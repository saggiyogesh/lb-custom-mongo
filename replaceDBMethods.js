const { MongoClient, ObjectId } = require('mongodb');
const url = 'mongodb://localhost:27017/lb-mongo';
const mongoose = require('mongoose');
const { promiseOrCallback } = require('mongoose/lib/utils');
const { Schema } = mongoose;

const blogSchema = new Schema({
  name: String
});

const Blog = mongoose.model('yoooo', blogSchema);

(async function() {
  try {
    const db = await mongoose.connect(
      url,
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
    const collectionInfo = await Blog.db.db.command({ listCollections: 1, filter: { name: 'Demo' } });
    console.log('collectionInfo 0-------', collectionInfo);
    const schema = collectionInfo.cursor.firstBatch[0].options.validator.$jsonSchema;
    console.log('schema 0-------', schema);
    // const collection = db.connection.db.collection('yoooo');
    const { collection } = Blog;
    const origInsert = collection.insert;
    const origInsertMany = collection.insertMany;
    const origInsertOne = collection.insertOne;

    collection.insert = function newInsert(docs, options, callback) {
      console.log('new insert called---------');
      return origInsert.call(collection, docs, options, callback);
    };

    collection.insertMany = function newInsertMany(docs, options, callback) {
      console.log('new insert many called---------');
      return origInsertMany.call(collection, docs, options, callback);
    };

    collection.insertOne = async function(doc, options, callback) {
      console.log('new insert one called---------');

      // if (callback && typeof callback === 'function') {

      // }
      // try {
      //   return await origInsertOne.call(collection, doc, options);
      // } catch (err) {
      //   if (err && err.code === 121) {
      //     console.log('validation err');
      //   }
      //   throw err;
      // }
      // const finalCB = (err, res) => {
      //   console.log('finalcb', err, res);
      // };

      return promiseOrCallback(callback, fn => {
        origInsertOne.call(collection, doc, options, (err, res) => {
          if (err && err.code === 121) {
            console.log('validation err');
          }
          fn(err, res);
        });
      });
    };

    const r = await Blog.create({ name: 'yo' });
    console.log('rr==>>>>>', r);

    // console.log('coll', collection);
    db.close();
    process.exit(1);
  } catch (err) {
    console.log('errr', err);
    process.exit(1);
  }
})();
