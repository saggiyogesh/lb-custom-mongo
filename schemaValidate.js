const { MongoClient, ObjectId } = require('mongodb');
const Log = require('lil-logger').getLogger(__filename);
const mongoose = require('mongoose');
require('mongoose-schema-jsonschema')(mongoose);
const Ajv = require('ajv');
const ajv = new Ajv();
require('ajv-bsontype')(ajv);
const url = 'mongodb://localhost:27017/eurodev-db';

const { Schema } = mongoose;
// const lilschema = require('./schema/user');

// const Schema = mongoose.Schema;

// const BannerSchema = new Schema(lilschema, { typeKey: '$type' });
// let jsonSchema = BannerSchema.jsonSchema();
// jsonSchema = JSON.stringify(jsonSchema);
// jsonSchema = jsonSchema.replace(/"type":"date",/g, '');
// jsonSchema = jsonSchema.replace(/"type":"objectid",/g, '');
// // banSchema = banSchema.replace(/"type":",  { typeKey: '$type' }",/g, '');

// jsonSchema = JSON.parse(jsonSchema);
// console.dir(jsonSchema, {
//   depth: null
// });

async function isCollectionExists(collectionName, db) {
  const col = await db.listCollections({ name: collectionName }).toArray();
  return Array.isArray(col) && col.length;
}

function createColl(collectionName, db) {
  return db.createCollection(collectionName);
}

async function deleteOldValidator(schemaName, db) {
  try {
    await db.command({
      collMod: schemaName,
      validator: {},
      validationLevel: 'off'
    });
  } catch (error) {
    Log.debug({ msg: 'error from deleteOldValidator function', arg1: error });
  }
}

async function addValidator(schemaName, schema, db) {
  try {
    const mongooseSchema = schema.properties;
    // topLevelRequiredFields key is added to mongoose schema for explicitly specifying nested object schema as required, which is not allowed directly in mongoose schema
    const topLevelRequiredFields = schema.topLevelRequiredFields || [];

    const baseSchema = new Schema(mongooseSchema, { typeKey: '$type' });
    let baseJSONSchema = baseSchema.jsonSchema();

    // remove type: data & type: onjectid from json, as date & objectid as configured as 'bsonType', so not required 'type'
    baseJSONSchema = JSON.stringify(baseJSONSchema)
      .replace(/"type":"date",/g, '')
      .replace(/"type":"objectid",/g, '');
    baseJSONSchema = JSON.parse(baseJSONSchema);

    // insert topLevelRequiredFields in required array
    const { required } = baseJSONSchema;
    baseJSONSchema.required = [...required, ...topLevelRequiredFields];
    console.dir(baseJSONSchema, {
      depth: null
    });

    await db.command({
      collMod: schemaName,
      validator: {
        $jsonSchema: baseJSONSchema
      },
      validationLevel: 'strict'
    });

    return baseJSONSchema;
  } catch (error) {
    Log.error({ msg: 'error from addValidator function', error });
    process.exit(1);
  }
}

const schemaFile = 'objSchema.js';
const temp = [];
(async function() {
  const urlSplitArray = url.split('/');
  const dbName = urlSplitArray[urlSplitArray.length - 1];
  try {
    const db = await MongoClient.connect(url);
    const dbo = await db.db(dbName);

    const schemaName = schemaFile.split('.js')[0];
    const fileData = require(`${__dirname}/schema/${schemaFile}`);

    try {
      await createColl(schemaName, dbo);
      console.log('collection created');
    } catch (err) {
      console.log('errr create coll', err);
    }
    const collection = dbo.collection(schemaName);

    await deleteOldValidator(schemaName, dbo);

    // unset user.id
    // await collection.updateMany({}, { $unset: { id: '' } });

    const jsonSchema = await addValidator(schemaName, fileData, dbo);

    Log.info({ msg: 'validator applied to all collections' });

    const cursor = await collection.find().toArray();
    for (const obj of cursor) {
      const validate = ajv.compile(jsonSchema);
      const test = validate(obj);
      try {
        if (!test) console.log(validate.errors, obj._id);
        temp.push(obj._id);
      } catch (error) {
        console.log('dsasdjflkasdjflksadf', obj);
      }
    }

    console.log('total shit...', temp.length);
    db.close();
    process.exit(1);
  } catch (err) {
    Log.debug({ msg: 'error from main function', arg1: err });
    process.exit(1);
  }
})();

// const temp = [];
// (async function() {
//   try {
//     const db = await MongoClient.connect(url);
//     const dbo = await db.db('eurodev-db');
//     await dbo.command({
//       collMod: 'user',
//       validator: {
//         $jsonSchema: jsonSchema
//       },
//       validationLevel: 'strict'
//     });

//     const collection = await dbo.collection('user');
//     const cursor = await collection.find().toArray();
//     for (const obj of cursor) {
//       const validate = ajv.compile(jsonSchema);
//       const test = validate(obj);
//       try {
//         if (!test) console.log(validate.errors, obj._id);
//         temp.push(obj._id);
//       } catch (error) {
//         console.log('dsasdjflkasdjflksadf', obj);
//       }
//     }
//     db.close();
//     console.log('total shit...', temp.length);
//   } catch (error) {
//     console.log(error);
//   }
// })();
