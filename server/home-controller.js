class HomeController {
  constructor({ starsDb }) {
    this._repos = starsDb.get('repos');
  }

  handle(req, res) {
    const repos = this._repos.value() || [];
    res.render('index.tpl', { repos });
  }
}

module.exports = HomeController;
