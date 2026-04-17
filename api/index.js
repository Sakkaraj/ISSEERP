module.exports = async (req, res) => {
  const appModule = await import('../serverJS/app.js');
  return appModule.default(req, res);
};
