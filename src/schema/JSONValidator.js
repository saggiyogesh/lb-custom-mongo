const Log = require('lil-logger').getLogger(__filename);
const Ajv = require('ajv');
const assert = require('assert');

module.exports = class JSONValidator {
  constructor(schemaName, jsonSchema, allErrors) {
    assert(schemaName, 'Schema name is not provided');
    assert(jsonSchema, 'jsonSchema is not provided');
    assert(typeof jsonSchema === 'object', 'jsonSchema must be object');

    this.schemaName = schemaName;
    this.jsonSchema = jsonSchema;
    const ajv = new Ajv({ allErrors });
    require('ajv-bsontype')(ajv);

    this._ajv = ajv;
    this._validate = ajv.compile(this.jsonSchema);
  }

  validate(doc) {
    const result = { valid: true, error: null, id: doc._id };
    const { _validate } = this;
    _validate.errors = [];
    const test = _validate(doc);
    if (!test) {
      // console.log(_validate.errors, doc._id);
      result.valid = false;
      result.error = _validate.errors;
    }

    return result;
  }

  validateMany(docs) {
    if (!Array.isArray(docs)) {
      // case when single doc were passed to validateMany
      docs = [docs];
    }
    Log.info({ msg: `Validating many docs for ${this.schemaName}`, arg1: docs.length });
    const res = {};
    for (const doc of docs) {
      const r = this.validate(doc);
      if (!r.valid) {
        res.hasError = true;
      }
      res[doc._id] = r;
    }
    res.docsCount = docs.length;
    return res;
  }
};
