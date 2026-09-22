'use strict';
// Persist this JSON state atomically. Serialize clients exclusively through publicView.
const { randomUUID, randomInt } = require('node:crypto');
const catalogue = require('./roles.json');
const roleName = (id, locale) => catalogue.roles.find(role => role.id === id)?.name[locale] || id;
const factionNames = { village: { en: 'Village', zh: '好人阵营' }, wolf: { en: 'Werewolves', zh: '狼人阵营' }, independent: { en: 'Independent', zh: '第三方阵营' }, lovers: { en: 'Lovers', zh: '情侣阵营' }, piper: { en: 'Piper', zh: '吹笛者' }, angel: { en: 'Angel', zh: '天使' }, jester: { en: 'Jester', zh: '小丑' }, draw: { en: 'Draw', zh: '平局' } };
const factionName = (id, locale) => factionNames[id]?.[locale] || id;
const WOLF_ROLES = new Set(['werewolf', 'wolfKing', 'whiteWolfKing', 'wolfBeauty', 'hiddenWolf', 'gargoyle', 'mechanicalWolf', 'bloodMoonApostle', 'wolfWitch']);
const INDEPENDENT_ROLES = new Set(['piper', 'angel', 'jester']);
const ROLES = new Set(['villager', 'seer', 'witch', 'hunter', 'guard', 'idiot', 'cupid', 'knight', 'dreamweaver', 'magician', 'gravekeeper', 'raven', 'demonHunter', 'pureWhite', 'wildChild', 'wolfHound', 'thief', 'elder', 'scapegoat', ...WOLF_ROLES, ...INDEPENDENT_ROLES]);
const OPENING_ROLES = ['cupid', 'wildChild', 'wolfHound', 'thief', 'mechanicalWolf'];
const NIGHT_STEPS = ['opening', 'wolves', 'magician', 'guard', 'dreamweaver', 'seer', 'pureWhite', 'wolfWitch', 'gargoyle', 'witch', 'wolfBeauty', 'raven', 'gravekeeper', 'demonHunter', 'piper'];
const ROLE_STEP = { cupid: 'opening', wildChild: 'opening', wolfHound: 'opening', thief: 'opening', mechanicalWolf: 'opening', seer: 'seer', guard: 'guard', witch: 'witch', dreamweaver: 'dreamweaver', magician: 'magician', gravekeeper: 'gravekeeper', raven: 'raven', demonHunter: 'demonHunter', pureWhite: 'pureWhite', wolfWitch: 'wolfWitch', gargoyle: 'gargoyle', wolfBeauty: 'wolfBeauty', piper: 'piper' };
const COPY_ROLES = new Set(['seer', 'guard', 'witch', 'raven', 'gravekeeper', 'demonHunter', 'hunter']);
const PRESETS = {
    6: ['werewolf', 'werewolf', 'seer', 'witch', 'villager', 'villager'],
    9: ['werewolf', 'werewolf', 'werewolf', 'seer', 'witch', 'hunter', 'villager', 'villager', 'villager'],
    12: ['werewolf', 'werewolf', 'werewolf', 'wolfKing', 'seer', 'witch', 'hunter', 'guard', 'villager', 'villager', 'villager', 'villager'],
    16: ['werewolf', 'werewolf', 'werewolf', 'wolfKing', 'wolfBeauty', 'seer', 'witch', 'hunter', 'guard', 'knight', 'raven', 'villager', 'villager', 'villager', 'villager', 'villager'],
};
const DEFAULT_SETTINGS = { nightSeconds: 45, daySeconds: 180, voteSeconds: 45, autoAdvance: false, sheriff: true, winCondition: 'edge', witchSelfSave: false, guardAntidote: 'save' };
const clone = x => JSON.parse(JSON.stringify(x));
const nowMs = now => Number.isFinite(now) ? now : Date.now();
function fail(code, message) { const error = new Error(message); error.code = code; error.clientSafe = true; throw error; }
function cleanName(name) { if (typeof name !== 'string')
    fail('INVALID_NAME', 'Enter a player name.'); const n = name.trim().replace(/\s+/g, ' '); if (!n || n.length > 30)
    fail('INVALID_NAME', 'Names must contain 1–30 characters.'); return n; }
function event(room, en, zh, now) { room.events.push({ id: randomUUID(), text: { en, zh }, at: now }); room.events = room.events.slice(-100); }
function secret(seat, en, zh, now) { seat.privateLog.push({ id: randomUUID(), text: { en, zh }, at: now }); seat.privateLog = seat.privateLog.slice(-60); }
function makeSeat(name, actorId) { return { id: randomUUID(), name, actorId: actorId || null, alive: true, canVote: true, roleId: null, team: null, state: {}, privateLog: [] }; }
function seatOf(room, actorId) { const id = room.members[actorId]?.seatId; return room.seats.find(s => s.id === id && s.actorId === actorId) || null; }
function getSeat(room, id) { const s = room.seats.find(s => s.id === id); if (!s)
    fail('INVALID_TARGET', 'That seat does not exist.'); return s; }
function aliveSeat(room, id) { const s = getSeat(room, id); if (!s.alive)
    fail('INVALID_TARGET', 'Choose a living player.'); return s; }
function isPack(s) { return s.team === 'wolf' && !['hiddenWolf', 'gargoyle'].includes(s.roleId); }
function effectiveRole(s) { return s.roleId === 'mechanicalWolf' ? s.state.copiedRole : s.roleId; }
function powersEnabled(room, s) { return s.team !== 'village' || (!room.villagePowersLost && room.silencedNight !== room.night); }
function connected(room, s, now) { return Boolean(s.actorId && room.members[s.actorId] && now - room.members[s.actorId].lastSeen <= 35000); }
function setPhase(room, kind, step) {
    room.phase = { id: randomUUID(), kind, step: step || null, number: room.night, deadline: null, paused: false };
    room.speakerSeatId = null;
    if (kind !== 'night') room.nightFlow = null;
}
function defaultDeck(n) { if (PRESETS[n])
    return [...PRESETS[n]]; const wolves = Math.max(1, Math.floor(n / 3)); return [...Array(wolves).fill('werewolf'), 'seer', 'witch', ...Array(Math.max(0, n - wolves - 2)).fill('villager')]; }
function validateDeck(deck, n) {
    if (!Array.isArray(deck) || deck.length !== n || deck.some(id => !ROLES.has(id)))
        fail('INVALID_DECK', 'Choose exactly one valid role for each seat.');
    if (!deck.some(id => WOLF_ROLES.has(id) && !['hiddenWolf', 'gargoyle'].includes(id)))
        fail('INVALID_DECK', 'Include at least one werewolf who can attack.');
    if (!deck.some(id => !WOLF_ROLES.has(id) && !INDEPENDENT_ROLES.has(id)))
        fail('INVALID_DECK', 'Include village players.');
    const singles = deck.filter(id => !['werewolf', 'villager'].includes(id));
    if (new Set(singles).size !== singles.length)
        fail('INVALID_DECK', 'Special roles may appear only once.');
    if (deck.filter(id => WOLF_ROLES.has(id)).length >= n / 2)
        fail('INVALID_DECK', 'Wolves must be fewer than half the room.');
    if (deck.includes('angel') && deck.includes('jester'))
        fail('INVALID_DECK', 'Angel and Jester use separate presets.');
}
function createRoom({ code, hostId, hostName, now }) {
    now = nowMs(now);
    if (!hostId)
        fail('INVALID_HOST', 'A host session is required.');
    const seat = makeSeat(cleanName(hostName), hostId);
    const room = { version: 1, code, revision: 1, createdAt: now, updatedAt: now, hostId, status: 'lobby', members: { [hostId]: { seatId: seat.id, lastSeen: now } }, seats: [seat], requests: [], settings: { ...DEFAULT_SETTINGS }, roleDeck: [], phase: null, night: 0, day: 0, events: [], messages: [], replay: [], actions: {}, votes: {}, pendingShots: [], winner: null, sheriffSeatId: null, lastExiledId: null, exileRounds: 0 };
    setPhase(room, 'lobby', null, now);
    event(room, 'The room is open. Join a seat and get ready.', '房间已创建，请入座准备。', now);
    return room;
}
function requireHost(room, actorId) { if (!room.hostId || actorId !== room.hostId)
    fail('HOST_ONLY', 'Only the room host can do that.'); }
