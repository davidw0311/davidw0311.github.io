'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function handlerWith(handle) {
  const testModule = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, '../src/functions/werewolf.js'), 'utf8');
  vm.runInNewContext(source, {
    module: testModule, Buffer, process: { env: { ALLOWED_ORIGINS: 'https://example.com' } },
    require: name => {
      if (name === '@azure/functions') return { app: { http() {} } };
      if (name.endsWith('storage.js')) return { BlobRoomStore: class {} };
      if (name.endsWith('service.js')) return { WerewolfService: class { handle(...args) { return handle(...args); } } };
      throw new Error(`Unexpected module ${name}`);
    },
  });
  return testModule.exports.handler;
}
function request(body = '{}', extra = {}) {
  const headers = new Map([['origin', 'https://example.com'], ...Object.entries(extra.headers || {})]);
  return { method: extra.method || 'POST', headers, text: async () => body, ...extra, ...(extra.headers ? { headers } : {}) };
}
const context = { error() {} };

test('handler sanitizes infrastructure errors even when they contain plausible error codes', async () => {
  const logs = [];
  const handler = handlerWith(() => { const error = new Error('Account secret and internal storage URL'); error.code = 'AuthenticationFailed'; error.statusCode = 403; throw error; });
  const result = await handler(request(), { error: (...args) => logs.push(args) });
  assert.equal(result.status, 503);
  assert.equal(result.jsonBody.error, 'temporarily-unavailable');
  assert.ok(!JSON.stringify(result).includes('Account secret'));
  assert.ok(!JSON.stringify(logs).includes('Account secret'));
  assert.equal(result.headers['Cache-Control'], 'no-store, private');
});
test('handler exposes only explicitly safe application errors', async () => {
  const handler = handlerWith(() => { const error = new Error('Only the host can do that.'); error.code = 'HOST_ONLY'; error.clientSafe = true; throw error; });
  const result = await handler(request(), context);
  assert.equal(result.status, 400);
  assert.equal(result.jsonBody.error, 'HOST_ONLY');
  assert.equal(result.jsonBody.message, 'Only the host can do that.');
});
test('handler rejects oversized declared bodies before reading them', async () => {
  const handler = handlerWith(() => assert.fail('Service must not be called'));
  let read = false;
  const result = await handler(request('', { headers: { 'content-length': '20000' }, text: async () => { read = true; return '{}'; } }), context);
  assert.equal(result.status, 413);
  assert.equal(read, false);
});
test('handler rejects oversized undeclared bodies, malformed JSON, and untrusted browser origins', async () => {
  const handler = handlerWith(() => assert.fail('Service must not be called'));
  assert.equal((await handler(request('x'.repeat(16385)), context)).status, 413);
  assert.equal((await handler(request('{broken'), context)).status, 400);
  const rejected = await handler(request('{}', { headers: { origin: 'https://attacker.example' } }), context);
  assert.equal(rejected.status, 403);
  assert.equal(rejected.headers['Access-Control-Allow-Origin'], undefined);
});
test('preflight and valid responses carry exact allowed origin and no-store headers', async () => {
  const handler = handlerWith(() => ({ view: { code: 'ABCD1234' } }));
  assert.equal((await handler(request('', { method: 'OPTIONS' }), context)).status, 204);
  const response = await handler(request(), context);
  assert.equal(response.status, 200);
  assert.equal(response.headers['Access-Control-Allow-Origin'], 'https://example.com');
  assert.equal(response.headers['Vary'], 'Origin');
  assert.equal(response.jsonBody.view.code, 'ABCD1234');
});
