const { MongoClient } = require('mongodb');
const url = 'mongodb://localhost:27017/';
const mongoose = require('mongoose');
const lilschema = require('./schema/user');
require('mongoose-schema-jsonschema')(mongoose);
const Ajv = require('ajv');
const ajv = new Ajv();
require('ajv-bsontype')(ajv);

const Schema = mongoose.Schema;

const BannerSchema = new Schema(lilschema);
console.dir(BannerSchema, {
  depth: null
});
const tempSchema = BannerSchema.jsonSchema();
let banSchema = JSON.stringify(tempSchema);
banSchema = banSchema.replace(/"type":"date",/g, '');
banSchema = banSchema.replace(/"type":"objectid",/g, '');

banSchema = JSON.parse(banSchema);

(async function() {
  try {
    const db = await MongoClient.connect(url);
    const dbo = await db.db('henkeltest-db');
    await dbo.command({
      collMod: 'user',
      validator: {
        $jsonSchema: banSchema
      },
      validationLevel: 'strict'
    });
    db.close();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})();

// let temp = [];
// (async function() {
//     try {
//         const db = await MongoClient.connect(url);
//         const dbo = db.db('henkeltest-db_copy');
//         let collection = await dbo.collection('Resource');
//         let cursor = await collection.find().toArray();
//         for (const obj of cursor) {
//             let validate = ajv.compile(banSchema);
//             let test = validate(obj);
//             try {
//                 if (!test) console.log(validate.errors, obj._id);
//                 temp.push(obj._id);
//             } catch (error) {
//                 console.log('dsasdjflkasdjflksadf', obj)
//             }
//         }
//         db.close();
//         console.log('toal shit...',temp.length)
//     } catch (error) {
//         console.log(error);
//     }
// })();