function requirePhase(room, c, kinds) { if (!kinds.includes(room.phase.kind))
    fail('WRONG_PHASE', 'That action is not available in this phase.'); if (c.expectedPhaseId !== room.phase.id)
    fail('STALE_PHASE', 'The phase changed. Refresh the room and try again.'); if (room.phase.paused)
    fail('PAUSED', 'The game is paused.'); }
function replaceOccupant(room, seat, actorId, name, now) {
    if (seat.actorId)
        delete room.members[seat.actorId];
    seat.actorId = actorId;
    seat.name = name;
    room.members[actorId] = { seatId: seat.id, lastSeen: now };
}
function nightSchedule(room) {
    const steps = new Set(['wolves']);
    for (const role of room.roleDeck) {
        if (ROLE_STEP[role]) steps.add(ROLE_STEP[role]);
        if (role === 'thief') { steps.add('seer'); steps.add('guard'); }
        if (role === 'mechanicalWolf')
            for (const step of ['seer', 'guard', 'witch', 'raven', 'gravekeeper', 'demonHunter']) steps.add(step);
    }
    const turns = [];
    if (room.night === 1)
        for (const role of OPENING_ROLES)
            if (room.roleDeck.includes(role)) turns.push({ step: 'opening', role });
    for (const step of NIGHT_STEPS)
        if (step !== 'opening' && steps.has(step)) turns.push({ step });
    return turns;
}
function eventNight(room) { return room.phase.kind === 'night' && Boolean(room.phase.nightStage); }
function setNightStage(room, stage, now) {
    const turn = room.nightSchedule[room.nightIndex];
    const flow = room.nightFlow || { version: 1 };
    setPhase(room, 'night', turn.step, now);
    room.phase.deadline = null;
    room.phase.nightStage = stage;
    if (turn.role) room.phase.nightRole = turn.role;
    room.phase.nightCues = stage === 'opening'
        ? [...(room.nightIndex === 0 ? ['night'] : []), turn.role || turn.step]
        : stage === 'closing' ? ['role-sleep'] : [];
    room.nightFlow = flow;
    flow.deadline = stage === 'opening' ? now + (room.nightIndex === 0 ? 45000 : 30000) : stage === 'closing' ? now + 12000 : null;
    delete flow.remainingMs;
    if (stage === 'acting') {
        flow.eligibleSeatIds = room.seats.filter(seat => actionDescriptor(room, seat)).map(seat => seat.id);
        flow.deadline = flow.eligibleSeatIds.length ? null : now + randomInt(7000, 15001);
    }
}
function beginNightTurn(room, now) {
    room.nightFlow = { version: 1, deadline: null, eligibleSeatIds: [] };
    setNightStage(room, 'opening', now);
}
function startNight(room, now) {
    room.voteDoneDay = null;
    room.night++;
    for (const s of room.seats) s.state.charmId = null;
    room.nightStartIds = room.seats.filter(s => s.alive).map(s => s.id);
    room.actions = {}; room.votes = {}; room.pendingShots = []; room.ravenTargetId = null;
    room.nightSchedule = nightSchedule(room);
    room.nightIndex = 0;
    beginNightTurn(room, now);
    event(room, `Night ${room.night}. Close your eyes.`, `第 ${room.night} 夜，天黑请闭眼。`, now);
}
function advanceNight(room, now) {
    if (!eventNight(room)) {
        // Rooms already inside a legacy timed night keep that night intact. Their
        // next startNight adopts the event-driven schedule without losing actions.
        if (room.phase.step === 'opening') resolveOpening(room, now);
        if (++room.nightIndex < room.nightSchedule.length) setPhase(room, 'night', room.nightSchedule[room.nightIndex], now);
        else resolveNight(room, now);
        return;
    }
    const current = room.nightSchedule[room.nightIndex];
    const next = room.nightSchedule[room.nightIndex + 1];
    if (current.step === 'opening' && next?.step !== 'opening') resolveOpening(room, now);
    if (++room.nightIndex < room.nightSchedule.length) beginNightTurn(room, now);
    else resolveNight(room, now);
}
function completeNightActions(room, now) {
    const eligible = room.nightFlow.eligibleSeatIds;
    if (room.phase.nightStage === 'acting' && eligible.length && eligible.every(id => actionAt(room, room.phase.step, id)))
        setNightStage(room, 'closing', now);
}
function finishNightNarration(room, now) {
    if (room.phase.nightStage === 'opening') { setNightStage(room, 'acting', now); completeNightActions(room, now); }
    else if (room.phase.nightStage === 'closing') advanceNight(room, now);
}
function pauseRoom(room, now, reason) {
    // An explicit pause also takes ownership of an old automatic disconnect pause.
    if (room.phase.paused) { if (!reason) delete room.phase.pauseReason; return; }
    if (eventNight(room)) {
        room.nightFlow.remainingMs = room.nightFlow.deadline == null ? null : Math.max(0, room.nightFlow.deadline - now);
        room.nightFlow.deadline = null;
        room.phase.id = randomUUID();
    }
    else room.phase.remainingMs = room.phase.deadline == null ? null : Math.max(0, room.phase.deadline - now);
    room.phase.paused = true;
    room.phase.deadline = null;
    if (reason) room.phase.pauseReason = reason;
}
function resumeRoom(room, now) {
    if (!room.phase.paused) return;
    room.phase.paused = false;
    if (eventNight(room)) {
        room.phase.id = randomUUID();
        room.phase.deadline = null;
        room.nightFlow.deadline = room.nightFlow.remainingMs == null ? null : now + Math.max(1, room.nightFlow.remainingMs);
        delete room.nightFlow.remainingMs;
    }
    else room.phase.deadline = room.phase.remainingMs == null ? null : now + Math.max(1000, room.phase.remainingMs);
    delete room.phase.remainingMs;
    delete room.phase.pauseReason;
}
// Upgrade existing rooms without changing their phase, choices, or manual pause.
function clearActionTimers(room) {
    let changed = false;
    const clear = (object, key) => {
        if (object[key] != null) { object[key] = null; changed = true; }
    };
    if (room.settings.autoAdvance) { room.settings.autoAdvance = false; changed = true; }
    clear(room.phase, 'deadline');
    clear(room.phase, 'remainingMs');
    if (eventNight(room) && room.phase.nightStage === 'acting' && room.nightFlow.eligibleSeatIds.length) {
        clear(room.nightFlow, 'deadline');
        clear(room.nightFlow, 'remainingMs');
    }
    return changed;
}
function transformedTeam(role) { return WOLF_ROLES.has(role) ? 'wolf' : INDEPENDENT_ROLES.has(role) ? 'independent' : 'village'; }
function actionAt(room, step, seatId) { return room.actions[step]?.[seatId] || null; }
function recordAction(room, step, s, action) { (room.actions[step] ||= {})[s.id] = action; }
function targetArray(c) { const xs = c.targetIds || (c.targetId ? [c.targetId] : []); if (!Array.isArray(xs) || xs.some(x => typeof x !== 'string') || new Set(xs).size !== xs.length)
    fail('INVALID_TARGET', 'Choose different valid players.'); return xs; }
