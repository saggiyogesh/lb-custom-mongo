const Log = require('lil-logger').getLogger(__filename);

const { promiseOrCallback } = require('mongoose/lib/utils');
const JSONValidator = require('./JSONValidator');

function manyDocsValidationError(data) {
  const e = new Error('ManyDocsValidationError');
  e.details = data;
  e.message = 'Many docs has validation error. Please check `details`';
  e.statusCode = 422;
  e.code = 'MANY_DOCS_VALIDATION_ERROR';
  return e;
}

function singleDocValidationError(error) {
  const e = new Error('SingleDocValidationError');
  e.details = error;
  e.message = 'Doc has validation error. Please check `details`';
  e.statusCode = 422;
  e.code = 'SINGLE_DOC_VALIDATION_ERROR';
  return e;
}

function handleError(result) {
  if (result.docsCount && result.docsCount > 1) {
    // many docs were validated
    return manyDocsValidationError(result);
  }

  let { error } = result;
  if (!result.error) {
    delete result.hasError;
    delete result.docsCount;
    const firstKey = Object.keys(result)[0];
    error = result[firstKey].error;
  }
  return singleDocValidationError(error);
}
const collMethods = [
  'insert',
  'insertMany',
  'insertOne',
  // 'update', 'updateMany', 'updateOne',
  'findOneAndUpdate',
  'findAndModify'
];

let i = 1000;

module.exports = class InjectValidator {
  constructor(schema, validationDB) {
    this.schema = schema;
    this.validationDB = validationDB.connection.db;
    this.jsonSchema = null;
    this.collection = schema.collection;
    this.origMethods = [];
    this.newMethods = [];
  }

  jsonValidatorFactory() {
    const { schema, jsonSchema, collection } = this;
    const jv = new JSONValidator(schema.modelName, jsonSchema);
    collection._jv = jv;

    collection._validateMany = function(docs) {
      const result = collection._jv.validateMany(docs);
      return result.hasError && handleError(result);
    };
  }

  async init() {
    const { schema } = this;
    const { modelName } = schema;
    try {
      const collectionInfo = await schema.db.db.command({ listCollections: 1, filter: { name: modelName } });
      this.jsonSchema = collectionInfo.cursor.firstBatch[0].options.validator.$jsonSchema;
    } catch (err) {
      Log.info({ msg: 'JSONSchema not found:', arg1: modelName });
    }

    if (this.jsonSchema) {
      this.jsonValidatorFactory(schema, this.jsonSchema);
      this.injectInMethods();
    }
  }

  injectInMethods() {
    const { collection } = this;

    collMethods.forEach(name => {
      this.origMethods[name] = collection[name];
      collection[name] = this[name].bind(this);
    });
  }

  insert(docs, options, callback) {
    const { collection } = this;
    console.log('new insert called---------');

    return promiseOrCallback(callback, fn => {
      // validate doc with jv
      const err = collection._validateMany(docs);
      if (err) {
        return fn(err);
      }

      this.origMethods.insert.call(collection, docs, options, fn);
    });
  }

  insertOne(doc, options, callback) {
    console.log('new insert one called---------');
    const { collection } = this;

    return promiseOrCallback(callback, fn => {
      // validate doc with jv
      const err = collection._validateMany(doc);
      if (err) {
        return fn(err);
      }

      this.origMethods.insertOne.call(collection, doc, options, fn);
    });
  }

  insertMany(docs, options, callback) {
    console.log('new insert many called---------');
    const { collection } = this;

    return promiseOrCallback(callback, fn => {
      // validate doc with jv
      const err = collection._validateMany(docs);
      if (err) {
        return fn(err);
      }

      this.origMethods.insertMany.call(collection, docs, options, fn);
    });
  }

  findAndModify(query, sort, doc, options, callback) {
    console.log('new findAndModify called---------');
    const { collection } = this;

    return promiseOrCallback(callback, fn => {
      this.origMethods.findAndModify.call(collection, query, sort, doc, options, async (err, res) => {
        if (err && err.code === 121) {
          err = await this.getWholeDocFromUpdateAndValidate(query, doc, options);
        }

        fn(err, res);
      });
    });
  }

  findOneAndUpdate(filter, update, options, callback) {
    console.log('new findOneAndUpdate called---------');
    const { collection } = this;

    return promiseOrCallback(callback, fn => {
      this.origMethods.findOneAndUpdate.call(collection, filter, update, options, async (err, res) => {
        if (err && err.code === 121) {
          err = await this.getWholeDocFromUpdateAndValidate(filter, update, options);
        }

        fn(err, res);
      });
    });
  }

  async getWholeDocFromUpdateAndValidate(selector, document, options = {}) {
    try {
      if (typeof options === 'function') {
        options = {};
      }

      const { validationDB, collection } = this;
      const currentDocs = await collection.find(selector).toArray();
      const mockCol = validationDB.collection(String(++i));
      await mockCol.insertMany(currentDocs);
      await mockCol.updateMany(selector, document, options);
      const docs = await mockCol.find(selector).toArray();

      mockCol.drop();
      console.log('docssssss', docs);
      const err = collection._validateMany(docs);
      console.log('err', err);
      return err;
    } catch (err) {
      console.log('error getWholeDocFromUpdate', err);
    }
  }
};
