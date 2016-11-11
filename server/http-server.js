const http = require('http');
const path = require('path');
const express = require('express');
const mustache = require('mustache-express');
const lowdb = require('lowdb');
const envalid = require('envalid');

// must be before next requires to enable debug
process.env.DEBUG = 'stars:*';

const StarsCollector = require('./stars-collector');
const IOServer = require('./io-server');
const HomeController = require('./home-controller');

require('dotenv').config();

const env = envalid.cleanEnv(process.env, {
  NODE_ENV: envalid.str({
    desc: 'Environment. E.g.: "development"',
    default: 'production'
  }),
  SERVER_PORT: envalid.num({
    desc: 'Server port number. E.g.: 3000',
    default: 3000
  }),
  STATICS_PATH: envalid.str({
    desc: 'Path to the static files. E.g.: "public"',
    default: 'public'
  }),
  GITHUB_ACCESS_TOKEN: envalid.str({
    desc: 'GitHub API access token.'
  })
});

const app = express();
const httpServer = http.Server(app);

const cwd = process.cwd();
const staticsPath = path.join(cwd, env.STATICS_PATH);
const viewsPath = path.join(cwd, env.VIEWS_PATH);
const dbPath = path.join(cwd, env.DB_PATH, 'stars.json');

/* IO */

const starsDb = lowdb(dbPath);
const starsCollector = new StarsCollector();
const ioServer = new IOServer({ httpServer, starsCollector, starsDb });

ioServer.init();

/* Express */

app.use(express.static(staticsPath));

app.set('views', viewsPath);
app.set('view cache', env.NODE_ENV === 'production');
app.engine('tpl', mustache());

const homeController = new HomeController({ starsDb });

app.get('/', homeController.handle.bind(homeController));

app.use((req, res, next) => {
  if (req.socket.listeners('error').length) {
    return next();
  }

  req.socket.on('error', error => {
    console.error(error.stack);
  });

  next();
});

httpServer.listen(env.SERVER_PORT, () => {
  console.log('Server listening on *:%d...', env.SERVER_PORT);
});
