module.exports = function (Demo) {
  Demo.beforeRemote('prototype.updateAttributes', function (ctx, modelInstance, next) {
    console.log('before ctx.req.params', ctx.req.params);
    console.log('before miodel insta', modelInstance);
    next();
  });

  Demo.afterRemote('prototype.updateAttributes', function (ctx, modelInstance, next) {
    console.log('after ctx.req.params', ctx.req.params);
    console.log('after miodel insta', modelInstance);
    next();
  });

  Demo.remoteMethod(
    'greet', {
      http: {
        path: '/greet',
        verb: 'get'
      },
      returns: {
        arg: 'results',
        type: 'string'
      }
    }
  );

  Demo.remoteMethod(
    'native', {
      http: {
        path: '/n',
        verb: 'get'
      },
      returns: {
        arg: 'results',
        type: 'string'
      }
    }
  );
};
