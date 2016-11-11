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
    this._starsCollector
      .on('start', ({ uri }) => {
        debug('Starting "%s"...', uri);
        let repo = this._repos.find({ uri });

        if (!repo.value()) {
          repo = { uri, lastUpdate: new Date(), status: 'started', stars: { count: 0, dates: [] } };
          this._repos.push(repo).value();
        } else {
          repo.assign({
            lastUpdate: new Date(),
            status: 'started',
            stars: { count: 0, dates: [] }
          }).value();
        }

        this._io.sockets.emit('collect:start', { uri }); // update ALL clients
      })
      .on('status', ({ uri, progress }) => {
        debug('"%s": %d%', uri, progress);
        this._io.sockets.emit('collect:status', { uri, progress });
      })
      .on('success', ({ uri, stars }) => {
        debug('"%s" done! %d star(s).', uri, stars.count);
        this._repos.find({ uri }).assign({ status: 'ok', stars }).value();
        this._io.sockets.emit('collect:success', { uri, stars });
      })
      .on('error', ({ uri, error }) => {
        debug('Error collecting "%s"!', uri, error);
        this._repos.find({ uri }).assign({ status: 'ko', error: error.message }).value();
        this._io.sockets.emit('collect:error', { uri, error: error.message });
      });

    this._io
      .on('connection', socket => {
        debug('New socket connection!', socket.id);
        socket.on('collect:request', request => this._onRequest({ request, socket }));
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
