'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const presets = require('../../public/assets/one-night/presets.json');
const { loadEngine } = require('./one-night-simulator');
const { catalogue } = require('../src/one-night/engine');

const responseBoard = {
  id: 'mixed-response-phases', players: 16,
  roles: ['empath', 'nostradamus', 'oracle', 'mirrorMan', 'copycat', 'doppelganger', 'witch', 'voodooLou', 'detector', 'marksman', 'gremlin', 'paranormalInvestigator', 'werewolf', 'vampire', 'master', 'villager', 'villager', 'seer', 'sentinel'],
};
const bonusBoard = {
  id: 'mixed-bonus-powers', players: 16,
  roles: ['werewolf', 'alphaWolf', 'bodySnatcher', 'alien', 'syntheticAlien', 'groob', 'zerb', 'leader', 'curator', 'thing', 'beholder', 'squire', 'auraSeer', 'apprenticeTanner', 'tanner', 'mortician', 'blob', 'familyMan', 'villager'],
};
const villainBoard = {
  id: 'villain-response-powers', players: 12,
  roles: ['temptress', 'drPeeker', 'rapscallion', 'henchman', 'detector', 'roleRetriever', 'voodooLou', 'switcheroo', 'selfAwarenessGirl', 'flipper', 'annoyingLad', 'evilometer', 'madScientist', 'intern', 'innocentBystander'],
};
const marksBoard = {
  id: 'marks-and-bonus', players: 16,
  roles: ['vampire', 'master', 'count', 'renfield', 'diseased', 'cupid', 'instigator', 'priest', 'assassin', 'apprenticeAssassin', 'cow', 'windyWendy', 'defenderEr', 'theSponge', 'ricochetRhino', 'werewolf', 'villager', 'villager', 'villager'],
};
const boards = [...presets, responseBoard, bonusBoard, villainBoard, marksBoard];
const json = value => JSON.stringify(value);

// Human choices are explicit and use only that person's prompt. They are not
// delegated to the bot policy, including all-player Empath/mark-review prompts.
function humanCommand(view) {
  const action = view.me.action;
  if (!action) return null;
  const command = { type: 'act', expectedPhaseId: view.phase.id, actionId: action.id, targets: [] };
  if (action.canSkip && action.targets.length < action.min) return { ...command, skip: true };
  command.choice = action.options?.[0]?.id;
  let count = action.max;
  if (action.roleId === 'nostradamus') count = command.choice === 'inspect' ? 1 : 0;
  command.targets = action.targets.slice(0, count).map(target => target.id);
  return command;
}

