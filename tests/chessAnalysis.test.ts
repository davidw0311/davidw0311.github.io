import assert from 'node:assert/strict';
import test from 'node:test';
import { Chess, type Square } from 'chess.js';
import { analysisMessage, createAnalysis, moveAnalysis, stepAnalysis, type AnalysisLine } from '../lib/chessAnalysis.ts';
import type { Puzzle } from '../lib/chessPuzzles.ts';

const puzzle: Puzzle = { id: 'test', fen: new Chess().fen(), moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6'], index: 0, rating: 800, themes: [], gameUrl: '' };
test('analysis starts at the selected solution position and preserves the full replay', () => {
  const line = createAnalysis(puzzle, 2);
  assert.equal(line.cursor, 2); assert.equal(line.frames.length, 4);
  assert.equal(line.frames[2].san, 'Nf3'); assert.equal(line.frames[2].move, 'g1f3');
  assert.equal(new Chess(line.frames[0].fen).turn(), 'b');
  assert.equal(createAnalysis(puzzle, 99).cursor, 3);
});
test('both sides can make legal variations; branching replaces only the redo tail', () => {
  const original = createAnalysis(puzzle, 0);
  const black = moveAnalysis(original, 'c7c5');
  const white = moveAnalysis(black, 'g1f3');
  assert.equal(white.frames.at(-1)!.san, 'Nf3'); assert.equal(white.cursor, 2);
  assert.equal(original.frames.length, 4); assert.equal(original.frames[1].san, 'e5');
  const undone = stepAnalysis(white, -1);
  assert.equal(stepAnalysis(undone, 1).frames[2].fen, white.frames[2].fen);
  const branch = moveAnalysis(undone, 'b1c3');
  assert.equal(branch.frames.length, 3); assert.equal(branch.frames[2].san, 'Nc3');
  assert.equal(stepAnalysis(branch, 1), branch); assert.equal(stepAnalysis(original, -1), original);
});
test('illegal or wrong-side moves do not change analysis history', () => {
  const line = createAnalysis(puzzle, 0);
  assert.equal(moveAnalysis(line, 'g1f3'), line); assert.equal(moveAnalysis(line, 'e7e4'), line);
});
test('accepted alternative solution moves are retained in the replay', () => {
  const line = createAnalysis(puzzle, 99, ['c5', 'Nf3']);
  assert.equal(line.frames.length, 3); assert.equal(line.frames[1].move, 'c7c5');
  assert.equal(line.frames.at(-1)!.san, 'Nf3');
});
test('analysis supports castling, en passant, underpromotion and their undo', () => {
  const cases = [
    ['r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'e1g1', 'g1', 'k'],
    ['4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', 'e5d6', 'd6', 'p'],
    ['4k3/P7/8/8/8/8/8/4K3 w - - 0 1', 'a7a8n', 'a8', 'n'],
  ];
  for (const [fen, move, square, type] of cases) {
    const start: AnalysisLine = { frames: [{ fen, san: 'Start' }], cursor: 0 };
    const next = moveAnalysis(start, move);
    assert.equal(new Chess(next.frames[1].fen).get(square as Square)?.type, type);
    assert.equal(stepAnalysis(next, -1).frames[0].fen, fen);
  }
});
test('mate and stalemate give rewind guidance and reject further moves', () => {
  for (const [fen, label] of [
    ['7k/6Q1/5K2/8/8/8/8/8 b - - 0 1', 'Checkmate'],
    ['7k/5Q2/5K2/8/8/8/8/8 b - - 0 1', 'Stalemate'],
  ]) {
    const line = { frames: [{ fen, san: 'End' }], cursor: 0 };
    assert.equal(moveAnalysis(line, 'h8h7'), line);
    assert.match(analysisMessage(fen), new RegExp(`${label}.*Go back`));
  }
});
