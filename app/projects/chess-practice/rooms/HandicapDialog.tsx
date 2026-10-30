'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Chess } from 'chess.js';
import { Check } from '@phosphor-icons/react';
import { pieceNames, pieceRoot } from '../AnimatedBoard';
import RoomDialog from './RoomDialog';
import styles from './rooms.module.css';

const pieces = new Chess().board().flatMap(row => row.filter(p => p && p.type !== 'k'));
export default function HandicapDialog({ removed, onSave, onClose, busy, error }: { removed: string[]; onSave: (removed: string[]) => Promise<boolean>; onClose: () => void; busy: boolean; error: string }) {
  const [chosen, setChosen] = useState(removed);
  function toggle(square: string) { setChosen(current => current.includes(square) ? current.filter(s => s !== square) : [...current, square]); }
  function preset(color: string, kind: string) {
    const rank = color === 'w' ? '1' : '8', pawnRank = color === 'w' ? '2' : '7';
    const squares = kind === 'queen' ? [`d${rank}`] : kind === 'rook' ? [`a${rank}`] : kind === 'knight' ? [`b${rank}`] : kind === 'pawns' ? [`a${pawnRank}`, `b${pawnRank}`] : [];
    setChosen(current => [...current.filter(s => !pieces.some(p => p!.color === color && p!.square === s)), ...squares]);
  }
  return <RoomDialog title="Piece handicap" onClose={onClose}>
    <p>Tap pieces to leave them off the starting board. Both kings stay. Both players must confirm the final setup.</p>
    {error && <p role="alert">{error}</p>}
    {(['w', 'b'] as const).map(color => <section key={color} className={styles.handicapSide}><div><h3>{color === 'w' ? 'White' : 'Black'}</h3><select aria-label={`${color === 'w' ? 'White' : 'Black'} handicap preset`} disabled={busy} defaultValue="custom" onChange={e => preset(color, e.target.value)}><option value="custom" disabled>Choose a preset</option><option value="none">Full army</option><option value="queen">Without a queen</option><option value="rook">Without a rook</option><option value="knight">Without a knight</option><option value="pawns">Without two pawns</option></select></div>
      <div className={styles.handicapPieces}>{pieces.filter(p => p!.color === color).map(p => <button key={p!.square} aria-label={`Remove ${color === 'w' ? 'white' : 'black'} ${pieceNames[p!.type]} on ${p!.square}`} aria-pressed={chosen.includes(p!.square)} disabled={busy} onClick={() => toggle(p!.square)}><Image src={`${pieceRoot}/${color}${p!.type.toUpperCase()}.svg`} width={38} height={38} alt="" /><span>{p!.square}</span>{chosen.includes(p!.square) && <Check size={16} weight="bold" />}</button>)}</div>
    </section>)}
    <div className={styles.dialogActions}><button className={styles.secondary} disabled={busy} onClick={() => setChosen([])}>Reset all</button><button className={styles.primary} disabled={busy} onClick={async () => { if (await onSave(chosen)) onClose(); }}>{busy ? 'Saving…' : `Use setup${chosen.length ? ` · ${chosen.length} removed` : ''}`}</button></div>
  </RoomDialog>;
}
