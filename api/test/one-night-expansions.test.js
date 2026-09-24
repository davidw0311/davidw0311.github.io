'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const expansion = require('../src/one-night/expansions');
const core = require('../src/one-night/core-roles.json');
const metadata = [...core, ...expansion.roles];

function fixture(role, others = ['werewolf', 'vampire', 'villager', 'tanner', 'seer', 'alien']) {
  const list = [role, ...others];
  const room = { roleDeck: [...list, 'villager', 'robber', 'oracle'], seats: list.map((r, i) => ({ id: `p${i}`, number: i + 1, name: `Player ${i + 1}`, originalRoleId: r, nightRoleId: r, knowledge: [] })), cards: {}, shields: [], marks: {}, artifacts: {}, revealed: [], actionLog: [], nightState: {}, settings: {}, phase: { id: 'phase', step: role }, expansion: {} };
  list.forEach((r, i) => { room.cards[`p${i}`] = { id: `physical-${i}`, roleId: r }; room.marks[`p${i}`] = 'clarity'; });
  ['villager', 'robber', 'oracle'].forEach((r, i) => { room.cards[`center:${i}`] = { id: `physical-center-${i}`, roleId: r }; });
  const ctx = { room, role, step: role, seat: room.seats[0], seats: room.seats, data: { seen: [], count: 0 }, roles: metadata, players: (self = true) => room.seats.filter((s) => self || s.id !== ctx.seat.id).map((s) => s.id), centers: () => Object.keys(room.cards).filter((id) => id.startsWith('center:')), targets: (ids) => ids.map((id) => ({ id, label: { en: id, zh: id } })), randomInt: (min, max) => max === undefined ? 0 : min, fail: (code, message) => { throw Object.assign(new Error(message), { code }); }, complete: () => { ctx.done = true; }, learn: (en, zh) => ctx.seat.knowledge.push({ text: { en, zh } }), originalActors: (r) => room.seats.filter((s) => s.nightRoleId === r).map((s) => s.id) };
  ctx.inspectCard = (id) => { assert.ok(room.cards[id], `card exists: ${id}`); assert.ok(!room.shields.includes(id)); room.actionLog.push({ type: 'view', seatId: ctx.seat.id, roleId: ctx.role, targets: [id] }); return structuredClone(room.cards[id]); };
  ctx.swapCards = (a, b) => { assert.ok(room.cards[a] && room.cards[b]); assert.notEqual(a, b); assert.ok(!room.shields.includes(a) && !room.shields.includes(b)); [room.cards[a], room.cards[b]] = [room.cards[b], room.cards[a]]; room.actionLog.push({ type: 'move', seatId: ctx.seat.id, roleId: ctx.role, targets: [a, b] }); };
  ctx.effectiveCard = (id) => { const card = room.cards[id]; const roleId = card.transformedRoleId || card.copiedRoleId || card.roleId; return { roleId, team: metadata.find((r) => r.id === roleId)?.team || 'village' }; };
  expansion.prepare(ctx);
  return ctx;
}
function result(ctx, votes = {}, dead = [], winners = []) { return { votes, effective: Object.fromEntries(ctx.room.seats.map((s) => [s.id, ctx.effectiveCard(s.id)])), dead: new Set(dead), winners: new Set(winners), counts: {}, protected: new Set() }; }
function doAction(ctx, targets = [], choice) { return expansion.perform(ctx, ctx.role, { targets, choice }); }

test('all expansion cards have distinct stable IDs and non-empty bilingual rules', () => {
  assert.equal(expansion.roles.length, 43);
  assert.equal(new Set(metadata.map((r) => r.id)).size, metadata.length);
  for (const r of expansion.roles) { assert.match(r.id, /^[a-z][a-zA-Z]+$/); assert.ok(r.name.en && r.name.zh && r.description.en && r.description.zh && r.icon); }
});
for (const r of expansion.roles.filter((r) => r.order !== null)) test(`playable expansion action: ${r.id}`, () => {
  const ctx = fixture(r.id);
  for (let tries = 0; !ctx.done && tries < 6; tries++) {
    const action = expansion.buildAction(ctx);
    assert.ok(action && action.prompt.en && action.prompt.zh);
    const choice = action.options?.[0].id;
    const count = r.id === 'nostradamus' && choice === 'inspect' ? 1 : action.min;
    doAction(ctx, action.targets.slice(0, count).map((t) => t.id), choice);
  }
  assert.equal(ctx.done, true, `${r.id} must finish`);
});

