const { pluralize } = require('inflection');
const remoting = require('strong-remoting');
const { SharedClass } = remoting;

let _remotes;
exports.init = function(app) {
  _remotes = remoting.create({
    cors: false,
    json: {
      limit: '20mb'
    },
    urlencoded: {
      extended: true,
      limit: '100kb'
    },
    errorHandler: {
      handler: (error, req, res, next) => {
        if (error instanceof Error) {
          console.log(error);
        }
        console.log('Remoting Error: ', req.method, req.url, req.query, req.body);
        next();
      }
    }
  });
  app.set('remoting', _remotes);
  return _remotes;
};

const _remoteMethods = {};
exports.restify = function(name, model) {
  const className = pluralize(name);
  const sharedClass = new SharedClass(className, model);
  _remotes.addClass(sharedClass);
  _remoteMethods[name] &&
    _remoteMethods[name].forEach(m => {
      m(sharedClass);
    });
  model.sharedClass = sharedClass;
};

function convertNullToNotFoundError(ctx, cb) {
  if (ctx.result !== null) return cb();

  const modelName = ctx.method.sharedClass.name;
  const id = ctx.getArgByName('id');
  const msg = `Unknown model: ${modelName}, id: ${id}`;
  const error = new Error(msg);
  error.statusCode = 404;
  error.status = 404;
  error.code = 'MODEL_NOT_FOUND';
  cb(error);
}

