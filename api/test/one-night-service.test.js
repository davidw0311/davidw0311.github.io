const {test} = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {OneNightService} = require('../src/one-night/service.js');
const {SupabaseRoomStore} = require('../src/one-night/supabase-storage.js');
const {makeHandler} = require('../src/one-night/http.js');

class MemoryStore {
  constructor() { this.data = new Map(); this.queues = new Map(); }
  async transact(key, fn) {
    const task = (this.queues.get(key) || Promise.resolve()).then(async () => {
      const result = await fn(structuredClone(this.data.get(key) ?? null));
      if (result.changed !== false) this.data.set(key, structuredClone(result.value));
      return result.result;
    });
    this.queues.set(key, task.catch(() => {}));
    return task;
  }
}
async function room() {
  const store = new MemoryStore(); let now = 100000;
  const service = new OneNightService(store, () => now);
  const token = randomUUID();
  const call = input => service.handle({token, requestId: randomUUID(), ...input}, 'test');
  const created = await call({op:'create', name:'Host'});
  const code = created.view.code;
  return {store, service, token, call, code, created, advance: value => {now += value;}};
}
async function dealt() {
  const t = await room(); const tokens = [t.token, randomUUID(), randomUUID()];
  for (let i=1;i<tokens.length;i++) await t.call({op:'join', code:t.code, token:tokens[i], name:`Player ${i}`});
  await t.call({op:'command', code:t.code, command:{type:'configure', roleDeck:['werewolf','werewolf','seer','robber','troublemaker','villager']}});
  const reply = await t.call({op:'command', code:t.code, command:{type:'start'}});
  return {...t, tokens, reply};
}
test('One Night room allocation and lost-response retries are durable and idempotent', async () => {
  const t = await room();
  const again = await t.call({op:'create',name:'Host'});
  assert.match(t.code, /^[A-Z]{4}$/);
  assert.equal(again.view.code,t.code);
  assert.equal(again.view.seats.length,1);
  assert.equal(again.recoveryKey,t.created.recoveryKey);
});
test('concurrent joins preserve every player and duplicate requests do not add seats', async () => {
  const t=await room();
  const packets=Array.from({length:5},(_,i)=>({op:'join',code:t.code,token:randomUUID(),requestId:randomUUID(),name:`Guest ${i}`}));
  const joins=await Promise.all(packets.map(t.call));
  assert.ok(joins.every(x=>x.view.me));
  await t.call(packets[0]);
  assert.equal((await t.call({op:'sync',code:t.code})).view.seats.length,6);
  await assert.rejects(t.call({...packets[0],name:'Different request'}),{code:'request-id-reused'});
});
test('a new device needs approval after cards are dealt and replacement preserves private state',async()=>{
  const t=await dealt();
  const old=await t.call({op:'sync',code:t.code,token:t.tokens[1]});
  const token=randomUUID();
  const pending=await t.call({op:'join',code:t.code,token,name:'Player 1'});
  assert.equal(pending.view.me,null);
  assert.equal(pending.recoveryKey,undefined);
  const host=await t.call({op:'sync',code:t.code});
  await t.call({op:'command',code:t.code,command:{type:'approveJoin',requestId:host.view.requests[0].id,replaceSeatId:old.view.me.seatId}});
  const joined=await t.call({op:'sync',code:t.code,token});
  assert.equal(joined.view.me.seatId,old.view.me.seatId);
  assert.equal(joined.view.me.originalRoleId,old.view.me.originalRoleId);
  const revoked=await t.call({op:'sync',code:t.code,token:t.tokens[1]}).catch(()=>null);
  assert.ok(!revoked || !revoked.view.me);
});
test('host recovery rotates the secret and revokes the old session',async()=>{
  const t=await room(); const token=randomUUID();
  await assert.rejects(t.call({op:'recover',code:t.code,token,recoveryKey:'wrong'}),{code:'invalid-recovery-key'});
  const reply=await t.call({op:'recover',code:t.code,token,recoveryKey:t.created.recoveryKey});
  assert.equal(reply.view.isHost,true);
  assert.notEqual(reply.recoveryKey,t.created.recoveryKey);
  await assert.rejects(t.call({op:'recover',code:t.code,token:randomUUID(),recoveryKey:t.created.recoveryKey}),{code:'invalid-recovery-key'});
  const old=await t.call({op:'sync',code:t.code}).catch(()=>null);
  assert.ok(!old || !old.view.isHost);
});
test('snapshots never expose server credentials, session hashes, or other private roles',async()=>{
  const t=await dealt();
  const guest=await t.call({op:'sync',code:t.code,token:t.tokens[1]});
  const serialized=JSON.stringify(guest);
  for(const value of [t.token,t.created.recoveryKey,'_requests','_creator','actorId','hostId','members']) assert.ok(!serialized.includes(value),value);
  assert.ok(guest.view.seats.every(s=>!s.roleId));
  assert.equal(guest.view.result,null);
});
test('rooms expire after a day without activity and malformed sessions never allocate state',async()=>{
  const t=await room();
  await assert.rejects(t.call({op:'create',token:'short',name:'X'}),{code:'invalid-session'});
  await assert.rejects(t.call({op:'join',code:'../test',name:'X'}),{code:'invalid-room-code'});
  t.advance(86400001);
  await assert.rejects(t.call({op:'sync',code:t.code}),{code:'room-expired'});
});
test('disband is immediately visible to every session',async()=>{
  const t=await room(); const token=randomUUID();
  await t.call({op:'join',code:t.code,token,name:'Guest'});
  await t.call({op:'command',code:t.code,command:{type:'disbandRoom'}});
  await assert.rejects(t.call({op:'sync',code:t.code,token}),{code:'room-disbanded'});
});
test('storage CAS retries latest state without overwriting concurrent actions',async()=>{
  const store=Object.create(SupabaseRoomStore.prototype); let value={n:0},version=1,writes=0;
  store.read=async()=>({value:structuredClone(value),version:String(version)});
  store.write=async(_key,next,v)=>{if(++writes===1){value.n=10;version++;return false;}assert.equal(v,String(version));value=next;return true;};
  const result=await store.transact('rooms/TEST',old=>{old.n++;return {value:old,result:old.n};});
  assert.equal(result,11); assert.equal(value.n,11);
});
test('HTTP rejects cross-origin requests, oversized bodies, and suppresses internal errors',async()=>{
  const handler=makeHandler({handle:async()=>{throw new Error('private secret');}});
  const foreign=await handler(new Request('https://example.test',{method:'POST',headers:{origin:'https://evil.test'},body:'{}'}));
  assert.equal(foreign.status,403);
  const large=await handler(new Request('https://example.test',{method:'POST',body:'x'.repeat(17000)}));
  assert.equal(large.status,413);
  const failure=await handler(new Request('https://example.test',{method:'POST',body:'{}'}));
  assert.equal(failure.status,503); assert.ok(!(await failure.text()).includes('private secret'));
});

