module.exports = function (Model) {
  Model.mixinStaticMethod = async function (id) {
    return { count: await Model.count() };
  };

  Model.mixinMethod = function (id, next) {
    (async function () {
      try {
        next(null, {
          id,
          count: await Model.count(),
          greet: await Model.greet()
        });
      } catch (err) {
        next(err);
      }
    })();
  };

  Model.remoteMethod('mixinMethod', {
    accepts: [{
      arg: 'id',
      type: 'string',
      http: {
        source: 'query'
      }
    }],
    http: {
      path: '/mixinMethod',
      verb: 'get'
    },
    returns: {
      type: 'object',
      root: true
    }
  });
};
