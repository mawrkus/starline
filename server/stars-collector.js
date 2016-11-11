const EventEmitter = require('events');

class StarsCollector extends EventEmitter {
  get({ uri }) {
    this.emit('start', { uri });

    let progress = 0;
    const intervalId = setInterval(() => {
      progress += 10;

      this.emit('status', { uri, progress });

      if (progress >= 100) {
        clearInterval(intervalId);

        /* const error = new Error('Ooops!');
        this.emit('error', { uri, error });
        return; */

        const stars = { count: 1337, dates: [] };
        this.emit('success', { uri, stars });
      }
    }, 1000);

    return this;
  }
}

module.exports = StarsCollector;
