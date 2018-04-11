const { prepareMongoOpts, changeToId } = require('../lbMongoFilter');

/**
 * Pass id to filter by _id. API is kept same as other mongoose methods.
 */
module.exports = class NativeMongo {
  static getNativeCollection() {
    return this.collection;
  }

  /**
   * `find` by mongo native. 
   * @static
   * @param {Object} filter - Same as loopback find filter
   * @returns {Promise}
   */
  static async findN(filter) {
    const { where, fields, skip, limit, sort } = prepareMongoOpts(filter, true);
    const data = await this.collection.find(where, { fields, skip, limit, sort }).toArray();
    return changeToId(data);
  }

  /**
   * `findOne` by mongo native. 
   * @static
   * @param {Object} filter - Same as loopback find filter
   * @returns {Promise}
   */
  static async findOneN(filter) {
    const { where, fields, skip, limit, sort } = prepareMongoOpts(filter, true);
    const data = await this.collection.findOne(where, { fields, skip, limit, sort });
    return changeToId(data);
  }

  /**
   * `findById` by mongo native. 
   * @static
   * @param {String} id - Model id
   * @param {Object} filter - Same as loopback find filter
   * @returns {Promise}
   */
  static async findByIdN(id, filter) {
    const { fields, skip, limit, sort } = prepareMongoOpts(filter, true);
    const data = await this.collection.findOne({ _id: id }, { fields, skip, limit, sort });
    return changeToId(data);
  }

  // static async createN(data) {
  //   await this.beforeCreate({ instance: data });
  //   let instance = await this.insertOne(data);
  //   console.log('instance', instance);
  //   if (Array.isArray(instance)) {
  //     instance = instance[0];
  //   }
  //   await this.afterCreate({ instance });
  // }
};
