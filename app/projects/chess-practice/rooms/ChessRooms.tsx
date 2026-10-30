'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Chess, type Square } from 'chess.js';
import { ArrowLeft, ArrowRight, ArrowsClockwise, Check, Copy, Flag, Handshake, ListNumbers, ShareNetwork, SlidersHorizontal, Users, ArrowCounterClockwise } from '@phosphor-icons/react';
import { useChessRoom, type RoomView } from '@/lib/chessRoomClient';
import AnimatedBoard, { pieceNames, pieceRoot } from '../AnimatedBoard';
import { SLOW_MOVE_MS } from '@/lib/chessMotion';
import HandicapDialog from './HandicapDialog';
import RoomDialog from './RoomDialog';
import boardStyles from '../chess.module.css';
import styles from './rooms.module.css';

const colorName = (color: string) => color === 'w' ? 'White' : 'Black';
const endings: Record<string, string> = { checkmate: 'Checkmate', stalemate: 'Stalemate', repetition: 'Threefold repetition', 'insufficient-material': 'Insufficient material', 'fifty-move-rule': 'Fifty-move rule', agreement: 'Draw agreed', resignation: 'Resignation' };

function Entry({ invitedCode, busy, enter }: { invitedCode: string; busy: boolean; enter: (op: 'create' | 'join', name: string, code?: string, color?: 'w' | 'b') => Promise<void> }) {
  const [mode, setMode] = useState<'create' | 'join'>(invitedCode ? 'join' : 'create');
  const [name, setName] = useState(''), [code, setCode] = useState(invitedCode), [color, setColor] = useState<'w' | 'b'>('w');
  function submit(e: FormEvent) { e.preventDefault(); void enter(mode, name, code, color); }
  return <section className={styles.entry} aria-labelledby="room-entry-title"><div className={styles.entryIntro}><Image src={`${pieceRoot}/wN.svg`} width={60} height={60} alt="" /><p className={styles.eyebrow}>A board for two</p><h1 id="room-entry-title">Your next game,<br />with a friend.</h1><p>Choose your sides. Give a piece head start. Take back a move when you both agree.</p><span>No account needed · Friendly, untimed games</span></div><form onSubmit={submit} className={styles.entryForm}>
    <div className={styles.modeTabs}><button type="button" aria-pressed={mode === 'create'} onClick={() => setMode('create')}>Create room</button><button type="button" aria-pressed={mode === 'join'} onClick={() => setMode('join')}>Join room</button></div>
    <label>Your name<input required maxLength={24} autoComplete="nickname" value={name} onChange={e => setName(e.target.value)} placeholder="What should your friend call you?" /></label>
    {mode === 'join' ? <label>Room code<input required maxLength={6} minLength={6} value={code} autoCapitalize="characters" autoComplete="off" spellCheck={false} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''))} placeholder="ABC234" className={styles.codeInput} /></label> : <label>Your pieces<select value={color} onChange={e => setColor(e.target.value as 'w' | 'b')}><option value="w">White · move first</option><option value="b">Black</option></select></label>}
    <button className={styles.primary} disabled={busy || !name.trim() || mode === 'join' && code.length !== 6}>{busy ? 'Connecting…' : mode === 'create' ? 'Create a room' : 'Join the board'}<ArrowRight size={18} /></button><p>{mode === 'create' ? 'Set handicaps in the lobby, then share the invitation.' : 'Your friend can find this code at the top of their room.'} Keep this browser to return to your seat.</p>
  </form></section>;
}
function statusHeading(view: RoomView) {
  if (view.pending) return view.pending.type === 'takeback' ? 'Takeback requested' : 'Draw offered';
  if (view.result) return view.result.winner ? `${colorName(view.result.winner)} wins` : 'Draw';
  return view.turn === view.me.color ? view.check ? 'You’re in check' : 'Your move' : `${view.players.find(p => !p.isMe)?.name || 'Your opponent'} to move`;
}
export default function ChessRooms() {
  const room = useChessRoom();
  const { view, busy, error, uncertain, expired, connectivity, command } = room;
  const [selected, setSelected] = useState<Square | null>(null), [promotion, setPromotion] = useState<{ from: string; to: string } | null>(null);
  const [flipped, setFlipped] = useState(false), [modal, setModal] = useState<'handicap' | 'takeback' | 'moves' | 'resign' | 'share' | null>(null);
  const [copied, setCopied] = useState(false), [invite, setInvite] = useState('');
  const locked = busy || uncertain || expired || connectivity !== 'online';
  const canPlay = Boolean(view && view.status === 'playing' && !view.pending && view.turn === view.me.color && !locked);
  const opponent = view?.players.find(p => !p.isMe), me = view?.players.find(p => p.isMe);
  const game = view ? new Chess(view.fen) : null;
  async function move(from: string, to: string, promote?: string) {
    if (!canPlay || !view || !game) return;
    const choices = game.moves({ verbose: true }).filter(m => m.from === from && m.to === to);
    if (!choices.length) { setSelected(null); return; }
    if (!promote && choices.some(m => m.promotion)) { setPromotion({ from, to }); return; }
    setPromotion(null); setSelected(null); await command({ type: 'move', move: `${from}${to}${promote || ''}` });
  }
  function select(square: Square) {
    if (!canPlay || !view || !game) return;
    const piece = game.get(square);
    if (selected && selected !== square && piece?.color !== view.me.color) { void move(selected, square); return; }
    setSelected(piece?.color === view.me.color && selected !== square ? square : null);
  }
  async function share() {
    if (!view) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${view.code}`;
    setInvite(url); setModal('share'); setCopied(false);
    try { await navigator.clipboard.writeText(url); setCopied(true); } catch { /* The selectable link remains available. */ }
  }
  async function act(value: Record<string, unknown>) { setSelected(null); setPromotion(null); return command(value); }
  const lobby = view?.status === 'lobby';
  return <main className={`${boardStyles.app} ${styles.app}`} data-room-state={!view ? 'entry' : lobby ? 'lobby' : 'game'}>
    <header className={styles.header}><Link href="/projects/chess-practice/" className={styles.back}><ArrowLeft size={19} /><span>Puzzles</span></Link><Link href="/projects/chess-practice/rooms/" className={styles.brand}><Image src={`${pieceRoot}/wN.svg`} width={27} height={27} alt="" />Chess Rooms</Link>{view ? <button className={styles.iconButton} onClick={() => void share()} aria-label="Share room invitation"><ShareNetwork size={21} /></button> : <Users size={23} className={styles.headerIcon} />}</header>
    {error && <div className={styles.error} role="alert"><span>{error}</span>{uncertain ? <button disabled={busy} onClick={() => void room.retryAction()}>Retry action</button> : expired ? <button onClick={room.disconnect}>Back to rooms</button> : <button onClick={room.clearError} aria-label="Dismiss room error">Dismiss</button>}</div>}
    {!room.restored ? <p className={styles.loading} role="status">Preparing your board…</p> : !view && !room.session ? <Entry invitedCode={room.invitedCode} busy={busy} enter={room.enter} /> : !view ? <div className={styles.loading}><p role="status">Reconnecting to your room…</p><button className={styles.secondary} onClick={room.disconnect}>Back to rooms</button></div> : <div className={styles.shell}>
      <div className={styles.roomBar}><button className={styles.roomCode} onClick={() => void share()} aria-label={`Share room ${view.code}`}><Users size={17} /><strong>{view.code}</strong><Copy size={14} /></button><span className={styles.connection} data-online={connectivity === 'online' && !expired}>{expired ? 'Room unavailable' : connectivity === 'online' ? 'Connected' : 'Reconnecting…'}</span><button className={styles.textButton} onClick={room.refresh} aria-label="Refresh room"><ArrowsClockwise size={16} /></button></div>
      <div className={lobby ? styles.lobbyLayout : styles.gameLayout}>
        <section className={boardStyles.boardSection} aria-label="Chess game"><div className={boardStyles.boardGroup}>
          <div className={boardStyles.boardCaption}><span className={styles.playerName}><i className={opponent?.color === 'w' ? boardStyles.whiteDisc : boardStyles.blackDisc} />{opponent?.name || 'Waiting for a friend'}</span><span className={styles.playerState}>{opponent ? lobby ? opponent.ready ? 'Ready' : 'Setting up' : opponent.connected ? colorName(opponent.color) : 'Away' : 'Open seat'}</span></div>
          <div id="room-chessboard" className={boardStyles.boardFrame}><AnimatedBoard key={view.code} fen={view.fen} whiteBottom={(view.me.color === 'w') !== flipped} selected={canPlay ? selected : null} hint="" lastMove={view.moves.at(-1)?.uci} canPlay={canPlay} playerColor={view.me.color} duration={SLOW_MOVE_MS} onSelect={select} onMove={(from, to) => { void move(from, to); }} />
            {promotion && <div className={boardStyles.promotion} role="dialog" aria-label="Choose promotion piece"><p>Promote your pawn</p><div>{['q', 'r', 'b', 'n'].map(p => <button key={p} disabled={locked} aria-label={`Promote to ${pieceNames[p]}`} onClick={() => void move(promotion.from, promotion.to, p)}><Image src={`${pieceRoot}/${view.me.color}${p.toUpperCase()}.svg`} alt={pieceNames[p]} width={60} height={60} /></button>)}</div><button className={styles.textButton} onClick={() => setPromotion(null)}>Cancel</button></div>}
          </div>
          <div className={boardStyles.boardFooter}><span className={styles.playerName}><i className={view.me.color === 'w' ? boardStyles.whiteDisc : boardStyles.blackDisc} />{view.me.name} · You</span><button onClick={() => setFlipped(f => !f)} aria-label="Flip board"><ArrowsClockwise size={15} />Flip</button></div>
        </div></section>
        {lobby ? <aside className={styles.lobbyPanel}><p className={styles.eyebrow}>Before the first move</p><h1>{opponent ? 'Make it your game.' : 'Invite your opponent.'}</h1><p>{opponent ? 'Check your colors and the starting pieces. The game starts when you both confirm.' : 'Share the room link or six-character code. Only two players can join.'}</p><button className={styles.secondary} onClick={() => void share()}><ShareNetwork size={18} />Share invitation</button>
          <label className={styles.colorField}>Your color<select value={view.me.color} disabled={locked} onChange={e => void act({ type: 'color', color: e.target.value })}><option value="w">White · move first</option><option value="b">Black</option></select></label>
          <div className={styles.setupSummary}><div><SlidersHorizontal size={18} /><strong>Piece handicap</strong><span>{view.removed.length ? `${view.removed.length} removed` : 'Full armies'}</span></div><p>{view.removed.length ? view.removed.map(square => { const p = new Chess().get(square as Square); return `${colorName(p!.color)} ${pieceNames[p!.type]} (${square})`; }).join(', ') : 'Give either side a head start by removing starting pieces.'}</p>{view.isHost ? <button className={styles.secondary} disabled={locked} onClick={() => setModal('handicap')}>Choose pieces</button> : <small>The host can change the handicap. Any setup change clears both ready confirmations.</small>}</div>
          <div className={styles.readyPlayers}>{view.players.map(p => <span key={p.color}><i className={p.color === 'w' ? boardStyles.whiteDisc : boardStyles.blackDisc} />{p.name}<small>{p.ready ? <><Check size={14} />Ready</> : 'Not ready'}</small></span>)}</div>
          <button className={styles.primary} disabled={locked || !opponent} onClick={() => void act({ type: 'ready', ready: !me?.ready, setupRevision: view.setupRevision })}>{me?.ready ? 'Cancel ready' : 'Ready to play'}<Check size={18} /></button><button className={styles.textButton} disabled={locked} onClick={() => void act({ type: 'leave' })}>{view.isHost ? 'Close room' : 'Leave lobby'}</button><small className={styles.roomNote}>Setup changes clear both confirmations. Rooms expire after 24 hours without a game action.</small>
        </aside> : <aside className={styles.gamePanel}><section className={styles.gameFeedback} aria-label="Game status"><div className={styles.statusTop}><h1>{statusHeading(view)}</h1><span>{colorName(view.me.color)}</span></div><p role="status" aria-live="polite">{view.pending ? view.pending.type === 'takeback' ? `${view.pending.mine ? 'You asked' : `${view.pending.name} asks`} to undo ${view.pending.plies === 1 ? 'the last move' : 'the last two moves'}. ${view.pending.mine ? 'Waiting for your opponent.' : 'The board changes only if you agree.'}` : `${view.pending.mine ? 'You offered' : `${view.pending.name} offers`} a draw. Waiting for agreement.` : view.result ? `${endings[view.result.reason] || 'Game over'}. ${view.result.winner === view.me.color ? 'Well played.' : 'Thanks for playing.'}` : connectivity !== 'online' ? 'Reconnecting. The board will update before your next move.' : view.turn === view.me.color ? view.check ? 'Your king is under attack. Find a legal response.' : 'Your turn. Select a piece, then its destination.' : 'Your opponent is thinking. No clock, no rush.'}</p>
          <div className={styles.lastMoves}><span>{view.moves.length ? view.moves.slice(-3).map(m => m.san).join('  ·  ') : 'White moves first'}</span><button aria-label="View move history" onClick={() => setModal('moves')}><ListNumbers size={17} /></button></div>
          <div className={styles.gameActions}>{view.pending ? view.pending.mine ? <button className={styles.secondary} disabled={locked} onClick={() => void act({ type: 'cancel' })}>Cancel request</button> : <><button className={styles.secondary} disabled={locked} onClick={() => void act({ type: 'respond', accept: false })}>Decline</button><button className={styles.primary} disabled={locked} onClick={() => void act({ type: 'respond', accept: true })}>Accept<Check size={17} /></button></> : <><button className={styles.secondary} disabled={locked || !view.moves.length || view.result?.reason === 'resignation' || view.result?.reason === 'agreement'} onClick={() => setModal('takeback')}><ArrowCounterClockwise size={18} />Takeback</button>{view.result ? <button className={styles.primary} onClick={room.disconnect}>New room<ArrowRight size={17} /></button> : <><button className={styles.secondary} disabled={locked} onClick={() => void act({ type: 'draw' })}><Handshake size={18} />Draw</button><button className={styles.secondary} disabled={locked} onClick={() => setModal('resign')} aria-label="Resign game"><Flag size={18} /></button></>}</>}</div>
        </section><p className={styles.gameNote}>Friendly game · No rating changes<br />{view.removed.length ? `${view.removed.length} starting pieces removed · ` : ''}Takebacks need your opponent’s agreement.</p></aside>}
      </div>
    </div>}
    {view && modal === 'handicap' && <HandicapDialog key={`${view.code}:${view.revision}`} removed={view.removed} busy={locked} error={error} onSave={removed => act({ type: 'handicap', removed })} onClose={() => setModal(null)} />}
    {view && modal === 'share' && <RoomDialog title="Invite your opponent" onClose={() => setModal(null)}><p>Send this link or ask your friend to enter the room code.</p><strong className={styles.inviteCode}>{view.code}</strong><label className={styles.shareField}>Invitation link<input readOnly value={invite} onFocus={e => e.target.select()} /></label><button className={styles.primary} onClick={async () => { try { await navigator.clipboard.writeText(invite); setCopied(true); } catch { setCopied(false); } }}>{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? 'Link copied' : 'Copy invitation'}</button><p>Your seat key stays in this browser. The invitation only shares the room code.</p></RoomDialog>}
    {view && modal === 'takeback' && <RoomDialog title="Request a takeback" onClose={() => setModal(null)}><p>Your opponent must agree. Play pauses while the request is pending; requests expire after two minutes.</p><div className={styles.takebackChoices}>{[1, 2].map(plies => <button className={styles.secondary} key={plies} disabled={locked || view.moves.length < plies} onClick={async () => { if (await act({ type: 'takeback', plies })) setModal(null); }}><ArrowCounterClockwise size={18} /><span>Undo {plies === 1 ? 'the last move' : 'the last two moves'}<small>{plies === 1 ? 'One piece move' : 'One move from each player'}</small></span></button>)}</div></RoomDialog>}
    {view && modal === 'moves' && <RoomDialog title="Move history" onClose={() => setModal(null)}>{!view.moves.length ? <p>No moves yet.</p> : <ol className={styles.moveHistory}>{Array.from({ length: Math.ceil(view.moves.length / 2) }, (_, i) => <li key={i}><span>{view.moves[i * 2]?.san}</span><span>{view.moves[i * 2 + 1]?.san || '…'}</span></li>)}</ol>}</RoomDialog>}
    {modal === 'resign' && <RoomDialog title="Resign this game?" onClose={() => setModal(null)}><p>Your opponent wins by resignation. This ends the game and cannot be undone with a takeback.</p><div className={styles.dialogActions}><button className={styles.secondary} onClick={() => setModal(null)}>Keep playing</button><button className={styles.primary} disabled={locked} onClick={async () => { if (await act({ type: 'resign' })) setModal(null); }}>Resign game<Flag size={17} /></button></div></RoomDialog>}
  </main>;
}
