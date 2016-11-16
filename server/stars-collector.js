const EventEmitter = require('events');
const Bottleneck = require('bottleneck');
const debug = require('debug')('stars:collector');

class StarsCollector extends EventEmitter {
  constructor({ httpClient }) {
    debug('Building stars collector...');
    super();
    this._httpClient = httpClient;
    this._starsPerPage = 100; // max allowed by GitHub API
    this._maxConcurrentReqs = 10;
    this._minTimeBetweenReqs = 100;
    this._limiters = {};
  }

  get({ uri }) {
    this.emit('start', { uri, stars: { count: 0, dates: [] } });

    this._requestRepoStats({ uri })
      .then(repoStats => {
        if (!repoStats.stars.count) {
          return this._onSuccess({ repoStats });
        }

        this._requestAll({ repoStats });
      })
      .catch(error => this._onError({ uri, error }));
  }

  _requestAll({ repoStats }) {
    const { uri, stars } = repoStats;
    const starsCountFromStats = stars.count;
    const pagesCount = Math.ceil(starsCountFromStats / this._starsPerPage);
    const allDates = {};
    let pagesCollected = 0;
    let progress = 0;

    const limiter = new Bottleneck(this._maxConcurrent, this._minTimeBetweenReqs);
    this._limiters[uri] = limiter;

    debug('"%s" stats: %d star(s) -> %d page(s).', uri, starsCountFromStats, pagesCount);

    for (let page = 1; page <= pagesCount; page++) {
      limiter.schedule(() => { // eslint-disable-line
        return this._requestStarDates({ uri, page: page++, pagesCount })
          .then(dates => {
            // no cancellation for now. ugly, for now.
            if (!this._limiters[uri]) {
              debug('"%s" already stopped', uri);
              return;
            }

            dates.forEach(date => {
              allDates[date] = allDates[date] || 0;
              allDates[date]++;
            });
            progress += dates.length;

            debug('"%s" -> page %d/%d done (%d/%d)', uri, ++pagesCollected, pagesCount, progress, starsCountFromStats);
            this.emit('status', { uri, progress, total: starsCountFromStats });

            if (pagesCollected >= pagesCount) {
              repoStats.stars = { count: progress, dates: allDates };
              this._onSuccess({ repoStats });
            }
          })
          .catch(error => this._onError({ uri, error }));
      });
    }
  }

  _requestRepoStats({ uri }) {
    debug('Requesting "%s" stats...', uri);

    return this._httpClient({ url: uri })
      .then(response => {
        const data = response.data;
        return {
          uri,
          stars: { count: data.stargazers_count, dates: [] },
          url: data.html_url,
          description: data.description,
          created: data.created_at,
          updated: data.updated_at,
        };
      });
  }

  _requestStarDates({ uri, page, pagesCount }) {
    debug('"%s" -> requesting page %d/%d...', uri, page, pagesCount);

    // it seems this will return all stars ever given, even if some if them were taken back...
    return this._httpClient({
      url: `${uri}/stargazers`,
      params: {
        page,
        per_page: this._starsPerPage
      },
      headers: {
        "Accept": 'application/vnd.github.v3.star+json' // includes "starred_at", what we need ;)
      }
    })
    .then(response => response.data.map(star => star.starred_at.split('T')[0]));
  }

  _onSuccess({ repoStats }) {
    const { uri, stars } = repoStats;

    debug('"%s" -> all done! %d ⭐', uri, stars.count);

    this._cleanup({ uri });
    this.emit('success', repoStats);
  }

  _onError({ uri, error }) {
    debug('"%s" -> error! ❌', uri, error);

    this._cleanup({ uri });
    this.emit('error', { uri, error });
  }

  _cleanup({ uri }) {
    if (this._limiters[uri]) {
      this._limiters[uri].stopAll(true);
      delete this._limiters[uri];
    }
  }
}

module.exports = StarsCollector;
