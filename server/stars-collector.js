const EventEmitter = require('events');
const debug = require('debug')('stars:collector');

class StarsCollector extends EventEmitter {
  constructor({ httpClient }) {
    debug('Building stars collector...');
    super();
    this._httpClient = httpClient;
    this._starsPerPage = 100; // max allowed by GitHub API
    this._rps = 10;
  }

  get({ uri }) {
    this.emit('start', { uri });

    this._requestRepoStats({ uri })
      .then(repoStats => {
        const pagesCount = Math.ceil(repoStats.stars.count / this._starsPerPage);
        let allDates = [];
        let page = 1;
        let pagesCollected = 0;

        debug('"%s" has %d star(s) -> %d page(s) at %d req/s.', uri, repoStats.stars.count, pagesCount, this._rps);

        const intervalId = setInterval(() => {
          if (page > pagesCount) {
            return clearInterval(intervalId);
          }

          debug('Requesting page %d/%d...', page, pagesCount);

          this._requestStarDates({ uri, page: page++ })
            .then(dates => {
              allDates = allDates.concat(dates);
              debug('Page %d/%d collected.', ++pagesCollected, pagesCount);

              const progress = Math.round((pagesCollected / pagesCount) * 100);
              this.emit('status', { uri, progress });

              if (pagesCollected >= pagesCount) {
                Object.assign(repoStats, {
                  uri,
                  stars: { count: allDates.length, dates: allDates }
                });

                this.emit('success', repoStats);
              }
            })
            .catch(error => this.emit('error', { uri, error }));
        }, 1000 / this._rps);
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
