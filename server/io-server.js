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
      .on('start', ({ uri }) => {
        debug('Starting "%s"...', uri);
        let repo = this._repos.find({ uri });

        if (!repo.value()) {
          repo = { uri, status: 'started', stars: { count: 0, dates: [] } };
          this._repos.push(repo).value();
        } else {
          repo.assign({
            status: 'started',
            stars: { count: 0, dates: [] }
          }).value();
        }

        this._io.sockets.emit('collect:start', { uri }); // update ALL clients
      })
      .on('status', ({ uri, progress, total }) => {
        debug('"%s": %d/%d ⭐', uri, progress, total);
        this._io.sockets.emit('collect:status', { uri, progress, total });
      })
      .on('success', repoStats => {
        const { uri, stars } = repoStats;
        Object.assign(repoStats, { status: 'ok' });

        debug('"%s" done! %d star(s).', uri, stars.count);

        this._repos.find({ uri }).assign(repoStats).value();

        this._io.sockets.emit('collect:success', { uri, starsCount: stars.count });
      })
      .on('error', ({ uri, error }) => {
        debug('Error collecting "%s"!', uri, error);

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
