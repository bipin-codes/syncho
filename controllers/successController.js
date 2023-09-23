module.exports = async (req, res, next) => {
  const { url } = req.cookies;
  try {
    res.render('success', { url });
  } catch (e) {
    res.render('error');
  }
};
