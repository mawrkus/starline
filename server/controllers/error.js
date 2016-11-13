class ErrorController {

  handler(err, req, res, next) { // eslint-disable-line
    console.error(err.stack);

    const statusCode = err.statusCode;

    if (statusCode >= 400 && statusCode < 500) {
      res.status(statusCode).render('404.tpl');
    } else {
      res.status(500).render('500.tpl');
    }
  }

}

module.exports = ErrorController;
