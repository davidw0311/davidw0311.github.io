'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createRoom, applyCommand, publicView, tickRoom } = require('../src/werewolf/engine');
const now = 1800000000000;
const deck = ['werewolf', 'werewolf', 'seer', 'witch', 'guard', 'hunter', 'villager', 'villager', 'villager'];
function send(room, actor, type, fields = {}) { return applyCommand(room, actor, {type,expectedPhaseId:room.phase.id,...fields}, now); }
function setup() {
    const room = createRoom({code:'TEST',hostId:'p0',hostName:'Host',now});
    for(let index=1;index<9;index++) send(room,`p${index}`,'requestJoin',{name:`Player ${index}`});
    send(room,'p0','startGame',{roleDeck:deck});return room;
}
function rejected(room,actor,type,fields,code) { const before=structuredClone(room);assert.throws(()=>send(room,actor,type,fields),{code});assert.deepEqual(room,before); }
for(const kind of ['ready','night','day','voting','sheriff','reaction','announcement','finished']) test(`restart clears ${kind}, including paused phases, while preserving the table`,()=>{
    const room=setup(), first=room.seats[0].id;
    room.phase={...room.phase,kind,step:'test',paused:true,deadline:now+1000,nightCues:['private'],publicCues:['night-deaths']};
    room.status=kind==='finished'?'finished':'playing';
    room.seats[0].photo='cat';room.seats[1].isBot=true;room.seats[2].actorId=null;
    room.botState.mode='manual';
    room.seats.forEach(seat=>{seat.ready=true;seat.alive=false;seat.canVote=false;seat.state={revealed:true,antidoteUsed:true,poisonUsed:true,silencedDay:3};seat.privateLog=[{text:{en:'OLD SECRET',zh:'旧秘密'}}];});
    room.night=3;room.day=3;room.actions={seer:{[first]:{targetId:first,result:{alignment:'wolf',night:3}}}};room.votes={[first]:first};room.pendingShots=[first];room.sheriffSeatId=first;room.lovers=[first];room.mixedLovers=true;room.villagePowersLost=true;room.finalNightWolfVictory=true;room.runoffIds=[first];room.voteRound=2;
    room.nightFlow={eligibleSeatIds:[first],secret:'OLD SECRET'};room.speakingTimer={deadline:now+1000};room.speakerSeatId=first;
    room.election={participantIds:[first],declarations:{[first]:true},candidateIds:[first],withdrawnIds:[],voterIds:[]};room.pendingAnnouncement={secret:'OLD SECRET'};room.lastVote={secret:'OLD SECRET'};room.lastNight={secret:'OLD SECRET'};room.replay=[{secret:'OLD SECRET'}];room.messages=[{channel:'wolves',text:'OLD SECRET'}];
    room._recoveryKey='server-only';room._requests={receipt:{at:now}};
    const seats=room.seats.map(({id,name,actorId,photo,isBot})=>({id,name,actorId,photo:photo||null,isBot:Boolean(isBot)}));
    const settings=structuredClone(room.settings),phaseId=room.phase.id,revision=room.revision;
    rejected(room,'p1','restartRound',{},'HOST_ONLY');rejected(room,'p0','restartRound',{expectedPhaseId:'old'},'STALE_PHASE');rejected(room,'p0','restartRound',{expectedPhaseId:undefined},'STALE_PHASE');
    send(room,'p0','restartRound');
    assert.equal(room.status,'lobby');assert.equal(room.gameId,null);assert.equal(room.phase.kind,'lobby');assert.notEqual(room.phase.id,phaseId);assert.equal(room.phase.paused,false);assert.equal(room.phase.deadline,null);assert.equal(room.revision,revision+1);
    assert.deepEqual(room.seats.map(({id,name,actorId,photo,isBot})=>({id,name,actorId,photo,isBot})),seats);assert.deepEqual(room.settings,settings);assert.deepEqual(room.roleDeck,deck);assert.equal(room.botState.mode,'manual');assert.equal(room.hostId,'p0');assert.equal(room._recoveryKey,'server-only');assert.ok(room._requests.receipt);
    for(const seat of room.seats){assert.equal(seat.ready,false);assert.equal(seat.alive,true);assert.equal(seat.canVote,true);assert.equal(seat.roleId,null);assert.equal(seat.team,null);assert.equal(seat.originalRoleId,undefined);assert.equal(seat.originalTeam,undefined);assert.deepEqual(seat.state,{});assert.deepEqual(seat.privateLog,[]);}
    const view=publicView(room,'p0',now);
    assert.equal(view.night,0);assert.equal(view.day,0);assert.equal(view.election,null);assert.equal(view.lastVote,null);assert.equal(view.lastNight,null);assert.equal(view.winner,null);assert.equal(view.speakingTimer,null);assert.deepEqual(view.me.history,[]);assert.equal(view.me.inspection,null);assert.deepEqual(view.me.allies,[]);assert.equal(view.me.action,null);assert.ok(!JSON.stringify(view).includes('OLD SECRET'));
    assert.deepEqual(room.actions,{});assert.deepEqual(room.votes,{});assert.deepEqual(room.pendingShots,[]);assert.equal(room.pendingAnnouncement,undefined);assert.equal(room.lovers,undefined);assert.equal(room.villagePowersLost,undefined);assert.equal(room.nightFlow,null);
    assert.equal(tickRoom(room,now+100000),false);rejected(room,'p0','restartRound',{},'WRONG_PHASE');
});
test('restart allows a fresh deal and seating changes while rejecting old readiness and narration',()=>{
    const room=setup(),oldGame=room.gameId,readyPhase=room.phase.id;
    room.seats.forEach(seat=>send(room,seat.actorId,'ready'));send(room,'p0','startNight');const nightPhase=room.phase.id;
    send(room,'p0','restartRound');send(room,'p0','moveSeat',{seatId:room.seats[0].id,number:9});send(room,'p0','startGame');
    assert.notEqual(room.gameId,oldGame);assert.ok(room.seats.every(seat=>!seat.ready));
    rejected(room,'p1','ready',{expectedPhaseId:readyPhase},'STALE_PHASE');rejected(room,'p0','startNight',{},'NOT_READY');
    room.seats.forEach(seat=>send(room,seat.actorId,'ready'));send(room,'p0','startNight');
    rejected(room,'p0','nightNarrationDone',{expectedPhaseId:nightPhase},'STALE_PHASE');
    rejected(room,'p1','nightAction',{expectedPhaseId:nightPhase,targetId:null},'STALE_PHASE');
});
test('pending reconnects survive restart and can join the lobby without losing existing seats',()=>{
    const room=setup();send(room,'waiting','requestJoin',{name:'Waiting player'});const existing=room.seats.map(seat=>seat.id);
    send(room,'p0','restartRound');assert.equal(room.requests.length,1);
    send(room,'waiting','heartbeat');assert.equal(room.requests.length,0);assert.ok(publicView(room,'waiting',now).me);assert.deepEqual(room.seats.slice(0,9).map(seat=>seat.id),existing);
});
