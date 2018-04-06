const memoize = require('memoizee');
// const { ObjectId } = require('mongodb');
const { isEmpty } = require('lodash');
const Promise = require('bluebird');
const HAS_LB_OP = /"or"|"and"|"gt"|"gte"|"lte"|"lt"|"inq"|"nin"/;

/**
 * copied from mongoose utils.js
 */
function promiseOrCallback(callback, fn) {
  if (typeof callback === 'function') {
    try {
      return fn(callback);
    } catch (error) {
      return process.nextTick(() => {
        throw error;
      });
    }
  }
  return new Promise((resolve, reject) => {
    fn(function (error, res) {
      if (error != null) {
        return reject(error);
      }
      if (arguments.length > 2) {
        return resolve(Array.prototype.slice.call(arguments, 1));
      }
      resolve(res);
    });
  });
};

const replaceMongoOp = memoize(function replaceMongoOp(where) {
  where = where || {};
  if (!isEmpty(where)) {
    where = JSON.stringify(where);
    if (HAS_LB_OP.test(where)) {
      where = where
        .replace('"or"', '"$or"')
        .replace('"and"', '"$and"')
        .replace('"gt"', '"$gt"')
        .replace('"gte"', '"$gte"')
        .replace('"lt"', '"$lt"')
        .replace('"lte"', '"$lte"')
        .replace('"inq"', '"$in"')
        .replace('"nin"', '"$nin"');
    }
    return JSON.parse(where);
  }
  return where;
});

const modifySortForMongo = memoize(function modifySortForMongo(sortStr) {
  if (!sortStr) {
    return;
  }
  const arr = sortStr.split(/\s+/);
  const s = {};
  s[arr[0]] = arr[1] === 'ASC' ? 1 : -1;
  return s;
});

function prepareMongoOpts(filter = {}) {
  const { fields = {}, limit, order, skip, where = {} } = filter;
  const sort = modifySortForMongo(order);
  return { where: replaceMongoOp(where), fields, skip, limit, sort };
}

// function coerceId(id) {
//   if (!(id instanceof ObjectId)) {
//     id = ObjectId(id);
//   }
//   return id;
// }

class BaseModel {
  static async beforeCreate() { }
  static async afterCreate() { }

  static async beforeUpdate() { }
  static async afterUpdate() { }

  static async beforeDelete() { }
  static async afterDelete() { }

  static _create(data, cb) {
    return this.insertMany(data);
  }

  static async create(data) {
    await this.beforeCreate({ instance: data });
    let instance = await this._create(data);
    if (Array.isArray(instance)) {
      instance = instance[0];
    }
    await this.afterCreate({ instance });
    return instance;
  }

  // passed
  static async _upsert(data) {
    const id = data.id || data._id;
    delete data.id;
    delete data._id;
    // id = coerceId(id);
    if (!id) {
      return await this.create(data);
    } else {
      const where = { id: id };
      await this.beforeUpdate({ data, where });
      const instance = await this.findOneAndUpdate({ _id: id }, data, { new: true });
      await this.afterUpdate({ data, where, instance });
      return instance;
    }
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
    return promiseOrCallback(cb, fn => { this.findOneM(where, fields, { skip, limit, sort }, fn); });
  }

  static _findById(id, filter, cb) {
    const { fields, skip, limit, sort } = prepareMongoOpts(filter);
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      return promiseOrCallback(cb, fn => {
        this.findOneM({ _id: id }, fields, { skip, limit, sort }, fn);
      });
    }
    const where = { id };
    return promiseOrCallback(cb, fn => { this.findOneM(where, fields, { skip, limit, sort }, fn); });
  }

  static _count(where, cb) {
    return promiseOrCallback(cb, fn => { this.countM(replaceMongoOp(where), fn); });
  }

  static destroyAll(where, cb) {
    return promiseOrCallback(cb, fn => {
      this.remove(replaceMongoOp(where), fn);
    });
  }

  static _updateAll(where, data, cb) {
    return promiseOrCallback(cb, fn => { this.updateMany(replaceMongoOp(where), data, fn); });
  }

  static updateAll(where, data, cb) {
    this._updateAll(where, data, cb);
  }

  static _deleteById(id) {
    // id = coerceId(id);
    return this.remove({ _id: id });
  }

  static async deleteById(id) {
    const where = { id };
    await this.beforeUpdate({ where });
    const res = this._deleteById(id);
    await this.afterUpdate({ where });
    return res;
  }

  static getNativeCollection() {
    return this.collection;
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
    const where = { _id: id };
    await this.constructor.beforeUpdate({ currentInstance, where });
    const instance = await this.constructor.findOneAndUpdate(where, data, { new: true });
    await this.constructor.afterUpdate({ instance, where });
    return instance;
  }
}

module.exports = BaseModel;
