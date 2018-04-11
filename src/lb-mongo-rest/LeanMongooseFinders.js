const { prepareMongoOpts, changeToId } = require('../lbMongoFilter');
module.exports = class LeanMongooseFinders {
  /**
   * Leaned version of mongoose `find`. 
   * @static
   * @param {Object} filter - Same as loopback find filter
   * @returns {Promise}
   */
  static async findL(filter) {
    const { where, fields, skip, limit, sort } = prepareMongoOpts(filter);
    const data = await this.findM(where, fields, { skip, limit, sort, lean: true });
    return changeToId(data);
  }

  /**
   * Leaned version of mongoose `findOne`. 
   * @static
   * @param {Object} filter - Same as loopback find filter
   * @returns {Promise}
   */
  static async findOneL(filter) {
    const { where, fields, skip, limit, sort } = prepareMongoOpts(filter);
    const data = await this.findOneM(where, fields, { skip, limit, sort, lean: true });
    return changeToId(data);
  }

  /**
   * Leaned version of mongoose `findById`. 
   * @static
   * @param {String} id - Model id
   * @param {Object} filter - Same as loopback find filter
   * @returns {Promise}
   */
  static async findByIdL(id, filter) {
    const { fields, skip, limit, sort } = prepareMongoOpts(filter);
    const data = await this.findOneM({ _id: id }, fields, { skip, limit, sort, lean: true });
    return changeToId(data);
  }
};
