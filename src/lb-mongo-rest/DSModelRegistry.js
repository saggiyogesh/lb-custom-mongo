const assert = require('assert');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const _ds = {};

exports.registerConnection = function(name, connection) {
  assert(name, 'Error in DS name.');

  assert(!Object.keys(_ds).includes(name), `DS name already used. ${name}`);

  _ds[name] = connection;
  console.log('Registry registerDS');
};

exports.Model = function(schema, options = {}) {
  options.timestamps = true;
  if (!Object.prototype.hasOwnProperty.call(options, 'autoIndex')) {
    options.autoIndex = false;
  }

  if (!Object.prototype.hasOwnProperty.call(options, 'versionKey')) {
    options.versionKey = false;
  }
  return Class => {
    const schemaInstance = new Schema(schema, options);
    schemaInstance.loadClass(Class);
    mongoose.model(Class.name, schemaInstance);
  };
};

// const runValidatorsPlugin = function (schema, options) {
//   schema.pre('findOneAndUpdate', function (next) {
//     this.options.runValidators = true;
//     next();
//   });

//   schema.pre('update', function (next) {
//     this.options.runValidators = true;
//     next();
//   });

//   schema.pre('updateMany', function (next) {
//     this.options.runValidators = true;
//     next();
//   });

//   schema.pre('updateOne', function (next) {
//     this.options.runValidators = true;
//     next();
//   });
// };

// mongoose.plugin(runValidatorsPlugin);
