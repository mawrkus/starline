const io = require('socket.io');
const debug = require('debug')('stars:io');

class IOServer {
  constructor({ httpServer, starsCollector, starsDb }) {
    debug('Building IO server...');
    this._io = io(httpServer);
    this._starsCollector = starsCollector;
    this._repos = starsDb.get('repos');
  }

  init() {
    this._bindStarsCollectorEvents();
    this._bindIOEvents();
  }

  _bindIOEvents() {
    this._io
      .on('connection', socket => {
        debug('New socket connection!', socket.id);
        socket.on('collect:request', request => this._onRequest({ request, socket }));
      });
  }

  _bindStarsCollectorEvents() {
    this._starsCollector
      .on('start', repoStats => {
        const { uri } = repoStats;
        const collectMetas = {
          collectStatus: 'started',
          collectDate: new Date()
        };
        const repo = this._repos.find({ uri });

        if (!repo.value()) {
          this._repos.push(Object.assign(repoStats, collectMetas)).value();
        } else {
          repo.assign(collectMetas).value();
        }

        this._io.sockets.emit('collect:start', { uri }); // update ALL clients
      })
      .on('status', ({ uri, progress, total }) => {
        this._io.sockets.emit('collect:status', { uri, progress, total });
      })
      .on('success', repoStats => {
        const { uri, stars } = repoStats;
        const repo = this._repos.find({ uri });

        repo.assign(Object.assign(repoStats, { collectStatus: 'ok' })).value();

        this._io.sockets.emit('collect:success', { uri, starsCount: stars.count });
      })
      .on('error', ({ uri, error }) => {
        this._repos.remove({ uri }).value();

        this._io.sockets.emit('collect:error', { uri, error: error.message });
      });
  }

  _onRequest({ request, socket }) {
    debug('New request!', request, socket.id);

    const { uri } = request;
    const repo = this._repos.find({ uri, status: 'started' }).value();

    if (repo) {
      debug('"%s" already in progress, doing nothing.', uri, socket.id);
      return;
    }

    this._starsCollector.get({ uri });
  }
}

module.exports = IOServer;
