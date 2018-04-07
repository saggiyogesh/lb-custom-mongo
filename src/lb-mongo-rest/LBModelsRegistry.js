// const assert = require('assert');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

exports.register = function modelDecorator(Class, config, options = {}) {
  // options.timestamps = true;
  if (!options.hasOwnProperty('autoIndex')) {
    options.autoIndex = false;
  }

  if (!options.hasOwnProperty('versionKey')) {
    options.versionKey = false;
  }

  options.strict = false;
  options.collection = Class.name;
  const schemaInstance = new Schema(config.properties, options);
  schemaInstance.loadClass(Class);
  schemaInstance.set('toJSON', {
    virtuals: true, getters: true, transform: function (doc, ret) { delete ret._id; }
  });

  schemaInstance.set('toObject', { getters: true, transform: function (doc, ret) { delete ret._id; } });
  mongoose.model(config.name, schemaInstance);
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
