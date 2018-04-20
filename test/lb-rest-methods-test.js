import test from 'ava';
import axios from 'axios';
const getPort = require('get-port');
const sleep = require('then-sleep');
const { isDate } = require('lodash');
const { ObjectId } = require('mongodb');
const { randomStr } = require('./TestUtils');
const OK = 'OK';

let url, caller;

function afterAppStarted() {
  return new Promise((resolve, reject) => {
    process.on('appStarted', function () {
      resolve('1');
    });
  });
}

async function startApp(params) {
  require('./server/server.js');
  await afterAppStarted();
  await sleep(100);
}

test.before(async t => {
  let port = 5000;
  process.env.PORT = port = await getPort();
  await startApp();
  const { address = '0.0.0.0' } = process.env;
  url = `http://${address}:${port}/api`;
  caller = axios.create({
    baseURL: url,
    timeout: 5000
  });
});

async function findById(id) {
  return await caller.get('/Users/' + id);
}

async function create(method = 'post', no) {
  return await caller[method]('/Demos', {
    email: 'saggiyogesh@gmail.com',
    name: 'yoo',
    no
  });
}

async function createSpec(t, method) {
  const { statusText, data } = await create(method);
  console.log('data', data);
  t.is(statusText, OK);
  t.is(data.email, 'saggiyogesh@gmail.com');
  t.is(data.name, 'yoo');
  t.is(data.no, 10);
  t.truthy(isDate(new Date(data.creationTime)));
  t.truthy(isDate(new Date(data.lastUpdationTime)));
  return data;
}

async function updateSpec(t, oldRec, isUpdateAttr) {
  const { id, lastUpdationTime, creationTime, name } = oldRec;
  let url = '/Demos';
  const inputData = {
    name: 'new name',
    no: 15,
    id
  };

  if (isUpdateAttr) {
    url += `/${id}`;
    delete inputData.id;
  }

  console.log('update---', url, inputData);
  const { statusText, data } = await caller.put(url, inputData);
  console.log('update', data);
  t.is(statusText, OK);
  t.is(data.email, 'saggiyogesh@gmail.com');
  t.is(data.name, 'new name');
  t.is(data.no, 15);
  t.truthy(isDate(new Date(data.creationTime)));
  t.truthy(isDate(new Date(data.lastUpdationTime)));

  // old data validation
  t.not(name, data.name);
  t.is(new Date(data.creationTime).getTime(), new Date(creationTime).getTime());
  console.log('gte', new Date(data.lastUpdationTime).getTime(), new Date(lastUpdationTime).getTime());
  t.truthy(new Date(data.lastUpdationTime).getTime() > new Date(lastUpdationTime).getTime());
}

test('create', async t => {
  await createSpec(t);
});

test('create + findById with _id defined as String', async t => {
  // case when _id is passed
  const _id = randomStr();
  const { statusText, data } = await caller.post('/Users', {
    email: 'saggiyogesh@gmail.com',
    _id
  });

  console.log('data', data);
  t.is(statusText, OK);
  t.is(data.email, 'saggiyogesh@gmail.com');
  t.is(data.id, _id);
  t.falsy(ObjectId.isValid(data.id));
  t.truthy(isDate(new Date(data.creationTime)));
  t.truthy(isDate(new Date(data.lastUpdationTime)));

  // validate findById
  const res1 = await findById(_id);
  console.log('res.data', res1.data);
  t.is(res1.statusText, OK);
  t.is(res1.data.email, 'saggiyogesh@gmail.com');
  t.is(res1.data.id, _id);

  // case when _id is not passed, default ObjectId is inserted
  const res = await caller.post('/Users', {
    email: 'saggiyogesh@gmail.com'
  });

  console.log('res.data', res.data);
  t.is(res.statusText, OK);
  t.is(res.data.email, 'saggiyogesh@gmail.com');
  t.truthy(ObjectId.isValid(res.data.id));
  t.truthy(isDate(new Date(data.creationTime)));
  t.truthy(isDate(new Date(data.lastUpdationTime)));

  // validate findById
  const res2 = await findById(res.data.id);
  console.log('res.data', res1.data);
  t.is(res2.statusText, OK);
  t.is(res2.data.email, 'saggiyogesh@gmail.com');
  t.is(res2.data.id, res.data.id);
  t.truthy(ObjectId.isValid(res2.data.id));
});

