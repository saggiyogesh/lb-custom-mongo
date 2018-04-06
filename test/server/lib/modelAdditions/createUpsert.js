module.exports = function (Model) {
  const add = (ctx) => {
    const req = ctx.req;
    const data = req.body;

    data.creationTime = new Date();
    data.lastUpdationTime = new Date();
  };

  const update = (ctx) => {
    const req = ctx.req;
    const data = req.body;
    data.lastUpdationTime = new Date();
  };

  Model.beforeRemote('create', function (ctx, modelInstance, next) {
    add(ctx);
    next();
  });

  Model.beforeRemote('upsert', function (ctx, modelInstance, next) {
    (modelInstance.id || ctx.req.body.id) ? update(ctx) : add(ctx);
    next();
  });

  Model.beforeRemote('prototype.updateAttributes', function (ctx, modelInstance, next) {
    update(ctx);
    next();
  });
};
