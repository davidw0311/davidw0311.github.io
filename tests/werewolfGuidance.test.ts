import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { getWerewolfGuidance } from "../lib/werewolfGuidance.ts";
import type { Action, GameView, Localized } from "../lib/werewolfClient.ts";

const require = createRequire(import.meta.url);
const catalogue = require("../api/src/werewolf/roles.json") as { roles: { id: string }[] };
const engine = require("../api/src/werewolf/engine.js");
const text = (lines: Localized[], lang: "en" | "zh" = "en") => lines.map(value => value[lang]).join(" ");
function fixture(role = "witch"): GameView {
  return {
    code: "TEST", revision: 1, hostSeatId: "other", isHost: false, status: "playing",
    settings: { nightSeconds: 45, daySeconds: 180, voteSeconds: 45, autoAdvance: false, sheriff: true, winCondition: "edge", witchSelfSave: "firstNight", guardAntidote: "kill" },
    roleDeck: [role], seats: [
      { id: "me", name: "My name", connected: true, occupied: true, alive: true, isHost: false, isSheriff: false, canVote: true },
      { id: "other", name: "Secret target name", connected: true, occupied: true, alive: true, isHost: true, isSheriff: false, canVote: true },
    ], requests: [], me: { seatId: "me", roleId: role, team: "village", alive: true, roleState: {}, allies: [], privateLog: [], action: null },
    phase: { id: "phase", kind: "night", step: role, number: 1, deadline: null, paused: false, nightStage: "acting" },
    day: 0, events: [], winner: null, speakerSeatId: null,
  };
}
function action(view: GameView, step: string, extra: Partial<Action> = {}) {
  view.me!.action = { kind: "nightAction", step, targets: ["me", "other"], canSkip: true, input: "single", alreadySubmitted: false, ...extra };
  view.phase.step = step;
}

test("all 32 role cards have concise English and Chinese rules and practical tips", () => {
  assert.equal(catalogue.roles.length, 32);
  for (const { id } of catalogue.roles) {
    const guide = getWerewolfGuidance(fixture(id));
    assert.ok(guide.rules.length >= 1 && guide.rules.length <= 4, `${id} rule count`);
    assert.ok(guide.tips.length >= 1 && guide.tips.length <= 2, `${id} tip count`);
    assert.ok(guide.turn.length <= 3, `${id} turn count`);
    for (const line of [...guide.rules, ...guide.tips, ...guide.turn]) {
      assert.ok(line.en.trim().length > 15, `${id} English content`);
      assert.match(line.zh, /[\u4e00-\u9fff]/, `${id} Chinese content`);
    }
  }
});

test("Witch card follows first-night-only, always and never self-save room rules", () => {
  const view = fixture();
  assert.match(text(getWerewolfGuidance(view).rules), /only on night one/);
  assert.match(text(getWerewolfGuidance(view).rules, "zh"), /第二夜起不能自救/);
  view.settings.witchSelfSave = true;
  assert.match(text(getWerewolfGuidance(view).rules), /any night/);
  view.settings.witchSelfSave = false;
  assert.match(text(getWerewolfGuidance(view).rules), /never.*including night one/);
  for (const setting of [true, false, "firstNight"] as const) {
    view.settings.witchSelfSave = setting;
    assert.match(text(getWerewolfGuidance(view).rules), /at most one potion per night/);
    assert.match(text(getWerewolfGuidance(view).rules, "zh"), /不能同夜救人又毒人/);
  }
});

test("Witch turn follows the server's self-save availability and retains the one-potion limit", () => {
  const view = fixture();
  action(view, "witch", { options: ["poison", "save", "skip"], victimId: "me" });
  assert.match(text(getWerewolfGuidance(view).turn), /self-save is available tonight/);
  assert.match(text(getWerewolfGuidance(view).turn), /at most one potion tonight/);
  view.phase.number = 2;
  view.me!.action!.options = ["poison", "skip"];
  assert.match(text(getWerewolfGuidance(view).turn), /does not allow saving yourself tonight/);
  view.settings.witchSelfSave = true;
  view.me!.action!.options = ["poison", "save", "skip"];
  assert.match(text(getWerewolfGuidance(view).turn), /self-save is available tonight/);
  view.settings.witchSelfSave = false;
  view.phase.number = 1;
  view.me!.action!.options = ["poison", "skip"];
  assert.match(text(getWerewolfGuidance(view).turn), /does not allow saving yourself tonight/);
});

