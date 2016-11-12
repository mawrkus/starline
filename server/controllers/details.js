const path = require('path');
const fs = require('fs');
const createError = require('http-errors');
const moment = require('moment');

class RepoDetailsController {
  constructor({ starsDb }) {
    this._repos = starsDb.get('repos');
  }

  handler(req, res, next) {
    const { userSlug, repoSlug } = req.params;
    const repoUri = `${userSlug}/${repoSlug}`;
    const repo = this._repos.find({ uri: repoUri }).value();

    if (!repo) {
      const error = new createError.NotFound(`Cannot find repo "${repoUri}"!`);
      return next(error);
    }

    const tsvFile = this._buildTSVFile({ userSlug, repoSlug, dates: repo.stars.dates });

    const repoData = Object.assign({}, repo, {
      created: moment(repo.created).format('dddd, MMMM Do YYYY'),
      updated: moment(repo.updated).format('dddd, MMMM Do YYYY'),
      tsvFile
    });

    res.render('details.tpl', { repo: repoData });
  }

  _buildTSVFile({ userSlug, repoSlug, dates }) {
    const filename = `${userSlug}-${repoSlug}.tsv`;
    const filePath = path.join(process.cwd(), process.env.STATICS_PATH, 'data', filename);

    const starsCountPerDate = dates.sort().reduce((results, date) => {
      results[date] = results[date] || 0;
      results[date]++;
      return results;
    }, {});

    console.log('Building TSV file "%s"...', filePath);

    const lines = Object.keys(starsCountPerDate)
      .map(date => `${date}\t\t\t${starsCountPerDate[date]}`)
      .join('\n');

    const tsv = `date\t\t\tstars\n${lines}`;

    fs.writeFileSync(filePath, tsv);

    return filename;
  }
}

module.exports = RepoDetailsController;
