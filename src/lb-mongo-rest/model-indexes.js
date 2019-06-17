const Promise = require('bluebird');

async function modelIndexes(model, config) {
  const indexes = config.schema.indexes;
  if (indexes) {
    console.log('Indexes are present!');
    const queryArr = [];
    Object.keys(indexes).forEach((obj) => {
      const { fields } = indexes[obj];
      if (typeof indexes[obj].fields === 'string') {
        // create simple index
        queryArr.push(model.collection.createIndex({[fields]: 1}, {name: obj, background: true}));
      } else if (typeof indexes[obj].fields === 'object') {
        // create compound index
        const tmpCompoundIndexFields = {};
        fields.forEach((obj) => { tmpCompoundIndexFields[obj] = 1; });
        queryArr.push(model.collection.createIndex(tmpCompoundIndexFields, {name: obj, background: true}));
      }
    });
    // const response = await model.collection.createIndex({name: 1});
    console.log('queryArr-------', queryArr.length);
    const response = await Promise.all(queryArr);
    console.log('response-----------', response);
  }
};

module.exports.createIndex = modelIndexes;