exports.insert = function(klass /* , model, config */) {
  const className = pluralize(klass.name);
  _remoteMethods[klass.name] = _remoteMethods[klass.name] || [];
  klass.beforeRemote = function(name, fn) {
    _remotes.before(className + '.' + name, (ctx, next) => {
      return fn(ctx, ctx.result, next);
    });
  };

  klass.afterRemote = function(name, fn) {
    _remotes.after(className + '.' + name, (ctx, next) => {
      return fn(ctx, ctx.result, next);
    });
  };

  klass.remoteMethod = function(name, options = {}) {
    if (options.isStatic === false) {
      options.isStatic = false;
    } else {
      options.isStatic = true;
    }
    _remoteMethods[klass.name].push(sharedClass => {
      sharedClass.defineMethod(name, options);
    });
  };

  klass.sharedCtor = function(data, id, options, fn) {
    const Model = this;

    const isRemoteInvocationWithOptions =
      typeof data !== 'object' && typeof id === 'object' && typeof options === 'function';
    if (isRemoteInvocationWithOptions) {
      // sharedCtor(id, options, fn)
      fn = options;
      options = id;
      id = data;
      data = null;
    } else if (typeof data === 'function') {
      // sharedCtor(fn)
      fn = data;
      data = null;
      id = null;
      options = null;
    } else if (typeof id === 'function') {
      // sharedCtor(data, fn)
      // sharedCtor(id, fn)
      fn = id;
      options = null;

      if (typeof data === 'object') {
        id = null;
      } else {
        id = data;
        data = null;
      }
    }

    if (id && data) {
      const model = new Model(data);
      model.id = id;
      fn(null, model);
    } else if (data) {
      fn(null, new Model(data));
    } else if (id) {
      const filter = {};
      Model.findById(id, filter, (err, model) => {
        if (err) {
          fn(err);
        } else if (model) {
          fn(null, model);
        } else {
          err = new Error(`could not find a model with id: ${id}`);
          err.statusCode = 404;
          err.code = 'MODEL_NOT_FOUND';
          fn(err);
        }
      });
    } else {
      fn(new Error('must specify an {{id}} or {{data}}'));
    }
  };

  const idDesc = className + ' id';
  klass.sharedCtor.accepts = {
    arg: 'id',
    type: 'any',
    required: true,
    http: { source: 'path' },
    description: idDesc
  };

  klass.sharedCtor.http = { path: '/:id' };

  klass.sharedCtor.returns = { root: true };

  // klass.getSharedClass = function getSharedClass() {
  //   return sharedClass;
  // };

  // default routes
  klass.remoteMethod('create', {
    accepts: {
      arg: 'data',
      type: 'object',
      allowArray: true,
      description: 'Model instance data',
      http: { source: 'body' }
    },
    returns: {
      arg: 'data',
      root: true
    },
    http: { verb: 'post', path: '/' }
  });

  klass.remoteMethod('upsert', {
    aliases: ['patchOrCreate', 'updateOrCreate'],
    description: 'Patch an existing model instance or insert a new one into the data source.',
    accessType: 'WRITE',
    accepts: {
      arg: 'data',
      type: 'object',
      http: { source: 'body' },
      description: 'Model instance data'
    },
    returns: { arg: 'data', root: true },
    http: [{ verb: 'put', path: '/' }]
  });

  klass.remoteMethod('findById', {
    description: 'Find a model instance by {{id}} from the data source.',
    accessType: 'READ',
    accepts: [
      {
        arg: 'id',
        type: 'any',
        description: 'Model id',
        required: true,
        http: { source: 'path' }
      },
      {
        arg: 'filter',
        type: 'object',
        description: 'Filter defining fields and include - must be a JSON-encoded string ({"something":"value"})'
      }
    ],
    returns: { arg: 'data', root: true },
    http: { verb: 'get', path: '/:id' },
    rest: { after: convertNullToNotFoundError }
  });

  klass.remoteMethod('find', {
    description: 'Find all instances of the model matched by filter from the data source.',
    accessType: 'READ',
    accepts: [
      {
        arg: 'filter',
        type: 'object',
        description:
          'Filter defining fields, where, include, order, offset, and limit - must be a ' +
          'JSON-encoded string ({"something":"value"})'
      }
    ],
    returns: { arg: 'data', type: [], root: true },
    http: { verb: 'get', path: '/' }
  });

  klass.remoteMethod('findOne', {
    description: 'Find first instance of the model matched by filter from the data source.',
    accessType: 'READ',
    accepts: [
      {
        arg: 'filter',
        type: 'object',
        description:
          'Filter defining fields, where, include, order, offset, and limit - must be a ' +
          'JSON-encoded string ({"something":"value"})'
      }
    ],
    returns: { arg: 'data', root: true },
    http: { verb: 'get', path: '/findOne' },
    rest: { after: convertNullToNotFoundError }
  });

  klass.remoteMethod('destroyAll', {
    description: 'Delete all matching records.',
    accessType: 'WRITE',
    accepts: { arg: 'where', type: 'object', description: 'filter.where object' },
    returns: {
      arg: 'count',
      type: 'object',
      description: 'The number of instances deleted',
      root: true
    },
    http: { verb: 'del', path: '/' },
    shared: false
  });

  klass.remoteMethod('updateAll', {
    aliases: ['update'],
    description: 'Update instances of the model matched by {{where}} from the data source.',
    accessType: 'WRITE',
    accepts: [
      {
        arg: 'where',
        type: 'object',
        http: { source: 'query' },
        description: 'Criteria to match model instances'
      },
      {
        arg: 'data',
        type: 'object',
        http: { source: 'body' },
        description: 'An object of model property name/value pairs'
      }
    ],
    returns: {
      arg: 'info',
      description: 'Information related to the outcome of the operation',
      type: {
        count: {
          type: 'number',
          description: 'The number of instances updated'
        }
      },
      root: true
    },
    http: { verb: 'post', path: '/update' }
  });

  klass.remoteMethod('deleteById', {
    aliases: ['destroyById', 'removeById'],
    description: 'Delete a model instance by {{id}} from the data source.',
    accessType: 'WRITE',
    accepts: {
      arg: 'id',
      type: 'any',
      description: 'Model id',
      required: true,
      http: { source: 'path' }
    },
    http: { verb: 'del', path: '/:id' },
    returns: { arg: 'count', type: 'object', root: true }
  });

  klass.remoteMethod('count', {
    description: 'Count instances of the model matched by where from the data source.',
    accessType: 'READ',
    accepts: { arg: 'where', type: 'object', description: 'Criteria to match model instances' },
    returns: { arg: 'count', type: 'number' },
    http: { verb: 'get', path: '/count' }
  });

  klass.remoteMethod('updateAttributes', {
    isStatic: false,
    accepts: {
      arg: 'data',
      type: 'object',
      http: { source: 'body' },
      description: 'An object of model property name/value pairs'
    },
    http: { path: '/', verb: 'put' },
    returns: { arg: 'data', root: true }
  });
};
