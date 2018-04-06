const fs = require('fs');
const path = require('path');
const LoggerUtil = require('../lib/LoggerUtil');

module.exports = function (app) {
  const basePath = process.cwd();
  const logDir = path.resolve(basePath, 'logs');
  const nodeEnv = process.env.NODE_ENV || 'local';
  const args = [basePath];
  if (nodeEnv !== 'local') {
    args.push('dist');
  }
  args.push('server');

  const serverDistPath = path.resolve.apply(path, args);

  console.log('nodeEnv', nodeEnv);

  // Create the log directory if it does not exist
  if (!fs.existsSync(logDir)) {
    console.log('Log directory not found. Creating it.');
    fs.mkdirSync(logDir);
  }

  // config file as per env
  const configFileName = `config.${nodeEnv}.json`;
  let configFilePath = path.resolve(serverDistPath, configFileName);

  // check if configFilePath exists otherwise use config.json
  // TODO merge the config.json Object props into config.env.json Object,
  // so replicating is not required
  !fs.existsSync(configFilePath) && (configFilePath = path.resolve(serverDistPath, 'config.json'));

  const configJSON = require(configFilePath);
  const mailOpts = Object.assign({}, configJSON.loggerEmailTransport, {});
  const logglyOpts = Object.assign({}, configJSON.loggerLogglyTransport, {});

  LoggerUtil.initLogger(logDir, mailOpts, logglyOpts);

  global.LoggerUtil = LoggerUtil;

  // init logger display route
  configureLogViewer(app);
};

const LOG_DISPLAY_TMPL = `
  <body>
    <script src="//ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js"></script>
    <input type="text" id="fileName" placeholder="fileName" />
    <input type="text" id="c" placeholder="c"/>
    <button id="s">Print last 1000 lines</button>
    <hr>
    <pre id="logViewer">
    </pre>
    <script>
      var c = $("#c");
      var fileName = $("#fileName");
      var logViewer = $("#logViewer");
      var url = ""
      $("#s").click(function(e){
        logViewer.html('');
        var fcd = "//" + location.host + "/api/Utilities/exec?params=";
        var b = fcd;

        if(c.val()){
          fcd = fcd + c.val();
        }
        else{
          if(!fileName.val()){
            logViewer.html('Error: No file name');
            return;
          }
          fcd = fcd + "tail -n 1000 /app/logs/" + fileName.val();
        }

        if(b === fcd){
          logViewer.html('Error: No file name');
          return;
        }
        $.ajax({
          url: fcd,
          success: function(result){
            logViewer.html(result);
          },
          error: function(a,result){
            console.log(arguments)
            logViewer.html(a.responseJSON.error.stack);
          }

        });
      });

      c.hide();
    </script>
  </body>

`;

function configureLogViewer(app) {
  app.get('/api/_logger_', function (req, res, next) {
    res.send(LOG_DISPLAY_TMPL);
  });
}
