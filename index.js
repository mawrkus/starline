'use strict';

const path = require('path');
const fs = require('fs');
const axios = require('axios');

require('dotenv').config();

const REQUEST_TIMEOUT = 10000;
const STARS_PER_PAGE = 100; // max allowed by GitHub
const RPS = 10;

const httpClient = axios.create({
  method: 'get',
  baseURL: `https://api.github.com/repos`,
  timeout: REQUEST_TIMEOUT,
  params: {
    access_token: process.env.GITHUB_ACCESS_TOKEN // add your API token to the env variables
  }
});

function getStargazersCount({ uri }) {
  console.log('Getting # of GitHub stars for "%s"...', uri);
  return httpClient({ url: uri }).then(response => response.data.stargazers_count);
}

function requestStarDates({ uri, page, pagesCount }) {
  return httpClient({
    url: `${uri}/stargazers`,
    params: {
      page,
      per_page: STARS_PER_PAGE
    },
    headers: {
      "Accept": 'application/vnd.github.v3.star+json' // includes "starred_at", what we need ;)
    }
  })
  .then(response => response.data.map(star => star.starred_at.split('T')[0]))
  .catch(error => {
    console.error('Ooops page %d!', page, error.stack);
    console.error(error.stack);
    return [{ error, page }];
  });
}

function saveStarDates({ uri, dates, outputFolder }) {
  console.log('Done, saving %d date(s)...', dates.length);

  const starsCountPerDate = dates.sort().reduce((results, date) => {
    results[date] = results[date] || 0;
    results[date]++;
    return results;
  }, {});

  let filename = `${uri.replace('/', '-')}.json`;
  let filePath = path.join(process.cwd(), outputFolder, filename);

  console.log('Writing stars to JSON file "%s"...', filePath);

  fs.writeFileSync(filePath, JSON.stringify(starsCountPerDate));

  filename = `data.tsv`;
  filePath = path.join(process.cwd(), outputFolder, filename);

  console.log('Writing stars to TSV file "%s"...', filePath);

  const tsv = `date\t\t\tstars\n` +
        Object.keys(starsCountPerDate)
          .map(date => `${date}\t\t\t${starsCountPerDate[date]}`)
          .join('\n');

  fs.writeFileSync(filePath, tsv);
}

/* *** */

let uri = process.argv[2];
// let uri = 'dimsemenov/PhotoSwipe';
// uri = 'cheeriojs/cheerio';
// uri = 'mzabriskie/axios';
// uri = 'mawrkus/tinycore';
// uri = 'mawrkus/js-unit-testing-guide';

getStargazersCount({ uri })
  .then(starsCount => {
    const pagesCount = Math.ceil(starsCount / STARS_PER_PAGE);
    let allDates = [];
    let pagesCollected = 0;
    let page = 1;

    console.log('"%s" has collected %d star(s) -> %d page(s) at %d req/s.', uri, starsCount, pagesCount, RPS);

    const intervalId = setInterval(() => {
      if (page > pagesCount) {
        return clearInterval(intervalId);
      }

      console.log('Requesting page %d/%d...', page, pagesCount);

      requestStarDates({ uri, page: page++ })
        .then(dates => {
          allDates = allDates.concat(dates);
          console.log('Page %d/%d collected.', ++pagesCollected, pagesCount);

          if (pagesCollected >= pagesCount) {
            saveStarDates({ uri, dates: allDates, outputFolder: 'web/data' });
          }
        })
        .catch(error => {
          console.error('Ooops! Something went wrong :(', error.stack);
        });
    }, 1000 / RPS);
  })
  .catch(error => {
    console.error('Ooops! Something went wrong :(', error.stack);
  });
