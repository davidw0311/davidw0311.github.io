const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeHandler}=require('../src/werewolf/http');
const origin='https://davidw0311.github.io';
const request=(body='{}',options={})=>new Request('https://example.test/werewolf',{method:'POST',headers:{origin,...options.headers},body,...options});
test('handler sanitizes infrastructure failures but exposes safe validation errors',async()=>{
 const infra=makeHandler({handle(){const e=new Error('secret database URL');e.code='AuthenticationFailed';throw e;}});
 const response=await infra(request()); assert.equal(response.status,503); assert.ok(!(await response.text()).includes('secret'));
 const safe=makeHandler({handle(){const e=new Error('Host only');e.code='HOST_ONLY';e.clientSafe=true;throw e;}});
 assert.deepEqual(await (await safe(request())).json(),{error:'HOST_ONLY',message:'Host only'});
});
test('handler rejects oversized declared and streamed bodies and malformed requests',async()=>{
 const handler=makeHandler({handle(){assert.fail('Service should not run');}});
 assert.equal((await handler(request('{}',{headers:{origin,'content-length':'20000'}}))).status,413);
 assert.equal((await handler(request('x'.repeat(16385)))).status,413);
 assert.equal((await handler(request('{bad'))).status,400);
 assert.equal((await handler(new Request('https://example.test',{method:'GET'}))).status,405);
});
test('handler validates CORS and preflight and never caches room responses',async()=>{
 const handler=makeHandler({handle:async()=>({view:{code:'MOON'}})});
 const preflight=await handler(new Request('https://example.test',{method:'OPTIONS',headers:{origin}}));
 assert.equal(preflight.status,204); assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),origin);
 assert.equal((await handler(request('{}',{headers:{origin:'https://attacker.example'}}))).status,403);
 const response=await handler(request());assert.equal(response.headers.get('Cache-Control'),'no-store, private');assert.deepEqual(await response.json(),{view:{code:'MOON'}});
});