test("Witch spent potion guidance does not mistake a hidden pack target for a peaceful night", () => {
  const view = fixture();
  action(view, "witch", { options: ["poison", "skip"], victimId: null });
  view.me!.roleState.antidoteUsed = true;
  let turn = text(getWerewolfGuidance(view).turn);
  assert.match(turn, /antidote spent; poison remaining/);
  assert.match(turn, /pack target is hidden/);
  assert.doesNotMatch(turn, /nobody was attacked|no attack|peaceful/i);
  view.me!.roleState = { poisonUsed: true };
  view.me!.action!.options = ["save", "skip"];
  view.me!.action!.victimId = "other";
  turn = text(getWerewolfGuidance(view).turn);
  assert.match(turn, /antidote remaining; poison spent/);
  assert.match(turn, /Save is available/);
  view.me!.roleState.antidoteUsed = true;
  view.me!.action = null;
  assert.match(text(getWerewolfGuidance(view).turn), /Both potions are spent/);
});

test("submitted Witch decisions give a wait message instead of suggesting a second potion", () => {
  const view = fixture();
  action(view, "witch", { alreadySubmitted: true, options: ["poison", "save", "skip"], victimId: "me" });
  const turn = text(getWerewolfGuidance(view).turn);
  assert.match(turn, /submitted and cannot be changed/);
  assert.doesNotMatch(turn, /Save is available|self-save is available|Choose at most/);
});

test("Guard guidance explains consecutive selections, poison and both antidote interaction settings", () => {
  for (const role of ["guard", "witch"]) {
    const view = fixture(role);
    assert.match(text(getWerewolfGuidance(view).rules), /cancel their protection/);
    view.settings.guardAntidote = "save";
    assert.match(text(getWerewolfGuidance(view).rules), /together still block/);
  }
  const view = fixture("guard");
  action(view, "guard");
  view.me!.roleState.lastGuard = "other";
  const guide = getWerewolfGuidance(view);
  assert.match(text(guide.rules), /consecutive nights; skipping resets/);
  assert.match(text(guide.turn), /cannot repeat last night/);
  assert.match(text(guide.turn), /not poison/);
  assert.match(text(guide.turn), /cancel their protection/);
});

test("Mechanical Wolf copied abilities inherit the right rules without changing its team", () => {
  for (const copy of ["seer", "guard", "witch", "raven", "gravekeeper", "demonHunter", "hunter"]) {
    const view = fixture("mechanicalWolf");
    view.me!.team = "wolf";
    view.me!.roleState.copiedRole = copy;
    const guide = getWerewolfGuidance(view);
    assert.match(text(guide.rules), /remain a wolf.*pack attack/);
    assert.ok(guide.rules.length <= 4, `${copy} card remains concise`);
    assert.ok(guide.rules.some(rule => getWerewolfGuidance(fixture(copy)).rules.some(other => other.en === rule.en)));
  }
  const view = fixture("mechanicalWolf");
  view.me!.roleState = { copiedRole: "witch", poisonUsed: true };
  action(view, "witch", { options: ["save", "skip"], victimId: "me" });
  assert.match(text(getWerewolfGuidance(view).rules), /only on night one/);
  assert.match(text(getWerewolfGuidance(view).turn), /poison spent/);
  action(view, "wolves");
  assert.match(text(getWerewolfGuidance(view).turn), /Every eligible wolf must submit/);
  assert.doesNotMatch(text(getWerewolfGuidance(view).turn), /Potions:/);
});

test("previewing another role never attaches the current player's private state or turn", () => {
  const view = fixture("mechanicalWolf");
  view.me!.roleState = { copiedRole: "witch", antidoteUsed: true };
  action(view, "witch", { options: ["poison", "skip"] });
  const preview = getWerewolfGuidance(view, "witch");
  assert.deepEqual(preview.turn, []);
  assert.doesNotMatch(text(preview.rules), /Your copied ability|spent/);
  assert.deepEqual(getWerewolfGuidance(view, "unknown"), { rules: [], tips: [], turn: [] });
  view.me = null;
  assert.deepEqual(getWerewolfGuidance(view), { rules: [], tips: [], turn: [] });
  assert.ok(getWerewolfGuidance(view, "seer").rules.length);
});