test('recognition appears before a villain chooses an inspection target, including optional skip', () => {
  const ctx = fixture('drPeeker', ['rapscallion', 'villager']);
  expansion.initialize(ctx);
  assert.match(ctx.seat.knowledge[0].text.en, /#2/);
  expansion.perform(ctx, { skip: true });
  assert.equal(ctx.done, true);
});

test('Body Snatcher transforms only two physical cards, and the stolen conversion follows later swaps', () => {
  const ctx = fixture('bodySnatcher', ['villager', 'villager', 'alien']);
  doAction(ctx, ['p1']);
  assert.equal(ctx.room.cards.p0.id, 'physical-1');
  assert.equal(ctx.room.cards.p0.alien, true);
  assert.equal(ctx.room.cards.p1.alien, true);
  assert.equal(ctx.room.cards.p2.alien, undefined);
  ctx.swapCards('p0', 'p2');
  assert.equal(expansion.effective(ctx, 'p2', ctx.effectiveCard('p2')).team, 'alien');
  assert.equal(expansion.effective(ctx, 'p0', ctx.effectiveCard('p0')).team, 'village');
});

test('Body Snatcher has a valid no-op when shield prevents any legal exchange', () => {
  const ctx = fixture('bodySnatcher'); ctx.room.shields.push('p0');
  assert.equal(expansion.buildAction(ctx).min, 0);
  doAction(ctx); assert.equal(ctx.done, true);
});

test('mark and role-changing artifacts override Body Snatcher, while void does not', () => {
  const ctx = fixture('villager'); ctx.room.cards.p0.alien = true;
  ctx.room.marks.p0 = 'vampire';
  assert.equal(expansion.effective(ctx, 'p0', { roleId: 'villager', team: 'vampire' }).team, 'vampire');
  ctx.room.artifacts.p0 = 'cloakOfPrince';
  assert.deepEqual(expansion.effective(ctx, 'p0', { roleId: 'villager', team: 'vampire' }), { roleId: 'prince', team: 'village' });
  ctx.room.marks.p0 = 'clarity'; ctx.room.artifacts.p0 = 'void';
  assert.equal(expansion.effective(ctx, 'p0', ctx.effectiveCard('p0')).team, 'alien');
});

test('Cow reveals only adjacency boolean, not opponent seats', () => {
  const ctx = fixture('cow', ['alien', 'seer', 'villager']); expansion.initialize(ctx);
  assert.match(ctx.seat.knowledge[0].text.en, /At least one/);
  assert.doesNotMatch(ctx.seat.knowledge[0].text.en, /#2|alien|p1/);
});

test('Aura Seer snapshots real earlier actions and excludes later changes', () => {
  const ctx = fixture('auraSeer'); ctx.room.actionLog.push({ type: 'move', seatId: 'p1' });
  expansion.initialize(ctx); ctx.room.actionLog.push({ type: 'view', seatId: 'p2' }); doAction(ctx);
  assert.match(ctx.seat.knowledge.at(-1).text.en, /#2/);
  assert.doesNotMatch(ctx.seat.knowledge.at(-1).text.en, /#3/);
});

test('Nostradamus stores a team on its original physical card even after it was swapped away', () => {
  const ctx = fixture('nostradamus'); ctx.swapCards('p0', 'p2');
  doAction(ctx, ['p1'], 'inspect'); doAction(ctx, [], 'finish');
  assert.equal(ctx.room.expansion.nostradamusTeams['physical-0'], 'wolf');
  assert.equal(ctx.room.expansion.nostradamusTeams['physical-2'], undefined);
  assert.ok(ctx.room.seats.every((s) => s.knowledge.some((n) => /Nostradamus/.test(n.text.en))));
});

test('Nostradamus skips with a published preselected default, including when copied out of the center', () => {
  const ctx = fixture('nostradamus'); expansion.perform(ctx, { skip: true });
  assert.equal(ctx.room.expansion.nostradamusTeams['physical-0'], 'village');
  assert.ok(ctx.room.expansion.publicRules.length > 1);
});

test('Nostradamus must choose a card when selecting inspect', () => {
  const ctx = fixture('nostradamus'); assert.throws(() => doAction(ctx, [], 'inspect'), /Select one card/);
});

test('Exposer must choose exactly announced number or skip', () => {
  const ctx = fixture('exposer'); ctx.room.expansion.exposerCount = 2;
  assert.throws(() => doAction(ctx, ['center:0']), /required number/);
  doAction(ctx, ['center:0', 'center:1']); assert.deepEqual(ctx.room.revealed, ['center:0', 'center:1']);
});

test('all center-inspection expansion roles can select Alpha Wolf extra center', () => {
  for (const role of ['mirrorMan', 'rapscallion', 'voodooLou', 'exposer']) {
    const ctx = fixture(role); ctx.room.cards['center:3'] = { id: 'extra-wolf', roleId: 'werewolf' };
    assert.ok(expansion.buildAction(ctx).targets.some((t) => t.id === 'center:3'), role);
  }
});

test('Rascal higher seat restriction cannot invent targets when too few remain', () => {
  const ctx = fixture('rascal'); ctx.room.expansion.rascalVariant = 'higher'; ctx.seat.number = 100;
  const before = structuredClone(ctx.room.cards); assert.equal(expansion.buildAction(ctx).min, 0);
  doAction(ctx); assert.deepEqual(ctx.room.cards, before);
});

test('Thing cannot tap a distant player and anonymous tap reveals no role holder', () => {
  const ctx = fixture('thing'); assert.throws(() => doAction(ctx, ['p3']), /required number/);
  doAction(ctx, ['p1']); assert.equal(ctx.room.seats[1].knowledge[0].text.en, 'A neighboring player sent you a secret tap.');
});

test('Flipper does not expose Innocent Bystander', () => {
  const ctx = fixture('flipper', ['innocentBystander', 'villager']); doAction(ctx, ['p1']); assert.deepEqual(ctx.room.revealed, []);
});

test('Temptress adds a fourth reserve outside the center and exchanges it with non-villain', () => {
  const ctx = fixture('temptress', ['henchman', 'seer', 'villager']);
  assert.ok(ctx.room.cards['reserve:villain']);
  assert.throws(() => doAction(ctx, ['p1']), /required number/);
  doAction(ctx, ['p2']); assert.equal(ctx.room.cards.p2.roleId, 'henchman'); assert.equal(ctx.room.cards['reserve:villain'].roleId, 'seer');
});

test('Cursed wolf conversion takes precedence over simultaneous Vampire vote', () => {
  const ctx = fixture('cursed', ['werewolf', 'vampire']); const r = result(ctx, { p1: 'p0', p2: 'p0' }); expansion.beforeVote(ctx, r);
  assert.deepEqual(r.effective.p0, { roleId: 'werewolf', team: 'wolf' });
});

test('Windy Wendy changes to a villain before vote resolution', () => {
  const ctx = fixture('windyWendy', ['henchman', 'villager']); const r = result(ctx, { p1: 'p0' }); expansion.beforeVote(ctx, r); assert.equal(r.effective.p0.team, 'villain');
});

test('Prince, Sponge, and Defender apply vote protection', () => {
  const ctx = fixture('prince', ['theSponge', 'defenderEr', 'villager']); const r = result(ctx, { p2: 'p3' }); expansion.beforeVote(ctx, r);
  assert.deepEqual([...r.protected].sort(), ['p0', 'p1', 'p3']);
});

test('Mist of Vampire removes old Prince vote protection', () => {
  const ctx = fixture('prince'); ctx.room.artifacts.p0 = 'mistOfVampire'; const r = result(ctx); expansion.beforeVote(ctx, r);
  assert.equal(r.protected.has('p0'), false); assert.equal(r.effective.p0.roleId, 'vampire');
});

test('Rhino redirects initial execution and never recursively bounces a Rhino chain', () => {
  const ctx = fixture('ricochetRhino', ['ricochetRhino', 'hunter', 'villager']); const r = result(ctx, { p0: 'p1', p1: 'p2' }, ['p0']);
  expansion.beforeVote(ctx, r); expansion.replaceDeaths(ctx, r); assert.deepEqual([...r.dead], ['p1']);
});

test('Blob neighborhood is based on final holder after a card swap', () => {
  const ctx = fixture('blob', ['villager', 'villager', 'villager', 'villager']); ctx.room.expansion.blobOffsets = [-1, 1]; ctx.swapCards('p0', 'p2');
  let r = result(ctx, {}, ['p0']); expansion.afterVote(ctx, r); assert.equal(r.winners.has('p2'), true);
  r = result(ctx, {}, ['p1']); expansion.afterVote(ctx, r); assert.equal(r.winners.has('p2'), false);
});

test('Mortician uses final physical neighbors and can co-win', () => {
  const ctx = fixture('mortician', ['villager', 'villager', 'villager']); const r = result(ctx, {}, ['p1'], ['p3']); expansion.afterVote(ctx, r);
  assert.equal(r.winners.has('p0'), true); assert.equal(r.winners.has('p3'), true);
});

test('Groob and Zerb paired have opposing personal objectives', () => {
  const ctx = fixture('groob', ['zerb', 'alien', 'leader', 'villager']); const r = result(ctx, {}, ['p1'], ['p0', 'p2', 'p4']); expansion.afterVote(ctx, r);
  assert.equal(r.winners.has('p0'), true); assert.equal(r.winners.has('p1'), false); assert.equal(r.winners.has('p3'), false);
});

test('Leader can co-win with aliens when pair survives even if aliens unanimously kill Leader', () => {
  const ctx = fixture('leader', ['groob', 'zerb', 'alien', 'villager']); const r = result(ctx, { p1: 'p0', p2: 'p0', p3: 'p0' }, ['p0']); expansion.afterVote(ctx, r);
  assert.equal(r.winners.has('p0'), true); assert.equal(r.winners.has('p3'), true); assert.equal(r.winners.has('p4'), false);
});

test('Mad Scientist death suppresses ordinary hero and villain winners', () => {
  const ctx = fixture('madScientist', ['henchman', 'villager', 'intern']); const r = result(ctx, {}, ['p0'], ['p1', 'p2']); expansion.afterVote(ctx, r);
  assert.deepEqual([...r.winners].sort(), ['p0', 'p3']);
});

test('Synthetic death defeats ordinary village and aliens but permits independent Blob win', () => {
  const ctx = fixture('syntheticAlien', ['alien', 'villager', 'blob', 'villager', 'villager']); ctx.room.expansion.blobOffsets = [1]; const r = result(ctx, {}, ['p0'], ['p1', 'p2']); expansion.afterVote(ctx, r);
  assert.equal(r.winners.has('p0'), true); assert.equal(r.winners.has('p1'), false); assert.equal(r.winners.has('p2'), false); assert.equal(r.winners.has('p3'), true);
});

test('Empath receives private responses without exposing the Empath to respondents', () => {
  const ctx = fixture('empath'); const spy = ctx.room.seats[0]; ctx.seat = ctx.room.seats[1]; ctx.data = {};
  assert.equal(expansion.getActors(ctx, 'empath').length, ctx.room.seats.length);
  doAction(ctx, [], 'yes'); assert.match(spy.knowledge[0].text.en, /#2: yes/); assert.equal(ctx.seat.knowledge.length, 0);
});

test('Dagger of the Traitor requires a different teammate death', () => {
  const ctx = fixture('villager', ['villager', 'werewolf']); ctx.room.artifacts.p0 = 'daggerOfTraitor';
  let r = result(ctx, {}, ['p0'], ['p0']); expansion.afterVote(ctx, r); assert.equal(r.winners.has('p0'), false);
  r = result(ctx, {}, ['p1']); expansion.afterVote(ctx, r); assert.equal(r.winners.has('p0'), true);
});

test('classic and Vampire decks do not show irrelevant Alien variant rules', () => {
  const ctx = fixture('villager');
  ctx.room.roleDeck = ['werewolf', 'werewolf', 'seer', 'robber', 'troublemaker', 'villager']; expansion.prepare(ctx); assert.deepEqual(ctx.room.expansion.publicRules, []);
  ctx.room.roleDeck = ['vampire', 'master', 'count', 'priest', 'diseased', 'renfield']; expansion.prepare(ctx); assert.deepEqual(ctx.room.expansion.publicRules, []);
});

test('Alien variant rules are readable and only list selected roles', () => {
  const ctx = fixture('alien'); ctx.room.roleDeck = ['alien', 'cow', 'seer', 'robber', 'villager', 'villager']; expansion.prepare(ctx);
  const en = ctx.room.expansion.publicRules.map((rule) => rule.en).join(' ');
  assert.doesNotMatch(en, /Psychic|Rascal|Exposer|Mortician|onePlayer|swapOthers/);
  assert.match(en, /Aliens recognize/);
});

test('Vampire mark overrides Oracle and Nostradamus chosen teams', () => {
  for (const role of ['oracle', 'nostradamus']) {
    const ctx = fixture(role); ctx.room.marks.p0 = 'vampire';
    assert.equal(expansion.effective(ctx, 'p0', { roleId: role, team: 'vampire' }).team, 'vampire');
    const r = result(ctx); r.effective.p0.team = 'vampire'; expansion.beforeVote(ctx, r); assert.equal(r.effective.p0.team, 'vampire');
  }
});

test('Body Snatcher conversion overrides Oracle and Nostradamus chosen teams', () => {
  for (const role of ['oracle', 'nostradamus']) {
    const ctx = fixture(role); ctx.room.cards.p0.alien = true;
    assert.equal(expansion.effective(ctx, 'p0', { roleId: role, team: 'village' }).team, 'alien');
    const r = result(ctx); expansion.beforeVote(ctx, r); assert.equal(r.effective.p0.team, 'alien');
  }
});

test('Vampire-marked independent role uses Vampire victory and does not regain personal victory', () => {
  for (const role of ['blob', 'familyMan', 'mortician', 'madScientist', 'syntheticAlien', 'apprenticeTanner', 'intern']) {
    const ctx = fixture(role); ctx.room.marks.p0 = 'vampire'; const r = result(ctx, {}, ['p0', 'p1']); r.effective.p0.team = 'vampire';
    expansion.afterVote(ctx, r); assert.equal(r.winners.has('p0'), false, role);
  }
});

test('Doppelganger Body Snatcher may target an unknown alien but not the copied source', () => {
  const ctx = fixture('bodySnatcher', ['bodySnatcher', 'alien', 'villager']); ctx.seat.copyMode = 'doppel'; ctx.seat.copySourceId = 'p1'; ctx.step = 'doppelganger';
  expansion.initialize(ctx); assert.equal(ctx.seat.knowledge.length, 0);
  const action = expansion.buildAction(ctx); assert.equal(action.targets.some((t) => t.id === 'p1'), false); assert.equal(action.targets.some((t) => t.id === 'p2'), true);
  doAction(ctx, ['p2']); assert.equal(ctx.done, true);
});

test('Squire fallback does not override a Tanner death', () => {
  const ctx = fixture('squire', ['tanner', 'villager']); const r = result(ctx, {}, ['p1']); expansion.afterVote(ctx, r); assert.equal(r.winners.has('p0'), false);
});
