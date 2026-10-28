import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { hasSeen, initialProgress, playPuzzleMove, readProgress, recordAttempt, skillLevel, solutionFrames, startPuzzle, targetRating, type Puzzle, type PuzzleManifest } from '../lib/chessPuzzles.ts';
const manifest = JSON.parse(readFileSync('public/assets/chess/puzzles/manifest.json', 'utf8')) as PuzzleManifest;
const bank = manifest.buckets.flatMap(bucket => (JSON.parse(readFileSync(`public/assets/chess/puzzles/${bucket.rating}.json`, 'utf8')) as Omit<Puzzle, 'index'>[]).map((p, index) => ({ ...p, index: bucket.offset + index })));
const at = '2026-10-28T10:00:00.000Z';

test('the bank has over 10,000 unique puzzles and stable, contiguous indexes', () => {
  assert.ok(manifest.count > 10000); assert.equal(bank.length, manifest.count);
  assert.equal(new Set(bank.map(p => p.id)).size, bank.length);
  bank.forEach((p, i) => assert.equal(p.index, i));
  assert.ok(bank.some(p => p.rating < 600)); assert.ok(bank.some(p => p.rating >= 2600));
});
test('every imported puzzle has a legal setup, solution, and replay', () => {
  for (const puzzle of bank) {
    assert.ok(puzzle.moves.length >= 2, puzzle.id);
    const start = startPuzzle(puzzle);
    assert.equal(start.cursor, 1);
    assert.notEqual(start.fen, puzzle.fen);
    let fen = start.fen, cursor = 1;
    while (cursor < puzzle.moves.length) {
      const result = playPuzzleMove(puzzle, fen, cursor, puzzle.moves[cursor]);
      assert.ok(['correct', 'solved'].includes(result.status), puzzle.id);
      fen = result.fen; cursor = result.cursor;
      if (result.status === 'solved') break;
    }
    const frames = solutionFrames(puzzle);
    assert.equal(frames[0].fen, start.fen);
    assert.equal(frames.at(-1)!.fen, fen, puzzle.id);
  }
});
test('illegal moves leave the position and cursor unchanged', () => {
  const puzzle = bank[0], start = startPuzzle(puzzle);
  assert.deepEqual(playPuzzleMove(puzzle, start.fen, 1, 'a1a1'), { status: 'illegal', fen: start.fen, cursor: 1, san: [] });
});
test('wrong legal moves are rejected without advancing the board', () => {
  const puzzle = bank.find(p => !p.themes.includes('mateIn1'))!;
  const start = startPuzzle(puzzle), game = new Chess(start.fen);
  const wrong = game.moves({ verbose: true }).find(m => `${m.from}${m.to}${m.promotion || ''}` !== puzzle.moves[1])!;
  const result = playPuzzleMove(puzzle, start.fen, 1, `${wrong.from}${wrong.to}${wrong.promotion || ''}`);
  assert.equal(result.status, 'incorrect'); assert.equal(result.fen, start.fen); assert.equal(result.cursor, 1);
});
test('an alternate mate in one is accepted', () => {
  const puzzle: Puzzle = { id: 'mate', fen: '7k/8/5KQ1/8/8/8/8/8 b - - 0 1', moves: ['h8h7', 'g6g7'], rating: 600, themes: ['mateIn1'], index: 0, gameUrl: '' };
  // Evaluate at a composed player-to-move position with several legal mates.
  const fen = '7k/8/5KQ1/8/8/8/8/8 w - - 0 1';
  const game = new Chess(fen);
  const mates = game.moves({ verbose: true }).filter(m => { const g = new Chess(fen); g.move(m); return g.isCheckmate(); });
  assert.ok(mates.length > 0);
  const mate = mates[0]; const uci = `${mate.from}${mate.to}`;
  puzzle.moves[1] = 'g6a6';
  assert.equal(playPuzzleMove(puzzle, fen, 1, uci).status, 'solved');
});
test('promotions, including underpromotions, work through the full bank', () => {
  const promotionPuzzles = bank.filter(p => p.moves.some(m => m.length === 5));
  assert.ok(promotionPuzzles.length > 10);
  for (const p of promotionPuzzles.slice(0, 50)) assert.ok(solutionFrames(p).length > 1);
});
test('Elo rewards harder successes more and penalizes easier misses more', () => {
  const base = initialProgress();
  const easyWin = recordAttempt(base, { index: 1, rating: 600, won: true, at });
  const hardWin = recordAttempt(base, { index: 1, rating: 1100, won: true, at });
  assert.ok(hardWin.rating > easyWin.rating && easyWin.rating > base.rating);
  const easyMiss = recordAttempt(base, { index: 1, rating: 600, won: false, at });
  const hardMiss = recordAttempt(base, { index: 1, rating: 1100, won: false, at });
  assert.ok(easyMiss.rating < hardMiss.rating && hardMiss.rating < base.rating);
});
test('each puzzle is rated once, even after retries and device sync replay', () => {
  const attempt = { index: 1000, rating: 1000, won: false, at };
  const missed = recordAttempt(initialProgress(), attempt);
  assert.ok(hasSeen(missed, 1000)); assert.equal(missed.attempts, 1); assert.equal(missed.solved, 0);
  const duplicate = recordAttempt(missed, attempt);
  assert.deepEqual(duplicate, missed);
  const reviewed = recordAttempt(missed, { ...attempt, won: true });
  assert.equal(reviewed.rating, missed.rating); assert.equal(reviewed.attempts, 1);
  assert.equal(reviewed.solved, 0); assert.deepEqual(reviewed.missed, []);
  assert.equal(recordAttempt(reviewed, { ...attempt, won: true }), reviewed, 'repeated completed reviews must not queue more state');
});
test('seen bitmap round trips at byte boundaries and largest allowed index', () => {
  let progress = initialProgress();
  for (const index of [0, 7, 8, 255, 256, 19999]) progress = recordAttempt(progress, { index, rating: 800, won: true, at });
  const restored = readProgress(JSON.parse(JSON.stringify(progress)));
  for (const index of [0, 7, 8, 255, 256, 19999]) assert.ok(hasSeen(restored, index));
  assert.equal(hasSeen(restored, 9), false);
  assert.equal(restored.attempts, 6);
});
test('unlimited solving keeps the cloud profile compact', () => {
  let progress = initialProgress();
  for (const puzzle of bank) progress = recordAttempt(progress, { index: puzzle.index, rating: puzzle.rating, won: puzzle.index % 2 === 0, at });
  assert.equal(progress.attempts, bank.length); assert.equal(progress.history.length, 30); assert.equal(progress.missed.length, 30);
  assert.equal(progress.recent.length, 12); assert.ok(JSON.stringify(progress).length < 5000);
});
test('streaks, accuracy counters, and daily activity reflect first attempts only', () => {
  let p = initialProgress();
  for (const [i, won] of [true, true, false, true].entries()) p = recordAttempt(p, { index: i, won, rating: 800, at });
  assert.equal(p.solved, 3); assert.equal(p.attempts, 4); assert.equal(p.streak, 1); assert.equal(p.longest, 2);
  assert.deepEqual(p.days, [['2026-10-28', 4]]);
});
test('adaptive selection mixes accessible puzzles with stretch challenges', () => {
  const p = { ...initialProgress(), rating: 1500 };
  assert.equal(targetRating(p, 'adaptive', .2), 1300); assert.equal(targetRating(p, 'adaptive', .8), 1500);
  assert.equal(targetRating(p, 'adaptive', .95), 1600); assert.equal(targetRating(p, 'gentle'), 1200);
  assert.equal(targetRating(p, 'challenge'), 1600);
  assert.equal(targetRating(initialProgress(), 'gentle'), 500);
});
test('corrupt stored progress is rejected and valid data survives serialization', () => {
  for (const value of [null, {}, { version: 1, rating: NaN }, { ...initialProgress(), seen: 'bad!' }, { ...initialProgress(), history: [null] }, { ...initialProgress(), solved: 5 }, { ...initialProgress(), missed: [-1] }]) assert.deepEqual(readProgress(value), initialProgress());
  const valid = recordAttempt(initialProgress(), { index: 42, rating: 900, won: true, at });
  assert.deepEqual(readProgress(JSON.parse(JSON.stringify(valid))), valid);
});
test('skill milestones progress with rating', () => {
  assert.equal(skillLevel(800).next, 1000); assert.equal(skillLevel(1000).name, 'Pattern spotter');
  assert.equal(skillLevel(1800).next, 2200); assert.equal(skillLevel(2800).name, 'Tactics expert');
});