test("the actual engine's suppressed Seer view never receives an instruction to inspect", () => {
  const room = engine.createRoom({ code: "TEST", hostId: "host", hostName: "Host", now: 100 });
  Object.assign(room.seats[0], { roleId: "seer", team: "village" });
  room.status = "playing";
  room.night = 2;
  room.phase = { id: "suppressed", kind: "night", step: "seer", number: 2, nightStage: "acting", paused: false, deadline: null };
  room.nightFlow = { eligibleSeatIds: [] };
  for (const cause of ["elder", "bloodMoon"]) {
    room.villagePowersLost = cause === "elder";
    room.silencedNight = cause === "bloodMoon" ? 2 : null;
    const view = engine.publicView(room, "host", 100) as GameView;
    assert.equal(view.me!.action, null);
    const turn = text(getWerewolfGuidance(view).turn);
    assert.match(turn, /no action available/);
    assert.doesNotMatch(turn, /Choose|inspect|Elder|Blood Moon/);
  }
});

test("dead players wait except for authorized shots and badge decisions; pauses override both", () => {
  const view = fixture("hunter");
  view.me!.alive = false;
  view.phase.kind = "reaction";
  assert.match(text(getWerewolfGuidance(view).turn), /eliminated/);
  action(view, "shoot", { kind: "shoot" });
  assert.match(text(getWerewolfGuidance(view).turn), /shot is available now/);
  view.phase.paused = true;
  assert.match(text(getWerewolfGuidance(view).turn), /game is paused/);
  assert.doesNotMatch(text(getWerewolfGuidance(view).turn), /shot is available/);
  view.phase.paused = false;
  view.me!.action = null;
  view.me!.canPassBadge = true;
  assert.match(text(getWerewolfGuidance(view).turn), /Sheriff badge, or destroy/);
  view.status = "finished";
  assert.match(text(getWerewolfGuidance(view).turn), /game is over/);
});

test("ready, narration and unavailable actions do not prematurely offer role decisions", () => {
  const view = fixture();
  action(view, "witch", { options: ["save", "skip"], victimId: "me" });
  view.phase.kind = "ready";
  assert.match(text(getWerewolfGuidance(view).turn), /tap Ready/);
  view.me!.ready = true;
  assert.match(text(getWerewolfGuidance(view).turn), /You are ready/);
  view.phase.kind = "night";
  for (const stage of ["opening", "closing"] as const) {
    view.phase.nightStage = stage;
    assert.match(text(getWerewolfGuidance(view).turn), /Wait/);
    assert.doesNotMatch(text(getWerewolfGuidance(view).turn), /self-save is available/);
  }
  view.phase.kind = "announcement";
  assert.match(text(getWerewolfGuidance(view).turn), /Listen to the announcement/);
});

test("night-two lethal checks and Demon Hunter unlock are explained at the correct time", () => {
  const hunter = fixture("demonHunter");
  assert.match(text(getWerewolfGuidance(hunter).turn), /begins on night two/);
  hunter.phase.number = 2;
  action(hunter, "demonHunter");
  assert.match(text(getWerewolfGuidance(hunter).turn), /non-wolf target makes you die/);
  assert.match(text(getWerewolfGuidance(hunter).turn), /Dream protection can block a wolf/);
  for (const role of ["pureWhite", "wolfWitch"]) {
    const view = fixture(role);
    action(view, role);
    assert.match(text(getWerewolfGuidance(view).turn), /Night one/);
    view.phase.number = 2;
    assert.match(text(getWerewolfGuidance(view).turn), /lethal/);
  }
});

test("votes, silencing and spent daytime powers follow public eligibility without guessing", () => {
  const view = fixture("knight");
  view.phase.kind = "day";
  view.phase.step = "discussion";
  view.seats[0].silenced = true;
  view.me!.canDuel = true;
  assert.match(text(getWerewolfGuidance(view).turn), /silenced.*may still vote/);
  assert.match(text(getWerewolfGuidance(view).turn), /one duel is available/);
  view.me!.canDuel = false;
  assert.doesNotMatch(text(getWerewolfGuidance(view).turn), /duel is available/);
  view.phase.kind = "voting";
  assert.match(text(getWerewolfGuidance(view).turn), /not eligible/);
  action(view, "sheriff", { kind: "vote" });
  assert.match(text(getWerewolfGuidance(view).turn), /tied in the runoff cannot vote/);
  view.me!.action!.alreadySubmitted = true;
  assert.match(text(getWerewolfGuidance(view).turn), /ballot is recorded/);
});

test("guidance neither mutates its view nor echoes other players, private logs or card assignments", () => {
  const view = fixture("seer");
  action(view, "seer");
  view.me!.privateLog = [{ text: { en: "Confidential inspection", zh: "私密查验" } }];
  view.seats[1].roleId = "werewolf";
  const before = JSON.stringify(view);
  const result = JSON.stringify(getWerewolfGuidance(view));
  assert.equal(JSON.stringify(view), before);
  assert.doesNotMatch(result, /Secret target name|Confidential inspection|私密查验|"other"/);
});
