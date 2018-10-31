const { ObjectId } = require('mongodb');
const Promise = require('bluebird');

/**
 * Pass id to filter by _id. API is kept same as other mongoose methods.
 */
module.exports = class Populate {
  static getNativeCollection() {
    return this.collection;
  }

  static findByIdNC(id, filter) {
    return this.findByIdN(ObjectId(id), filter);
  }

  static async findOneF(data, fetchById) {
    if (fetchById) {
      data = await this.findByIdN(ObjectId.isValid(data) ? ObjectId(data) : data);
    }
    const { models } = this.app;
    let promObj = {};
    for (const [key, value] of Object.entries(this.getMapping())) {
      let { finder, outputField } = value;
      !finder && (finder = 'findByIdNC');
      !outputField && (outputField = key);
      console.log('.........', key, value);
      promObj[outputField] = models[value.collection][finder](data[key], { fields: value.fields || {} });
    }
    promObj = await Promise.props(promObj);
    return Object.assign(data, promObj);
  }
};
