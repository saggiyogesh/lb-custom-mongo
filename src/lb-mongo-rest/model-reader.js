const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { init, insert, restify } = require('./rest-mixin');
const { register } = require('./LBModelsRegistry');

const _modelsExec = new Map();
const _modelsConfig = new Map();
const _modelMixins = new Map();
// const regex = /^function\s+\(([a-zA-Z]+)\)/;

const moongooseLBConflictingMethods = ['find', 'findOne', 'findById', 'count'];
let _mixinsDir;
exports.init = function i(app, modelsDir, mixinsDir) {
  const remotes = init(app);
  app.models = {};
  _mixinsDir = mixinsDir;
  configureModels(app, modelsDir);
  app.use('/api', remotes.handler('rest'));
};

function resolveMongooseLBMethods(model, name) {
  const mMeth = model[name];
  model[name] = model[`_${name}`];
  model[`${name}M`] = mMeth;
}

function configureModels(app, modelsDir) {
  console.log('modelsdir', modelsDir);
  const dirs = fs.readdirSync(modelsDir);
  for (const dirName of dirs) {
    const modelDirPath = path.resolve(modelsDir, dirName);
    if (fs.statSync(modelDirPath).isDirectory()) {
      console.log('isdir', modelDirPath);
      const files = fs.readdirSync(modelDirPath);
      for (const f of files) {
        if (f.length - f.lastIndexOf('.js') === 3) {
          const fp = path.resolve(modelDirPath, f);
          if (f === 'schema.js') {
            const schema = require(fp);
            assert(schema.name, 'Schema name not found: ' + fp);
            _modelsConfig.set(schema.name, { path: fp, schema });
          } else if (f === 'remotes.js') {
            continue;
          } else {
            const module = require(fp);
            const modelName = module.name;
            assert(modelName, 'Model name not found: ' + fp);
            _modelsExec.set(modelName, { path: fp, modelName, module });
          }
        }
      }

      // configs
      const modelName = dirName;
      const config = _modelsConfig.get(modelName);
      const { module } = _modelsExec.get(modelName);
      insert(module, config);
      register(module, config.schema);

      const connection = app.get('db');
      const model = connection.models[modelName];
      try {
        require(path.resolve(modelsDir, modelName, `remotes.js`))(model);
      } catch (e) { }

      for (const m of moongooseLBConflictingMethods) {
        resolveMongooseLBMethods(model, m);
      }

      module._model = model;
      model.app = app;
      model.models = app.models;
      model.schemaDef = config.schema;

      if (_modelMixins.has(modelName)) {
        _modelMixins.get(modelName)(model);
      }
      restify(modelName, model);
      app.models[modelName] = model;
    }
  }
};

exports.loadMixin = function loadMixin(model, mixinPath) {
  const p = path.resolve(_mixinsDir, mixinPath);
  console.log('process.cwd()', process.cwd());
  _modelMixins.set(model.name, require(p));
  console.log('fp', p);
};
