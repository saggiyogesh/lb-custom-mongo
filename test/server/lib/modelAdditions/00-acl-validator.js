/**
 * This module will strictly check for user logged in for defined methods.
 * `lilACL.methods`:  remote methods of Model, on which authenticated must be checked
 * `lilACL.ignoredMethods`: remote methods of Model, on which authenticated will be ignored
 */

function getAllRemoteMethods(Model, ignoredMethods) {
  const modelName = Model.modelName;
  const remotes = [];
  Model.sharedClass._methods.forEach(m => {
    // Log.debug('------ remote --', m.stringName, modelName);
    const remote = m.stringName.replace(`${modelName}.`, '');
    if (ignoredMethods.indexOf(remote) === -1) {
      remotes.push(remote);
    }
  });

  // Log.debug('all remotes', remotes);
  return remotes;
}

function getMethodsNames(methods = []) {
  if (!Array.isArray(methods)) {
    return [methods];
  }
  return methods;
}

module.exports = function (Model) {
  const lilACLConf = Model.schemaDef.lilACL;

  // Log.debug(lilACLConf);
  if (lilACLConf && lilACLConf.methods) {
    let {
      methods,
      ignoredMethods
    } = lilACLConf;
    // Log.debug(methods, ignoredMethods);
    methods = getMethodsNames(methods);
    ignoredMethods = getMethodsNames(ignoredMethods);
    // Log.debug('configs---> ', methods, ignoredMethods);
    // wildcard
    if (methods.length === 1 && methods[0] === '*') {
      methods = getAllRemoteMethods(Model, ignoredMethods);
    }

    methods.forEach(m => {
      Model.beforeRemote(m, function (context, modelInstance, next) {
        let e;
        if (!context.req.isLoggedIn) {
          // e = new UnauthenticatedError();
        }

        next(e);
      });
    });
  }
};
