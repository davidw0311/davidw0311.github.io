'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createRoom,applyCommand,publicView,tickRoom}=require('../src/werewolf/engine');
let time=1800000000000;
function send(room, actor, type, data = {}) { return applyCommand(room, actor, { type, expectedPhaseId: room.phase.id, ...data }, ++time); }
function setup(roles = ['werewolf', 'werewolf', 'seer', 'witch', 'guard', 'hunter', 'villager', 'villager', 'villager'], settings = {}) {
    const room = createRoom({ code: 'ABCDEF', hostId: 'actor0', hostName: 'A', now: ++time });
    for (let i = 1; i < roles.length; i++) {
        send(room, `actor${i}`, 'requestJoin', { name: String.fromCharCode(65 + i) });
    }
    send(room, 'actor0', 'updateSettings', { settings: { winCondition: 'all', sheriff: false, witchSelfSave: false, guardAntidote: 'save', ...settings } });
    send(room, 'actor0', 'startGame', { roleDeck: roles });
    for (const seat of room.seats) send(room, seat.actorId, 'ready');
    send(room, room.hostId, 'startNight');
    // Tests assign deterministic server-only cards after exercising production shuffle.
    room.seats.forEach((s, i) => { s.roleId = roles[i]; s.team = ['werewolf', 'wolfKing', 'whiteWolfKing', 'wolfBeauty', 'hiddenWolf', 'gargoyle', 'mechanicalWolf', 'bloodMoonApostle', 'wolfWitch'].includes(roles[i]) ? 'wolf' : ['angel', 'jester', 'piper'].includes(roles[i]) ? 'independent' : 'village'; s.originalRoleId = s.roleId; s.originalTeam = s.team; });
    return room;
}
const id = (r, i) => r.seats[i].id;
function abstainPending(r) { for(const seatId of publicView(r,r.hostId,time).pendingVoterIds) { const seat=r.seats.find(s=>s.id===seatId); send(r,seat.actorId,'vote',{targetId:null}); } }
function finishDeathAnnouncement(r) { if(r.phase.kind==='announcement' && r.phase.step==='dayDeaths') send(r,r.hostId,'nightNarrationDone'); }
function closeVotes(r) { abstainPending(r); send(r,r.hostId,'resolveVoting'); finishDeathAnnouncement(r); }

function nextNight(r) {
    finishDeathAnnouncement(r);
    if (r.voteDoneDay === r.day) return send(r,r.hostId,'startNight');
    send(r,r.hostId,'startVoting');
    closeVotes(r);
    closeVotes(r);
    assert.equal(r.phase.kind,'night');
}
function advanceTestNight(r) {
    if (r.phase.nightStage === 'opening' || r.phase.nightStage === 'closing') {
        send(r, r.hostId, 'nightNarrationDone');
        return;
    }
    const actors = r.seats.map(seat => ({ seat, action: publicView(r, seat.actorId, time).me?.action }))
        .filter(({ action }) => action && !action.alreadySubmitted);
    for (const { seat, action } of actors) {
        const data = action.input === 'choice' ? { choice: action.options.includes('guard') ? 'guard' : action.options[0] } : { ability: 'skip' };
        send(r, seat.actorId, 'nightAction', data);
    }
    if (r.phase.nightStage === 'acting' && r.phase.step === 'wolves' && r.nightFlow.eligibleSeatIds.every(id => r.actions.wolves?.[id])) send(r,r.hostId,'hardSkip');
    if (r.phase.nightStage === 'acting' && !r.nightFlow.eligibleSeatIds.length) {
        time = Math.max(time + 1, r.nightFlow.deadline);
        for (const member of Object.values(r.members)) member.lastSeen = time;
        tickRoom(r, time);
    }
}
function stepTo(r, step, nightRole) {
    let n = 0;
    while (r.phase.kind === 'night' && (r.phase.step !== step || r.phase.nightStage !== 'acting' || nightRole && r.phase.nightRole !== nightRole) && n++ < 150) advanceTestNight(r);
    assert.equal(r.phase.step, step);
    assert.equal(r.phase.nightStage, 'acting');
    if (nightRole) assert.equal(r.phase.nightRole, nightRole);
}
function dawn(r) { let n = 0; while (r.phase.kind === 'night' && n++ < 200) advanceTestNight(r); if (r.phase.kind === 'announcement') send(r, r.hostId, 'nightNarrationDone'); assert.notEqual(r.phase.kind, 'night'); }
function nightAct(r, i, data) {
    const openingRole = ['cupid', 'wildChild', 'wolfHound', 'thief', 'mechanicalWolf'].includes(r.seats[i].roleId) && r.night === 1 && r.phase.step === 'opening' ? r.seats[i].roleId : null;
    if (openingRole) stepTo(r, 'opening', openingRole);
    else if (r.phase.nightStage === 'opening') send(r, r.hostId, 'nightNarrationDone');
    send(r, `actor${i}`, 'nightAction', data);
}
function exile(r, index) { if (r.phase.kind === 'reaction')
    send(r, 'actor0', 'nextPhase'); send(r, 'actor0', 'startVoting'); for (const [i, s] of r.seats.entries())
    if (s.alive && s.canVote)
        send(r, `actor${i}`, 'vote', { targetId: id(r, index) }); closeVotes(r); }
