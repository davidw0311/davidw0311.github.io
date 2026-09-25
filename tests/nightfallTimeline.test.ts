import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { getNightTimeline } from "../lib/nightfallTimeline.ts";

const require = createRequire(import.meta.url);
const classic = require("../api/src/werewolf/engine.js");
const oneNight = require("../api/src/one-night/engine.js");
const classicRoles = require("../api/src/werewolf/roles.json").roles as { id: string }[];
const oneNightRoles = oneNight.catalogue as { id: string; maxCount?: number }[];
let time = 1800000000000;
const calls = (variant: "werewolf" | "one-night", deck: string[]) => getNightTimeline({ variant, deck }).filter(step => !step.id.startsWith("night:"));

function classicRoom(deck: string[]) {
  const room = classic.createRoom({ code: "TEST", hostId: "a0", hostName: "Host", now: ++time });
  for (let i = 1; i < deck.length; i++) classic.applyCommand(room, `a${i}`, { type: "requestJoin", name: `Player ${i}` }, ++time);
  classic.applyCommand(room, "a0", { type: "startGame", roleDeck: deck, expectedPhaseId: room.phase.id }, ++time);
  for (let i = 0; i < deck.length; i++) classic.applyCommand(room, `a${i}`, { type: "ready", expectedPhaseId: room.phase.id }, ++time);
  classic.applyCommand(room, "a0", { type: "startNight", expectedPhaseId: room.phase.id }, ++time);
  return room;
}
function validOneNightDeck(selected: string[]) {
  const deck = [...selected];
  if (deck.filter(id => id === "mason").length === 1) deck.push("mason");
  for (const id of ["werewolf", "werewolf", "villager", "villager", "villager", "hunter", "tanner", "bodyguard"]) {
    if (deck.length >= 6) break;
    if (deck.filter(role => role === id).length < (oneNightRoles.find(role => role.id === id)?.maxCount || 1)) deck.push(id);
  }
  return deck;
}
function oneNightRoom(deck: string[]) {
  const room = oneNight.createRoom({ code: "TEST", hostId: "a0", hostName: "Host", now: ++time });
  for (let i = 1; i < deck.length - 3; i++) oneNight.applyCommand(room, `a${i}`, { type: "requestJoin", name: `Player ${i}` }, ++time);
  oneNight.applyCommand(room, "a0", { type: "configure", roleDeck: deck, expectedPhaseId: room.phase.id }, ++time);
  oneNight.applyCommand(room, "a0", { type: "start", expectedPhaseId: room.phase.id }, ++time);
  return room;
}

test("classic timeline matches actual first-night and later schedules for every role", () => {
  for (const { id } of classicRoles) {
    const deck = ["werewolf", id, "villager", "villager", "villager", "villager"];
    const room = classicRoom(deck);
    const timeline = calls("werewolf", deck);
    const actual = () => room.nightSchedule.map((turn: { step: string; role?: string }) => turn.role ? `opening:${turn.role}` : turn.step);
    assert.deepEqual(timeline.map(step => step.id), actual(), id);
    room.phase = { id: `day-${++time}`, kind: "day", step: "discussion", paused: false };
    room.day = 1; room.voteDoneDay = 1;
    classic.applyCommand(room, "a0", { type: "startNight", expectedPhaseId: room.phase.id }, ++time);
    assert.deepEqual(timeline.filter(step => !step.firstNightOnly).map(step => step.id), actual(), `${id} later nights`);
  }
});

