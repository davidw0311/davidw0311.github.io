'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createRoom, applyCommand, publicView, tickRoom } = require('../src/one-night/engine');

function fixture(artifact = 'mask') {
  const room = createRoom({ code: 'MOON', hostId: 'host', hostName: 'Host', now: 1000 });
  applyCommand(room, 'curator', { type: 'requestJoin', name: 'Curator' }, 1000);
  applyCommand(room, 'other', { type: 'requestJoin', name: 'Other' }, 1000);
  const roles = ['sentinel', 'curator', 'villager'];
  room.seats.forEach((seat, index) => {
    seat.number = index + 1; seat.originalRoleId = roles[index]; seat.nightRoleId = roles[index];
    room.cards[seat.id] = { id: `card-${index}`, roleId: roles[index] };
    room.marks[seat.id] = 'clarity';
  });
  room.status = 'playing'; room.roleDeck = [...roles, 'werewolf', 'seer', 'robber'];
  room.shields = [room.seats[2].id]; room.artifacts[room.seats[0].id] = artifact;
  room.schedule = []; room.nightIndex = 0; room.nightActors = [];
  room.phase = { id: 'night-end', kind: 'night', step: 'curator', roleId: 'curator', nightStage: 'closing', cueIds: ['close'], deadline: 2000 };
  return room;
}
const observers = ['host', 'curator', 'other'];

function assertPublicPresences(view) {
  assert.deepEqual(view.seats.map(seat => [seat.shielded, seat.hasArtifact]), [[false, true], [false, false], [true, false]]);
  assert.ok(view.seats.every(seat => !Object.hasOwn(seat, 'artifact') && !Object.hasOwn(seat, 'artifactId')));
}

test('public views hide token presence throughout night so waiting phones cannot infer which role acted', () => {
  const room = fixture();
  for (const nightStage of ['opening', 'acting', 'closing']) {
    room.phase.nightStage = nightStage;
    for (const actor of observers) {
      const view = publicView(room, actor, 1500);
      assert.ok(view.seats.every(seat => !Object.hasOwn(seat, 'shielded') && !Object.hasOwn(seat, 'hasArtifact')));
      assert.equal(view.artifacts, undefined);
      assert.equal(view.shields, undefined);
      assert.ok(!JSON.stringify(view).includes('Mask of Muting'));
    }
  }
});

test('day and voting expose shield and artifact presence, while the artifact description belongs only to its recipient', () => {
  const room = fixture();
  assert.equal(tickRoom(room, 2000), true);
  assert.equal(room.phase.kind, 'discussion');
  for (const actor of observers) {
    const view = publicView(room, actor, 2001);
    assertPublicPresences(view);
    assert.equal(view.result, null);
    assert.ok(view.seats.every(seat => seat.roleId === undefined));
    const text = JSON.stringify(view.me.knowledge);
    assert.equal(text.includes('Mask of Muting'), actor === 'host');
    assert.equal(text.includes('禁言面具'), actor === 'host');
    assert.equal(text.includes('Stay silent'), actor === 'host');
  }
  applyCommand(room, 'host', { type: 'startVote' }, 2002);
  for (const actor of observers) {
    const view = publicView(room, actor, 2003);
    assertPublicPresences(view);
    assert.equal(view.result, null);
    if (actor !== 'host') assert.ok(!JSON.stringify(view).includes('Mask of Muting'));
  }
});

test('final results reveal artifact identity with the final card and retain public token badges', () => {
  const room = fixture(); tickRoom(room, 2000);
  applyCommand(room, 'host', { type: 'startVote' }, 2001);
  const ids = room.seats.map(seat => seat.id);
  for (const [index, actor] of observers.entries()) applyCommand(room, actor, { type: 'vote', targetId: ids[[1, 2, 1][index]], expectedPhaseId: room.phase.id }, 2002);
  applyCommand(room, 'host', { type: 'finishVote' }, 2003);
  for (const actor of observers) {
    const view = publicView(room, actor, 2004);
    assertPublicPresences(view);
    assert.equal(view.result.players.find(player => player.seatId === ids[0]).artifact, 'mask');
    assert.ok(view.seats.every(seat => typeof seat.roleId === 'string'));
  }
});

test('every bonus artifact gives its recipient bilingual name and usable effect instructions at dawn', () => {
  const expected = {
    bowOfHunter: ['Bow of the Hunter', 'Hunter', '猎人之弓', '死亡'],
    cloakOfPrince: ['Cloak of the Prince', 'Votes cannot eliminate', '王子斗篷', '投票'],
    swordOfBodyguard: ['Sword of the Bodyguard', 'protects', '保镖之剑', '保护'],
    mistOfVampire: ['Mist of the Vampire', 'vampire team', '吸血鬼迷雾', '吸血鬼阵营'],
    alienArtifact: ['Alien Artifact', 'alien team', '外星神器', '外星人阵营'],
    daggerOfTraitor: ['Dagger of the Traitor', 'another player', '叛徒匕首', '另一位'],
  };
  for (const [artifact, checks] of Object.entries(expected)) {
    const room = fixture(artifact); tickRoom(room, 2000);
    const clue = publicView(room, 'host', 2001).me.knowledge[0].text;
    for (const expectedText of checks.slice(0, 2)) assert.ok(clue.en.includes(expectedText), `${artifact}: English effect`);
    for (const expectedText of checks.slice(2)) assert.ok(clue.zh.includes(expectedText), `${artifact}: Chinese effect`);
    assert.ok(!clue.en.includes(artifact) && !clue.zh.includes(artifact), `${artifact}: raw internal ID is not a playable instruction`);
    for (const actor of ['curator', 'other']) assert.ok(!JSON.stringify(publicView(room, actor, 2001).me.knowledge).includes(checks[0]));
  }
});
