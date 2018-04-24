const { ObjectId } = require('mongodb');
const memoize = require('memoizee');
const { isEmpty } = require('lodash');
const HAS_LB_OP = /"or"|"and"|"gt"|"gte"|"lte"|"lt"|"inq"|"nin"|"neq"/;
const DEFAULT_LIMIT = 20;

/**
 * Memoized Function constructs loopback's where filter to mongo native conditions
 * @param {Object} where - Loopback filter.where
 * @param {Boolean} convertToObjectId - Flag to convert `id` in where to ObjectId
 * @returns Object
 */
exports.replaceMongoOp = memoize(function replaceMongoOp(where, convertToObjectId) {
  where = where || {};
  if (!isEmpty(where) && where.id) {
    where._id = where.id;
    delete where.id;
  }
  return where;
});

exports.prepareMongoOpts = function prepareMongoOpts(filter = {}) {
  const { fields = {}, limit = DEFAULT_LIMIT, order, skip, where = {} } = filter;
  const sort = exports.modifySortForMongo(order);
  return { where: exports.replaceMongoOp(where), fields, skip, limit, sort };
};

exports.modifySortForMongo = memoize(function modifySortForMongo(sortStr) {
  if (!sortStr) {
    return;
  }
  const arr = sortStr.split(/\s+/);
  const s = {};
  s[arr[0]] = arr[1] === 'ASC' ? 1 : -1;
  return s;
});

exports.changeToId = function changeToId(data) {
  let isRetTypeArray = false;
  if (Array.isArray(data)) {
    isRetTypeArray = true;
  } else {
    data = [data];
  }
  data = data.map(d => {
    d.id = d._id;
    delete d._id;
    return d;
  });
  return isRetTypeArray ? data : data[0];
};
