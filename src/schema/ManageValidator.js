const mongoose = require('mongoose');
const { Schema } = mongoose;
const Log = require('lil-logger').getLogger(__filename);
const assert = require('assert');

// let { TYPE_MODELS = [] } = process.env;

require('mongoose-schema-jsonschema')(mongoose);

/**
 * Remove all specified keys from an object, no matter how deep they are.
 * The removal is done in place, so run it on a copy if you don't want to modify the original object.
 *
 *
 * This function has no limit so circular objects will probably crash the browser
 * @param obj The object from where you want to remove the keys
 * @param keys An array of property names (strings) to remove
 */

function removeKeys(obj, keys) {
  let index;

  for (const [prop] of Object.entries(obj)) {
    switch (typeof obj[prop]) {
      case 'string':
      case 'number':
      case 'boolean':
        index = keys.indexOf(prop);

        if (index > -1) {
          delete obj[prop];
        }

        break;

      case 'object':
        index = keys.indexOf(prop);

        if (index > -1) {
          delete obj[prop];
        } else {
          removeKeys(obj[prop], keys);
        }

        break;

      default:
    }
  }
}

class ManageValidator {
  constructor(db, schema) {
    assert(db, 'db is not provided');
    assert(schema, 'schema is not provided');
    this.db = db;
    this.collectionName = schema.name;
    this.schema = schema;
    this._jsonSchema = null;

    // check for $type schema models
    // if (!TYPE_MODELS.includes(this.collectionName)) {
    //   // $type is not used for this model and jsonschema is inserted,
    //   // so have to avoid inserting jsonSchema for such collections
    //   // To use jsonSchema, collection schema must be converted from type to $type
    //   // collection
    //   throw new Error(
    //     'Not a $type model collection. Please change this to $type collection and set in `TYPE_MODELS` env var.'
    //   );
    // }
  }

  getJSONSchema() {
    if (!this._jsonSchema) {
      const mongooseSchema = this.schema.properties;
      // topLevelRequiredFields key is added to mongoose schema for explicitly specifying nested object schema as required, which is not allowed directly in mongoose schema
      const topLevelRequiredFields = this.schema.topLevelRequiredFields || [];

      const baseSchema = new Schema(mongooseSchema, {
        typeKey: '$type'
      });
      let baseJSONSchema = baseSchema.jsonSchema();

      // remove default prop from json schema obj, as its not supported by mongo
      removeKeys(baseJSONSchema, ['default']);

      // remove type: data & type: onjectid from json, as date & objectid as configured as 'bsonType', so not required 'type'
      baseJSONSchema = JSON.stringify(baseJSONSchema)
        .replace(/"type":"date",/g, '')
        .replace(/"type":"objectid",/g, '');
      baseJSONSchema = JSON.parse(baseJSONSchema);

      // insert topLevelRequiredFields in required array
      let { required = [] } = baseJSONSchema;
      required = [...required, ...topLevelRequiredFields];

      if (required.length) {
        baseJSONSchema.required = required;
      }

      console.dir(baseJSONSchema, {
        depth: null
      });

      this._jsonSchema = baseJSONSchema;
    }

    return this._jsonSchema;
  }

  async insert() {
    try {
      await this.db.command({
        collMod: this.collectionName,
        validator: {
          $jsonSchema: this.getJSONSchema()
        },
        validationLevel: 'strict'
      });
      const name = this.collectionName;
      Log.info({ msg: 'validator applied : ' + name });
    } catch (error) {
      Log.error({ msg: 'error from addValidator function', error });
      throw error;
    }
  }

  async delete() {
    try {
      await this.db.command({
        collMod: this.collectionName,
        validator: {},
        validationLevel: 'off'
      });
    } catch (error) {
      Log.debug({ msg: 'error from deleteOldValidator function', arg1: error });
      throw error;
    }
  }

  createColl() {
    return this.db.createCollection(this.collectionName);
  }
}

exports.ManageValidator = ManageValidator;

exports.insertByInstance = async mv => {
  await mv.createColl();
  await mv.delete();
  const jsonSchema = await mv.insert();
  return jsonSchema;
};

exports.insert = (db, schema) => {
  const mv = new ManageValidator(db, schema);
  return exports.insertByInstance(mv);
};
