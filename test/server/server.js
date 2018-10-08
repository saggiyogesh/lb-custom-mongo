const loopback = require('loopback');
const boot = require('loopback-boot');
const app = module.exports = loopback();
const path = require('path');
const compression = require('compression');
const { init } = require('../../src/lb-mongo-rest');
app.use(compression());
console.log('starting......');
app.start = function () {
  const modelsDir = path.resolve(__dirname, 'models');
  const bootDir = path.resolve(__dirname, 'lbboot');
  const mixinsDir = path.resolve(__dirname, 'mixins');

  init(app, { modelsDir, bootDir, mixinsDir });
  return app.listen(process.env.PORT || app.get('port'), function () {
    const baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    process.emit('appStarted');
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
  if (err) throw err;
  const server = app.start();

  process.on('uncaughtException', () => {
    server.close();
  });
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
