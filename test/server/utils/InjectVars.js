const path = require('path');
const fs = require('fs');

const {
  NODE_ENV,
  API_URL,
  AUTH0_CLIENTID,
  AUTH0_DOMAIN,
  GA_KEY
} = process.env;

const cwd = process.cwd();
const dist = 'lil_dist';
const distPath = path.join(cwd, '../', dist);

function replaceVars(fileName) {
  const placeholder = '//{{__GLOBALS__}}';
  const script = `(function () { window.gaKey='${GA_KEY}';
    window._API_URL_='${API_URL}';window.authClientId='${AUTH0_CLIENTID}';window.authDomain='${AUTH0_DOMAIN}';})();`;

  const file = path.join(distPath, fileName);

  console.log('file', file);

  // console.log(fs.readFileSync(file, 'utf8'));

  const content = fs.readFileSync(file, 'utf8');

  fs.writeFileSync(file, content.replace(placeholder, script), 'utf8');

  // console.log(fs.readFileSync(file, 'utf8'));
}

function injectJS() {
  console.log('injecting js...');

  if (!API_URL) {
    console.log('API_URL not found.....');
    return;
  }

  replaceVars('index.html');
  replaceVars('auth-callback.html');
}

module.exports = function() {
  if (!NODE_ENV) {
    console.log('Deployment environment variables not found...');
    return;
  }

  injectJS();
};
