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

// skipped till schema is not fixed 
test.skip('findN with _id or id with where conditions', async t => {
  const c = await create();
  let r = await app.models.Demo.findN({ where: { _id: c.id } });
  console.log('cccc', c);
  console.log('rrrr', r);
  t.truthy(r.length === 1);
  t.truthy(r[0].id.equals(c.id));

  r = await app.models.Demo.findN({ where: { id: c.id } });
  console.log('cccc', c);
  console.log('rrrr', r);
  t.truthy(r.length === 1);
  t.truthy(r[0].id.equals(c.id));

  // test $in
  r = await app.models.Demo.findN({ where: { _id: { $in: [c.id] } } });
  console.log('cccc', c);
  console.log('rrrr', r);
  t.truthy(r.length === 1);
  t.truthy(r[0].id.equals(c.id));

  r = await app.models.Demo.findN({ where: { id: { $in: [c.id] } } });
  console.log('cccc', c);
  console.log('rrrr', r);
  t.truthy(r.length === 1);
  t.truthy(r[0].id.equals(c.id));
});

// skipped till schema is not fixed 
test.skip('findOneN with _id or id with where conditions', async t => {
  const c = await create();
  let r = await app.models.Demo.findOneN({ where: { _id: c.id } });
  console.log('cccc', c);
  console.log('rrrr', r);
  t.truthy(r.id.equals(c.id));

  r = await app.models.Demo.findOneN({ where: { id: c.id } });
  console.log('cccc', c);
  console.log('rrrr', r);
  t.truthy(r.id.equals(c.id));
});

// skipped till schema is not fixed 
test.skip('check for id as ObjectId', async t => {
  const c = await create();
  const f = await findByIdN(c.id);
  t.truthy(f.id instanceof ObjectId);
  t.truthy(f.id.equals(c.id));
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
