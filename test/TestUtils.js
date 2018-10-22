const { ObjectId } = require('mongodb');

exports.randomStr = function() {
  return (
    Math.random()
      .toString(36)
      .substring(2, 15) +
    Math.random()
      .toString(36)
      .substring(2, 15)
  );
};

exports.isObjectIdInstance = function(oid) {
  return ObjectId.isValid(oid) && oid.toJSON;
};