function alignment(s, exact = false) { return !exact && s.roleId === 'hiddenWolf' ? 'village' : s.team; }
function actionDescriptor(room, s) {
    if (!s || room.phase.paused || room.status !== 'playing')
        return null;
    const all = room.seats.filter(t => t.alive).map(t => t.id), other = all.filter(id => id !== s.id);
    if (room.phase.kind === 'reaction')
        return room.pendingShots.includes(s.id) ? { kind: 'shoot', step: 'shoot', input: 'single', targets: other, canSkip: true, alreadySubmitted: false } : null;
    if (!s.alive)
        return null;
    if (room.phase.kind === 'voting')
        return s.canVote && (!room.voteEligibleIds || room.voteEligibleIds.includes(s.id)) ? { kind: 'vote', step: room.phase.step, input: 'single', targets: all, canSkip: true, alreadySubmitted: Object.hasOwn(room.votes, s.id) } : null;
    if (room.phase.kind !== 'night' || (eventNight(room) && room.phase.nightStage !== 'acting'))
        return null;
    const step = room.phase.step, role = effectiveRole(s);
    let d = null;
    if (step === 'wolves' && isPack(s))
        d = { input: 'single', targets: all, canSkip: true };
    else if (step === 'opening' && room.night === 1 && ROLE_STEP[s.roleId] === 'opening' && (!room.phase.nightRole || room.phase.nightRole === s.roleId) && powersEnabled(room, s)) {
        if (s.roleId === 'cupid')
            d = { input: 'double', minTargets: 2, maxTargets: 2, targets: all, canSkip: true };
        else if (s.roleId === 'wolfHound')
            d = { input: 'choice', options: ['village', 'wolf'], targets: [], canSkip: false };
        else if (s.roleId === 'thief')
            d = { input: 'choice', options: ['seer', 'guard'], targets: [], canSkip: false };
        else
            d = { input: 'single', targets: other, canSkip: true };
    }
    else if (step !== 'opening' && powersEnabled(room, s) && (ROLE_STEP[role] === step || s.roleId === 'mechanicalWolf' && role === 'seer' && step === 'seer')) {
        if (step === 'guard')
            d = { input: 'single', targets: all.filter(id => id !== s.state.lastGuard), canSkip: true };
        else if (step === 'magician')
            d = { input: 'double', minTargets: 2, maxTargets: 2, targets: all, canSkip: true };
        else if (step === 'piper')
            d = { input: 'double', minTargets: 1, maxTargets: 2, targets: other.filter(id => !getSeat(room, id).state.charmed), canSkip: true };
        else if (step === 'gravekeeper')
            d = { input: 'none', targets: [], canSkip: true };
        else if (step === 'witch') {
            const victim = wolfVictim(room);
            const options = ['skip'];
            const canSelfSave = room.settings.witchSelfSave === true || (room.settings.witchSelfSave === 'firstNight' && room.night === 1);
            if (!s.state.antidoteUsed && victim && (victim !== s.id || canSelfSave))
                options.unshift('save');
            if (!s.state.poisonUsed)
                options.unshift('poison');
            if (eventNight(room) && options.length === 1) return null;
            d = { input: 'single', targets: all, options, canSkip: true, victimId: !s.state.antidoteUsed ? victim : null };
        }
        else if (step === 'wolfWitch')
            d = { input: 'single', targets: other, options: room.night >= 2 && !s.state.poisonUsed ? ['inspect', 'poison'] : ['inspect'], canSkip: true };
        else if (step === 'demonHunter') {
            if (room.night >= 2)
                d = { input: 'single', targets: other, canSkip: true };
        }
        else if (step === 'wolfBeauty')
            d = { input: 'single', targets: other.filter(id => id !== s.state.lastCharm), canSkip: true };
        else
            d = { input: 'single', targets: other, canSkip: true };
    }
    return d ? { kind: 'nightAction', step, ...d, alreadySubmitted: Boolean(actionAt(room, step, s.id)) } : null;
}
function wolfVictim(room) { const tally = {}; for (const [id, a] of Object.entries(room.actions.wolves || {})) {
    const s = getSeat(room, id);
    if (isPack(s) && a.targetId)
        tally[a.targetId] = (tally[a.targetId] || 0) + 1;
} const values = Object.entries(tally).sort((a, b) => b[1] - a[1]); return values.length && (!values[1] || values[0][1] > values[1][1]) ? values[0][0] : null; }
function acceptNightAction(room, s, c) {
    requirePhase(room, c, ['night']);
    const d = actionDescriptor(room, s);
    if (!d)
        fail('NO_ABILITY', 'You do not have an action in this step.');
    if (eventNight(room) && d.alreadySubmitted)
        fail('ACTION_ALREADY_SUBMITTED', 'Your action is submitted. Wait for the other players.');
    const choice = c.choice || c.ability;
    const skip = choice === 'skip' || (d.input !== 'none' && d.input !== 'choice' && !c.targetId && !c.targetIds && choice !== 'save');
    if (skip) {
        if (!d.canSkip)
            fail('INVALID_ACTION', 'Choose an option.');
        recordAction(room, d.step, s, { skip: true });
        return;
    }
    if (d.options && choice && !d.options.includes(choice))
        fail('INVALID_ACTION', 'That ability is unavailable.');
    if (d.input === 'choice') {
        if (!d.options.includes(choice))
            fail('INVALID_ACTION', 'Choose an available option.');
        recordAction(room, d.step, s, { choice });
        return;
    }
    if (d.step === 'witch' && choice === 'save') {
        if (!d.options.includes('save'))
            fail('INVALID_ACTION', 'The antidote cannot be used now.');
        recordAction(room, d.step, s, { ability: 'save', targetId: d.victimId });
        return;
    }
    if (d.step === 'witch' && choice !== 'poison')
        fail('INVALID_ACTION', 'Choose antidote, poison, or skip.');
    if (d.input === 'none') {
        recordAction(room, d.step, s, { ability: 'inspect' });
        return;
    }
    const ids = targetArray(c);
    if (ids.length < (d.minTargets || 1) || ids.length > (d.maxTargets || 1) || ids.some(id => !d.targets.includes(id)))
        fail('INVALID_TARGET', 'Choose eligible targets.');
    if (d.step === 'magician') {
        const pair = [...ids].sort().join(':');
        if ((s.state.usedSwaps || []).includes(pair))
            fail('INVALID_TARGET', 'This pair has already been swapped.');
    }
    recordAction(room, d.step, s, { targetId: ids[0], targetIds: ids, ability: choice || 'inspect' });
}
function resolveOpening(room, now) {
    for (const s of room.seats.filter(s => s.alive)) {
        const a = actionAt(room, 'opening', s.id);
        if (!a || a.skip) {
            if (s.roleId === 'thief') {
                s.roleId = 'guard';
                s.team = 'village';
            }
            continue;
        }
        if (s.roleId === 'cupid' && a.targetIds?.length === 2) {
            const [one, two] = a.targetIds.map(id => getSeat(room, id));
            one.state.loverId = two.id;
            two.state.loverId = one.id;
            room.lovers = a.targetIds;
            secret(one, `Your lover is ${two.name}.`, `你的情侣是 ${two.name}。`, now);
            secret(two, `Your lover is ${one.name}.`, `你的情侣是 ${one.name}。`, now);
        }
        else if (s.roleId === 'wildChild')
            s.state.idolId = a.targetId;
        else if (s.roleId === 'wolfHound')
            s.team = a.choice;
        else if (s.roleId === 'thief') {
            s.roleId = a.choice;
            s.team = 'village';
            secret(s, `Your new role is ${roleName(a.choice, 'en')}.`, `你的新身份为 ${roleName(a.choice, 'zh')}。`, now);
        }
        else if (s.roleId === 'mechanicalWolf') {
            const target = getSeat(room, a.targetId);
            const startingRole = target.originalRoleId || target.roleId;
            s.state.copiedRole = COPY_ROLES.has(startingRole) ? startingRole : 'seer';
            secret(s, `Copied ability: ${roleName(s.state.copiedRole, 'en')}.`, `学到的技能：${roleName(s.state.copiedRole, 'zh')}。`, now);
        }
    }
    if (room.lovers)
        room.mixedLovers = getSeat(room, room.lovers[0]).team !== getSeat(room, room.lovers[1]).team;
}
function kill(room, id, cause, now) {
    const s = getSeat(room, id);
    if (!s.alive)
        return;
    s.alive = false;
    s.state.deathCause = cause;
    s.state.diedAtNight = room.phase.kind === 'night' ? room.night : null;
    if ((effectiveRole(s) === 'hunter' || s.roleId === 'wolfKing') && !['poison', 'failedHunt', 'lover', 'charm', 'dreamLink'].includes(cause) && powersEnabled(room, s) && !s.state.shotUsed)
        room.pendingShots.push(s.id);
    if (s.state.loverId)
        kill(room, s.state.loverId, 'lover', now);
    if (s.roleId === 'wolfBeauty' && s.state.charmId)
        kill(room, s.state.charmId, 'charm', now);
    for (const child of room.seats.filter(t => t.alive && t.roleId === 'wildChild' && t.state.idolId === s.id)) {
        child.team = 'wolf';
        secret(child, 'Your idol died. You are now a werewolf.', '你的榜样死亡，你已加入狼人阵营。', now);
    }
}
function evaluateWin(room, now) {
    if (room.status !== 'playing')
        return true;
    const living = room.seats.filter(s => s.alive);
    let winner = !living.length ? { team: 'draw', reason: { en: 'No players survived.', zh: '无人存活。' } } : null;
    for (const piper of living.filter(s => s.roleId === 'piper'))
        if (!winner && living.filter(s => s.id !== piper.id).every(s => s.state.charmed))
            winner = { team: 'piper', seatIds: [piper.id], reason: { en: 'Every other survivor is charmed.', zh: '其他存活玩家均被魅惑。' } };
    if (!winner && room.mixedLovers && living.length === 2 && room.lovers.every(id => living.some(s => s.id === id)))
        winner = { team: 'lovers', seatIds: [...room.lovers], reason: { en: 'The cross-faction lovers are the last survivors.', zh: '跨阵营情侣成为最后的幸存者。' } };
    const wolves = living.filter(s => s.team === 'wolf'), village = living.filter(s => s.team === 'village');
    if (!winner && !wolves.length)
        winner = { team: 'village', reason: { en: 'All werewolves have been eliminated.', zh: '所有狼人均已出局。' } };
    else if (!winner) {
        let wolfWin = false;
        if (room.settings.winCondition === 'all')
            wolfWin = living.every(s => s.team === 'wolf');
        else if (room.settings.winCondition === 'parity')
            wolfWin = wolves.length >= living.length - wolves.length;
        else {
            const originalPlain = room.seats.some(s => s.originalRoleId === 'villager'), originalSpecial = room.seats.some(s => s.originalTeam === 'village' && s.originalRoleId !== 'villager');
            wolfWin = !village.length || (originalPlain && !village.some(s => s.originalRoleId === 'villager')) || (originalSpecial && !village.some(s => s.originalRoleId !== 'villager'));
        }
        if (wolfWin)
            winner = { team: 'wolf', reason: { en: 'The werewolves met the room’s victory condition.', zh: '狼人达成房间设定的胜利条件。' } };
    }
    if (!living.length && !winner)
        winner = { team: 'draw', reason: { en: 'No players survived.', zh: '无人存活。' } };
    if (winner) {
        finish(room, winner, now);
        return true;
    }
    return false;
}
function finish(room, winner, now) { room.winner = winner; room.status = 'finished'; room.pendingShots = []; setPhase(room, 'finished', null, now); event(room, `Game over: ${factionName(winner.team, 'en')}. ${winner.reason.en}`, `游戏结束：${factionName(winner.team, 'zh')}。${winner.reason.zh}`, now); }
function reactionsOrDay(room, now) { room.pendingShots = [...new Set(room.pendingShots)].filter(id => !getSeat(room, id).state.shotUsed); if (room.pendingShots.length) {
    setPhase(room, 'reaction', 'shoot', now);
    return;
} if (evaluateWin(room, now))
    return; setPhase(room, 'day', room.voteDoneDay === room.day ? 'afterVote' : 'discussion', now); }
