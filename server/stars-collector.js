const EventEmitter = require('events');
const Bottleneck = require('bottleneck');
const debug = require('debug')('stars:collector');

class StarsCollector extends EventEmitter {
  constructor({ httpClient }) {
    debug('Building stars collector...');
    super();
    this._httpClient = httpClient;
    this._starsPerPage = 100; // max allowed by GitHub API
    this._rps = 10;
    this._limiter = new Bottleneck(this._rps, 100);
  }

  get({ uri }) {
    this.emit('start', { uri });

    this._requestRepoStats({ uri })
      .then(repoStats => {
        const starsCount = repoStats.stars.count;
        const pagesCount = Math.ceil(starsCount / this._starsPerPage);
        let allDates = [];
        let pagesCollected = 0;

        debug('"%s" has %d star(s) -> %d page(s) at %d req/s.', uri, starsCount, pagesCount, this._rps);

        if (!starsCount) {
          Object.assign(repoStats, { uri, stars: { count: 0, dates: [] } });
          this.emit('success', repoStats);
          return;
        }

        for (let page = 1; page <= pagesCount; page++) {
          this._limiter.schedule(() => { // eslint-disable-line
            debug('Requesting page %d/%d...', page, pagesCount);

            return this._requestStarDates({ uri, page: page++ })
              .then(dates => {
                allDates = allDates.concat(dates);
                debug('Page %d/%d collected.', ++pagesCollected, pagesCount);

                this.emit('status', { uri, progress: allDates.length, total: starsCount });

                if (pagesCollected >= pagesCount) {
                  Object.assign(repoStats, {
                    uri,
                    stars: { count: allDates.length, dates: allDates }
                  });

                  this.emit('success', repoStats);
                }
              })
              .catch(error => this.emit('error', { uri, error }));
          });
        }
      })
      .catch(error => this.emit('error', { uri, error }));
  }

  _requestRepoStats({ uri }) {
    return this._httpClient({ url: uri })
      .then(response => {
        const data = response.data;
        return {
          url: data.html_url,
          description: data.description,
          created: data.created_at,
          updated: data.updated_at,
          stars: { count: data.stargazers_count }
        };
      });
  }

  _requestStarDates({ uri, page }) {
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
