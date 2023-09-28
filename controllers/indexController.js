const { APP_NAME } = require('../constants');

module.exports = async (req, res) => {
  res.clearCookie('url');
  delete req.session.redirected;

  res.render('index', { title: APP_NAME });
};
