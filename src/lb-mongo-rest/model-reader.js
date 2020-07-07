const fs = require('fs');
const path = require('path');
const assert = require('assert');
const moize = require('moize').default;
const { init, insert, restify } = require('./rest-mixin');
const { register } = require('./LBModelsRegistry');
const { createIndex } = require('./model-indexes.js');
const BaseModel = require('./BaseModel');

const { MEMOIZED_MODELS = '', MEMO_MAX_AGE = 100 * 1000 } = process.env;

console.log('MEMOIZED_MODELS--', MEMOIZED_MODELS);
const memoizedModels = MEMOIZED_MODELS.split(',') || [];
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

const fnsToMemoize = ['find', 'findOne', 'findN', 'findOneN', 'findById', 'findByIdN'];

function transformArgs(args) {
  // console.log('transformArgs', args);
  const last = args[args.length - 1];
  if (typeof last === 'function') {
    // console.log('last', last);
    args.pop(); // remove this callback
  }
  return args;
}

function memoizer(model, memoizedMethods = fnsToMemoize) {
  console.log('memoizer--', model.modelName);
  memoizedMethods.forEach(name => {
    const fn = model[name];

    const memoizedFn = moize(function () {
      // console.log('in memo find----', arguments);
      const args = [...arguments];
      transformArgs(args);
      return fn.apply(model, args);
    }, {
      isDeepEqual: true,
      isPromise: true,
      // onCacheHit: (cache, options, moized) => {
      //   console.log('-------->>> cache hit', name, model.modelName, cache.keys);
      // },
      maxAge: parseInt(MEMO_MAX_AGE),
      transformArgs
    });

    model[name] = memoizedFn;
  });
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
      const exec = _modelsExec.get(modelName);
      let module;
      if (!exec) {
        class Klass extends BaseModel { }
        module = Klass;
      } else {
        module = exec.module;
        assert(module.toString().indexOf('extends BaseModel') > -1,
          `Model '${modelName}' must extend 'BaseModel'`);
      }
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
        _modelMixins.get(modelName).forEach((mixin) => {
          mixin(model);
        });
      }
      restify(modelName, model);
      app.models[modelName] = model;

      modelName === 'Demo' && console.log('model --->>>>', Object.keys(model));

      memoizedModels.includes(modelName) && memoizer(model, config.schema.memoizedMethods);
      createIndex(model, config);
    }
  }
};

exports.loadMixin = function loadMixin(model, mixinPath) {
  const { name } = model;
  const p = path.resolve(_mixinsDir, mixinPath);
  let arr = [];
  if (!_modelMixins.has(name)) {
    _modelMixins.set(model.name, arr);
  } else {
    arr = _modelMixins.get(model.name);
  }
  arr.push(require(p));
};
