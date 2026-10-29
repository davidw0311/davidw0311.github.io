import { Chess } from 'chess.js';
import type { Puzzle } from './chessPuzzles.ts';

export type AnalysisFrame = { fen: string; san: string; move?: string };
export type AnalysisLine = { frames: AnalysisFrame[]; cursor: number };

// Seed the timeline with the full solution, or the solver's accepted line.
export function createAnalysis(puzzle: Puzzle, cursor: number, played?: string[]): AnalysisLine {
  const game = new Chess(puzzle.fen);
  game.move(puzzle.moves[0]);
  const frames: AnalysisFrame[] = [{ fen: game.fen(), san: 'Starting position' }];
  for (const input of played ?? puzzle.moves.slice(1)) {
    const move = game.move(input);
    frames.push({ fen: game.fen(), san: move.san, move: `${move.from}${move.to}${move.promotion || ''}` });
  }
  return { frames, cursor: Math.max(0, Math.min(frames.length - 1, cursor)) };
}

export function moveAnalysis(line: AnalysisLine, input: string): AnalysisLine {
  const game = new Chess(line.frames[line.cursor].fen);
  try {
    const move = game.move(input);
    return { frames: [...line.frames.slice(0, line.cursor + 1), { fen: game.fen(), san: move.san, move: `${move.from}${move.to}${move.promotion || ''}` }], cursor: line.cursor + 1 };
  } catch { return line; }
}

export function stepAnalysis(line: AnalysisLine, direction: -1 | 1): AnalysisLine {
  const cursor = Math.max(0, Math.min(line.frames.length - 1, line.cursor + direction));
  return cursor === line.cursor ? line : { ...line, cursor };
}

export function analysisMessage(fen: string): string {
  const game = new Chess(fen);
  if (game.isCheckmate()) return 'Checkmate. Go back a move to explore another line.';
  if (game.isStalemate()) return 'Stalemate. Go back a move to explore another line.';
  return `${game.turn() === 'w' ? 'White' : 'Black'} to move${game.isCheck() ? ' · in check' : ''}. Try either side’s legal moves. Your rating is unchanged.`;
}
