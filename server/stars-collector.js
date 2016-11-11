const EventEmitter = require('events');
const debug = require('debug')('stars:collector');

class StarsCollector extends EventEmitter {
  get({ uri }) {
    const id = uri.replace(/\//, '-');
    const repo = { uri, id, stars: { count: 0, dates: [] }, status: 0 };

    this.emit('start', repo);
    debug('Starting...', repo);

    let progress = 0;
    const intervalId = setInterval(() => {
      progress += 10;
      repo.status = progress;

      this.emit('status', repo);
      debug('In progress...', repo);

      if (progress >= 100) {
        clearInterval(intervalId);

        repo.stars.count = 1337;
        repo.status = 'ok';

        this.emit('success', repo);
        debug('Success!', repo);

        /* repo.status = 'error';
        this.emit('error', repo);
        debug('Error!', repo); */
      }
    }, 1000);

    return this;
  }
}

module.exports = StarsCollector;