test('upsert', async t => {
  const oldRec = await createSpec(t, 'put');
  await updateSpec(t, oldRec);
});

async function upsertSpecWhenIdIsString(_id, t) {
  // case create
  const { statusText, data } = await caller.put('/Users', {
    email: 'saggiyogesh@gmail.com',
    no: 11,
    _id
  });
  t.is(statusText, OK);
  t.is(data.email, 'saggiyogesh@gmail.com');
  t.is(data.no, 11);
  if (_id) {
    t.is(data.id, _id);
  } else {
    t.truthy(ObjectId.isValid(data.id));
  }
  t.truthy(isDate(new Date(data.creationTime)));
  t.truthy(isDate(new Date(data.lastUpdationTime)));

  // case update
  const res = await caller.put('/Users', {
    email: 'saggiyogesh@gmail.com',
    no: 212,
    _id
  });
  t.is(res.statusText, OK);
  t.is(res.data.email, 'saggiyogesh@gmail.com');
  t.not(res.data.no, 11);
  t.is(res.data.no, 212);
  if (_id) {
    t.is(res.data.id, _id);
  } else {
    t.truthy(ObjectId.isValid(res.data.id));
  }
  t.truthy(isDate(new Date(data.creationTime)));
  t.truthy(isDate(new Date(data.lastUpdationTime)));
  t.truthy(new Date(res.data.lastUpdationTime).getTime() > new Date(data.lastUpdationTime).getTime());
}
test('upsert with _id defined as String', async t => {
  // case create when _id is passed
  const _id = randomStr();
  // case when _id is passed
  await upsertSpecWhenIdIsString(_id, t);

  // case when _id not passed, ObjectId will be assigned
  await upsertSpecWhenIdIsString(null, t);
});

test('updateAttrs', async t => {
  const { data } = await create();
  console.log('updateAttrs..', data);
  await updateSpec(t, data, true);
});

test('findById', async t => {
  const { data } = await create();
  console.log('findone..', data);
  const res = await caller.get('/Demos/' + data.id);
  const findData = res.data;
  t.is(res.statusText, OK);
  t.is(data.email, findData.email);
  t.is(data.name, findData.name);
  t.is(data.no, findData.no);
  t.is(new Date(data.creationTime).getTime(), new Date(findData.creationTime).getTime());
  t.is(new Date(data.lastUpdationTime).getTime(), new Date(findData.lastUpdationTime).getTime());
});

test('updateAll', async t => {
  const inserted = 3, no = 111;
  await Promise.all([create('post', no), create('post', no), create('post', no)]);

  const where = { no };
  const { statusText, data } = await caller.post(`Demos/update?where=${JSON.stringify(where)}`, { name: 'test', no: 12 });
  console.log('data', data);
  t.is(statusText, OK);
  t.is(data.n, inserted);
});

test('updateAll $set', async t => {
  const inserted = 3, no = 9;
  await Promise.all([create('post', no), create('post', no), create('post', no)]);

  const where = { no };
  const { statusText, data } = await caller.post(`Demos/update?where=${JSON.stringify(where)}`, { $set: { name: 'test', no: 12 } });
  console.log('data', data);
  t.is(statusText, OK);
  t.is(data.n, inserted);
});

test('deleteById', async t => {
  const created = await create();
  console.log('deleteById created..', created.data);
  const { statusText, data } = await caller.delete(`Demos/${created.data.id}`);
  console.log('data', data);
  t.is(statusText, OK);
  t.is(data.n, 1);
});

test('custom model remotes', async t => {
  const { statusText, data } = await caller.get('/Demos/greet');
  console.log('data', data);
  t.is(statusText, OK);
  t.truthy(isDate(new Date(data.results.creationTime)));
  t.truthy(isDate(new Date(data.results.lastUpdationTime)));
});

test('mixin remotes', async t => {
  const { statusText, data } = await caller.get('Demos/mixinMethod?id=idid');
  console.log('data', data);
  t.is(statusText, OK);
  t.is(data.id, 'idid');
  t.truthy(isDate(new Date(data.greet.creationTime)));
  t.truthy(isDate(new Date(data.greet.lastUpdationTime)));
});
