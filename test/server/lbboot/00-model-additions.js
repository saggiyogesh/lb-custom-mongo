const fs = require('fs');
const path = require('path');
const modelAdditionsPath = path.resolve(__dirname, '../lib/modelAdditions');
const modelAdditions = fs.readdirSync(modelAdditionsPath);

// Boot script for enhancing the models
module.exports = function (app) {
  const models = app.models;
  Object.keys(models).forEach(k => {
    modelAdditions.forEach(p => {
      p.length - p.lastIndexOf('.js') === 3 && require(path.resolve(modelAdditionsPath, p))(models[k]);
    });
  });
};
