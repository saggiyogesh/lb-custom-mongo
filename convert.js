const { MongoClient, ObjectId } = require('mongodb');
const url = 'mongodb://localhost:27017/';
const mongoose = require('mongoose');
const lilschema = require('./schema/ConceptMap');
require('mongoose-schema-jsonschema')(mongoose);
const Ajv = require('ajv');
const ajv = new Ajv();
require('ajv-bsontype')(ajv);

const Schema = mongoose.Schema;

const BannerSchema = new Schema(lilschema, { typeKey: '$type' });

const tempSchema = BannerSchema.jsonSchema();

console.dir(tempSchema, {
  depth: null
});

throw new Error('BREAK@!!!');

let banSchema = JSON.stringify(tempSchema);
banSchema = banSchema.replace(/"type":"date",/g, '');
banSchema = banSchema.replace(/"type":"objectid",/g, '');

banSchema = JSON.parse(banSchema);
const validate = ajv.compile(banSchema);

function tryConvert(errObj, doc) {
  errObj = errObj[0];
  const type = errObj.params.bsonType;
  const prop = errObj.dataPath.replace(/./, '');
  const curVal = doc[prop];
  const curType = typeof curVal;
  console.log('-->', type, prop, curType);
  try {
    if (type) {
      switch (type.toLowerCase()) {
        case 'date':
          doc[prop] = new Date(curVal);
          break;

        default:
          break;
      }
    } else {
      delete doc[prop];
    }
    validateS(doc);
  } catch (err) {
    console.log('tryConvert err', err);
    throw err;
  }
}

function validateS(obj) {
  const test = validate(obj);
  try {
    if (!test) {
      console.log(validate.errors, obj._id);
      tryConvert(validate.errors, obj);
    }
    temp.push(obj._id);
  } catch (error) {}
}

const temp = [];
(async function() {
  try {
    const db = await MongoClient.connect(url);
    const dbo = db.db('henkeltest-db');
    const collection = await dbo.collection('ConceptMap');
    const cursor = await collection
      .find()
      .limit(1)
      .toArray();

    for (const obj of cursor) {
      validateS(obj);
      console.log('final---', obj);
      break;
    }
    db.close();
    console.log('toal shit...', temp.length);
  } catch (error) {
    console.log(error);
  }
})();
