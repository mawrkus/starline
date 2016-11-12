const REGEXP_SLUGIFY = /\//;

function slugify(uri) {
  return uri.replace(REGEXP_SLUGIFY, '-');
}

class HomeController {
  constructor({ starsDb }) {
    this._repos = starsDb.get('repos');
  }

  handler(req, res) {
    const repos = this._repos
                    .map(repo => Object.assign({ id: slugify(repo.uri) }, repo))
                    .value() || [];

    res.render('home.tpl', { repos });
  }
}

module.exports = HomeController;
