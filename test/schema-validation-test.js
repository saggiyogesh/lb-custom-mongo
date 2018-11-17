import test from 'ava';
import axios from 'axios';
const getPort = require('get-port');
const sleep = require('then-sleep');
const { ObjectId } = require('mongodb');
const { randomStr, isObjectIdInstance } = require('./TestUtils');
let url;
let app;

function afterAppStarted() {
  return new Promise(resolve => {
    process.on('appStarted', () => {
      resolve('1');
    });
  });
}

async function startApp() {
  app = require('./server/server.js');
  await afterAppStarted();
  await sleep(100);
}

test.before(async () => {
  let port = 5000;
  port = await getPort();
  process.env.PORT = port;

  await startApp();
  const { address = '0.0.0.0' } = process.env;
  url = `http://${address}:${port}/api`;
  axios.create({
    baseURL: url,
    timeout: 5000
  });
});

async function create(model = 'Demo', _id) {
  return await app.models[model].create({
    _id,
    email: 'saggiyogesh@gmail.com',
    name: 'yoo'
  });
}

async function findByIdN(id, model = 'Demo') {
  return await app.models[model].findByIdN(id);
}

// for checking oid string with oid obj
function equals(obj1, obj2) {
  return typeof obj1 === typeof obj2 && obj1.equals(obj2);
}

test('findN with _id or id with where conditions', async t => {
  const c = await create();
  let r = await app.models.Demo.findN({ where: { _id: ObjectId(c.id) } });
  console.log('cccc', c);
  console.log('rrrr', r);
  t.truthy(r.length === 1);
  t.truthy(equals(r[0].id, c._id));

  r = await app.models.Demo.findN({ where: { id: ObjectId(c.id) } });
  console.log('rrrr1', r);
  t.truthy(r.length === 1);
  t.truthy(equals(r[0].id, c._id));

  // test $in
  r = await app.models.Demo.findN({ where: { _id: { $in: [ObjectId(c.id)] } } });
  console.log('rrrr2', r);
  t.truthy(r.length === 1);
  t.truthy(equals(r[0].id, c._id));

  r = await app.models.Demo.findN({ where: { id: { $in: [ObjectId(c.id)] } } });
  console.log('rrrr3', r);
  t.truthy(r.length === 1);
  t.truthy(equals(r[0].id, c._id));
});

test('findOneN with _id or id with where conditions', async t => {
  const c = await create();
  let r = await app.models.Demo.findOneN({ where: { _id: ObjectId(c.id) } });
  console.log('cccc', c, typeof c._id);
  console.log('rrrr', r, typeof r.id);
  t.truthy(equals(r.id, c._id));

  r = await app.models.Demo.findOneN({ where: { id: ObjectId(c.id) } });
  console.log('rrrr1', r, typeof r.id);
  t.truthy(equals(r.id, c._id));
});

test('check for id as string', async t => {
  const c = await create();
  const f = await findByIdN(ObjectId(c.id));
  t.is(typeof c.id, 'string');

  t.truthy(isObjectIdInstance(f.id));
  t.truthy(isObjectIdInstance(c._id));

  t.falsy(isObjectIdInstance(c._id.toString()));

  t.truthy(equals(f.id, c._id));
});

test('check for id as String and valid ObjectId', async t => {
  const _id = randomStr();
  const c = await create('User', _id);

  const f = await findByIdN(c.id, 'User');
  t.is(typeof f.id, 'string');
  t.truthy(f.id === c.id);
  // User schema _id is types as String
  const c1 = await create('User');

  const f1 = await findByIdN(c1.id, 'User');
  t.is(typeof f1.id, 'string');
  t.truthy(ObjectId.isValid(f1.id));
  t.truthy(f1.id === c1.id);
});

test('aggregateN', async t => {
  const r = await app.models.Demo.aggregateN([{ $match: { email: 'saggiyogesh@gmail.com' } }]);
  t.truthy(Array.isArray(r));
});

test('countN with _id or id with where conditions', async t => {
  let r = await app.models.Demo.countN({ email: 'saggiyogesh@gmail.com' });
  t.truthy(Number.isInteger(r));
});
