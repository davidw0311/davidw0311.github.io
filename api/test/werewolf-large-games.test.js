'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const catalogue = require('../src/werewolf/roles.json');

// Exercise the production module with reproducible entropy, including its shuffle,
// speech order, UUIDs and empty-role delays. No live rooms or network are involved.
function seededEngine(seed) {
    let state = seed >>> 0, serial = 0;
    const random = max => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return Math.floor(state / 0x100000000 * max);
    };
    const file = require.resolve('../src/werewolf/engine');
    const realRequire = createRequire(file);
    const engineModule = { exports: {} };
    const localRequire = name => name === 'node:crypto' ? {
        randomUUID: () => `00000000-0000-4000-8000-${String(++serial).padStart(12, '0')}`,
        randomInt: (min, max) => max === undefined ? random(min) : min + random(max - min),
    } : realRequire(name);
    new Function('require', 'module', fs.readFileSync(file, 'utf8'))(localRequire, engineModule);
    return { engine: engineModule.exports, random };
}

const boards = [
    ...catalogue.presets.filter(preset => preset.roles.length >= 12),
    { id: '18-opening-roles', roles: ['werewolf', 'werewolf', 'whiteWolfKing', 'hiddenWolf', 'mechanicalWolf', 'cupid', 'wildChild', 'wolfHound', 'thief', 'seer', 'witch', 'guard', 'hunter', 'elder', 'scapegoat', 'angel', 'villager', 'villager'] },
    { id: '20-jester-magic', roles: ['werewolf', 'werewolf', 'wolfKing', 'wolfBeauty', 'gargoyle', 'seer', 'witch', 'guard', 'hunter', 'magician', 'dreamweaver', 'gravekeeper', 'raven', 'silencer', 'demonHunter', 'jester', 'knight', 'villager', 'villager', 'villager'] },
    { id: '24-all-night-powers', roles: ['werewolf', 'wolfKing', 'wolfBeauty', 'wolfWitch', 'mechanicalWolf', 'bloodMoonApostle', 'seer', 'witch', 'guard', 'hunter', 'cupid', 'magician', 'dreamweaver', 'gravekeeper', 'raven', 'demonHunter', 'pureWhite', 'wildChild', 'wolfHound', 'thief', 'piper', 'elder', 'knight', 'villager'] },
];

