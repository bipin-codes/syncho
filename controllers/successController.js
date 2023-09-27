module.exports = async (req, res) => {
  const { url } = req.cookies;
  res.render('success', { url });
};