function simulate(board, seed) {
  const engine = loadEngine(seed);
  let now = 1800000000000;
  const room = engine.createRoom({ code: 'BOTTEST', hostId: 'human-host', hostName: 'Human host', now });
  const stats = { games: 1, botCommands: 0, humanResponses: 0, roles: new Set(), multiStepRoles: new Set() };
  const send = (actor, command) => {
    try { engine.applyCommand(room, actor, { expectedPhaseId: room.phase.id, ...command }, ++now); }
    catch (error) { error.message = `${board.id} seed=${seed} ${room.phase.kind}/${room.phase.step}/${room.phase.nightStage || ''} ${command.type}: ${error.message}`; throw error; }
  };
  const host = (type, data = {}) => send(room.hostId, { type, ...data });
  const view = actor => engine.publicView(room, actor, now);
  const reject = (type, data = {}, code) => {
    const before = json(room);
    assert.throws(() => host(type, data), code ? { code } : undefined);
    assert.equal(json(room), before, 'Rejected command must leave the room unchanged');
  };
  host('addBots', { count: board.players - 1 });
  host('setBotMode', { mode: 'manual' });
  host('configure', { roleDeck: board.roles });
  host('start');
  const humanId = view(room.hostId).me.seatId;
  const originalSeats = room.seats.map(seat => seat.id).join(',');
  const cardIds = Object.values(room.cards).map(card => card.id).sort().join(',');
  // Consensus completes all Vampire markers together; compare the human's
  // actual ballot rather than that shared completion marker.
  const humanDecisions = () => json({ ready: room.seats.find(seat => seat.id === humanId).ready, actions: Object.entries(room.actions).filter(([step, actions]) => step !== 'vampire' && actions[humanId]).map(([step]) => step), vampireChoice: room.nightState[`vampire:${humanId}`]?.target || null, vote: room.votes[humanId] || null });
  const assertPrivacy = () => {
    const observer = view('observer');
    assert.equal(observer.me, null); assert.equal(observer.isHost, false);
    for (const projection of [observer, view(room.hostId)]) {
      for (const field of ['cards', 'nightActors', 'actions', 'nightState', 'members', 'botState']) assert.equal(projection[field], undefined);
      assert.equal(projection.result, null);
      assert.ok(projection.seats.every(seat => !seat.roleId && !seat.actorId));
      for (const seat of room.seats.filter(seat => seat.isBot)) assert.ok(!json(projection).includes(seat.actorId), 'Bot credential leaked');
    }
  };
  // Readying every bot still cannot bypass a real human or start the night.
  for (let i = 1; i < board.players; i++) host('botStep');
  assert.equal(view(room.hostId).me.ready, false);
  reject('startNight', {}, 'NOT_READY');
  host('ready'); host('startNight');
  const roleCounts = new Map();
  for (let steps = 0; room.phase.kind === 'night' && steps < 500; steps++) {
    assert.equal(room.seats.map(seat => seat.id).join(','), originalSeats);
    assert.equal(Object.values(room.cards).map(card => card.id).sort().join(','), cardIds, 'Physical cards cannot disappear or duplicate');
    assertPrivacy();
    if (room.phase.nightStage !== 'acting') { host('narrationDone'); continue; }
    // Predict the one legal bot decision from private projections; the real
    // botStep scheduler still decides and performs the actual command.
    const candidates = room.seats.filter(seat => seat.isBot).flatMap(seat => {
      const projection = view(seat.actorId), before = json(projection);
      const command = engine.chooseBotCommand(projection);
      assert.equal(json(projection), before, 'Policy must not mutate a private projection');
      if (!command) return [];
      assert.ok(['ready', 'act', 'vote'].includes(command.type), 'Bots must not issue host controls');
      return [{ seat, command, action: projection.me.action }];
    });
    if (candidates.length) {
      for (const candidate of candidates) if (candidate.action) {
        stats.roles.add(candidate.action.roleId);
        const key = `${room.phase.id}:${candidate.seat.id}:${candidate.action.roleId}`;
        const previous = roleCounts.get(key);
        if (previous && previous !== candidate.action.id) stats.multiStepRoles.add(candidate.action.roleId);
        roleCounts.set(key, candidate.action.id);
      }
      const before = humanDecisions();
      host('botStep'); stats.botCommands++;
      assert.equal(humanDecisions(), before, 'Bots cannot submit, skip or ready humans');
    }
    const own = view(room.hostId);
    if (own.me.action) {
      // A real response may keep this stage open after every bot is done.
      const command = humanCommand(own);
      send(room.hostId, command); stats.humanResponses++;
    } else if (!candidates.length && room.phase.nightStage === 'acting') {
      assert.equal(room.nightActors.length, 0, `${board.id} seed=${seed}: bots stalled at ${room.phase.step}`);
      assert.ok(room.phase.deadline != null);
      now = room.phase.deadline; assert.equal(engine.tickRoom(room, now), true);
    }
  }
  assert.equal(room.phase.kind, 'discussion', `${board.id} seed=${seed}: night exceeded decision bound`);
  assertPrivacy();
  reject('botStep', {}, 'BOT_IDLE');
  host('startVote');
  for (let i = 1; i < board.players; i++) host('botStep');
  assert.deepEqual([...view(room.hostId).pendingVoterIds], [humanId]);
  reject('finishVote', {}, 'PENDING_VOTES');
  host('vote', { targetId: room.seats.find(seat => seat.id !== humanId).id });
  host('finishVote');
  assert.equal(room.status, 'finished');
  assert.equal(room.result.players.length, board.players);
  assert.equal(room.result.center.length, 3 + Number(board.roles.includes('alphaWolf')));
  assert.equal(Object.keys(room.votes).length, board.players);
  for (const player of room.result.players) {
    assert.equal(player.won, room.result.winners.includes(player.seatId));
    assert.equal(player.died, room.result.deaths.includes(player.seatId));
  }
  host('rematch');
  assert.equal(view(room.hostId).me.roleId, null);
  assert.equal(view(room.hostId).me.knowledge.length, 0);
  assert.equal(view(room.hostId).result, null);
  return stats;
}

test('real One Night bots complete seeded 3–16-player games across every expansion with human decisions intact', t => {
  const totals = { games: 0, botCommands: 0, humanResponses: 0, roles: new Set(), multiStepRoles: new Set() };
  for (const [index, board] of boards.entries()) for (const repetition of [1, 2, 3]) {
    const stats = simulate(board, 8200 + index * 101 + repetition);
    for (const key of ['games', 'botCommands', 'humanResponses']) totals[key] += stats[key];
    for (const key of ['roles', 'multiStepRoles']) for (const value of stats[key]) totals[key].add(value);
  }
  assert.equal(totals.games, boards.length * 3);
  const expectedRoles = new Set(catalogue.filter(role => role.order !== null).map(role => role.id === 'master' ? 'vampire' : role.id === 'syntheticAlien' ? 'alien' : role.id));
  expectedRoles.add('markReview'); expectedRoles.add('lovers');
  assert.deepEqual([...totals.roles].sort(), [...expectedRoles].sort(), 'Every active role category must make a real bot decision');
  for (const role of ['vampire', 'empath', 'nostradamus', 'oracle', 'detector', 'witch', 'voodooLou', 'marksman', 'gremlin', 'doppelganger', 'copycat', 'mirrorMan', 'paranormalInvestigator']) assert.ok(totals.roles.has(role), `${role} must receive a bot decision`);
  for (const role of ['seer', 'witch', 'voodooLou', 'detector', 'gremlin']) assert.ok(totals.multiStepRoles.has(role), `${role} must exercise response subphases`);
  t.diagnostic(json({ ...totals, roles: [...totals.roles].sort(), multiStepRoles: [...totals.multiStepRoles].sort() }));
});
