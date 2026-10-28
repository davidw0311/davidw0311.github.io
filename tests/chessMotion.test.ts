import assert from 'node:assert/strict';
import test from 'node:test';
import { Chess } from 'chess.js';
import { reconcilePieces, squarePosition, waitForMove, SLOW_MOVE_MS, REPLY_PAUSE_MS } from '../lib/chessMotion.ts';

test('piece identities survive a normal move and a capture', () => {
  const game = new Chess();
  let pieces = reconcilePieces([], game.fen());
  const whitePawn = pieces.find(p => p.square === 'e2')!.id;
  game.move('e4'); pieces = reconcilePieces(pieces, game.fen());
  assert.equal(pieces.find(p => p.square === 'e4')!.id, whitePawn);
  game.move('d5'); pieces = reconcilePieces(pieces, game.fen());
  const captured = pieces.find(p => p.square === 'd5')!.id;
  game.move('exd5'); pieces = reconcilePieces(pieces, game.fen());
  assert.equal(pieces.find(p => p.square === 'd5')!.id, whitePawn);
  assert.ok(!pieces.some(p => p.id === captured));
  assert.equal(pieces.length, 31);
  assert.equal(new Set(pieces.map(p => p.id)).size, pieces.length);
});
test('castling moves the original king and rook together', () => {
  const game = new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
  const before = reconcilePieces([], game.fen());
  const king = before.find(p => p.square === 'e1')!.id, rook = before.find(p => p.square === 'h1')!.id;
  game.move('O-O'); const after = reconcilePieces(before, game.fen());
  assert.equal(after.find(p => p.square === 'g1')!.id, king);
  assert.equal(after.find(p => p.square === 'f1')!.id, rook);
});
test('en passant removes the captured pawn without replacing the moving pawn', () => {
  const game = new Chess();
  for (const move of ['e4', 'a6', 'e5', 'd5']) game.move(move);
  const before = reconcilePieces([], game.fen()), pawn = before.find(p => p.square === 'e5')!.id;
  game.move('exd6'); const after = reconcilePieces(before, game.fen());
  assert.equal(after.find(p => p.square === 'd6')!.id, pawn);
  assert.ok(!after.some(p => p.square === 'd5'));
  assert.equal(after.length, before.length - 1);
});
test('promotions and reverse playback preserve the moving piece identity', () => {
  for (const promotion of ['q', 'r', 'b', 'n']) {
    const game = new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');
    const before = reconcilePieces([], game.fen()), pawn = before.find(p => p.square === 'a7')!.id;
    const fen = game.fen(); game.move(`a7a8${promotion}`);
    const after = reconcilePieces(before, game.fen());
    assert.equal(after.find(p => p.square === 'a8')!.id, pawn);
    assert.equal(after.find(p => p.square === 'a8')!.type, promotion);
    const restored = reconcilePieces(after, fen);
    assert.equal(restored.find(p => p.square === 'a7')!.id, pawn);
    assert.equal(restored.find(p => p.square === 'a7')!.type, 'p');
  }
});
test('stationary pieces retain identities during solution playback', () => {
  const game = new Chess(); const before = reconcilePieces([], game.fen());
  game.move('Nf3'); const forward = reconcilePieces(before, game.fen());
  const back = reconcilePieces(forward, new Chess().fen());
  assert.deepEqual(new Map(back.map(p => [p.square, p.id])), new Map(before.map(p => [p.square, p.id])));
});
test('board coordinates map both player orientations correctly', () => {
  assert.deepEqual(squarePosition('a8', true), { x: 0, y: 0 });
  assert.deepEqual(squarePosition('h1', true), { x: 700, y: 700 });
  assert.deepEqual(squarePosition('h1', false), { x: 0, y: 0 });
  assert.deepEqual(squarePosition('a8', false), { x: 700, y: 700 });
});
test('a cancelled animation cannot finish in another puzzle or account', async () => {
  const controller = new AbortController();
  const waiting = waitForMove(10000, controller.signal);
  controller.abort();
  assert.equal(await waiting, false);
  assert.equal(await waitForMove(0, controller.signal), false);
});
test('relaxed moves finish before the opponent pause and reduced motion is immediate', async () => {
  assert.ok(SLOW_MOVE_MS >= 600);
  assert.ok(REPLY_PAUSE_MS >= 150);
  assert.equal(await waitForMove(0, new AbortController().signal), true);
  assert.equal(await waitForMove(5, new AbortController().signal), true);
});
