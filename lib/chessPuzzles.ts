import { Chess } from 'chess.js';

export type Puzzle = { id: string; fen: string; moves: string[]; rating: number; themes: string[]; gameUrl: string; index: number };
export type PuzzleManifest = { count: number; buckets: { rating: number; count: number; offset: number }[] };
export type Progress = {
  version: 1; rating: number; best: number; attempts: number; solved: number;
  streak: number; longest: number; seen: string; missed: number[];
  history: [number, string][]; days: [string, number][];
  recent: [number, boolean, string][];
};
export type Attempt = { index: number; rating: number; won: boolean; at: string };
export const PROGRESS_KEY = 'chess_practice_v1';
export const initialProgress = (): Progress => ({ version: 1, rating: 800, best: 800, attempts: 0, solved: 0, streak: 0, longest: 0, seen: '', missed: [], history: [], days: [], recent: [] });

export function readProgress(value: unknown): Progress {
  if (!value || typeof value !== 'object') return initialProgress();
  const v = value as Progress;
  if (v.version !== 1 || !Number.isFinite(v.rating) || v.rating < 400 || v.rating > 3200 || !Number.isInteger(v.attempts) || v.attempts < 0 || !Number.isInteger(v.solved) || v.solved < 0 || v.solved > v.attempts || typeof v.seen !== 'string' || !/^[A-Za-z0-9+/=]*$/.test(v.seen) || v.seen.length > 4000 || !Array.isArray(v.missed) || !v.missed.every(n => Number.isInteger(n) && n >= 0 && n < 20000) || !Array.isArray(v.history) || !v.history.every(h => Array.isArray(h) && Number.isFinite(h[0]) && typeof h[1] === 'string') || !Array.isArray(v.days) || !v.days.every(d => Array.isArray(d) && typeof d[0] === 'string' && Number.isInteger(d[1])) || !Array.isArray(v.recent) || !v.recent.every(r => Array.isArray(r) && Number.isInteger(r[0]) && typeof r[1] === 'boolean' && typeof r[2] === 'string') || !Number.isFinite(v.best) || !Number.isInteger(v.streak) || !Number.isInteger(v.longest)) return initialProgress();
  try { atob(v.seen); } catch { return initialProgress(); }
  return { ...v, missed: v.missed.slice(-30), history: v.history.slice(-30), days: v.days.slice(-30), recent: v.recent.slice(-12) };
}
export function hasSeen(progress: Progress, index: number): boolean {
  const bytes = atob(progress.seen); const byte = bytes.charCodeAt(index >> 3) || 0;
  return Boolean(byte & (1 << (index % 8)));
}
function markSeen(seen: string, index: number) {
  const old = atob(seen); const bytes = new Uint8Array(Math.max(old.length, (index >> 3) + 1));
  for (let i = 0; i < old.length; i++) bytes[i] = old.charCodeAt(i);
  bytes[index >> 3] |= 1 << (index % 8);
  return btoa(String.fromCharCode(...bytes));
}
export function recordAttempt(progress: Progress, attempt: Attempt): Progress {
  if (!Number.isInteger(attempt.index) || attempt.index < 0 || attempt.index >= 20000 || !Number.isFinite(attempt.rating) || !Number.isFinite(Date.parse(attempt.at))) return progress;
  if (hasSeen(progress, attempt.index)) {
    // Review can clear a mistake, but cannot farm rating points or inflate statistics.
    return attempt.won ? { ...progress, missed: progress.missed.filter(i => i !== attempt.index) } : progress;
  }
  const expected = 1 / (1 + 10 ** ((attempt.rating - progress.rating) / 400));
  const k = progress.attempts < 10 ? 64 : 32;
  const rating = Math.max(400, Math.min(3200, Math.round(progress.rating + k * ((attempt.won ? 1 : 0) - expected))));
  const streak = attempt.won ? progress.streak + 1 : 0;
  const day = attempt.at.slice(0, 10);
  const days: [string, number][] = progress.days.map(([d, n]) => [d, n]);
  const entry = days.find(d => d[0] === day);
  if (entry) entry[1]++; else days.push([day, 1]);
  days.sort((a, b) => a[0].localeCompare(b[0]));
  return { ...progress, rating, best: Math.max(progress.best, rating), attempts: progress.attempts + 1,
    solved: progress.solved + Number(attempt.won), streak, longest: Math.max(progress.longest, streak),
    seen: markSeen(progress.seen, attempt.index),
    missed: (attempt.won ? progress.missed : [...progress.missed.filter(i => i !== attempt.index), attempt.index]).slice(-30),
    history: [...progress.history, [rating, attempt.at] as [number, string]].slice(-30), days: days.slice(-30),
    recent: [[attempt.index, attempt.won, attempt.at] as [number, boolean, string], ...progress.recent].slice(0, 12) };
}
export function skillLevel(rating: number) {
  if (rating < 1000) return { name: 'Finding your feet', next: 1000, floor: 400 };
  if (rating < 1400) return { name: 'Pattern spotter', next: 1400, floor: 1000 };
  if (rating < 1800) return { name: 'Tactical thinker', next: 1800, floor: 1400 };
  if (rating < 2200) return { name: 'Sharp calculator', next: 2200, floor: 1800 };
  if (rating < 2600) return { name: 'Combination hunter', next: 2600, floor: 2200 };
  return { name: 'Tactics expert', next: 3200, floor: 2600 };
}
export function targetRating(progress: Progress, difficulty: string, random = Math.random()) {
  const offset = difficulty === 'gentle' ? -300 : difficulty === 'challenge' ? 150 : random < .7 ? -150 : random < .9 ? 0 : 150;
  return Math.max(400, Math.min(3100, Math.floor((progress.rating + offset) / 100) * 100));
}
export function startPuzzle(puzzle: Puzzle) {
  const game = new Chess(puzzle.fen); game.move(puzzle.moves[0]);
  return { fen: game.fen(), cursor: 1, color: game.turn() };
}
export function playPuzzleMove(puzzle: Puzzle, fen: string, cursor: number, uci: string) {
  const game = new Chess(fen);
  let move;
  try { move = game.move(uci); } catch { return { status: 'illegal' as const, fen, cursor, san: [] as string[] }; }
  if (uci !== puzzle.moves[cursor] && !game.isCheckmate()) return { status: 'incorrect' as const, fen, cursor, san: [] as string[] };
  const san = [move.san]; cursor++;
  if (game.isCheckmate() || cursor >= puzzle.moves.length) return { status: 'solved' as const, fen: game.fen(), cursor, san };
  san.push(game.move(puzzle.moves[cursor]).san); cursor++;
  return { status: cursor >= puzzle.moves.length ? 'solved' as const : 'correct' as const, fen: game.fen(), cursor, san };
}
export function solutionFrames(puzzle: Puzzle) {
  const game = new Chess(puzzle.fen); game.move(puzzle.moves[0]);
  const frames = [{ fen: game.fen(), san: 'Starting position' }];
  for (const move of puzzle.moves.slice(1)) frames.push({ san: game.move(move).san, fen: game.fen() });
  return frames;
}
export function themeLabel(theme: string) { return theme.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()); }
