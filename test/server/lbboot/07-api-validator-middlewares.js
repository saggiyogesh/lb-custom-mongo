module.exports = function initApp(app) {
  app.all('/api/*', async function jwtValidator(req, res, next) {
    console.log('@ jwtvalidator');
    next();
  });
};
