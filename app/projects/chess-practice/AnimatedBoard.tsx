'use client';
import { useState, type KeyboardEvent } from 'react';
import Image from 'next/image';
import { Chess, type Square } from 'chess.js';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { reconcilePieces, squarePosition } from '@/lib/chessMotion';
import styles from './chess.module.css';

export const pieceNames: Record<string, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
export const pieceRoot = '/assets/chess/pieces/classic';
export default function AnimatedBoard({ fen, whiteBottom, selected, hint, lastMove, canPlay, playerColor, duration, onSelect, onMove }: {
  fen: string; whiteBottom: boolean; selected: Square | null; hint: string; lastMove?: string;
  canPlay: boolean; playerColor: 'w' | 'b'; duration: number;
  onSelect: (square: Square) => void; onMove: (from: string, to: string) => void;
}) {
  const [tracked, setTracked] = useState(() => ({ fen, pieces: reconcilePieces([], fen) }));
  if (tracked.fen !== fen) setTracked({ fen, pieces: reconcilePieces(tracked.pieces, fen) });
  const reducedMotion = useReducedMotion();
  const seconds = reducedMotion ? 0 : duration / 1000;
  const game = new Chess(fen);
  const files = whiteBottom ? 'abcdefgh' : 'hgfedcba';
  const ranks = whiteBottom ? '87654321' : '12345678';
  const squares = [...ranks].flatMap(rank => [...files].map(file => `${file}${rank}` as Square));
  const legal = selected ? game.moves({ square: selected, verbose: true }).map(m => m.to) : [];
  function boardKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const delta: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -8, ArrowDown: 8 };
    if (!(event.key in delta)) return;
    event.preventDefault(); document.getElementById(`chess-square-${Math.max(0, Math.min(63, index + delta[event.key]))}`)?.focus();
  }
  return <>
    <div className={styles.boardSurface}>
      <div className={styles.board} role="group" aria-label="Chessboard. Select a piece, then its destination. Arrow keys move focus.">
        {squares.map((square, i) => {
          const piece = game.get(square);
          const dark = (square.charCodeAt(0) - 97 + Number(square[1])) % 2 === 0;
          const hinted = hint.slice(0, 2) === square || hint.slice(2, 4) === square;
          const moved = lastMove?.slice(0, 2) === square || lastMove?.slice(2, 4) === square;
          return <button key={square} id={`chess-square-${i}`} type="button" data-square={square}
            className={`${styles.square} ${dark ? styles.dark : styles.light} ${moved ? styles.lastMove : ''} ${selected === square ? styles.selected : ''} ${hinted ? styles.hinted : ''}`}
            aria-label={`${square}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${pieceNames[piece.type]}` : ' empty'}`}
            aria-pressed={selected === square} aria-disabled={!canPlay} onKeyDown={e => boardKey(e, i)}
            onClick={() => onSelect(square)} draggable={canPlay && piece?.color === playerColor}
            onDragStart={e => {
              e.dataTransfer.setData('application/x-chess-square', square); e.dataTransfer.effectAllowed = 'move';
              const image = e.currentTarget.closest('[role="group"]')?.parentElement?.querySelector<HTMLImageElement>(`[data-piece-square="${square}"] img`);
              if (image) { const bounds = image.getBoundingClientRect(); e.dataTransfer.setDragImage(image, bounds.width / 2, bounds.height / 2); }
              if (selected !== square) onSelect(square);
            }}
            onDragOver={e => { if (canPlay) e.preventDefault(); }} onDrop={e => {
              e.preventDefault(); const from = e.dataTransfer.getData('application/x-chess-square');
              if (canPlay && /^[a-h][1-8]$/.test(from)) onMove(from, square);
            }}>
            {legal.includes(square) && <span className={piece ? styles.capture : styles.moveDot} />}
          </button>;
        })}
      </div>
      <div className={styles.pieces} aria-hidden="true">
        <AnimatePresence initial={false}>
          {tracked.pieces.map(piece => {
            const pos = squarePosition(piece.square, whiteBottom);
            return <motion.div key={piece.id} data-piece-id={piece.id} data-piece-square={piece.square}
              className={styles.piece} initial={false} animate={{ x: `${pos.x}%`, y: `${pos.y}%`, opacity: 1 }}
              exit={{ opacity: 0, transition: { delay: seconds * .75, duration: seconds * .25 } }}
              transition={{ duration: seconds, ease: [.25, .1, .25, 1] }}
              style={{ zIndex: piece.square === lastMove?.slice(2, 4) ? 3 : 2 }}>
              <Image src={`${pieceRoot}/${piece.color}${piece.type.toUpperCase()}.svg`} alt="" draggable={false} width={80} height={80} priority />
            </motion.div>;
          })}
        </AnimatePresence>
      </div>
    </div>
    <div className={styles.rankLabels} aria-hidden="true">{[...ranks].map(rank => <span key={rank}>{rank}</span>)}</div>
    <div className={styles.fileLabels} aria-hidden="true">{[...files].map(file => <span key={file}>{file}</span>)}</div>
  </>;
}
