// const assert = require('assert');
const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const { Schema } = mongoose;

// conditional $type for configured schemas
console.log('TYPE_MODELS--', process.env.TYPE_MODELS);
const TYPE_MODELS = {};
if (process.env.TYPE_MODELS) {
  for (const val of process.env.TYPE_MODELS.split(',')) {
    TYPE_MODELS[val] = val;
  }
}

exports.register = function(Class, config, options = {}) {
  // options.timestamps = true;
  if (!Object.prototype.hasOwnProperty.call(options, 'autoIndex')) {
    options.autoIndex = false;
  }

  if (!Object.prototype.hasOwnProperty.call(options, 'versionKey')) {
    options.versionKey = false;
  }

  if (TYPE_MODELS[Class.name]) {
    options.typeKey = '$type';
  }

  options.strict = false;
  options.id = false;
  options.minimize = false;
  options.collection = Class.name;

  const schemaInstance = new Schema(config.properties, options);
  schemaInstance.loadClass(Class);

  schemaInstance.virtual('id').get(function() {
    if (ObjectId.isValid(this._id)) {
      // TODO did for loopback compatibility, must be removed once schema is implemented
      return String(this._id);
    }
    return this._id;
  });

  schemaInstance.set('toJSON', {
    virtuals: true,
    getters: true,
    transform: (doc, ret) => {
      delete ret._id;
    }
  });

  schemaInstance.set('toObject', {
    getters: true,
    transform: (doc, ret) => {
      delete ret._id;
    }
  });

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
