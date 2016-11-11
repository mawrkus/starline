const io = require('socket.io');
const debug = require('debug')('stars:io');

class IOServer {
  constructor({ httpServer, starsCollector, starsDb }) {
    this._io = io(httpServer);
    this._starsCollector = starsCollector;
    this._repos = starsDb.get('repos');
  }

  init() {
    this._io.on('connection', socket => {
      debug('New socket connection!', socket.id);
      socket.on('collect:request', request => this._onRequest({ socket, request }));
    });
  }

  _onRequest({ socket, request }) {
    debug('New request!', request);
    const { uri } = request;

    const repo = this._repos.find({ uri }).value();
    if (repo) {
      debug('"%s" already in progress, doing nothing.', uri);
      return;
    }

    this._starsCollector
      .on('start', data => {
        this._repos.push(data).value();
        socket.emit('collect:start', data);
      })
      .on('status', data => socket.emit('collect:status', data))
      .on('success', data => {
        this._repos.find({ uri: data.uri }).assign(data).value();
        socket.emit('collect:success', data);
      })
      .on('error', data => {
        this._repos.find({ uri: data.uri }).assign(data).value();
        socket.emit('collect:error', data);
      });

    this._starsCollector.get({ uri });
  }
}

module.exports = IOServer;
