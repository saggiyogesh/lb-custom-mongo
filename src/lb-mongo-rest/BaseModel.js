const { ObjectId } = require('mongodb');
const { promiseOrCallback } = require('mongoose/lib/utils');

const LeanMongooseFinders = require('./LeanMongooseFinders');
const NativeMongo = require('./NativeMongo');
const Populate = require('./Populate');
const mix = require('../mix');
const { prepareMongoOpts, replaceMongoOp } = require('../lbMongoFilter');

class BaseModel extends mix(LeanMongooseFinders, NativeMongo, Populate) {
  static async beforeCreate() {}

  static async afterCreate() {}

  static async beforeUpdate() {}

  static async afterUpdate() {}

  static async beforeDelete() {}

  static async afterDelete() {}

  static _create(data) {
    if (this.collection._validateMany) {
      // validate data first by jsonvalidator, if Model configured & in TYPES_MODEL env var
      const err = this.collection._validateMany(data);
      if (err) {
        throw err;
      }
    }

    // create mongoose doc & override validate fn
    if (!Array.isArray(data)) {
      data = [data];
    }
    data = data.map(d => {
      const doc = new this(d);

      // overriding mongoose validate doc validation to skip mongoose schema validation while inserting.
      doc.validate = function(options, callback) {
        if (typeof options === 'function') {
          callback = options;
          options = null;
        }
        return promiseOrCallback(callback, fn => fn(null, true));
      };
      return doc;
    });

    return this.insertMany(data);
  }

  static async create(data) {
    await this.beforeCreate({ instance: data });
    // check if _id is not ObjectId for this model
    if (this.schemaDef.properties._id && !data._id) {
      data._id = ObjectId();
    }
    let instance = await this._create(data);
    if (Array.isArray(instance)) {
      instance = instance[0];
    }
    const ctx = { instance };
    await this.afterCreate(ctx);
    return ctx.instance;
  }

  // passed
  static async _upsert(data) {
    const id = data.id || data._id;
    delete data.id;
    delete data._id;
    // id = coerceId(id);
    const isExists = await this.countM({ _id: id });
    if (!isExists) {
      data._id = id;
      return this.create(data);
    }
    const where = { id };
    await this.beforeUpdate({ data, where });
    const instance = await this.findOneAndUpdate({ _id: id }, data, { new: true });
    await this.afterUpdate({ data, where, instance });
    return instance;
  }

  static upsert(data, cb) {
    return this._upsert(data, cb);
  }

  // passed
  static _find(filter = {}, cb) {
    if (typeof filter === 'function') {
      cb = filter;
      filter = {};
    }
    const { where, fields, skip, limit, sort } = prepareMongoOpts(filter);
    return promiseOrCallback(cb, fn => {
      this.findM(where, fields, { skip, limit, sort }, fn);
    });
  }

  static _findOne(filter, cb) {
    if (typeof filter === 'function') {
      cb = filter;
      filter = {};
    }
    const { where, fields, skip, limit, sort } = prepareMongoOpts(filter);
    return promiseOrCallback(cb, fn => {
      this.findOneM(where, fields, { skip, limit, sort }, fn);
    });
  }

  static _findById(id, filter, cb) {
    const { fields, skip, limit, sort } = prepareMongoOpts(filter);
    // if (ObjectId.isValid(id)) {
    //   return promiseOrCallback(cb, fn => {
    //     this.findOneM({ _id: id }, fields, { skip, limit, sort }, fn);
    //   });
    // }
    const where = { _id: id };
    return promiseOrCallback(cb, fn => {
      this.findOneM(where, fields, { skip, limit, sort }, fn);
    });
  }

  static _count(where, cb) {
    return promiseOrCallback(cb, fn => {
      this.countM(replaceMongoOp(where), fn);
    });
  }

  static destroyAll(where, cb) {
    return promiseOrCallback(cb, fn => {
      this.remove(replaceMongoOp(where), fn);
    });
  }

  static _updateAll(where, data, cb) {
    return promiseOrCallback(cb, fn => {
      this.updateMany(replaceMongoOp(where), data, fn);
    });
  }

  static updateAll(where, data, cb) {
    return this._updateAll(where, data, cb);
  }

  static _deleteById(id) {
    // id = coerceId(id);
    return this.remove({ _id: id });
  }

  static async deleteById(id) {
    const where = { id };
    await this.beforeDelete({ where });
    const res = this._deleteById(id);
    await this.afterDelete({ where });
    return res;
  }

  updateAttribute(name, value, options) {
    const data = {};
    data[name] = value;
    return this.updateAttributes(data, options);
  }

  async updateAttributes(data) {
    const id = data.id || data._id || this._id || this._doc._id;
    delete data.id;
    delete data._id;
    // id = coerceId(id);
    const currentInstance = this._doc;
    const where = { id };
    // data.id = id;
    await this.constructor.beforeUpdate({ currentInstance, where, data });
    data = { $set: data };

    // using mongo method instead of mongoose to avoid casting of values done by mongoose
    const { value } = await this.collection.findOneAndUpdate({ _id: id }, data, { returnOriginal: false });

    // creating mongoose model instance to return
    const instance = new this.constructor(value);
    await this.constructor.afterUpdate({ instance, where, data });
    return instance;
  }
}

module.exports = BaseModel;