function custom(special) { return ['werewolf', 'werewolf', special, 'seer', 'witch', 'villager', 'villager', 'villager', 'villager']; }

const view=(r,i)=>publicView(r,'actor'+i,time);
for(const role of ['hiddenWolf','gargoyle'])test(`${role} inherits a kill after the last ordinary wolf dies, without earlier pack access`,()=>{
 const r=setup(['werewolf',role,'seer','witch','guard','villager','villager','villager','villager']);stepTo(r,'wolves');assert.equal(view(r,1).me.action,null);dawn(r);exile(r,0);nextNight(r);stepTo(r,'wolves');assert.ok(view(r,1).me.action);nightAct(r,1,{targetId:id(r,5)});dawn(r);assert.equal(r.seats[5].alive,false);
});
test('Blood Moon silences night skills but restores daytime Knight and suppresses that night Hunter shot',()=>{
 const r=setup(['werewolf','bloodMoonApostle','knight','witch','hunter','villager','villager','villager','villager']);dawn(r);send(r,'actor1','wolfExplode');finishDeathAnnouncement(r);nextNight(r);nightAct(r,0,{targetId:id(r,4)});dawn(r);assert.ok(!r.pendingShots.includes(id(r,4)));assert.equal(view(r,2).me.canDuel,true);send(r,'actor2','knightDuel',{targetId:id(r,0)});assert.equal(r.seats[0].alive,false);
});
test('Angel becomes village after a first-day double abstention',()=>{const r=setup(custom('angel'));dawn(r);nextNight(r);assert.equal(r.exileRounds,1);assert.equal(r.seats[2].team,'village');});
test('Wolf Witch cannot inspect wolf teammates or poison; night-two Pure White check is lethal',()=>{
 const r=setup(['werewolf','wolfWitch','pureWhite','witch','guard','villager','villager','villager','villager']);stepTo(r,'wolfWitch');assert.throws(()=>nightAct(r,1,{targetId:id(r,0)}),{code:'INVALID_TARGET'});nightAct(r,1,{targetId:id(r,2)});dawn(r);assert.equal(r.seats[2].alive,true);nextNight(r);stepTo(r,'wolfWitch');assert.throws(()=>nightAct(r,1,{ability:'poison',targetId:id(r,5)}),{code:'INVALID_ACTION'});nightAct(r,1,{targetId:id(r,2)});dawn(r);assert.equal(r.seats[2].alive,false);
});
test('Knight defeats Beauty without charm casualty, retains mandatory voting, and cannot duel after exile',()=>{
 const r=setup(['werewolf','wolfBeauty','knight','witch','guard','villager','villager','villager','villager']);stepTo(r,'wolfBeauty');nightAct(r,1,{targetId:id(r,5)});dawn(r);assert.equal(view(r,1).me.canExplode,false);assert.throws(()=>send(r,'actor1','wolfExplode'),{code:'NO_ABILITY'});send(r,'actor2','knightDuel',{targetId:id(r,1)});finishDeathAnnouncement(r);assert.equal(r.seats[5].alive,true);assert.throws(()=>send(r,r.hostId,'startNight'),{code:'VOTE_REQUIRED'});
 const p=setup(custom('knight'));dawn(p);exile(p,8);assert.equal(view(p,2).me.canDuel,false);assert.throws(()=>send(p,'actor2','knightDuel',{targetId:id(p,0)}),{code:'NO_ABILITY'});
});
test('Poisoned Beauty does not cause a charm death',()=>{const r=setup(['werewolf','wolfBeauty','seer','witch','guard','villager','villager','villager','villager']);stepTo(r,'witch');nightAct(r,3,{ability:'poison',targetId:id(r,1)});stepTo(r,'wolfBeauty');nightAct(r,1,{targetId:id(r,5)});dawn(r);assert.equal(r.seats[1].alive,false);assert.equal(r.seats[5].alive,true);});
for(const role of ['gargoyle','raven'])test(`${role} repeat-target restriction is server-enforced`,()=>{const roles=role==='gargoyle'?['werewolf','gargoyle','seer','witch','guard','villager','villager','villager','villager']:custom('raven');const i=roles.indexOf(role),r=setup(roles);stepTo(r,role);nightAct(r,i,{targetId:id(r,5)});dawn(r);exile(r,8);nextNight(r);stepTo(r,role);assert.throws(()=>nightAct(r,i,{targetId:id(r,5)}),{code:'INVALID_TARGET'});});
test('Dream protection blocks hunting, and double dream does not give Hunter a shot',()=>{
 const r=setup(['werewolf','werewolf','dreamweaver','demonHunter','witch','villager','villager','villager','villager']);dawn(r);nextNight(r);stepTo(r,'dreamweaver');nightAct(r,2,{targetId:id(r,0)});stepTo(r,'demonHunter');nightAct(r,3,{targetId:id(r,0)});dawn(r);assert.equal(r.seats[0].alive,true);
 const p=setup(['werewolf','werewolf','dreamweaver','hunter','witch','villager','villager','villager','villager']);for(let n=1;n<=2;n++){stepTo(p,'dreamweaver');nightAct(p,2,{targetId:id(p,3)});dawn(p);if(n===1)nextNight(p);}assert.equal(p.seats[3].alive,false);assert.ok(!p.pendingShots.includes(id(p,3)));
});
test('Elder poison removes future village powers',()=>{const r=setup(custom('elder'));stepTo(r,'witch');nightAct(r,4,{ability:'poison',targetId:id(r,2)});dawn(r);assert.equal(r.villagePowersLost,true);nextNight(r);stepTo(r,'seer');assert.equal(view(r,3).me.action,null);});
test('Revealed Idiot cannot receive further exile votes',()=>{const r=setup(custom('idiot'));dawn(r);exile(r,2);nextNight(r);dawn(r);send(r,r.hostId,'startVoting');assert.ok(!view(r,0).me.action.targets.includes(id(r,2)));assert.throws(()=>send(r,'actor0','vote',{targetId:id(r,2)}),{code:'INVALID_TARGET'});});
test('Gravekeeper reports no exile following a tied day',()=>{const r=setup(custom('gravekeeper'));dawn(r);exile(r,8);nextNight(r);dawn(r);nextNight(r);stepTo(r,'gravekeeper');nightAct(r,2,{});dawn(r);assert.match(view(r,2).me.privateLog.at(-1).text.en,/No player/);});
test('Swaps precede pack attacks and never disclose redirected inspection seats',()=>{const r=setup(['werewolf','werewolf','magician','seer','witch','villager','villager','villager','villager']);assert.equal(r.nightSchedule[0].step,'magician');stepTo(r,'magician');nightAct(r,2,{targetIds:[id(r,0),id(r,5)]});stepTo(r,'seer');nightAct(r,3,{targetId:id(r,5)});assert.deepEqual(view(r,3).me.inspection,{night:1,targetId:id(r,5),alignment:'wolf'});assert.equal(view(r,3).me.privateLog.at(-1).text.en,'F: wolf.');});
test('Dead Sheriff resolves badge before voting; cannot change ballot weight during voting',()=>{const r=setup();r.sheriffSeatId=id(r,6);nightAct(r,0,{targetId:id(r,6)});nightAct(r,1,{targetId:id(r,6)});dawn(r);assert.equal(r.phase.step,'badge');assert.throws(()=>send(r,r.hostId,'startVoting'),{code:'BADGE_PENDING'});send(r,'actor6','passBadge',{targetId:id(r,0)});send(r,r.hostId,'startVoting');assert.throws(()=>send(r,'actor6','passBadge',{targetId:id(r,1)}),{code:'NO_ABILITY'});});
test('Host can hard skip a disconnected dead Sheriff by destroying the badge',()=>{const r=setup();r.sheriffSeatId=id(r,6);nightAct(r,0,{targetId:id(r,6)});nightAct(r,1,{targetId:id(r,6)});dawn(r);send(r,'actor6','leave');send(r,r.hostId,'hardSkip');assert.equal(r.sheriffSeatId,null);assert.equal(r.phase.step,'discussion');});
test('Sheriff tie opens PK speeches, locks candidacies, and elects the runoff winner',()=>{const r=setup(undefined,{sheriff:true});dawn(r);for(let i=0;i<9;i++)send(r,'actor'+i,'sheriffInterest',{run:i===0||i===2});send(r,r.hostId,'advanceElection');send(r,r.hostId,'advanceElection');for(const i of [1,3,4,5,6,7,8])send(r,'actor'+i,'vote',{targetId:i===8?null:id(r,[1,3,4].includes(i)?0:2)});assert.equal(r.phase.kind,'sheriff');assert.equal(r.election.round,2);assert.throws(()=>send(r,'actor0','sheriffWithdraw'),{code:'WRONG_PHASE'});send(r,r.hostId,'advanceElection');for(const i of [1,3,4,5,6,7,8])send(r,'actor'+i,'vote',{targetId:id(r,2)});assert.equal(r.sheriffSeatId,id(r,2));assert.equal(r.phase.step,'sheriffResult');});
test('Cross-faction lovers prevent premature parity and follow Wild Child conversion',()=>{
 const r=setup(['werewolf','werewolf','cupid','seer','witch','villager','villager','villager','villager'],{winCondition:'parity'});nightAct(r,2,{targetIds:[id(r,0),id(r,5)]});stepTo(r,'wolves');for(const i of [2,3,4,7,8])r.seats[i].alive=false;dawn(r);assert.equal(r.status,'playing');
 const p=setup(['werewolf','werewolf','cupid','wildChild','seer','villager','villager','villager','villager']);nightAct(p,2,{targetIds:[id(p,3),id(p,5)]});nightAct(p,3,{targetId:id(p,6)});stepTo(p,'wolves');nightAct(p,0,{targetId:id(p,6)});nightAct(p,1,{targetId:id(p,6)});dawn(p);assert.equal(p.mixedLovers,true);
});
test('Last Blood Moon survives exile for one last night and then expires',()=>{const r=setup(['werewolf','bloodMoonApostle','seer','witch','guard','villager','villager','villager','villager']);dawn(r);exile(r,0);nextNight(r);dawn(r);exile(r,1);assert.equal(r.status,'playing');assert.equal(r.seats[1].alive,true);nextNight(r);nightAct(r,1,{targetId:id(r,5)});dawn(r);assert.equal(r.seats[5].alive,false);assert.equal(r.seats[1].alive,false);assert.equal(r.winner.team,'village');});
test('Blood Moon can win on its last attack before delayed expiry',()=>{const r=setup(['werewolf','bloodMoonApostle','seer','witch','guard','villager','villager','villager','villager']);dawn(r);for(const i of [0,2,3,4,6,7,8])r.seats[i].alive=false;exile(r,1);assert.equal(r.status,'playing');nextNight(r);nightAct(r,1,{targetId:id(r,5)});dawn(r);assert.equal(r.seats[1].alive,false);assert.equal(r.winner.team,'wolf');});
test('Every named board has a valid deck and reaches first dawn',()=>{const catalogue=require('../src/werewolf/roles.json');for(const preset of catalogue.presets){const r=setup(preset.roles);dawn(r);assert.equal(r.phase.kind,'day',preset.id);}});

