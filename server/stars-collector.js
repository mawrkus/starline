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
    this._limiter = new Bottleneck(this._maxConcurrent, this._minTimeBetweenReqs);
  }

  get({ uri }) {
    this.emit('start', { uri, stars: { count: 0, dates: [] } });

    this._requestRepoStats({ uri })
      .then(repoStats => {
        const starsCount = repoStats.stars.count;
        const pagesCount = Math.ceil(starsCount / this._starsPerPage);
        const allDates = {};
        let pagesCollected = 0;
        let progress = 0;

        debug('"%s" stats: %d star(s) -> %d page(s).', uri, starsCount, pagesCount);

        if (!starsCount) {
          debug('"%s" -> nothing to do.', uri);
          this.emit('success', repoStats);
          return;
        }

        for (let page = 1; page <= pagesCount; page++) {
          this._limiter.schedule(() => { // eslint-disable-line
            return this._requestStarDates({ uri, page: page++ })
              .then(dates => {
                dates.forEach(date => {
                  allDates[date] = allDates[date] || 0;
                  allDates[date]++;
                });
                progress += dates.length;

                debug('"%s" -> page %d/%d collected -> %d/%d ⭐', uri, ++pagesCollected, pagesCount, progress, starsCount);
                this.emit('status', { uri, progress, total: starsCount });

                if (pagesCollected >= pagesCount) {
                  Object.assign(repoStats, {
                    uri,
                    stars: { count: progress, dates: allDates }
                  });

                  debug('"%s" -> done -> %d star(s).', uri, progress);
                  this.emit('success', repoStats);
                }
              })
              .catch(error => this._emitError({ uri, error }));
          });
        }
      })
      .catch(error => this._emitError({ uri, error }));
  }

  _emitError({ uri, error }) {
    debug('Error collecting "%s"!', uri, error);

    this._limiter.stopAll(true);
    // when stopped, a limiter is useless, a new one must be created
    this._limiter = new Bottleneck(this._maxConcurrent, this._minTimeBetweenReqs);

    this.emit('error', { uri, error });
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

  _requestStarDates({ uri, page }) {
    debug('"%s" -> requesting page %d...', uri, page);

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
}

module.exports = StarsCollector;