test("first-night setup order and reserved transformations do not disclose copied identities", () => {
  const deck = ["werewolf", "mechanicalWolf", "thief", "wolfHound", "wildChild", "cupid", "villager", "villager", "villager"];
  const room = classicRoom(deck);
  const timeline = calls("werewolf", deck);
  assert.deepEqual(timeline.filter(step => step.firstNightOnly).map(step => step.roleId), ["cupid", "wildChild", "wolfHound", "thief", "mechanicalWolf"]);
  assert.deepEqual(timeline.map(step => step.id), room.nightSchedule.map((turn: { step: string; role?: string }) => turn.role ? `opening:${turn.role}` : turn.step));
  for (const roleId of ["seer", "guard", "witch", "raven", "gravekeeper", "demonHunter"]) {
    assert.match(timeline.find(step => step.id === roleId)!.description.en, /does not confirm/);
  }
  const before = getNightTimeline({ variant: "werewolf", deck: room.roleDeck });
  room.seats.forEach((seat: { alive: boolean; roleId: string; state: Record<string, unknown> }) => { seat.alive = false; seat.roleId = "villager"; seat.state.copiedRole = "hunter"; });
  assert.deepEqual(getNightTimeline({ variant: "werewolf", deck: room.roleDeck }), before);
});

test("One Night public schedule matches the engine for every role and its copied follow-ups", () => {
  for (const { id } of oneNightRoles) {
    for (const selected of [[id], [...new Set([id, "doppelganger", "mirrorMan"])]]) {
      const deck = validOneNightDeck(selected);
      const room = oneNightRoom(deck);
      assert.deepEqual(calls("one-night", deck).map(step => step.id), room.schedule.map((turn: { step: string }) => turn.step), selected.join(", "));
    }
  }
});

test("mixed expansions retain shared calls, mark review, lovers and distinct villain turns", () => {
  const deck = ["master", "count", "cupid", "syntheticAlien", "groob", "zerb", "dreamWolf", "alphaWolf", "temptress", "drPeeker", "rapscallion", "henchman", "doppelganger", "seer", "insomniac", "curator", "villager"];
  const room = oneNightRoom(deck);
  const timeline = calls("one-night", deck);
  assert.deepEqual(timeline.map(step => step.id), room.schedule.map((turn: { step: string }) => turn.step));
  for (const id of ["vampire", "alien", "werewolf", "markReview", "lovers", "temptress", "drPeeker", "rapscallion", "henchman", "doppel:count", "doppel:insomniac", "doppel:curator"]) assert.ok(timeline.some(step => step.id === id), id);
  for (const id of ["master", "syntheticAlien", "dreamWolf"]) assert.ok(!timeline.some(step => step.id === id), `${id} has no separate call`);
  assert.match(timeline.find(step => step.id === "werewolf")!.description.en, /no night kill/);
  assert.match(timeline.find(step => step.id === "doppel:count")!.description.en, /does not disclose/);
});

test("all timeline names and descriptions are bilingual, stable, unique and exclude passive roles", () => {
  for (const variant of ["werewolf", "one-night"] as const) {
    const deck = (variant === "werewolf" ? classicRoles : oneNightRoles).map(role => role.id);
    const original = [...deck];
    const timeline = getNightTimeline({ variant, deck });
    assert.deepEqual(deck, original);
    assert.equal(new Set(timeline.map(step => step.id)).size, timeline.length);
    assert.equal(timeline[0].id, "night:start");
    assert.equal(timeline.at(-1)!.id, "night:end");
    for (const step of timeline) {
      assert.ok(step.name.en.trim().length > 0, step.id);
      assert.match(step.name.zh, /[\u4e00-\u9fff]/, step.id);
      assert.ok(step.description.en.trim().length > 20, step.id);
      assert.match(step.description.zh, /[\u4e00-\u9fff]/, step.id);
    }
    assert.ok(!timeline.some(step => step.roleId === "villager" || step.roleId === "hunter"));
    if (variant === "one-night") assert.ok(timeline.every(step => !step.firstNightOnly));
  }
});

test("unknown and unconfigured roles add no calls; duplicate cards do not duplicate calls", () => {
  for (const variant of ["werewolf", "one-night"] as const) {
    assert.deepEqual(getNightTimeline({ variant, deck: [] }).map(step => step.id), ["night:start", "night:end"]);
    assert.deepEqual(calls(variant, ["not-a-role"]), []);
    assert.deepEqual(calls(variant, ["werewolf", "werewolf", "seer"]), calls(variant, ["werewolf", "seer"]));
  }
});
