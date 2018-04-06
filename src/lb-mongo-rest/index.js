const mongoose = require('mongoose');
const { init, loadMixin } = require('./model-reader');
const { configure } = require('./lbboot-reader');

const mongoURL = process.env.MONGO_URL || 'mongodb://127.0.0.1/lb-mongo';

exports.init = async function lbMongoInit(app, { modelsDir, bootDir, mixinsDir }) {
  console.log('mode', modelsDir, bootDir, mixinsDir);
  try {
    const db = await mongoose.connect(mongoURL, {
      promiseLibrary: require('bluebird'),
      loggerLevel: 'error',
      autoIndex: false,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 500,
      poolSize: 10,
      bufferMaxEntries: 0
    });
    console.log('DB connected ', db.connections[0].name);
    app.set('db', db);
    init(app, modelsDir, mixinsDir);
    configure(app, bootDir);

    console.log('models', Object.keys(app.models));
  } catch (err) {
    throw err;
  }
};

exports.BaseModel = require('./BaseModel');

exports.loadMixin = loadMixin;
