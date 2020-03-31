import test from 'ava';
import axios from 'axios';
const getPort = require('get-port');
const sleep = require('then-sleep');
const { ObjectId } = require('mongodb');
const { randomStr } = require('./TestUtils');
let url, app;

function afterAppStarted() {
  return new Promise((resolve, reject) => {
    process.on('appStarted', function () {
      resolve('1');
    });
  });
}

async function startApp(params) {
  app = require('./server/server.js');
  await afterAppStarted();
  await sleep(100);
}

test.before(async t => {
  let port = 5000;
  process.env.PORT = port = await getPort();
  await startApp();
  const { address = '0.0.0.0' } = process.env;
  url = `http://${address}:${port}/api`;
  const caller = axios.create({
    baseURL: url,
    timeout: 5000
  });

  console.log('app.models', Object.keys(app.models));
});

async function create(model = 'Demo', _id, name = 'yoo') {
  return await app.models[model].create({
    _id,
    email: 'saggiyogesh@gmail.com',
    name
  });
}

async function findById(id, model = 'Demo') {
  return await app.models[model].findById(id);
}

test('check for id as ObjectId', async t => {
  const c = await create();
  console.log('ccc', c);
  t.is(typeof c.id, 'string'); // maintain compatibility with old loopback code

  const f = await findById(ObjectId(c._id));
  t.truthy(f._id instanceof ObjectId);
  t.is(typeof f.id, 'string');
});

test('check for id as String and valid ObjectId', async t => {
  const _id = randomStr();
  const c = await create('User', _id);
  t.is(typeof c.id, 'string');

  const f = await findById(c.id, 'User');
  t.is(typeof f.id, 'string');

  const c1 = await create('User');
  t.is(typeof c1.id, 'string');
  t.truthy(ObjectId.isValid(c1.id));

  const f1 = await findById(c1.id, 'User');
  t.is(typeof f1.id, 'string');
  t.truthy(ObjectId.isValid(f1.id));
});

test('test for memo find fns returning same results', async t => {
  const c = await create();

  const f = await findById(c.id);
  const f1 = await findById(c.id);
  t.deepEqual(f, f1);

  // let c = await create();
});
