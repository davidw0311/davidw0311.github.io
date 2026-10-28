'use client';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Chess, type Square } from 'chess.js';
import { ArrowLeft, ArrowRight, ArrowsClockwise, ChartLineUp, Check, Horse, CaretLeft, CaretRight, Fire, Lightbulb, SignOut, Target, UserCircle } from '@phosphor-icons/react';
import { getSupabase } from '../piano-party/account/supabase';
import { hasSeen, playPuzzleMove, skillLevel, solutionFrames, startPuzzle, targetRating, themeLabel, type Puzzle, type PuzzleManifest } from '@/lib/chessPuzzles';
import { useChessProgress } from './useChessProgress';
import AccountDialog from './AccountDialog';
import styles from './chess.module.css';

const pieceNames: Record<string, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const assetRoot = '/assets/chess/puzzles';
type Round = { puzzle: Puzzle; fen: string; cursor: number; color: 'w' | 'b'; status: 'playing' | 'solved' | 'revealed'; message: string; failed: boolean; review: boolean; san: string[]; hint: string; frame: number };
export default function ChessPractice() {
  const { progress, user, ready, syncStatus, record, retrySync, guestAvailable, importGuest } = useChessProgress();
  const [manifest, setManifest] = useState<PuzzleManifest | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const roundRef = useRef<Round | null>(null);
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{ from: string; to: string } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [difficulty, setDifficulty] = useState('adaptive');
  const [tab, setTab] = useState<'practice' | 'progress'>('practice');
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [accountError, setAccountError] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const message = params.get('error_description');
    if (message) {
      const timer = setTimeout(() => setAccountError(message), 0);
      window.history.replaceState(null, '', window.location.pathname);
      return () => clearTimeout(timer);
    }
  }, []);
  const cache = useRef(new Map<number, Promise<Puzzle[]>>());
  const visited = useRef(new Set<number>());
  const request = useRef(0);
  const dragFrom = useRef<string | null>(null);
  const currentProgress = useRef(progress);
  useEffect(() => { currentProgress.current = progress; }, [progress]);
  const level = skillLevel(progress.rating);
  function updateRound(next: Round) { roundRef.current = next; setRound(next); }
  const loadBucket = useCallback((bucket: { rating: number; offset: number }) => {
    let promise = cache.current.get(bucket.rating);
    if (!promise) {
      promise = fetch(`${assetRoot}/${bucket.rating}.json`).then(async response => {
        if (!response.ok) throw new Error('Could not load puzzles. Check your connection and try again.');
        const rows: Omit<Puzzle, 'index'>[] = await response.json();
        return rows.map((p, i) => ({ ...p, index: bucket.offset + i }));
      }).catch(e => { cache.current.delete(bucket.rating); throw e; });
      cache.current.set(bucket.rating, promise);
    }
    return promise;
  }, []);
  // Sampling happens only when a puzzle is requested, never during rendering.
  /* eslint-disable react-hooks/purity */
  const nextPuzzle = useCallback(async (mode = 'adaptive', reviewIndex?: number) => {
    if (!manifest) return;
    const serial = ++request.current; setLoading(true); setError(''); setSelected(null); setPromotion(null);
    try {
      const p = currentProgress.current;
      const target = targetRating(p, mode);
      let chosen: Puzzle | undefined;
      const buckets = [...manifest.buckets].sort((a, b) => Math.abs(a.rating - target) - Math.abs(b.rating - target));
      function unused(rows: Puzzle[]) { return rows.filter(row => !hasSeen(p, row.index) && !visited.current.has(row.index)); }
      if (reviewIndex !== undefined) {
        const bucket = manifest.buckets.find(b => reviewIndex >= b.offset && reviewIndex < b.offset + b.count);
        if (bucket) chosen = (await loadBucket(bucket)).find(row => row.index === reviewIndex);
      } else {
        for (const bucket of buckets) {
          const candidates = unused(await loadBucket(bucket));
          if (candidates.length) { chosen = candidates[Math.floor(Math.random() * candidates.length)]; break; }
        }
        // The whole bank remains playable after completion; repeats are clearly marked as review.
        if (!chosen && buckets[0]) { const rows = await loadBucket(buckets[0]); chosen = rows[Math.floor(Math.random() * rows.length)]; }
      }
      if (serial !== request.current) return;
      if (!chosen) throw new Error('That puzzle is unavailable. Try another puzzle.');
      visited.current.add(chosen.index);
      const start = startPuzzle(chosen);
      const next: Round = { puzzle: chosen, ...start, status: 'playing', message: '', failed: false, review: hasSeen(p, chosen.index), san: [], hint: '', frame: 0 };
      roundRef.current = next; setRound(next); setFlipped(false);
    } catch (e) { if (serial === request.current) setError(e instanceof Error ? e.message : 'Could not load a puzzle. Please retry.'); }
    finally { if (serial === request.current) setLoading(false); }
  }, [manifest, loadBucket]);
  /* eslint-enable react-hooks/purity */
  const fetchManifest = useCallback(async () => {
    setError(''); setLoading(true);
    try {
      const response = await fetch(`${assetRoot}/manifest.json`);
      if (!response.ok) throw new Error('Could not load the puzzle library. Check your connection, then retry.');
      setManifest(await response.json());
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load puzzles.'); setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => { void fetchManifest(); }, 0); return () => clearTimeout(timer); }, [fetchManifest]);
  useEffect(() => {
    const timer = setTimeout(() => { if (ready && manifest) { visited.current.clear(); void nextPuzzle(); } }, 0);
    const counter = request;
    return () => { clearTimeout(timer); counter.current++; };
  }, [ready, user?.id, manifest, nextPuzzle]);
  function finish(won: boolean, r: Round) {
    if (!r.failed || won && r.review) record({ index: r.puzzle.index, rating: r.puzzle.rating, won, at: new Date().toISOString() });
  }
  function attemptMove(from: string, to: string, promote?: string) {
    const r = roundRef.current;
    if (!r || !ready || loading || r.status !== 'playing') return;
    const game = new Chess(r.fen);
    const moves = game.moves({ verbose: true }).filter(m => m.from === from && m.to === to);
    if (!promote && moves.some(m => m.promotion)) { setPromotion({ from, to }); return; }
    const result = playPuzzleMove(r.puzzle, r.fen, r.cursor, `${from}${to}${promote || ''}`);
    setPromotion(null); setSelected(null);
    if (result.status === 'illegal') { updateRound({ ...r, message: 'That move isn’t legal. Choose a legal destination.' }); return; }
    if (result.status === 'incorrect') {
      finish(false, r);
      updateRound({ ...r, failed: true, message: 'Not quite. The position is restored. Keep looking, or use a hint.' }); return;
    }
    const solved = result.status === 'solved';
    if (solved) finish(!r.failed, r);
    updateRound({ ...r, fen: result.fen, cursor: result.cursor, san: [...r.san, ...result.san], hint: '',
      status: solved ? 'solved' : 'playing', frame: solved ? solutionFrames(r.puzzle).length - 1 : 0,
      message: solved ? (r.failed ? 'You found the line. Nicely worked through.' : r.review ? 'Review complete. No rating change.' : 'Puzzle solved. Well calculated.') : 'Good move. Find the continuation.' });
  }
  function selectSquare(square: Square) {
    if (!round || round.status !== 'playing' || loading || !ready) return;
    const game = new Chess(round.fen); const piece = game.get(square);
    if (selected && square !== selected && piece?.color !== round.color) { attemptMove(selected, square); return; }
    setSelected(piece?.color === round.color && selected !== square ? square : null);
  }
  function hint() {
    const r = roundRef.current; if (!r || r.status !== 'playing') return;
    finish(false, r);
    const move = r.puzzle.moves[r.cursor]; const piece = new Chess(r.fen).get(move.slice(0, 2) as Square);
    updateRound({ ...r, failed: true, hint: r.hint ? move : move.slice(0, 2), message: r.hint ? `Try ${move.slice(0, 2)} to ${move.slice(2, 4)}${move[4] ? `, promoting to ${pieceNames[move[4]]}` : ''}.` : `Look at your ${pieceNames[piece?.type || 'p']} on ${move.slice(0, 2)}. This attempt is now practice.` });
  }
  function reveal() {
    const r = roundRef.current; if (!r || r.status !== 'playing') return;
    finish(false, r); setSelected(null); setPromotion(null);
    updateRound({ ...r, failed: true, status: 'revealed', frame: 0, message: 'Step through the solution, then try another position.' });
  }
  function skip() {
    const r = roundRef.current;
    if (r?.status === 'playing') finish(false, r);
    void nextPuzzle(difficulty);
  }
  function review(index: number) {
    const r = roundRef.current;
    if (r?.status === 'playing') finish(false, r);
    setTab('practice'); void nextPuzzle(difficulty, index);
  }
  function boardKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const delta: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -8, ArrowDown: 8 };
    if (!(event.key in delta)) return;
    event.preventDefault(); document.getElementById(`chess-square-${Math.max(0, Math.min(63, index + delta[event.key]))}`)?.focus();
  }
  async function signOut() {
    setAccountError('');
    await retrySync();
    const { error } = await getSupabase().auth.signOut();
    if (error) setAccountError('Could not log out. Please reconnect and try again.');
  }
  const frames = round && round.status !== 'playing' ? solutionFrames(round.puzzle) : [];
  const displayFen = frames.length ? frames[round!.frame].fen : round?.fen;
  const game = displayFen ? new Chess(displayFen) : null;
  const whiteBottom = round ? (round.color === 'w') !== flipped : true;
  const files = whiteBottom ? 'abcdefgh' : 'hgfedcba';
  const ranks = whiteBottom ? '87654321' : '12345678';
  const squares = [...ranks].flatMap(rank => [...files].map(file => `${file}${rank}` as Square));
  const legal = selected && game ? game.moves({ square: selected, verbose: true }).map(m => m.to) : [];
  const accuracy = progress.attempts ? Math.round(progress.solved / progress.attempts * 100) : 0;
  const points = [...(progress.attempts < 30 ? [800] : []), ...progress.history.map(h => h[0])];
  const low = Math.min(...points) - 35, high = Math.max(...points) + 35;
  const line = points.map((rating, i) => `${20 + i / Math.max(1, points.length - 1) * 560},${150 - (rating - low) / (high - low) * 120}`).join(' ');
  const canPlay = Boolean(ready && round && !loading && round.status === 'playing');
  return <main className={styles.app}>
    <a className="skip-link" href="#puzzle-board">Skip to chessboard</a>
    <header className={styles.header}>
      <Link href="/#space" className={styles.back}><ArrowLeft size={17} /><span>Space</span></Link>
      <Link href="/projects/chess-practice/" className={styles.brand}><Horse size={28} weight="fill" /><span>Chess<span className={styles.brandLight}> Practice</span></span></Link>
      <div className={styles.account}>{user ? <><span className={styles.userName}>{String(user.user_metadata.full_name || 'Player').slice(0, 30)}</span><button className={styles.iconButton} onClick={() => void signOut()} aria-label="Log out"><SignOut size={20} /></button></> : <button className={styles.login} onClick={() => setAuthOpen(true)}><UserCircle size={20} />Log in</button>}</div>
    </header>
    <div className={styles.shell}>
      <div className={styles.intro}>
        <div><p className={styles.eyebrow}>A little practice. A sharper game.</p><h1>Find your next move.</h1><p>Real positions. Unlimited puzzles. A challenge that grows with you.</p></div>
        <div className={styles.topRating}><Target size={21} /><span><strong>{progress.rating}</strong><small>Puzzle rating {progress.attempts < 10 && '· provisional'}</small></span></div>
      </div>
      <nav className={styles.tabs} aria-label="Chess practice sections">
        <button aria-current={tab === 'practice' ? 'page' : undefined} onClick={() => setTab('practice')}><Horse size={19} />Practice</button>
        <button aria-current={tab === 'progress' ? 'page' : undefined} onClick={() => setTab('progress')}><ChartLineUp size={19} />Your progress</button>
        <span className={styles.sync}><span className={user ? styles.syncDot : styles.localDot} />{ready ? syncStatus : 'Loading your progress…'}{user && <button aria-label="Retry saving progress" onClick={() => void retrySync()}><ArrowsClockwise size={14} /></button>}</span>
      </nav>
      {accountError && <p role="alert" className={styles.error}>{accountError}</p>}
      {guestAvailable && <div className={styles.importNotice}><p>Your guest practice is saved separately on this device.</p><button onClick={importGuest}>Add it to my account <ArrowRight size={16} /></button></div>}
      {tab === 'practice' ? <div className={styles.practice}>
        <section className={styles.boardSection} aria-label="Chess puzzle">
          <div className={styles.boardCaption}><span className={styles.turn}><i className={round?.color === 'b' ? styles.blackDisc : styles.whiteDisc} />{round ? `${round.color === 'w' ? 'White' : 'Black'} to move` : 'Preparing your puzzle'}</span><span>{round?.review ? 'Review · unrated' : round?.failed ? 'Practice · attempt recorded' : 'Rated puzzle'}</span></div>
          <div id="puzzle-board" className={styles.boardFrame}>
            <div className={styles.board} role="group" aria-label="Chessboard. Select a piece, then its destination. Arrow keys move focus.">
              {squares.map((square, i) => {
                const piece = game?.get(square); const dark = (square.charCodeAt(0) - 97 + Number(square[1])) % 2 === 0;
                const hinted = round?.hint.slice(0, 2) === square || round?.hint.slice(2, 4) === square;
                return <button key={square} id={`chess-square-${i}`} type="button" data-square={square} className={`${styles.square} ${dark ? styles.dark : styles.light} ${selected === square ? styles.selected : ''} ${hinted ? styles.hinted : ''}`} aria-label={`${square}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${pieceNames[piece.type]}` : ' empty'}`} aria-pressed={selected === square} aria-disabled={!canPlay} onKeyDown={e => boardKey(e, i)} onClick={() => selectSquare(square)} draggable={canPlay && piece?.color === round?.color} onDragStart={e => { dragFrom.current = square; e.dataTransfer.setData('text/plain', square); e.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => { dragFrom.current = null; }} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (dragFrom.current) attemptMove(dragFrom.current, square); dragFrom.current = null; }}>
                  {i % 8 === 0 && <span className={styles.rank} aria-hidden="true">{square[1]}</span>}
                  {i >= 56 && <span className={styles.file} aria-hidden="true">{square[0]}</span>}
                  {piece && <Image src={`/assets/chess/pieces/${piece.color}${piece.type.toUpperCase()}.svg`} alt="" draggable={false} width={80} height={80} />}
                  {legal.includes(square) && <span className={piece ? styles.capture : styles.moveDot} />}
                </button>;
              })}
            </div>
            {(loading || !ready) && !error && <div className={styles.boardLoading} role="status"><Horse size={42} weight="thin" /><span>{ready ? 'Finding your next challenge…' : 'Loading your practice…'}</span></div>}
            {error && <div className={styles.boardLoading} role="alert"><p>{error}</p><button className={styles.primary} onClick={() => manifest ? void nextPuzzle(difficulty) : void fetchManifest()}>Try again</button></div>}
            {promotion && <div className={styles.promotion} role="dialog" aria-label="Choose promotion piece"><p>Promote your pawn</p><div>{['q', 'r', 'b', 'n'].map(piece => <button key={piece} aria-label={`Promote to ${pieceNames[piece]}`} onClick={() => attemptMove(promotion.from, promotion.to, piece)}><Image alt={pieceNames[piece]} src={`/assets/chess/pieces/${round?.color}${piece.toUpperCase()}.svg`} width={60} height={60} /></button>)}</div><button className={styles.textButton} onClick={() => setPromotion(null)}>Cancel</button></div>}
          </div>
          <div className={styles.boardFooter}><span>Click or drag to move.{round && ` · #${round.puzzle.id}`}</span><button disabled={!round || loading} onClick={() => setFlipped(v => !v)}><ArrowsClockwise size={17} />Flip board</button></div>
        </section>
        <aside className={styles.sidebar}>
          <section className={styles.challenge}>
            <p className={styles.eyebrow}>{round?.status === 'solved' ? 'Position understood' : round?.status === 'revealed' ? 'Learn the line' : 'Your next challenge'}</p>
            <h2>{round?.status === 'solved' ? 'That’s the move.' : round?.status === 'revealed' ? 'See how it works.' : 'Take your time.'}</h2>
            <p>{round?.status === 'playing' || !round ? 'Find the best move, then follow the line. There’s no clock to race.' : round?.review ? 'Practice makes patterns familiar. Review puzzles don’t change your rating.' : `This puzzle was rated ${round?.puzzle.rating}.`}</p>
            <div className={styles.feedback} role="status" aria-live="polite">{round?.status === 'solved' && <Check size={21} weight="bold" />}<span>{round?.message || 'Look for checks, captures, and threats.'}</span></div>
            {round?.status !== 'playing' && round && <>
              <a className={styles.sourceGame} href={round.puzzle.gameUrl} target="_blank" rel="noreferrer">View original game ↗</a>
              <div className={styles.themes}>{round.puzzle.themes.filter(t => !['short', 'long', 'veryLong', 'oneMove', 'master', 'masterVsMaster'].includes(t)).map(t => <span key={t}>{themeLabel(t)}</span>)}</div>
              <div className={styles.playback}><button aria-label="Previous solution move" disabled={round.frame === 0} onClick={() => updateRound({ ...round, frame: round.frame - 1 })}><CaretLeft size={19} /></button><span>{round.frame === 0 ? 'Starting position' : `${round.frame} / ${frames.length - 1} · ${frames[round.frame]?.san}`}</span><button aria-label="Next solution move" disabled={round.frame >= frames.length - 1} onClick={() => updateRound({ ...round, frame: round.frame + 1 })}><CaretRight size={19} /></button></div>
              <button className={styles.primary} disabled={loading || !ready} onClick={() => void nextPuzzle(difficulty)}>Next puzzle <ArrowRight size={19} /></button>
            </>}
            {(!round || round.status === 'playing') && <div className={styles.tools}><button disabled={!canPlay} onClick={hint}><Lightbulb size={19} />{round?.hint ? 'Show move' : 'Hint'}</button><button disabled={!canPlay} onClick={reveal}>Show solution</button></div>}
            {round?.san.length ? <div className={styles.moveList}><small>Your line</small><p>{round.san.join('  ')}</p></div> : null}
          </section>
          <div className={styles.settings}><label htmlFor="difficulty">Challenge level</label><select id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value)}><option value="adaptive">Adaptive · matched to you</option><option value="gentle">Gentle · build confidence</option><option value="challenge">Stretch · think a little deeper</option></select><small>Applies to the next puzzle.</small><button disabled={!round || loading || !ready} className={styles.textButton} onClick={skip}>{round?.status === 'playing' ? 'Skip puzzle' : 'Another puzzle'} <ArrowRight size={15} /></button></div>
          <section className={styles.skill}><div className={styles.skillHeading}><Target size={21} /><span>Your skill level</span></div><h3>{level.name}</h3><div className={styles.skillTrack} role="progressbar" aria-label="Progress to next skill level" aria-valuemin={level.floor} aria-valuemax={level.next} aria-valuenow={progress.rating}><span style={{ width: `${Math.max(0, Math.min(100, (progress.rating - level.floor) / (level.next - level.floor) * 100))}%` }} /></div><p>{progress.attempts < 10 ? `${10 - progress.attempts} more rated puzzles to settle your starting rating.` : `${level.next - progress.rating} rating points to the next milestone.`}</p><div className={styles.miniStats}><span><strong>{progress.solved}</strong>solved</span><span><strong>{accuracy}%</strong>accuracy</span><span><strong><Fire size={18} />{progress.streak}</strong>solve streak</span></div></section>
        </aside>
      </div> : <section className={styles.progressPage} aria-labelledby="progress-title">
        <div className={styles.progressHeading}><div><p className={styles.eyebrow}>Every position adds up</p><h2 id="progress-title">Your game is growing.</h2></div><button className={styles.primary} onClick={() => setTab('practice')}>Keep practising <ArrowRight size={17} /></button></div>
        <div className={styles.stats}><div><small>Puzzle rating</small><strong>{progress.rating}</strong><span>{level.name}</span></div><div><small>Puzzles solved</small><strong>{progress.solved}</strong><span>of {progress.attempts} first attempts</span></div><div><small>Accuracy</small><strong>{accuracy}%</strong><span>First attempt, without hints</span></div><div><small>Personal best</small><strong>{progress.best}</strong><span>Longest solve streak: {progress.longest}</span></div></div>
        <div className={styles.progressGrid}><section className={styles.chart}><h3>Your rating over time</h3>{progress.history.length > 1 ? <><svg viewBox="0 0 600 185" role="img" aria-label={`Puzzle rating over the last ${progress.history.length} attempts: ${progress.history.map(h => h[0]).join(', ')}`}><path d="M20 155H580" stroke="currentColor" opacity=".16" /><polyline points={line} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" /></svg><div className={styles.chartLabels}><span>Recent {progress.history.length} attempts</span><strong>{progress.rating} now</strong></div></> : <p className={styles.empty}>Solve a few puzzles to see your rating take shape.</p>}<small>Your puzzle rating measures tactics practice in this app. It isn’t a game rating or an official Elo.</small></section><section className={styles.activity}><h3>Practice rhythm</h3><div className={styles.activityBars}>{Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setUTCDate(d.getUTCDate() - 13 + i); const date = d.toISOString().slice(0, 10); const n = progress.days.find(day => day[0] === date)?.[1] || 0; return <div key={date} title={`${date}: ${n} puzzles`}><span style={{ height: `${n ? Math.max(10, Math.min(100, n * 8)) : 4}%` }} /><small>{d.getUTCDate()}</small></div>; })}</div><p>{progress.days.reduce((n, d) => n + d[1], 0)} {progress.days.reduce((n, d) => n + d[1], 0) === 1 ? 'puzzle' : 'puzzles'} across your most recent 30 active days. Daily totals use UTC.</p></section></div>
        <section className={styles.review}><div><p className={styles.eyebrow}>Turn mistakes into patterns</p><h3>Worth another look.</h3><p>{progress.missed.length ? 'Revisit missed puzzles without affecting your rating.' : 'Missed puzzles will appear here for another try.'}</p></div><div className={styles.reviewList}>{progress.missed.slice(-8).reverse().map((index, i) => <button disabled={loading || !ready} key={index} onClick={() => review(index)}><span>Review position {i + 1}</span><ArrowRight size={18} /></button>)}</div></section>
      </section>}
      {!user && <section className={styles.guestBanner}><UserCircle size={25} /><p><strong>Your progress has a home.</strong><span>Practise as a guest, or log in to take your rating with you.</span></p><button onClick={() => setAuthOpen(true)}>Save my progress <ArrowRight size={17} /></button></section>}
      <details className={styles.how}><summary>How puzzles and ratings work</summary><p>Solve the full line without a wrong move or hint to earn rating points. The first incorrect legal move, hint, solution reveal, or skip records one failed attempt. You can keep practising after a mistake. Illegal moves don’t count against you. Reviews never earn extra rating points.</p><p>Your rating uses Elo-style updates against each puzzle’s difficulty, with faster calibration for your first 10 attempts. Adaptive mode mixes comfortable positions with occasional harder challenges. Skill labels describe progress within this app.</p><p>There is no daily limit. The library contains {manifest?.count.toLocaleString() || 'over 11,000'} puzzles; after you finish it, you can continue reviewing. Account progress syncs online. Guest progress stays in this browser. Avoid solving on multiple devices at exactly the same time.</p></details>
      <footer className={styles.footer}><span>A better player, one position at a time.</span><span>Puzzles: <a href="https://database.lichess.org/" target="_blank" rel="noreferrer">Lichess · CC0</a><span className={styles.footerSep}>/</span>Pieces: <a href="https://github.com/LexLuengas/chessnut-pieces" target="_blank" rel="noreferrer">Chessnut · Apache 2.0</a></span></footer>
    </div>
    {authOpen && <AccountDialog onClose={() => setAuthOpen(false)} />}
  </main>;
}