test('14-player preset has exactly the requested roles and full role support', () => {
 const {PRESETS,ROLES}=require('../src/werewolf/engine');
 const preset=require('../src/werewolf/roles.json').presets.find(p=>p.id==='14');
 assert.deepEqual(preset.roles,PRESETS[14]); assert.equal(preset.roles.length,14);
 assert.equal(preset.roles.filter(r=>r==='werewolf').length,3);
 assert.equal(preset.roles.filter(r=>r==='villager').length,4);
 for(const role of ['wolfKing','seer','witch','hunter','guard','silencer','wildChild']) assert.equal(preset.roles.filter(r=>r===role).length,1);
 assert.ok(preset.roles.every(role=>ROLES.has(role)));
 const r=setup(preset.roles); dawn(r); assert.equal(r.phase.kind,'day');
});
const silenceDeck=['werewolf','werewolf','silencer','seer','witch','villager','villager','villager','villager'];
test('silence stays secret at night, blocks daytime speech but preserves voting and replacement',()=>{
 const r=setup(silenceDeck); stepTo(r,'silencer'); nightAct(r,2,{targetId:id(r,5)});
 assert.equal(publicView(r,'actor0',time).seats[5].silenced,false);
 dawn(r); assert.equal(publicView(r,'actor5',time).seats[5].silenced,true);
 assert.throws(()=>send(r,'actor5','chat',{text:'hello'}),e=>e.code==='SILENCED');
 assert.throws(()=>send(r,'actor0','setSpeaker',{seatId:id(r,5)}),e=>e.code==='SILENCED');
 send(r,'replacement','requestJoin',{name:'F'}); send(r,'actor0','approveJoin',{requestId:r.requests.at(-1).id,replaceSeatId:id(r,5)});
 assert.equal(publicView(r,'replacement',time).seats[5].silenced,true);
 send(r,'actor0','startVoting'); send(r,'replacement','vote',{targetId:null});
 assert.ok(!publicView(r,'replacement',time).pendingVoterIds.includes(id(r,5)));
 closeVotes(r); closeVotes(r); assert.equal(publicView(r,'replacement',time).seats[5].silenced,false);
 stepTo(r,'silencer'); assert.ok(!publicView(r,'actor2',time).me.action.targets.includes(id(r,5)));
 assert.throws(()=>nightAct(r,2,{targetId:id(r,5)}),e=>e.code==='INVALID_TARGET');
 nightAct(r,2,{ability:'skip'}); dawn(r); assert.equal(publicView(r,'replacement',time).seats[5].silenced,false);
 nextNight(r); stepTo(r,'silencer'); assert.ok(publicView(r,'actor2',time).me.action.targets.includes(id(r,5)));
 nightAct(r,2,{targetId:id(r,2)}); dawn(r); assert.equal(publicView(r,'actor2',time).seats[2].silenced,true);
});
test('silencing elder dying that night still silences, and next night receives a dead-role pause',()=>{
 const r=setup(silenceDeck); stepTo(r,'wolves'); nightAct(r,0,{targetId:id(r,2)}); nightAct(r,1,{targetId:id(r,2)});
 stepTo(r,'silencer'); nightAct(r,2,{targetId:id(r,5)}); dawn(r);
 assert.equal(r.seats[2].alive,false); assert.equal(publicView(r,'actor5',time).seats[5].silenced,true);
 nextNight(r); stepTo(r,'silencer'); assert.deepEqual(r.nightFlow.eligibleSeatIds,[]); assert.ok(r.nightFlow.deadline>time);
});
test('first-night silence waits until sheriff election ends and narration announces the target',()=>{
 const r=setup(silenceDeck,{sheriff:true}); stepTo(r,'silencer'); nightAct(r,2,{targetId:id(r,5)}); dawn(r);
 assert.equal(r.phase.kind,'sheriff'); assert.equal(publicView(r,'actor5',time).seats[5].silenced,false);
 send(r,'actor5','chat',{text:'Sheriff speech allowed'});
 for(const s of r.seats) send(r,s.actorId,'sheriffInterest',{run:false});
 send(r,r.hostId,'advanceElection');
 send(r,r.hostId,'advanceElection');
 for(let n=0;n<5 && r.phase.kind==='announcement';n++) {
  if(r.phase.step==='dawn') assert.ok(r.phase.publicCues.includes('silenced-today'));
  send(r,r.hostId,'nightNarrationDone');
 }
 assert.equal(publicView(r,'actor5',time).seats[5].silenced,true);
});

