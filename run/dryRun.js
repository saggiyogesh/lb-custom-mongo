#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const prettier = require('prettier');
const fs = require('fs');
// const path = require('path');
const { ManageValidator, insert, insertByInstance } = require('../src/schema/ManageValidator');
const JSONValidator = require('../src/schema/JSONValidator');
const url = process.env.MONGO_URL || 'mongodb://127.0.0.1/lb-mongo';
const { TYPE_MODELS, CWD } = process.env;

if (!TYPE_MODELS) {
  console.log('NO MODELS!!!!!');
  process.exit(1);
}

let db;
let dbo;
const temp = [];
const temp1 = [];
async function connectDB() {
  const urlSplitArray = url.split('/');
  const dbName = urlSplitArray[urlSplitArray.length - 1];
  db = await MongoClient.connect(url);
  dbo = await db.db(dbName);
}

async function validateCollectionDocs(schema) {
  const collection = dbo.collection(schema.name);
  const mv = new ManageValidator(dbo, schema);
  const jsonSchema = mv.getJSONSchema();

  const jv = new JSONValidator(schema.name, jsonSchema, true);

  const cursor = await collection
    .find()
    .limit(20)
    .toArray();
  console.log('Total docs: ', cursor.length);

  const clonedSchema = Object.assign({}, schema);
  console.log('schema name: ', schema.name);

  // create temp collection in db to validate against mongo jsonschema
  const d = new Date();
  clonedSchema.name = schema.name + d.toLocaleDateString() + '_' + d.toLocaleTimeString();
  await insert(dbo, clonedSchema);
  const clonedColl = dbo.collection(clonedSchema.name);
  console.log('inDB Total docs: ', cursor.length);
  for (const obj1 of cursor) {
    const obj = Object.assign({}, obj1);
    const id = obj._id;
    delete obj._id;
    try {
      // eslint-disable-next-line no-await-in-loop
      await clonedColl.insertOne(obj);
    } catch (err) {
      temp.push(id);
    }
  }

  // remove cloned collection
  await dbo.dropCollection(clonedSchema.name);

  console.log('total shit from db insert...', temp.length);

  // validate against ajv
  for (const obj of cursor) {
    const test = jv.validate(obj);
    if (!test.valid) {
      temp1.push(test.id);
    }
  }

  console.log('total shit from ajv...', temp1.length);

  if (temp.length !== temp1.length) {
    throw new Error('Incorrect invalid docs count from ajv & mongo validator. Check schema.');
  }

  return { mv, result: temp.length === 0 };
}

const cwd = CWD || process.cwd();
const schemasFolderPath = cwd + '/server/schemas';
const modelsFolderPath = cwd + '/server/models';

async function createJSONSchemas() {
  try {
    // create schemas folder in server
    try {
      fs.mkdirSync(schemasFolderPath);
    } catch (err) {
      console.log('err Folder Exists');
    }

    await connectDB();
    for (const modelName of TYPE_MODELS.split(',')) {
      const modelSchemaJSPath = `${modelsFolderPath}/${modelName}/schema.js`;
      const schema = require(modelSchemaJSPath);
      // eslint-disable-next-line no-await-in-loop
      const { mv, result } = await validateCollectionDocs(schema);

      if (result) {
        // everything fine till now... file docs validated
        // write jsonSchema in file in schemas folder
        // eslint-disable-next-line no-await-in-loop
        await fs.writeFileSync(
          `${schemasFolderPath}/${schema.name}.json`,
          prettier.format(JSON.stringify(mv.getJSONSchema()), { parser: 'json-stringify' })
        );

        // upsert the jsonschema in mongo collection
        // eslint-disable-next-line no-await-in-loop
        await insertByInstance(mv);
      }
    }
  } catch (err) {
    console.log('errr-->', err);
    throw err;
  } finally {
    process.exit(0);
  }
}

createJSONSchemas()
  .then()
  .catch(e => {
    console.log('FInal error occurred', e);
    process.exit(1);
  });

// const schemaFile = 'user.js';
// const schemaName = schemaFile.split('.js')[0];
// // const fileData = require(`${__dirname}/schema/${schemaFile}`);
// const fileData = require(`/Users/yogesh/workspace/lil-projects/loopback-custom-mongo/schema/user.js`);

// let temp = [];

// (async function() {
//   try {
//     const urlSplitArray = url.split('/');
//     const dbName = urlSplitArray[urlSplitArray.length - 1];
//     db = await MongoClient.connect(url);
//     const dbo = await db.db(dbName);
//     const collection = dbo.collection(schemaName);
//     const mv = new ManageValidator(dbo, fileData);
//     const jsonSchema = mv.getJSONSchema();

//     const jv = new JSONValidator(jsonSchema);

//     const cursor = await collection.find().toArray();
//     console.log('Total docs: ', cursor.length);

//     const clonedSchema = Object.assign({}, fileData);
//     console.log('fileData', fileData.name);
//     const d = new Date();
//     clonedSchema.name = fileData.name + d.toLocaleDateString() + d.toLocaleTimeString();
//     await insert(dbo, clonedSchema);
//     const clonedColl = dbo.collection(clonedSchema.name);
//     console.log('inDB Total docs: ', cursor.length);
//     for (const obj of cursor) {
//       const id = obj._id;
//       delete obj._id;
//       try {
//         await clonedColl.insert(obj);
//       } catch (err) {
//         temp.push(id);
//       }
//     }

//     console.log('total shit from db insert...', temp.length);

//     temp = [];
//     for (const obj of cursor) {
//       const test = jv.validate(obj);
//       if (!test.valid) {
//         temp.push(test.id);
//       }
//     }

//     console.log('total shit from ajv...', temp.length);
//   } catch (err) {
//     console.log('err--', err);
//   } finally {
//     db.close();
//     process.exit(1);
//   }
// })();
