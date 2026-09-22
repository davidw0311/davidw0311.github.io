// Explicit endpoint required: this creates one disposable room that expires after inactivity.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const endpoint = process.argv.find(arg => arg.startsWith('--url='))?.slice(6);
if (!endpoint || !/^https?:\/\//.test(endpoint)) throw new Error('Pass --url=<werewolf API endpoint>.');
let code;
async function call(token, op, fields = {}, expectedError) {
  const response = await fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'https://davidw0311.github.io' },
    body: JSON.stringify({ token, op, code, requestId: randomUUID(), ...fields }), signal: AbortSignal.timeout(45000),
  });
  const body = await response.json();
  if (expectedError) { assert.equal(body.error, expectedError); return body; }
  assert.equal(response.status, 200, `${op}: ${body.error || response.status}`);
  assert.ok(body.view); return body;
}
let host = randomUUID();
const created = await call(host, 'create', { name: 'Verification host' });
code = created.view.code;
assert.match(code, /^[A-Z]{4}$/);
let view = created.view;
const members = [host];
const tokens = Array.from({ length: 5 }, () => randomUUID());
view = (await call(host, 'command', { command: { type: 'addSeat', name: 'Verification A' } })).view;
const reservedSeat = view.seats.find(seat => seat.name === 'Verification A').id;
const joins = await Promise.all(tokens.map((token, i) => call(token, 'join', { name: `Verification ${String.fromCharCode(65 + i)}` })));
assert.ok(joins.every(reply => reply.view.me && !reply.view.myRequest));
assert.equal(joins[0].view.me.seatId, reservedSeat);
view = (await call(host, 'sync')).view;
assert.equal(view.requests.length, 0);
members.push(...tokens);
view = (await call(host, 'sync')).view;
assert.equal(view.seats.length, 6);
// Explicit lobby exits remove seats; reconnecting creates one seat without approval.
const guestBefore = (await call(tokens[0], 'sync')).view.me.seatId;
const guestLeft = await call(tokens[0], 'command', { command: { type: 'leave' } });
assert.equal(guestLeft.view.me, null);
assert.equal(guestLeft.view.seats.length, 5);
await call(tokens[0], 'sync', {}, 'NOT_SEATED');
const guestReturned = await call(tokens[0], 'join', { name: 'Verification A' });
assert.ok(guestReturned.view.me);
assert.notEqual(guestReturned.view.me.seatId, guestBefore);
// A lobby host exit transfers control and rotates its recovery key atomically.
const lobbySnapshots = await Promise.all(members.map(token => call(token, 'sync')));
const formerHost = host;
const formerKey = lobbySnapshots[0].recoveryKey;
const departure = await call(host, 'command', { command: { type: 'leave' } });
assert.equal(departure.view.me, null);
const successorIndex = lobbySnapshots.findIndex(reply => reply.view.me.seatId === departure.view.hostSeatId);
assert.ok(successorIndex > 0);
host = members[successorIndex];
const successor = await call(host, 'sync');
assert.equal(successor.view.isHost, true);
assert.notEqual(successor.recoveryKey, formerKey);
await call(randomUUID(), 'recover', { recoveryKey: formerKey }, 'invalid-recovery-key');
await call(formerHost, 'join', { name: 'Verification former host' });
members.splice(0, members.length, host, ...members.filter(token => token !== host));
view = (await call(host, 'sync')).view;
assert.equal(view.seats.length, 6);
view = (await call(host, 'command', { command: { type: 'updateSettings', settings: { nightSeconds: 10 } } })).view;
view = (await call(host, 'command', { command: { type: 'startGame', expectedPhaseId: view.phase.id } })).view;
assert.equal(view.status, 'playing');
assert.equal(view.phase.kind, 'ready');
await call(host, 'command', {command:{type:'startNight',expectedPhaseId:view.phase.id}}, 'NOT_READY');
const initial = await Promise.all(members.map(token => call(token, 'sync')));
for (const reply of initial) {
  assert.ok(reply.view.me.roleId);
  assert.equal(reply.view.seats.filter(seat => seat.roleId).length, 0);
}
const before = initial[1].view.me;
const replacement = randomUUID();
await call(replacement, 'join', { name: 'Verification A returned' });
view = (await call(host, 'sync')).view;
const pending = view.requests.find(r => r.name === 'Verification A returned');
await call(host, 'command', { command: { type: 'approveJoin', requestId: pending.id, replaceSeatId: before.seatId } });
const restored = await call(replacement, 'sync');
assert.equal(restored.view.me.seatId, before.seatId);
assert.equal(restored.view.me.roleId, before.roleId);
assert.equal(restored.recoveryKey, undefined);
await call(members[1], 'sync', {}, 'NOT_SEATED');
members[1] = replacement;
view = (await call(host, 'sync')).view;
await Promise.all(members.map(token => call(token, 'command', {command:{type:'ready',expectedPhaseId:view.phase.id}})));
view = (await call(host, 'command', {command:{type:'startNight',expectedPhaseId:view.phase.id}})).view;
assert.equal(view.phase.nightStage, 'opening');
// Narration ACKs and explicit participant actions drive the entire night.
// Withhold the Seer action to verify that only explicit host skip ends the wait.
view = (await call(host, 'sync')).view;
await call(host, 'command', { command: { type: 'nextPhase', expectedPhaseId: view.phase.id } }, 'NIGHT_FLOW_CONTROLLED');
const nightSteps = new Set();
let nightStages = 0;
while (view.phase.kind === 'night') {
  assert.ok(++nightStages <= 20, 'Night did not finish after the expected role turns.');
  const phase = view.phase;
  if (phase.nightStage === 'opening' || phase.nightStage === 'closing') {
    assert.ok(phase.nightCues.length > 0);
    const packet = { requestId: randomUUID(), command: { type: 'nightNarrationDone', expectedPhaseId: phase.id } };
    const first = await call(host, 'command', packet);
    const retry = await call(host, 'command', packet);
    assert.equal(first.view.phase.id, retry.view.phase.id);
    assert.notEqual(first.view.phase.id, phase.id);
    await call(host, 'command', { command: packet.command }, first.view.phase.kind === 'night' ? 'STALE_PHASE' : 'WRONG_PHASE');
  } else {
    assert.equal(phase.nightStage, 'acting');
    nightSteps.add(phase.step);
    const snapshots = await Promise.all(members.map(token => call(token, 'sync')));
    const participants = snapshots.flatMap((reply, index) => {
      const action = reply.view.me.action;
      assert.ok(reply.view.seats.every(seat => !Object.hasOwn(seat, 'roleId')));
      return action?.kind === 'nightAction' && !action.alreadySubmitted ? [{ token: members[index], action }] : [];
    });
    assert.ok(participants.length > 0, `No living actors in ${phase.step}.`);
    if (phase.step === 'seer') {
      assert.equal(participants.length, 1);
      const missing = participants[0].token;
      const observer = members.find(token => token !== missing);
      await call(missing, 'command', { command: { type: 'leave' } });
      const until = Date.now() + 15000;
      let current;
      do {
        current = (await call(observer, 'sync')).view;
        assert.equal(current.phase.paused, false);
        assert.equal(current.phase.deadline, null);
        assert.equal(current.phase.id, phase.id, 'Offline actions must not expire.');
        await new Promise(resolve => setTimeout(resolve, 400));
      } while (Date.now() < until);
      assert.equal(current.phase.nightStage, 'acting');
      const skip = { requestId: randomUUID(), command: { type: 'hardSkip', expectedPhaseId: phase.id } };
      await call(members.find(token => token !== host), 'command', skip, 'HOST_ONLY');
      const skipped = await call(host, 'command', skip);
      assert.equal(skipped.view.phase.nightStage, 'closing');
      assert.equal((await call(host, 'command', skip)).view.phase.id, skipped.view.phase.id);
      await call(missing, 'command', { command: { type: 'nightAction', ability: 'skip', expectedPhaseId: phase.id } }, 'STALE_PHASE');
      view = (await call(host, 'sync')).view;
      continue;
    }
    const victim = initial.find(reply => reply.view.me.roleId === 'villager').view.me.seatId;
    if (phase.step === 'witch') assert.equal(participants[0].action.victimId, victim);
    const packets = participants.map(({ token, action }) => {
      assert.equal(action.canSkip, true, 'The default deck must support explicit night skips.');
      return { token, fields: { requestId: randomUUID(), command: { type: 'nightAction', ...(phase.step === 'wolves' ? {targetId:victim} : {ability:'save'}), expectedPhaseId: phase.id } } };
    });
    await Promise.all(packets.map(({ token, fields }) => call(token, 'command', fields)));
    const closed = (await call(host, 'sync')).view;
    assert.equal(closed.phase.nightStage, 'closing');
    assert.notEqual(closed.phase.id, phase.id);
    const repeated = await call(packets[0].token, 'command', packets[0].fields);
    assert.equal(repeated.view.phase.id, closed.phase.id);
    await call(packets[0].token, 'command', { command: packets[0].fields.command }, 'STALE_PHASE');
  }
  view = (await call(host, 'sync')).view;
}
assert.deepEqual([...nightSteps], ['wolves', 'seer', 'witch']);
assert.equal(view.phase.kind, 'sheriff');
assert.equal(view.phase.step, 'nomination');
assert.ok(view.seats.every(seat=>seat.alive));
const electionSeats = await Promise.all(members.map(async token => ({token, seatId:(await call(token,'sync')).view.me.seatId})));
for (const [index, member] of electionSeats.entries()) view=(await call(member.token,'command',{command:{type:'sheriffInterest',run:index===1||index===2,expectedPhaseId:view.phase.id}})).view;
assert.equal(view.phase.step,'nomination');
view=(await call(host,'command',{command:{type:'advanceElection',expectedPhaseId:view.phase.id}})).view;
while(view.speakerSeatId) {
 const speaker=electionSeats.find(member=>member.seatId===view.speakerSeatId);
 view=(await call(speaker.token,'command',{command:{type:'sheriffSpeechDone',expectedPhaseId:view.phase.id}})).view;
}
view=(await call(electionSeats[2].token,'command',{command:{type:'sheriffWithdraw',expectedPhaseId:view.phase.id}})).view;
view=(await call(electionSeats[2].token,'command',{command:{type:'sheriffRejoin',expectedPhaseId:view.phase.id}})).view;
assert.ok(view.election.candidateIds.includes(electionSeats[2].seatId));
view=(await call(electionSeats[2].token,'command',{command:{type:'sheriffWithdraw',expectedPhaseId:view.phase.id}})).view;
view=(await call(host,'command',{command:{type:'advanceElection',expectedPhaseId:view.phase.id}})).view;
await call(electionSeats[2].token,'command',{command:{type:'vote',targetId:electionSeats[1].seatId,expectedPhaseId:view.phase.id}},'NO_VOTE');
for(const member of electionSeats.filter((_,index)=>index!==1&&index!==2)) view=(await call(member.token,'command',{command:{type:'vote',targetId:electionSeats[1].seatId,expectedPhaseId:view.phase.id}})).view;
assert.equal(view.phase.step,'sheriffResult');
assert.ok(view.seats.find(seat=>seat.id===electionSeats[1].seatId).isSheriff);
view=(await call(host,'command',{command:{type:'nightNarrationDone',expectedPhaseId:view.phase.id}})).view;
assert.equal(view.phase.step,'dawn'); assert.deepEqual(view.phase.publicCues,['peaceful-night']);
view=(await call(host,'command',{command:{type:'nightNarrationDone',expectedPhaseId:view.phase.id}})).view;
assert.equal(view.phase.kind, 'day');
assert.equal(view.day, 1);
assert.ok(view.seats.every(seat => seat.alive));
assert.deepEqual(view.lastNight.numbers,[]);
await call(members.find(token=>token!==host),'command',{command:{type:'setSpeechTimer',seconds:5,expectedPhaseId:view.phase.id}},'HOST_ONLY');
view=(await call(host,'command',{command:{type:'setSpeechTimer',seconds:30,expectedPhaseId:view.phase.id}})).view;
const oldTimer=view.speakingTimer.id;
view=(await call(host,'command',{command:{type:'setSpeechTimer',seconds:5,expectedPhaseId:view.phase.id}})).view;
assert.notEqual(view.speakingTimer.id,oldTimer); const speakingPhase=view.phase.id;
await new Promise(resolve=>setTimeout(resolve,5500)); view=(await call(host,'sync')).view;
assert.equal(view.phase.id,speakingPhase); assert.ok(view.speakingTimer.endsAt<=view.serverTime);
view=(await call(host,'command',{command:{type:'cancelSpeechTimer',expectedPhaseId:view.phase.id}})).view;
assert.equal(view.speakingTimer,null);
// Host secret can recover the existing seat on another device; old token is revoked.
const hostState = await call(host, 'sync'); const oldHost = host; host = randomUUID();
const recovery = await call(host, 'recover', { recoveryKey: hostState.recoveryKey, name: 'Recovered host' });
assert.equal(recovery.view.me.seatId, hostState.view.me.seatId);
assert.equal(recovery.view.me.roleId, hostState.view.me.roleId);
assert.notEqual(recovery.recoveryKey, hostState.recoveryKey);
await call(oldHost, 'sync', {}, 'NOT_SEATED');
await call(members[1], 'command', { command: { type: 'startNight', expectedPhaseId: recovery.view.phase.id } }, 'HOST_ONLY');
// The host can skip discussion, but never missing ballots.
const voting = await call(host, 'command', { command: {type:'hardSkip', expectedPhaseId:recovery.view.phase.id} });
assert.equal(voting.view.phase.kind, 'voting');
await call(host,'command',{command:{type:'hardSkip',expectedPhaseId:voting.view.phase.id}},'VOTES_PENDING');
assert.equal(voting.view.pendingVoterIds.length,6);
for(const token of members) await call(token===oldHost?host:token,'command',{command:{type:'vote',targetId:null,expectedPhaseId:voting.view.phase.id}});
const afterVote = await call(host, 'command', { command: {type:'hardSkip', expectedPhaseId:voting.view.phase.id} });
assert.equal(afterVote.view.phase.kind, 'voting');
assert.equal(afterVote.view.voteRound, 2);
for(const token of members) await call(token===oldHost?host:token,'command',{command:{type:'vote',targetId:null,expectedPhaseId:afterVote.view.phase.id}});
const nightTwo = await call(host, 'command', {command:{type:'hardSkip',expectedPhaseId:afterVote.view.phase.id}});
assert.equal(nightTwo.view.phase.kind, 'night');
assert.ok(afterVote.view.seats.every(seat => seat.alive));
view=nightTwo.view;
while(view.phase.kind==='night' && view.phase.step!=='seer') view=(await call(host,'command',{command:{type:'hardSkip',expectedPhaseId:view.phase.id}})).view;
view=(await call(host,'command',{command:{type:'nightNarrationDone',expectedPhaseId:view.phase.id}})).view;
const currentMembers=members.map(token=>token===oldHost?host:token);
let seerToken;
for(const token of currentMembers) if((await call(token,'sync')).view.me.roleId==='seer') seerToken=token;
const wolfSeat=initial.find(reply=>reply.view.me.roleId==='werewolf').view.me.seatId;
const inspected=await call(seerToken,'command',{command:{type:'nightAction',targetId:wolfSeat,expectedPhaseId:view.phase.id}});
assert.deepEqual(inspected.view.me.inspection,{night:2,targetId:wolfSeat,alignment:'wolf'});
assert.equal((await call(currentMembers.find(token=>token!==seerToken),'sync')).view.me.inspection,null);

// Disband also verifies that all participants lose access.
await call(host, 'command', {command:{type:'disbandRoom'}});
await call(members[1], 'sync', {}, 'room-disbanded');
await call(randomUUID(), 'join', {name:'Late join'}, 'room-disbanded');
console.log('Live multiplayer checks passed: four-letter codes, readiness gate, six players, automatic concurrent seating, reserved seats, voluntary lobby exits, automatic host transfer, hidden cards, replacement, complete event-driven night, indefinite offline actions, host-only night/day hard skips, duplicate narration/action protection, host recovery, automatic Sheriff nominations, explicit host speech/ballot transitions, reversible withdrawal, mandatory ballots, numbered announcements, adjustable speaking timers without auto-advance, immediate private Seer results, runoff voting, disbanding, and permissions.');