function resolveNight(room, now) {
    const deathsBefore = new Set(room.seats.filter(s => !s.alive).map(s => s.id));
    const swaps = [];
    for (const [id, a] of Object.entries(room.actions.magician || {}))
        if (!a.skip && a.targetIds?.length === 2) {
            swaps.push(a.targetIds);
            const s = getSeat(room, id);
            (s.state.usedSwaps ||= []).push([...a.targetIds].sort().join(':'));
        }
    const mapped = id => swaps.reduce((value, [a, b]) => value === a ? b : value === b ? a : value, id);
    const entries = step => Object.entries(room.actions[step] || {}).filter(([, a]) => !a.skip).map(([id, a]) => [getSeat(room, id), { ...a, targetId: a.targetId ? mapped(a.targetId) : null, targetIds: a.targetIds?.map(mapped) }]);
    const guarded = new Set(), dreamed = new Set(), dreamLinks = [], kills = [];
    for (const [s, a] of entries('guard')) {
        guarded.add(a.targetId);
        s.state.lastGuard = actionAt(room, 'guard', s.id).targetId;
    }
    for (const [s, a] of entries('dreamweaver')) {
        if (s.state.lastDream === a.targetId)
            kills.push([a.targetId, 'dream']);
        else
            dreamed.add(a.targetId);
        dreamLinks.push([s.id, a.targetId]);
        s.state.lastDream = a.targetId;
    }
    let victim = wolfVictim(room);
    victim = victim ? mapped(victim) : null;
    let saved = false;
    for (const [s, a] of entries('witch')) {
        if (a.ability === 'save') {
            s.state.antidoteUsed = true;
            if (a.targetId === victim)
                saved = true;
        }
        else if (a.ability === 'poison') {
            s.state.poisonUsed = true;
            kills.push([a.targetId, 'poison']);
        }
    }
    for (const [s, a] of entries('wolfBeauty')) {
        s.state.charmId = a.targetId;
        s.state.lastCharm = actionAt(room, 'wolfBeauty', s.id).targetId;
    }
    for (const [, a] of entries('raven'))
        room.ravenTargetId = a.targetId;
    for (const [s, a] of entries('seer')) {
        const target = getSeat(room, a.targetId), team = alignment(target);
        secret(s, `${target.name}: ${team}.`, `${target.name}：${team === 'wolf' ? '狼人阵营' : team === 'village' ? '好人阵营' : '第三方阵营'}。`, now);
    }
    for (const step of ['pureWhite', 'gargoyle', 'wolfWitch'])
        for (const [s, a] of entries(step)) {
            const t = getSeat(room, a.targetId);
            if (step === 'wolfWitch' && a.ability === 'poison') {
                s.state.poisonUsed = true;
                kills.push([t.id, 'poison']);
            }
            else {
                secret(s, `${t.name}: ${roleName(t.roleId, 'en')}.`, `${t.name} 的身份：${roleName(t.roleId, 'zh')}。`, now);
                if (step === 'pureWhite' && room.night >= 2 && t.team === 'wolf')
                    kills.push([t.id, 'inspection']);
            }
        }
    for (const [s] of entries('gravekeeper')) {
        if (room.lastExiledId) {
            const t = getSeat(room, room.lastExiledId);
            secret(s, `${t.name} belonged to ${factionName(t.team, 'en')}.`, `${t.name} 的阵营：${factionName(t.team, 'zh')}。`, now);
        }
        else
            secret(s, 'No player has been exiled.', '尚无人被放逐。', now);
    }
    for (const [s, a] of entries('demonHunter')) {
        const t = getSeat(room, a.targetId);
        kills.push(t.team === 'wolf' ? [t.id, 'hunt'] : [s.id, 'failedHunt']);
    }
    for (const [, a] of entries('piper'))
        for (const id of a.targetIds || [])
            getSeat(room, id).state.charmed = true;
    for (const s of room.seats.filter(s => s.state.charmed && s.alive)) {
        const names = room.seats.filter(t => t.state.charmed && t.id !== s.id).map(t => t.name).join(', ');
        secret(s, `You are charmed. Other charmed players: ${names || 'none'}.`, `你已被吹笛者魅惑。其他被魅惑者：${names || '无'}。`, now);
    }
    if (victim && !dreamed.has(victim)) {
        const target = getSeat(room, victim), blocked = (saved || guarded.has(victim)) && !(saved && guarded.has(victim) && room.settings.guardAntidote === 'kill');
        if (!blocked) {
            if (target.roleId === 'elder' && !target.state.elderHit)
                target.state.elderHit = true;
            else
                kills.push([victim, 'wolves']);
        }
    }
    kills.sort((a, b) => (a[1] === 'poison' ? -1 : 0) - (b[1] === 'poison' ? -1 : 0));
    for (const [id, cause] of kills) {
        const t = getSeat(room, id);
        if (cause === 'poison' && (dreamed.has(id) || effectiveRole(t) === 'demonHunter'))
            continue;
        kill(room, id, cause, now);
    }
    for (let pass = 0; pass < dreamLinks.length; pass++)
        for (const [dreamer, target] of dreamLinks)
            if (!getSeat(room, dreamer).alive)
                kill(room, target, 'dreamLink', now);
    for (const s of room.seats) {
        if (!actionAt(room, 'guard', s.id)?.targetId)
            delete s.state.lastGuard;
        if (!actionAt(room, 'dreamweaver', s.id)?.targetId)
            delete s.state.lastDream;
        if (!actionAt(room, 'wolfBeauty', s.id)?.targetId)
            delete s.state.lastCharm;
    }
    const dead = room.seats.filter(s => !s.alive && !deathsBefore.has(s.id));
    room.day = room.night;
    (room.replay ||= []).push({ type: 'night', night: room.night, actions: clone(room.actions), eliminatedSeatIds: dead.map(s => s.id) });
    event(room, dead.length ? `Dawn. Eliminated: ${dead.map(s => s.name).join(', ')}.` : 'Dawn. Nobody died.', dead.length ? `天亮了。出局玩家：${dead.map(s => s.name).join('、')}。` : '天亮了，昨夜平安夜。', now);
    reactionsOrDay(room, now);
}
function resolveVoting(room, now) {
    const tally = {};
    for (const [id, target] of Object.entries(room.votes))
        if (target) {
            tally[target] = (tally[target] || 0) + (room.phase.step !== 'sheriff' && room.sheriffSeatId === id ? 1.5 : 1);
        }
    if (room.phase.step !== 'sheriff' && room.ravenTargetId && getSeat(room, room.ravenTargetId).alive)
        tally[room.ravenTargetId] = (tally[room.ravenTargetId] || 0) + 1;
    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    let target = sorted.length && (!sorted[1] || sorted[0][1] > sorted[1][1]) ? getSeat(room, sorted[0][0]) : null;
    room.lastVote = { kind: room.phase.step, votes: clone(room.votes), tally, at: now };
    (room.replay ||= []).push({ type: 'vote', day: room.day, ...clone(room.lastVote) });
    if (room.phase.step === 'sheriff') {
        room.sheriffSeatId = target?.id || null;
        event(room, target ? `${target.name} is the Sheriff.` : 'The Sheriff vote tied. No Sheriff was elected.', target ? `${target.name} 当选警长。` : '警长投票平票，无人当选。', now);
        setPhase(room, 'day', 'discussion', now);
        return;
    }
    room.exileRounds++;
    room.voteDoneDay = room.day;
    if (!target && sorted.length)
        target = room.seats.find(s => s.alive && s.roleId === 'scapegoat') || null;
    if (target) {
        if (target.roleId === 'jester' || target.roleId === 'angel' && room.exileRounds === 1) {
            kill(room, target.id, 'exile', now);
            finish(room, { team: target.roleId, seatIds: [target.id], reason: { en: `${target.name} achieved their exile victory.`, zh: `${target.name} 达成被放逐胜利。` } }, now);
            return;
        }
        if (target.roleId === 'idiot' && !target.state.revealed) {
            target.state.revealed = true;
            target.canVote = false;
            event(room, `${target.name} revealed as Idiot and survives, without voting rights.`, `${target.name} 翻牌为白痴，存活但失去投票权。`, now);
        }
        else {
            kill(room, target.id, 'exile', now);
            room.lastExiledId = target.id;
            if (target.roleId === 'elder')
                room.villagePowersLost = true;
            event(room, `${target.name} was exiled.`, `${target.name} 被放逐。`, now);
        }
    }
    else
        event(room, 'The vote produced no exile.', '本轮投票无人出局。', now);
    for (const s of room.seats.filter(s => s.alive && s.roleId === 'angel'))
        s.team = 'village';
    reactionsOrDay(room, now);
}
function validateSettings(settings) {
    if (!settings || typeof settings !== 'object' || Array.isArray(settings))
        fail('INVALID_SETTINGS', 'Invalid room settings.');
    const next = {};
    for (const [key, value] of Object.entries(settings)) {
        if (['nightSeconds', 'daySeconds', 'voteSeconds'].includes(key)) {
            if (!Number.isInteger(value) || value < 10 || value > 1800)
                fail('INVALID_SETTINGS', 'Timers must be between 10 and 1800 seconds.');
        }
        else if (['autoAdvance', 'sheriff'].includes(key)) {
            if (typeof value !== 'boolean')
                fail('INVALID_SETTINGS', 'Invalid setting.');
        }
        else if (key === 'witchSelfSave') {
            if (value !== false && value !== true && value !== 'firstNight')
                fail('INVALID_SETTINGS', 'Choose never, first night only, or any night for Witch self-save.');
        }
        else if (key === 'winCondition') {
            if (!['edge', 'all', 'parity'].includes(value))
                fail('INVALID_SETTINGS', 'Unknown victory rule.');
        }
        else if (key === 'guardAntidote') {
            if (!['save', 'kill'].includes(value))
                fail('INVALID_SETTINGS', 'Unknown protection interaction.');
        }
        else
            fail('INVALID_SETTINGS', `Unknown setting: ${key}`);
        next[key] = value;
    }
    return next;
}
function executeCommand(room, actorId, c, now) {
    if (!c || typeof c.type !== 'string')
        fail('INVALID_COMMAND', 'Choose an action.');
    if (c.type === 'requestJoin') {
        if (seatOf(room, actorId)) {
            room.members[actorId].lastSeen = now;
            return;
        }
        const name = cleanName(c.name);
        if (room.status === 'lobby') {
            // Only an unoccupied reservation can be claimed by name. A lost connection
            // does not relinquish an existing player's seat or host permissions.
            let seat = room.seats.find(candidate => !candidate.actorId && candidate.name === name);
            if (!seat) {
                if (room.seats.length >= 24)
                    fail('ROOM_FULL', 'Rooms support at most 24 seats.');
                seat = makeSeat(name);
                room.seats.push(seat);
            }
            replaceOccupant(room, seat, actorId, name, now);
            room.requests = room.requests.filter(request => request.actorId !== actorId);
            event(room, `${name} joined seat ${room.seats.indexOf(seat) + 1}.`, `${name} 加入 ${room.seats.indexOf(seat) + 1} 号位。`, now);
            if (!room.hostId) {
                room.hostId = actorId;
                event(room, `${name} is now the host.`, `${name} 成为房主。`, now);
            }
            return;
        }
        const existing = room.requests.find(r => r.actorId === actorId);
        if (existing) {
            existing.name = name;
            return;
        }
        if (room.requests.length >= 48)
            fail('ROOM_BUSY', 'The room has too many pending requests.');
        room.requests.push({ id: randomUUID(), actorId, name, createdAt: now });
        return;
    }
    if (c.type === 'heartbeat') {
        const member = room.members[actorId];
        if (member)
            member.lastSeen = now;
        return;
    }
    const hostTypes = new Set(['approveJoin', 'rejectJoin', 'addSeat', 'removeSeat', 'transferHost', 'updateSettings', 'startGame', 'nextPhase', 'startNight', 'startVoting', 'resolveVoting', 'startSheriff', 'pause', 'resume', 'setSpeaker', 'resetGame', 'nightNarrationDone', 'skipNightTurn', 'hardSkip']);
    if (hostTypes.has(c.type))
        requireHost(room, actorId);
    const s = seatOf(room, actorId);
    if (c.type === 'leave' && !s && room.requests.some(request => request.actorId === actorId)) {
        room.requests = room.requests.filter(request => request.actorId !== actorId);
        return;
    }
    if (!s && !hostTypes.has(c.type))
        fail('NOT_SEATED', 'You do not occupy a seat in this room.');
    if (s)
        room.members[actorId].lastSeen = now;
    switch (c.type) {
        case 'approveJoin': {
            const request = room.requests.find(r => r.id === c.requestId);
            if (!request)
                fail('REQUEST_EXPIRED', 'That join request no longer exists.');
            let seat;
            if (c.replaceSeatId) {
                seat = getSeat(room, c.replaceSeatId);
                if (seat.actorId === room.hostId)
                    fail('HOST_SEAT', 'Transfer hosting before replacing the host seat.');
            }
            else {
                if (room.status !== 'lobby')
                    fail('REPLACEMENT_REQUIRED', 'Choose an existing seat to replace during a game.');
                if (room.seats.length >= 24)
                    fail('ROOM_FULL', 'Rooms support at most 24 seats.');
                seat = makeSeat(request.name);
                room.seats.push(seat);
            }
            replaceOccupant(room, seat, request.actorId, request.name, now);
            room.requests = room.requests.filter(r => r.id !== request.id);
            event(room, `${seat.name} joined seat ${room.seats.indexOf(seat) + 1}.`, `${seat.name} 加入 ${room.seats.indexOf(seat) + 1} 号位。`, now);
            break;
        }
        case 'rejectJoin':
            room.requests = room.requests.filter(r => r.id !== c.requestId);
            break;
        case 'addSeat':
            if (room.status !== 'lobby')
                fail('WRONG_PHASE', 'New seats can only be added before the game.');
            if (room.seats.length >= 24)
                fail('ROOM_FULL', 'Rooms support at most 24 seats.');
            room.seats.push(makeSeat(cleanName(c.name)));
            break;
        case 'removeSeat': {
            const target = getSeat(room, c.seatId);
            if (target.actorId === room.hostId)
                fail('HOST_SEAT', 'Transfer hosting before removing the host.');
            if (target.actorId)
                delete room.members[target.actorId];
            target.actorId = null;
            if (room.status === 'lobby')
                room.seats = room.seats.filter(t => t.id !== target.id);
            event(room, `${target.name}'s seat was ${room.status === 'lobby' ? 'removed' : 'disconnected; their game identity is preserved'}.`, `${target.name} 的座位已${room.status === 'lobby' ? '移除' : '解除连接，游戏身份保留'}。`, now);
            break;
        }
        case 'transferHost': {
            const target = getSeat(room, c.seatId);
            if (!target.actorId)
                fail('INVALID_TARGET', 'The new host must be connected to a seat.');
            room.hostId = target.actorId;
            event(room, `${target.name} is now the host.`, `${target.name} 成为房主。`, now);
            break;
        }
        case 'updateSettings': {
            const changes = validateSettings(c.settings || {});
            if (room.status !== 'lobby') {
                if (c.expectedPhaseId !== room.phase.id)
                    fail('STALE_PHASE', 'The phase changed.');
                if (c.roleDeck || Object.keys(changes).some(key => !['nightSeconds', 'daySeconds', 'voteSeconds', 'autoAdvance'].includes(key)))
                    fail('WRONG_PHASE', 'Role and victory rules are locked once the game starts.');
            }
            room.settings = { ...room.settings, ...changes, autoAdvance: false };
            if (c.roleDeck) {
                validateDeck(c.roleDeck, c.roleDeck.length);
                room.roleDeck = [...c.roleDeck];
            }
            break;
        }
        case 'startGame': {
            requirePhase(room, c, ['lobby']);
            if (room.seats.length < 6 || room.seats.length > 24)
                fail('PLAYER_COUNT', 'Games need 6–24 players.');
            if (room.seats.some(t => !t.actorId))
                fail('EMPTY_SEATS', 'Every seat needs a player before starting.');
            const deck = c.roleDeck || (room.roleDeck.length === room.seats.length ? room.roleDeck : defaultDeck(room.seats.length));
            validateDeck(deck, room.seats.length);
            room.roleDeck = [...deck];
            const shuffled = [...deck];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = randomInt(i + 1);
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            room.seats.forEach((t, i) => { t.roleId = shuffled[i]; t.team = transformedTeam(t.roleId); t.originalRoleId = t.roleId; t.originalTeam = t.team; t.alive = true; t.canVote = true; t.state = {}; t.privateLog = []; });
            room.status = 'playing';
            room.replay = [];
            room.night = 0;
            room.day = 0;
            room.winner = null;
            room.exileRounds = 0;
            room.lastExiledId = null;
            room.sheriffSeatId = null;
            room.villagePowersLost = false;
            room.silencedNight = null;
            room.lovers = null;
            room.mixedLovers = false;
            room.lastVote = null;
            room.messages = [];
            startNight(room, now);
            break;
        }
        case 'hardSkip':
        case 'skipNightTurn':
            if (c.expectedPhaseId !== room.phase.id) fail('STALE_PHASE', 'The phase changed.');
            if (room.status !== 'playing' || !['night', 'day', 'voting', 'reaction'].includes(room.phase.kind) || c.type === 'skipNightTurn' && room.phase.kind !== 'night') fail('WRONG_PHASE', 'There is no active step to skip.');
            clearActionTimers(room);
            if (room.phase.paused) resumeRoom(room, now);
            event(room, 'The host skipped the current step. Submitted choices were retained.', '房主跳过了当前阶段，已提交的选择予以保留。', now);
            if (eventNight(room)) {
                if (room.phase.nightStage === 'closing') advanceNight(room, now);
                else setNightStage(room, 'closing', now);
                break;
            }
            // Continue through the same day/reaction resolution as normal host controls.
            c = { ...c, expectedPhaseId: room.phase.id };
            // falls through
        case 'nextPhase':
            requirePhase(room, c, ['night', 'day', 'voting', 'reaction']);
            if (eventNight(room))
                fail('NIGHT_FLOW_CONTROLLED', 'Night roles advance after narration and every required player action.');
            if (room.phase.kind === 'night')
                advanceNight(room, now);
            else if (room.phase.kind === 'voting')
                resolveVoting(room, now);
            else if (room.phase.kind === 'reaction') {
                for (const id of room.pendingShots)
                    getSeat(room, id).state.shotUsed = true;
                room.pendingShots = [];
                reactionsOrDay(room, now);
            }
            else if (room.voteDoneDay === room.day)
                startNight(room, now);
            else {
                room.votes = {};
                setPhase(room, 'voting', 'exile', now);
            }
            break;
        case 'nightNarrationDone':
            requirePhase(room, c, ['night']);
            if (!eventNight(room) || !['opening', 'closing'].includes(room.phase.nightStage))
                fail('WRONG_PHASE', 'Narration completion is only available while a role opens or closes its eyes.');
            finishNightNarration(room, now);
            break;
        case 'startNight':
            requirePhase(room, c, ['day']);
            startNight(room, now);
            break;
        case 'startVoting':
            requirePhase(room, c, ['day']);
            room.votes = {};
            setPhase(room, 'voting', 'exile', now);
            break;
        case 'startSheriff':
            requirePhase(room, c, ['day']);
            if (!room.settings.sheriff)
                fail('DISABLED', 'Sheriff elections are disabled.');
            room.votes = {};
            setPhase(room, 'voting', 'sheriff', now);
            break;
        case 'resolveVoting':
            requirePhase(room, c, ['voting']);
            resolveVoting(room, now);
            break;
        case 'pause':
            if (c.expectedPhaseId !== room.phase.id) fail('STALE_PHASE', 'The phase changed.');
            pauseRoom(room, now);
            break;
        case 'resume':
            if (c.expectedPhaseId !== room.phase.id) fail('STALE_PHASE', 'The phase changed.');
            resumeRoom(room, now);
            break;
        case 'setSpeaker':
            requirePhase(room, c, ['day']);
            room.speakerSeatId = c.seatId ? aliveSeat(room, c.seatId).id : null;
            break;
        case 'resetGame':
            if (c.expectedPhaseId !== room.phase.id)
                fail('STALE_PHASE', 'The phase changed.');
            if (room.status === 'playing')
                fail('GAME_RUNNING', 'Finish the current game before resetting.');
            room.status = 'lobby';
            room.winner = null;
            room.night = 0;
            room.day = 0;
            room.seats.forEach(t => { t.roleId = null; t.team = null; t.state = {}; t.alive = true; t.canVote = true; t.privateLog = []; });
            room.events = [];
            room.messages = [];
            room.replay = [];
            room.pendingShots = [];
            room.sheriffSeatId = null;
            room.lastVote = null;
            room.requests = [];
            setPhase(room, 'lobby', null, now);
            break;
        case 'nightAction':
            acceptNightAction(room, s, c);
            if (eventNight(room)) completeNightActions(room, now);
            break;
        case 'vote':
            requirePhase(room, c, ['voting']);
            if (!s.alive || !s.canVote)
                fail('NO_VOTE', 'You cannot vote.');
            if (c.targetId !== null)
                aliveSeat(room, c.targetId);
            room.votes[s.id] = c.targetId;
            break;
        case 'shoot':
            requirePhase(room, c, ['reaction']);
            if (!room.pendingShots.includes(s.id))
                fail('NO_ABILITY', 'You cannot shoot now.');
            if (c.targetId === s.id)
                fail('INVALID_TARGET', 'Choose another player.');
            if (c.targetId !== null)
                aliveSeat(room, c.targetId);
            s.state.shotUsed = true;
            room.pendingShots = room.pendingShots.filter(id => id !== s.id);
            if (c.targetId) {
                kill(room, c.targetId, 'shot', now);
                event(room, `${s.name} shot ${getSeat(room, c.targetId).name}.`, `${s.name} 开枪带走 ${getSeat(room, c.targetId).name}。`, now);
            }
            reactionsOrDay(room, now);
            break;
        case 'knightDuel':
            requirePhase(room, c, ['day']);
            if (!s.alive || s.roleId !== 'knight' || s.state.duelUsed || !powersEnabled(room, s))
                fail('NO_ABILITY', 'You cannot duel.');
            {
                const t = aliveSeat(room, c.targetId);
                if (t.id === s.id)
                    fail('INVALID_TARGET', 'Choose another player.');
                s.state.duelUsed = true;
                const loser = t.team === 'wolf' ? t : s;
                kill(room, loser.id, 'duel', now);
                event(room, `${s.name} challenged ${t.name}. ${loser.name} died.`, `${s.name} 决斗 ${t.name}，${loser.name} 死亡。`, now);
                reactionsOrDay(room, now);
            }
            break;
        case 'wolfExplode':
            requirePhase(room, c, ['day']);
            if (!s.alive || !isPack(s))
                fail('NO_ABILITY', 'You cannot self-destruct.');
            if (s.roleId === 'whiteWolfKing' && c.targetId) {
                const t = aliveSeat(room, c.targetId);
                if (t.id === s.id)
                    fail('INVALID_TARGET', 'Choose another player.');
                kill(room, t.id, 'explosion', now);
            }
            if (s.roleId === 'bloodMoonApostle')
                room.silencedNight = room.night + 1;
            kill(room, s.id, 'explosion', now);
            event(room, `${s.name} self-destructed.`, `${s.name} 自爆。`, now);
            reactionsOrDay(room, now);
            break;
        case 'passBadge':
            if (room.sheriffSeatId !== s.id)
                fail('NO_ABILITY', 'Only the Sheriff can pass the badge.');
            if (c.targetId !== null)
                aliveSeat(room, c.targetId);
            room.sheriffSeatId = c.targetId;
            break;
        case 'leave':
            if (room.status === 'lobby') {
                delete room.members[actorId];
                room.seats = room.seats.filter(seat => seat.id !== s.id);
                room.requests = room.requests.filter(request => request.actorId !== actorId);
                event(room, `${s.name} left the lobby.`, `${s.name} 离开了大厅。`, now);
                if (room.hostId === actorId) {
                    const successor = room.seats.find(seat => connected(room, seat, now)) || room.seats.find(seat => seat.actorId);
                    room.hostId = successor?.actorId || null;
                    if (successor)
                        event(room, `${successor.name} is now the host.`, `${successor.name} 成为房主。`, now);
                }
            }
            else {
                // Once cards exist, even an explicit exit preserves the identity for
                // same-token reconnects and host-approved replacement by a new token.
                room.members[actorId].lastSeen = 0;
            }
            break;
        case 'chat': {
            const channel = c.channel || 'public';
            if (!['public', 'wolves', 'dead'].includes(channel))
                fail('INVALID_CHANNEL', 'Unknown chat channel.');
            if (typeof c.text !== 'string' || !c.text.trim() || c.text.length > 500)
                fail('INVALID_MESSAGE', 'Messages must contain 1–500 characters.');
            if (room.status === 'playing') {
                if (channel === 'public' && (!s.alive || !['day', 'voting'].includes(room.phase.kind)))
                    fail('CHAT_CLOSED', 'Public chat is open to living players during the day.');
                if (channel === 'wolves' && (!s.alive || !isPack(s) || room.phase.kind !== 'night'))
                    fail('CHAT_CLOSED', 'Wolf chat is open to the pack at night.');
                if (channel === 'dead' && s.alive)
                    fail('CHAT_CLOSED', 'Dead chat is for eliminated players.');
            }
            else if (channel !== 'public')
                fail('CHAT_CLOSED', 'Use public chat before and after the game.');
            if (s.state.lastChatAt && now - s.state.lastChatAt < 800)
                fail('RATE_LIMIT', 'Please wait before sending another message.');
            s.state.lastChatAt = now;
            room.messages.push({ id: randomUUID(), seatId: s.id, name: s.name, text: c.text.trim(), channel, at: now });
            room.messages = room.messages.slice(-200);
            break;
        }
        default: fail('UNKNOWN_COMMAND', 'Unknown room action.');
    }
}
function applyCommand(room, actorId, command, now) {
    now = nowMs(now);
    if (command?.type === 'heartbeat') {
        const member = room.members[actorId];
        const pending = room.requests.find(request => request.actorId === actorId);
        if (!member && !pending)
            fail('NOT_SEATED', 'This session no longer occupies a seat. Request to join again.');
        if (!member && room.status === 'lobby' && (room.seats.length < 24 || room.seats.some(seat => !seat.actorId && seat.name === pending.name))) {
            // Upgrade clients already waiting in a pre-auto-admission lobby. A full
            // lobby stays quietly pending; its next poll can fill a newly free seat.
            command = { type: 'requestJoin', name: pending.name };
        }
        else if (!member || now - member.lastSeen < 10000)
            return room;
    }
    // A rejected command is a transaction rollback, including heartbeats and potion state.
    const working = clone(room);
    executeCommand(working, actorId, command, now);
    working.revision++;
    working.updatedAt = now;
    Object.keys(room).forEach(k => delete room[k]);
    Object.assign(room, working);
    return room;
}
function tickRoom(room, now) {
    now = nowMs(now);
    if (room.status !== 'playing') return false;
    let changed = clearActionTimers(room);
    if (room.phase.paused && room.phase.pauseReason === 'disconnected') {
        resumeRoom(room, now);
        changed = true;
    }
    const persist = () => {
        if (changed) { room.revision++; room.updatedAt = now; }
        return changed;
    };
    if (room.phase.paused) return persist();
    if (eventNight(room)) {
        const flow = room.nightFlow;
        if (room.phase.nightStage === 'acting') {
            const completed = flow.eligibleSeatIds.length && flow.eligibleSeatIds.every(id => actionAt(room, room.phase.step, id));
            if (!completed && (flow.deadline == null || now < flow.deadline)) return persist();
            setNightStage(room, 'closing', now);
        }
        else {
            if (flow.deadline == null || now < flow.deadline) return persist();
            finishNightNarration(room, now);
        }
        changed = true;
        return persist();
    }
    return persist();
}
function recoverHost(room, actorId, now) {
    now = nowMs(now);
    const oldHost = room.hostId;
    const hostSeat = seatOf(room, oldHost);
    const actorSeat = seatOf(room, actorId);
    if (actorSeat && actorSeat.id !== hostSeat?.id)
        fail('RECOVERY_SEATED', 'Use the host’s original browser or an unseated session to recover.');
    if (hostSeat)
        replaceOccupant(room, hostSeat, actorId, hostSeat.name, now);
    else {
        const seat = makeSeat('Host', actorId);
        room.seats.push(seat);
        room.members[actorId] = { seatId: seat.id, lastSeen: now };
    }
    delete room.members[oldHost];
    if (hostSeat)
        room.members[actorId] = { seatId: hostSeat.id, lastSeen: now };
    room.hostId = actorId;
    room.requests = room.requests.filter(r => r.actorId !== actorId);
    room.revision++;
    room.updatedAt = now;
    event(room, 'The host recovered control of this room.', '房主已恢复房间控制权。', now);
    return room;
}
function publicView(room, actorId, now) {
    now = nowMs(now);
    const s = seatOf(room, actorId), isHost = Boolean(room.hostId && room.hostId === actorId);
    const finished = room.status === 'finished';
    const me = s ? { seatId: s.id, roleId: s.roleId, team: s.team, alive: s.alive, roleState: clone(s.state), allies: s.team === 'wolf' && s.roleId !== 'gargoyle' ? room.seats.filter(t => t.id !== s.id && isPack(t)).map(t => t.id) : [], privateLog: clone(s.privateLog), action: actionDescriptor(room, s), canDuel: room.phase.kind === 'day' && s.alive && s.roleId === 'knight' && !s.state.duelUsed && powersEnabled(room, s), canExplode: room.phase.kind === 'day' && s.alive && isPack(s), canPassBadge: room.sheriffSeatId === s.id } : null;
    // A replaced client receives no former secrets or private messages, even with an old token.
    const messages = s ? room.messages.filter(m => m.channel === 'public' || finished || m.channel === 'dead' && !s.alive || m.channel === 'wolves' && isPack(s)) : [];
    return { code: room.code, revision: room.revision, status: room.status, isHost, hostSeatId: seatOf(room, room.hostId)?.id || null, settings: clone(room.settings), roleDeck: [...room.roleDeck], seats: room.seats.map(t => ({ id: t.id, name: t.name, connected: connected(room, t, now), occupied: Boolean(t.actorId), alive: t.alive, canVote: t.canVote, isHost: Boolean(t.actorId && t.actorId === room.hostId), isSheriff: room.sheriffSeatId === t.id, ...(finished ? { roleId: t.roleId, team: t.team } : t.state.revealed ? { roleId: t.roleId } : {}) })), requests: isHost ? room.requests.map(r => ({ id: r.id, name: r.name, createdAt: r.createdAt })) : [], myRequest: room.requests.some(r => r.actorId === actorId) ? { status: 'pending' } : null, me, phase: clone(room.phase), day: room.day, night: room.night, events: clone(room.events), messages: clone(messages), winner: clone(room.winner), speakerSeatId: room.speakerSeatId || null, lastVote: room.lastVote ? clone(room.lastVote) : null, voteCount: Object.keys(room.votes || {}).length, replay: finished ? clone(room.replay || []) : [] };
}
module.exports = { createRoom, applyCommand, publicView, tickRoom, recoverHost, DEFAULT_SETTINGS, ROLES, PRESETS };