function simulation(board, seed) {
    const { engine, random } = seededEngine(seed);
    let now = 1800000000000;
    const room = engine.createRoom({ code: 'TEST', hostId: 'actor-0', hostName: 'Player 1', now });
    const stats = { games: 1, commands: 0, nights: 0, sheriffRunoffs: 0, exileRunoffs: 0, reconnects: 0, replacements: 0, badges: 0, shots: 0, actions: {}, winners: {} };
    const view = actor => engine.publicView(room, actor, now);
    const seat = id => room.seats.find(candidate => candidate.id === id);
    const send = (actor, type, data = {}) => {
        const context = `${board.id} seed=${seed} ${room.phase.kind}/${room.phase.step}/${room.phase.nightStage || ''} night=${room.night}: ${type}`;
        try { engine.applyCommand(room, actor, { type, expectedPhaseId: room.phase.id, ...data }, ++now); }
        catch (error) { error.message = `${context}: ${error.message}`; throw error; }
        stats.commands++;
    };
    const host = (type, data) => send(room.hostId, type, data);
    const reject = (actor, type, data, code) => {
        const before = JSON.stringify(room);
        assert.throws(() => send(actor, type, data), { code });
        assert.equal(JSON.stringify(room), before, 'Rejected decisions must roll back completely');
    };
    const choose = choices => choices[random(choices.length)];
    const reconnect = id => {
        const actor = seat(id).actorId;
        const before = view(actor).me;
        send(actor, 'leave');
        assert.equal(view(actor).seats.find(s => s.id === id).connected, false);
        send(actor, 'heartbeat');
        assert.deepEqual(view(actor).me, before);
        stats.reconnects++;
    };
    const replace = id => {
        const previousActor = seat(id).actorId;
        const previous = view(previousActor).me;
        const actor = `replacement-${stats.replacements}`;
        send(actor, 'requestJoin', { name: seat(id).name });
        assert.equal(view(actor).me, null);
        host('approveJoin', { requestId: room.requests.find(request => request.actorId === actor).id, replaceSeatId: id });
        const replacement = view(actor).me;
        assert.equal(replacement.seatId, id);
        assert.equal(replacement.roleId, previous.roleId);
        assert.deepEqual(replacement.history, previous.history);
        assert.deepEqual(replacement.roleState, previous.roleState);
        assert.equal(view(previousActor).me, null);
        reject(previousActor, 'heartbeat', {}, 'NOT_SEATED');
        stats.replacements++;
    };
    for (let i = 1; i < board.roles.length; i++) send(`actor-${i}`, 'requestJoin', { name: `Player ${i + 1}` });
    host('updateSettings', { settings: {
        sheriff: seed % 4 !== 0,
        winCondition: ['edge', 'all', 'parity'][seed % 3],
        witchSelfSave: [false, true, 'firstNight'][seed % 3],
        guardAntidote: seed % 2 ? 'kill' : 'save',
    } });
    host('startGame', { roleDeck: board.roles });
    const stableIds = room.seats.map(s => s.id);
    assert.equal(room.phase.kind, 'ready');
    reject(room.hostId, 'startNight', {}, 'NOT_READY');
    for (const player of room.seats) send(player.actorId, 'ready');
    reconnect(stableIds[1]);
    replace(stableIds[2]);
    assert.equal(view(seat(stableIds[2]).actorId).me.ready, false);
    reject(room.hostId, 'startNight', {}, 'NOT_READY');
    send(seat(stableIds[2]).actorId, 'ready');
    host('startNight');

    let disturbedNight = false, previousNight = 0;
    for (let turn = 0; turn < 3000 && room.status === 'playing'; turn++) {
        assert.deepEqual(room.seats.map(s => s.id), stableIds);
        if (room.night !== previousNight) { previousNight = room.night; stats.nights++; }
        const publicState = view(room.hostId);
        assert.ok(publicState.seats.every(s => !Object.hasOwn(s, 'team')));
        assert.deepEqual(publicState.replay, []);
        assert.equal(view('observer').me, null);
        if (room.phase.kind === 'night') {
            if (['opening', 'closing'].includes(room.phase.nightStage)) {
                const oldPhase = room.phase.id;
                if (random(3) === 0) {
                    now = Math.max(now + 1, room.nightFlow.deadline);
                    assert.equal(engine.tickRoom(room, now), true);
                } else host('nightNarrationDone');
                assert.notEqual(room.phase.id, oldPhase);
                continue;
            }
            const eligible = room.nightFlow.eligibleSeatIds;
            if (!eligible.length) {
                assert.ok(room.nightFlow.deadline > now);
                now = room.nightFlow.deadline;
                assert.equal(engine.tickRoom(room, now), true);
                assert.equal(room.phase.nightStage, 'closing');
                continue;
            }
            if (!disturbedNight) {
                const id = eligible.find(id => seat(id).actorId !== room.hostId);
                if (id) {
                    const phaseId = room.phase.id;
                    reconnect(id);
                    replace(id);
                    host('pause');
                    assert.equal(view(seat(id).actorId).me.action, null);
                    host('resume');
                    reject(seat(id).actorId, 'nightAction', { expectedPhaseId: phaseId, ability: 'skip' }, 'STALE_PHASE');
                    disturbedNight = true;
                }
            }
            let wolfTarget;
            if (room.phase.step === 'wolves') {
                const nonWolves = room.seats.filter(s => s.alive && s.team !== 'wolf');
                wolfTarget = choose(nonWolves.length ? nonWolves : room.seats.filter(s => s.alive)).id;
            }
            for (const id of eligible) {
                const player = seat(id), descriptor = view(player.actorId).me.action;
                assert.ok(descriptor, `Missing ${room.phase.step} descriptor for eligible player`);
                if (descriptor.alreadySubmitted) continue;
                const step = room.phase.step;
                let data;
                if (step === 'wolves') data = { targetId: wolfTarget };
                else if (descriptor.input === 'choice') data = { choice: choose(descriptor.options) };
                else if (descriptor.canSkip && (random(6) === 0 || descriptor.input !== 'none' && descriptor.targets.length < (descriptor.minTargets || 1))) data = { ability: 'skip' };
                else if (step === 'witch') {
                    const ability = choose(descriptor.options);
                    data = { ability, ...(ability === 'poison' ? { targetId: choose(descriptor.targets) } : {}) };
                } else if (descriptor.input === 'double') {
                    const pairs = descriptor.targets.flatMap((a, index) => descriptor.targets.slice(index + 1).map(b => [a, b]));
                    const available = step === 'magician' ? pairs.filter(pair => !(player.state.usedSwaps || []).includes([...pair].sort().join(':'))) : pairs;
                    data = available.length ? { targetIds: choose(available) } : descriptor.minTargets === 1 && descriptor.targets.length ? { targetIds: [descriptor.targets[0]] } : { ability: 'skip' };
                } else data = descriptor.input === 'none' ? {} : { targetId: choose(descriptor.targets) };
                send(player.actorId, 'nightAction', data);
                stats.actions[step] = (stats.actions[step] || 0) + 1;
            }
            assert.equal(room.phase.nightStage, 'closing', `${board.id} seed=${seed}: all legal night actions must complete`);
        } else if (room.phase.kind === 'announcement') {
            if (random(4) === 0) { now = room.phase.deadline; assert.equal(engine.tickRoom(room, now), true); }
            else host('nightNarrationDone');
        } else if (room.phase.kind === 'sheriff') {
            if (room.phase.step === 'nomination') {
                const candidates = room.election.participantIds.slice(0, 4);
                for (const id of room.election.participantIds) send(seat(id).actorId, 'sheriffInterest', { run: candidates.includes(id) });
                send(seat(candidates[0]).actorId, 'sheriffWithdraw');
                send(seat(candidates[0]).actorId, 'sheriffRejoin');
                send(seat(candidates[3]).actorId, 'sheriffWithdraw');
                host('advanceElection');
            } else if (room.speakerSeatId) send(seat(room.speakerSeatId).actorId, 'sheriffSpeechDone');
            else host('advanceElection');
        } else if (room.phase.kind === 'voting') {
            const isSheriff = room.phase.step === 'sheriff';
            const voters = [...publicState.pendingVoterIds];
            assert.ok(voters.length);
            const candidates = view(seat(voters[0]).actorId).me.action.targets;
            if (isSheriff) {
                const expectedVoters = room.election.participantIds.filter(id => room.election.round === 2 ? !candidates.includes(id) : !room.election.declarations[id]);
                assert.deepEqual(voters, expectedVoters, 'Runoff restores voting to eliminated and withdrawn candidates');
            }
            const target = choose(candidates);
            const forceExileTie = !isSheriff && room.day === 1 && seed % 6 === 0 && !room.ravenTargetId;
            if (isSheriff && room.election.round === 2) stats.sheriffRunoffs++;
            if (!isSheriff && room.voteRound === 2) stats.exileRunoffs++;
            if (!isSheriff) reject(room.hostId, 'resolveVoting', {}, 'VOTES_PENDING');
            for (const [index, id] of voters.entries()) {
                const targetId = isSheriff ? room.election.round === 2 && seed % 5 !== 0 ? candidates[0] : candidates[index % 2] : forceExileTie ? null : target;
                send(seat(id).actorId, 'vote', { targetId });
            }
            if (!isSheriff) host('resolveVoting');
        } else if (room.phase.kind === 'reaction') {
            const id = room.pendingShots[0];
            const descriptor = view(seat(id).actorId).me.action;
            send(seat(id).actorId, 'shoot', { targetId: descriptor.targets.length && random(5) ? choose(descriptor.targets) : null });
            stats.shots++;
        } else if (room.phase.kind === 'day') {
            if (room.phase.step === 'badge') {
                const living = room.seats.filter(s => s.alive);
                send(seat(room.sheriffSeatId).actorId, 'passBadge', { targetId: random(4) ? choose(living).id : null });
                stats.badges++;
            } else if (room.phase.step === 'afterVote') host('startNight');
            else {
                const knight = room.seats.find(s => view(s.actorId).me.canDuel);
                const explosive = room.seats.find(s => view(s.actorId).me.canExplode);
                if (knight && random(3) === 0) send(knight.actorId, 'knightDuel', { targetId: choose(room.seats.filter(s => s.alive && s.id !== knight.id)).id });
                else if (explosive && random(12) === 0) send(explosive.actorId, 'wolfExplode', { targetId: choose(room.seats.filter(s => s.alive && s.id !== explosive.id)).id });
                else host('startVoting');
            }
        } else assert.fail(`Unrecognized phase: ${JSON.stringify(room.phase)}`);
    }
    assert.equal(room.status, 'finished', `${board.id} seed=${seed}: game stalled at ${JSON.stringify(room.phase)}`);
    assert.ok(room.winner?.team);
    assert.equal(view(room.hostId).seats.length, board.roles.length);
    assert.ok(view(room.hostId).seats.every(s => s.roleId && s.team));
    assert.ok(room.replay.length);
    stats.winners[room.winner.team] = 1;
    return stats;
}

function addStats(total, next) {
    for (const [key, value] of Object.entries(next)) {
        if (typeof value === 'number') total[key] = (total[key] || 0) + value;
        else { total[key] ||= {}; addStats(total[key], value); }
    }
}

test('seeded 12–24-player games finish across every large preset and all 32 roles', t => {
    assert.deepEqual(new Set(boards.flatMap(board => board.roles)), new Set(catalogue.roles.map(role => role.id)));
    const totals = {};
    for (const board of boards) for (let seed = 1; seed <= 24; seed++) addStats(totals, simulation(board, seed));
    assert.equal(totals.games, boards.length * 24);
    assert.ok(totals.sheriffRunoffs > 100);
    assert.ok(totals.exileRunoffs > 10);
    assert.ok(totals.badges > 10);
    assert.ok(totals.shots > 50);
    for (const step of ['opening', 'wolves', 'seer', 'witch', 'guard', 'magician', 'dreamweaver', 'gravekeeper', 'silencer', 'raven', 'demonHunter', 'pureWhite', 'wolfWitch', 'gargoyle', 'wolfBeauty', 'piper']) assert.ok(totals.actions[step] > 0, `${step} must act`);
    t.diagnostic(JSON.stringify(totals));
});
