const fs = require('fs');
const path = require('path');

exports.configure = function(app, bootDir) {
  const files = fs.readdirSync(bootDir);
  for (const f of files) {
    if (f.length - f.lastIndexOf('.js') === 3) {
      const p = path.resolve(bootDir, f);
      require(p)(app);
    }
  }
};