function dawnCues(r) {
 let n=0; while(r.phase.kind==='night' && n++<200) advanceTestNight(r);
 assert.equal(r.phase.step,'dawn'); return r.phase.publicCues;
}
test('dawn explicitly announces nobody silenced after a skip and hard skip',()=>{
 for(const hardSkip of [false,true]) {
  const r=setup(silenceDeck); stepTo(r,'silencer');
  if(hardSkip) send(r,r.hostId,'hardSkip'); else nightAct(r,2,{ability:'skip'});
  assert.deepEqual(dawnCues(r),['peaceful-night','nobody-silenced']);
  assert.ok(publicView(r,'actor0',time).events.some(e=>e.text.zh==='今日无人被禁言。'));
 }
});
test('dawn announces selected seat numbers, then nobody silenced after elder dies',()=>{
 const r=setup(silenceDeck); stepTo(r,'wolves'); nightAct(r,0,{targetId:id(r,2)}); nightAct(r,1,{targetId:id(r,2)});
 stepTo(r,'silencer'); nightAct(r,2,{targetId:id(r,5)});
 assert.deepEqual(dawnCues(r),['night-deaths','seat-3','silenced-today','seat-6']);
 send(r,r.hostId,'nightNarrationDone'); nextNight(r);
 assert.deepEqual(dawnCues(r),['peaceful-night','nobody-silenced']);
});
test('decks without Silencing Elder do not announce a silence result',()=>{
 const r=setup(); assert.deepEqual(dawnCues(r),['peaceful-night']);
});
