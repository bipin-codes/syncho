const { APP_NAME } = require('../constants');

module.exports = (req, res) => {
  res.clearCookie('url');
  res.render('index', { title: APP_NAME });
};
