const mongoose = require('mongoose');
const { ObjectId, MongoClient } = require('mongodb');
const Log = require('lil-logger').getLogger(__filename);
const { init, loadMixin } = require('./model-reader');
const { configure } = require('./lbboot-reader');

const mongoURL = process.env.MONGO_URL || 'mongodb://127.0.0.1/lb-mongo';

const validationDBURL = process.env.VALIDATION_MONGO_URL;

exports.init = async function(app, { modelsDir, bootDir, mixinsDir }) {
  console.log('mode', modelsDir, bootDir, mixinsDir);
  let db;
  try {
    db = await mongoose.connect(
      mongoURL,
      {
        promiseLibrary: require('bluebird'),
        loggerLevel: 'error',
        autoIndex: false,
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 500,
        poolSize: 10,
        bufferMaxEntries: 0
      }
    );
    console.log('DB connected ', db.connections[0].name);
  } catch (err) {
    throw err;
  }

  try {
    // configure validation mongodb
    let validationDB;
    if (validationDBURL) {
      const client = new MongoClient(validationDBURL);
      await client.connect();
      Log.info({ msg: 'Connected to validation mongo db' });
      validationDB = client.db('vdb');
    } else {
      validationDB = db;
    }

    app.set('validationDB', validationDB);
  } catch (err) {
    Log.error({ error: err, msg: 'Not able to connect to validation mongodb' });
  }

  app.set('db', db);
  init(app, modelsDir, mixinsDir);
  configure(app, bootDir);

  console.log('models', Object.keys(app.models));
};

exports.BaseModel = require('./BaseModel');

exports.loadMixin = loadMixin;

exports.ObjectId = ObjectId;
