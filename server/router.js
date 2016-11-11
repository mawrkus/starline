const path = require('path');
const express = require('express');
const lowdb = require('lowdb');
const HomeController = require('./home-controller');

const dbPath = path.join(process.cwd(), 'data', 'stars.json');
const starsDb = lowdb(dbPath);
const homeController = new HomeController({ starsDb });

const Router = express.Router();

Router.get('/', homeController.handle.bind(homeController));

module.exports = Router;