test('host restart is idempotent and rejects stale commands after a fresh deal', async () => {
  const t = await dealt();
  const packet = {op:'command', code:t.code, requestId:randomUUID(), command:{type:'restartRound',expectedPhaseId:t.reply.view.phase.id}};
  const [first, second] = await Promise.all([t.call(packet), t.call(packet)]);
  assert.equal(first.view.phase.id, second.view.phase.id);
  assert.equal(first.view.status, 'lobby'); assert.equal(second.view.revision, first.view.revision);
  assert.equal(first.view.gameId, null); assert.deepEqual(first.view.me.knowledge, []);
  const started = await t.call({op:'command',code:t.code,command:{type:'start',expectedPhaseId:first.view.phase.id}});
  assert.notEqual(started.view.gameId, t.reply.view.gameId);
  await assert.rejects(t.call({...packet,requestId:randomUUID()}), {code:'STALE_PHASE'});
  await assert.rejects(t.call({op:'command',code:t.code,token:t.tokens[1],command:{type:'restartRound',expectedPhaseId:started.view.phase.id}}), {code:'HOST_ONLY'});
  const guest = await t.call({op:'sync',code:t.code,token:t.tokens[1]});
  assert.equal(guest.view.me.ready, false); assert.deepEqual(guest.view.me.knowledge, []); assert.equal(guest.view.me.action, null);
});
