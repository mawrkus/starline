// must be before next requires to enable debug
process.env.DEBUG = 'stars:*';

const http = require('http');
const path = require('path');
const express = require('express');
const mustache = require('mustache-express');
const lowdb = require('lowdb');
const axios = require('axios');
const envalid = require('envalid');
const debug = require('debug')('stars:http');
const StarsCollector = require('./stars-collector');
const IOServer = require('./io-server');
const HomeController = require('./controllers/home');
const DetailsController = require('./controllers/details');
const ErrorController = require('./controllers/error');

require('dotenv').config();

const env = envalid.cleanEnv(process.env, {
  NODE_ENV: envalid.str({
    desc: 'Environment. E.g.: "development"',
    default: 'production'
  }),
  SERVER_PORT: envalid.num({
    desc: 'Server port number. E.g.: 8000',
    default: 8000
  }),
  STATICS_PATH: envalid.str({
    desc: 'Path to the static files. E.g.: "public"',
    default: 'public'
  }),
  VIEWS_PATH: envalid.str({
    desc: 'Path to the client templates. E.g.: "views"',
    default: 'views'
  }),
  DB_PATH: envalid.str({
    desc: 'Path to the database. E.g.: "data"',
    default: 'data'
  }),
  GITHUB_ACCESS_TOKEN: envalid.str({
    desc: 'GitHub API access token.'
  })
});

debug('starting HTTP server...');

const app = express();
const httpServer = http.Server(app);

const cwd = process.cwd();
const staticsPath = path.join(cwd, env.STATICS_PATH);
const viewsPath = path.join(cwd, env.VIEWS_PATH);
const dbPath = path.join(cwd, env.DB_PATH, 'stars.json');

/* IO */

const REQUEST_TIMEOUT = 10000;
const httpClient = axios.create({
  method: 'get',
  baseURL: `https://api.github.com/repos`,
  timeout: REQUEST_TIMEOUT,
  params: {
    access_token: env.GITHUB_ACCESS_TOKEN
  }
});
const starsCollector = new StarsCollector({ httpClient });

const starsDb = lowdb(dbPath);
const ioServer = new IOServer({ httpServer, starsCollector, starsDb });

ioServer.init();

/* Express */

app.use(express.static(staticsPath));

app.set('views', viewsPath);
app.set('view cache', env.NODE_ENV === 'production');
app.engine('tpl', mustache());

const homeController = new HomeController({ starsDb });
app.get('/', homeController.handler.bind(homeController));

const detailsController = new DetailsController({ starsDb, staticsPath });
app.get('/repos/:userSlug/:repoSlug', detailsController.handler.bind(detailsController));

app.use((req, res, next) => {
  if (req.socket.listeners('error').length) {
    return next();
  }

  req.socket.on('error', error => {
    console.error(error.stack);
  });

  next();
});

const errorController = new ErrorController();
app.use(errorController.handler.bind(errorController));

httpServer.listen(env.SERVER_PORT, () => {
  console.log('Server listening on *:%d...', env.SERVER_PORT);
});
