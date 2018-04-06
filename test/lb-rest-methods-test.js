import test from 'ava';
import axios from 'axios';
const getPort = require('get-port');
const sleep = require('then-sleep');
const { isDate } = require('lodash');
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

async function findOne() {
  return await caller.get('/Demos/findOne');
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

test('upsert', async t => {
  const oldRec = await createSpec(t, 'put');
  await updateSpec(t, oldRec);
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
