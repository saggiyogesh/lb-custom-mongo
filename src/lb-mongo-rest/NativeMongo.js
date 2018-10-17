const { prepareMongoOpts, changeToId, replaceMongoOp } = require('../lbMongoFilter');

/**
 * Pass id to filter by _id. API is kept same as other mongoose methods.
 */
module.exports = class NativeMongo {
  static getNativeCollection() {
    return this.collection;
  }

  /**
   * `find` by mongo native.
   * Method doesn't coerce objectId String to ObjectId obj.
   * But this method treats `id` as `_id` in where condition
   *
   * Example:
   *       let r = await app.models.Demo.findN({ where: { _id: ObjectId(c.id) } });
   *
   *       let r = await app.models.Demo.findN({ where: { id: ObjectId(c.id) } });
   *
   *       let r = await app.models.Demo.findN({ where: { _id: { $in: [ObjectId(c.id)] } } });
   *
   *       let r = await app.models.Demo.findN({ where: { id: { $in: [ObjectId(c.id)] } } });
   *
   * @static
   * @param {Object} filter - Same as loopback find filter
   * @returns {Promise}
   */
  static async findN(filter) {
    const { where, fields, skip, limit, sort } = prepareMongoOpts(filter);
    const data = await this.collection.find(where, { fields, skip, limit, sort }).toArray();
    return changeToId(data);
  }

  /**
   * `findOne` by mongo native.
   *  Method doesn't coerce objectId String to ObjectId obj.
   *  But this method treats `id` as `_id` in where condition
   *
   * Example:
   *       let r = await app.models.Demo.findOneN({ where: { _id: ObjectId(c.id) } });
   *
   *       let r = await app.models.Demo.findOneN({ where: { id: ObjectId(c.id) } });
   *
   * @static
   * @param {Object} filter - Same as loopback find filter
   * @returns {Promise}
   */
  static async findOneN(filter) {
    const { where, fields, skip, limit, sort } = prepareMongoOpts(filter);
    const data = await this.collection.findOne(where, { fields, skip, limit, sort });
    return changeToId(data);
  }

  /**
   * `findById` by mongo native.
   *  Method doesn't coerce objectId String to ObjectId obj.
   *
   * Example:
   *       let r = await app.models.Demo.findOneId(ObjectId(c.id) );
   *
   * @static
   * @param {String} id - Model id
   * @param {Object} filter - Same as loopback find filter
   * @returns {Promise}
   */
  static async findByIdN(id, filter) {
    const { fields, skip, limit, sort } = prepareMongoOpts(filter);
    const data = await this.collection.findOne({ _id: id }, { fields, skip, limit, sort });
    return changeToId(data);
  }

  /**
   * Mongo native `aggregate` helper method
   *
   * Example:
   *     const r = await app.models.Demo.aggregateN([{ $match: { email: 'saggiyogesh@gmail.com' } }]);
   *
   * @static
   * @param {Array} pipeline - Array containing all the aggregation framework commands for the execution.
   * @param {Object} options - Optional settings.
   * @returns {Promise}
   */

  static aggregateN(pipeline, options) {
    return this.collection.aggregate(pipeline, options).toArray();
  }

  /**
   * Mongo native `count` helper method
   *
   * Example:
   *     const r = await app.models.Demo.aggregateN([{ $match: { email: 'saggiyogesh@gmail.com' } }]);
   *
   * @static
   * @param {Object} where - Same as loopback where clause
   * @returns {Promise}
   */
  static countN(where) {
    return this.collection.count(replaceMongoOp(where));
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
