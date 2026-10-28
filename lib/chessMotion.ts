import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';

export const SLOW_MOVE_MS = 650;
export const REPLY_PAUSE_MS = 180;
export type BoardPiece = { id: string; square: Square; color: Color; type: PieceSymbol };

/** Keep DOM identities across moves, including captures, castling and promotions. */
export function reconcilePieces(previous: BoardPiece[], fen: string): BoardPiece[] {
  const positions = new Chess(fen).board().flatMap(rank => rank.filter(piece => piece !== null));
  const available = new Map(previous.map(piece => [piece.id, piece]));
  const result: (BoardPiece | null)[] = positions.map(piece => {
    const same = previous.find(p => p.square === piece.square && p.color === piece.color && p.type === piece.type);
    if (!same) return null;
    available.delete(same.id);
    return { ...same, square: piece.square };
  });
  // Match normal moves before considering promotions, so an existing queen keeps its identity.
  for (let i = 0; i < positions.length; i++) {
    if (result[i]) continue;
    const piece = positions[i];
    const match = [...available.values()].find(p => p.color === piece.color && p.type === piece.type);
    if (match) { available.delete(match.id); result[i] = { ...match, square: piece.square }; }
  }
  for (let i = 0; i < positions.length; i++) {
    if (result[i]) continue;
    const piece = positions[i];
    const promotion = [...available.values()].find(p => p.color === piece.color && (p.type === 'p' || piece.type === 'p'));
    if (promotion) available.delete(promotion.id);
    result[i] = { ...piece, id: promotion?.id || `${piece.color}${piece.type}-${piece.square}` };
  }
  return result as BoardPiece[];
}

export function squarePosition(square: Square, whiteBottom: boolean) {
  const file = square.charCodeAt(0) - 97, rank = Number(square[1]) - 1;
  return { x: (whiteBottom ? file : 7 - file) * 100, y: (whiteBottom ? 7 - rank : rank) * 100 };
}

/** An aborted move must never finish in a new puzzle or another account. */
export function waitForMove(milliseconds: number, signal: AbortSignal): Promise<boolean> {
  if (signal.aborted) return Promise.resolve(false);
  if (!milliseconds) return Promise.resolve(true);
  return new Promise(resolve => {
    const abort = () => { clearTimeout(timer); resolve(false); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(true); }, milliseconds);
    signal.addEventListener('abort', abort, { once: true });
  });
}
