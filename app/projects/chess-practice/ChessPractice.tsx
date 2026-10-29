'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Chess, type Square } from 'chess.js';
import { ArrowLeft, ArrowRight, ArrowsClockwise, ChartLineUp, Check, Horse, CaretLeft, CaretRight, Fire, Lightbulb, SignOut, Target, UserCircle, GearSix, Eye, SkipForward, ArrowCounterClockwise, BookmarkSimple } from '@phosphor-icons/react';
import { getSupabase } from '../piano-party/account/supabase';
import { hasSeen, playPuzzleMove, skillLevel, solutionFrames, startPuzzle, targetRating, themeLabel, type Puzzle, type PuzzleManifest } from '@/lib/chessPuzzles';
import { useChessProgress } from './useChessProgress';
import AccountDialog from './AccountDialog';
import AnimatedBoard, { pieceNames, pieceRoot } from './AnimatedBoard';
import PracticeDialog from './PracticeDialog';
import { REPLY_PAUSE_MS, SLOW_MOVE_MS, waitForMove } from '@/lib/chessMotion';
import { analysisMessage, createAnalysis, moveAnalysis, stepAnalysis, type AnalysisLine } from '@/lib/chessAnalysis';
import { collectionIndexes } from '@/lib/chessCollection';
import SavedPuzzles from './SavedPuzzles';
import styles from './chess.module.css';

const assetRoot = '/assets/chess/puzzles';
type Round = { puzzle: Puzzle; fen: string; cursor: number; color: 'w' | 'b'; status: 'playing' | 'solved' | 'revealed'; message: string; failed: boolean; review: boolean; san: string[]; hint: string; frame: number; lastMove?: string; startingRating: number; analysis?: AnalysisLine };
export default function ChessPractice() {
  const { progress, collection, savePuzzle, user, ready, syncStatus, record, retrySync, guestAvailable, importGuest } = useChessProgress();
  const savedIndexes = useMemo(() => collectionIndexes(collection), [collection]);
  const [manifest, setManifest] = useState<PuzzleManifest | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const roundRef = useRef<Round | null>(null);
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{ from: string; to: string } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [difficulty, setDifficulty] = useState('adaptive');
  const [tab, setTab] = useState<'practice' | 'progress' | 'saved'>('practice');
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moveDuration, setMoveDuration] = useState(SLOW_MOVE_MS);
  const [phase, setPhase] = useState<'idle' | 'player' | 'reply' | 'return'>('idle');
  const animation = useRef<AbortController | null>(null);
  const animationBusy = useRef(false);
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
  const nextPuzzle = useCallback(async (mode = 'adaptive', reviewIndex?: number) => {
    if (!manifest) return;
    animation.current?.abort(); animation.current = null; animationBusy.current = false; setPhase('idle');
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
          // eslint-disable-next-line react-hooks/purity -- This callback runs only on puzzle requests, never during render.
          if (candidates.length) { chosen = candidates[Math.floor(Math.random() * candidates.length)]; break; }
        }
        // The whole bank remains playable after completion; repeats are clearly marked as review.
        // eslint-disable-next-line react-hooks/purity -- Event-only fallback after the bank is completed.
        if (!chosen && buckets[0]) { const rows = await loadBucket(buckets[0]); chosen = rows[Math.floor(Math.random() * rows.length)]; }
      }
      if (serial !== request.current) return;
      if (!chosen) throw new Error('That puzzle is unavailable. Try another puzzle.');
      visited.current.add(chosen.index);
      const start = startPuzzle(chosen);
      const next: Round = { puzzle: chosen, ...start, status: 'playing', message: '', failed: false, review: hasSeen(p, chosen.index), san: [], hint: '', frame: 0, startingRating: p.rating };
      roundRef.current = next; setRound(next); setFlipped(false);
    } catch (e) { if (serial === request.current) setError(e instanceof Error ? e.message : 'Could not load a puzzle. Please retry.'); }
    finally { if (serial === request.current) setLoading(false); }
  }, [manifest, loadBucket]);
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
    return () => { clearTimeout(timer); counter.current++; animation.current?.abort(); animation.current = null; animationBusy.current = false; };
  }, [ready, user?.id, manifest, nextPuzzle]);
  function finish(won: boolean, r: Round) {
    if (!r.failed || won && r.review) {
      const next = record({ index: r.puzzle.index, rating: r.puzzle.rating, won, at: new Date().toISOString() });
      if (next) currentProgress.current = next;
    }
  }
  async function attemptMove(from: string, to: string, promote?: string) {
    const r = roundRef.current;
    if (!r || !ready || loading || animationBusy.current || (r.status !== 'playing' && !r.analysis)) return;
    const game = new Chess(r.analysis ? r.analysis.frames[r.analysis.cursor].fen : r.fen);
    const moves = game.moves({ verbose: true }).filter(m => m.from === from && m.to === to);
    if (!promote && moves.some(m => m.promotion)) { setPromotion({ from, to }); return; }
    const uci = `${from}${to}${promote || ''}`;
    if (r.analysis) {
      setPromotion(null); setSelected(null);
      const next = moveAnalysis(r.analysis, uci);
      if (next !== r.analysis) await animatePosition({ ...r, analysis: next });
      return;
    }
    const result = playPuzzleMove(r.puzzle, r.fen, r.cursor, uci);
    setPromotion(null); setSelected(null);
    if (result.status === 'illegal') { updateRound({ ...r, message: 'That move isn’t legal. Try another square.' }); return; }
    const controller = new AbortController(); animation.current = controller; animationBusy.current = true;
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : moveDuration;
    const hasReply = result.status !== 'incorrect' && result.cursor > r.cursor + 1;
    setPhase('player');
    game.move(uci);
    updateRound({ ...r, fen: game.fen(), hint: '', lastMove: uci });
    try {
      if (!await waitForMove(duration + (hasReply && duration ? REPLY_PAUSE_MS : 0), controller.signal)) return;
      if (result.status === 'incorrect') {
        finish(false, r); setPhase('return');
        updateRound({ ...r, failed: true, message: 'Not quite. The board is restored. Try another move.' });
        await waitForMove(duration, controller.signal);
        return;
      }
      if (hasReply) {
        setPhase('reply');
        updateRound({ ...r, fen: result.fen, hint: '', lastMove: r.puzzle.moves[r.cursor + 1] });
        if (!await waitForMove(duration, controller.signal)) return;
      }
      const solved = result.status === 'solved';
      if (solved) finish(!r.failed, r);
      updateRound({ ...r, fen: result.fen, cursor: result.cursor, san: [...r.san, ...result.san], hint: '',
        lastMove: hasReply ? r.puzzle.moves[r.cursor + 1] : uci,
        status: solved ? 'solved' : 'playing', frame: solved ? solutionFrames(r.puzzle).length - 1 : 0,
        message: solved ? (r.failed ? 'You found the line. Keep that pattern in mind.' : r.review ? 'Review complete. No rating change.' : 'Nicely calculated. You solved the full line.') : 'Good move. Find the continuation.' });
    } finally {
      if (animation.current === controller) { animation.current = null; animationBusy.current = false; setPhase('idle'); }
    }
  }
  function selectSquare(square: Square) {
    if (!round || (round.status !== 'playing' && !round.analysis) || loading || !ready || animationBusy.current) return;
    const game = new Chess(round.analysis ? round.analysis.frames[round.analysis.cursor].fen : round.fen); const piece = game.get(square);
    const color = game.turn();
    if (selected && square !== selected && piece?.color !== color) { void attemptMove(selected, square); return; }
    setSelected(piece?.color === color && selected !== square ? square : null);
  }
  async function animatePosition(next: Round) {
    const controller = new AbortController(); animation.current = controller; animationBusy.current = true;
    setSelected(null); setPromotion(null); setPhase('player'); updateRound(next);
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : moveDuration;
    try { await waitForMove(duration, controller.signal); }
    finally { if (animation.current === controller) { animation.current = null; animationBusy.current = false; setPhase('idle'); } }
  }
  function explore() {
    const r = roundRef.current;
    if (!r || r.status === 'playing' || animationBusy.current || loading) return;
    setSelected(null); setPromotion(null);
    if (r.analysis) { void animatePosition({ ...r, analysis: undefined }); return; }
    updateRound({ ...r, analysis: createAnalysis(r.puzzle, r.frame, r.status === 'solved' ? r.san : undefined) });
  }
  function step(direction: -1 | 1) {
    const r = roundRef.current;
    if (!r || r.status === 'playing' || animationBusy.current || loading) return;
    if (r.analysis) {
      const next = stepAnalysis(r.analysis, direction);
      if (next !== r.analysis) void animatePosition({ ...r, analysis: next });
    } else {
      const count = createAnalysis(r.puzzle, r.frame, r.status === 'solved' ? r.san : undefined).frames.length;
      const frame = Math.max(0, Math.min(count - 1, r.frame + direction));
      if (frame !== r.frame) void animatePosition({ ...r, frame });
    }
  }
  function hint() {
    const r = roundRef.current; if (!r || r.status !== 'playing' || animationBusy.current || loading || !ready) return;
    finish(false, r);
    const move = r.puzzle.moves[r.cursor]; const piece = new Chess(r.fen).get(move.slice(0, 2) as Square);
    updateRound({ ...r, failed: true, hint: r.hint ? move : move.slice(0, 2), message: r.hint ? `Try ${move.slice(0, 2)} to ${move.slice(2, 4)}${move[4] ? `, promoting to ${pieceNames[move[4]]}` : ''}.` : `Look at your ${pieceNames[piece?.type || 'p']} on ${move.slice(0, 2)}. Hints make this attempt practice.` });
  }
  function reveal() {
    const r = roundRef.current; if (!r || r.status !== 'playing' || animationBusy.current || loading || !ready) return;
    finish(false, r); setSelected(null); setPromotion(null);
    updateRound({ ...r, failed: true, status: 'revealed', frame: 0, hint: '', message: 'Step through the solution, then try another position.' });
  }
  function skip() {
    if (animationBusy.current) return;
    const r = roundRef.current;
    if (r?.status === 'playing') finish(false, r);
    void nextPuzzle(difficulty);
  }
  function review(index: number) {
    if (animationBusy.current) return;
    const r = roundRef.current;
    if (r?.status === 'playing') finish(false, r);
    setTab('practice'); void nextPuzzle(difficulty, index);
  }
  async function signOut() {
    setAccountError('');
    await retrySync();
    const { error } = await getSupabase().auth.signOut();
    if (error) setAccountError('Could not log out. Please reconnect and try again.');
  }
  const timeline = round && round.status !== 'playing' ? round.analysis ?? createAnalysis(round.puzzle, round.frame, round.status === 'solved' ? round.san : undefined) : null;
  const frames = timeline?.frames ?? [];
  const frame = timeline?.cursor ?? 0;
  const displayFen = frames.length ? frames[frame].fen : round?.fen;
  const activeColor = displayFen ? new Chess(displayFen).turn() : 'w';
  const puzzleSaved = Boolean(round && savedIndexes.includes(round.puzzle.index));
  const whiteBottom = round ? (round.color === 'w') !== flipped : true;
  const accuracy = progress.attempts ? Math.round(progress.solved / progress.attempts * 100) : 0;
  const points = [...(progress.attempts < 30 ? [800] : []), ...progress.history.map(h => h[0])];
  const low = Math.min(...points) - 35, high = Math.max(...points) + 35;
  const line = points.map((rating, i) => `${20 + i / Math.max(1, points.length - 1) * 560},${150 - (rating - low) / (high - low) * 120}`).join(' ');
  const isAnimating = phase !== 'idle';
  const canPlay = Boolean(ready && round && !loading && !error && !isAnimating && (round.status === 'playing' || round.analysis));
  const completed = Boolean(round && round.status !== 'playing');
  const ratingChange = round ? progress.rating - round.startingRating : 0;
  return <main className={styles.app} data-view={tab}>
    <a className="skip-link" href="#puzzle-board">Skip to chessboard</a>
    <h1 className={styles.srOnly}>Chess Practice</h1>
    <header className={styles.header}>
      <Link href="/#space" className={styles.back}><ArrowLeft size={19} /><span>Space</span></Link>
      <Link href="/projects/chess-practice/" className={styles.brand}><Image src={`${pieceRoot}/wN.svg`} width={29} height={29} alt="" /><span>Chess<span className={styles.brandLight}> Practice</span></span></Link>
      <div className={styles.account}>
        {user ? <button className={styles.iconButton} disabled={isAnimating} onClick={() => void signOut()} aria-label="Log out"><SignOut size={20} /></button> : <button className={styles.login} onClick={() => setAuthOpen(true)}><UserCircle size={19} /><span>Log in</span></button>}
        <button className={styles.iconButton} aria-label="Practice settings" disabled={isAnimating} onClick={() => setSettingsOpen(true)}><GearSix size={21} /></button>
      </div>
    </header>
    <div className={styles.shell}>
      <nav className={styles.tabs} aria-label="Chess practice sections">
        <button aria-current={tab === 'practice' ? 'page' : undefined} onClick={() => setTab('practice')}><Horse size={18} />Practice</button>
        <button aria-current={tab === 'progress' ? 'page' : undefined} onClick={() => setTab('progress')}><ChartLineUp size={18} />Progress</button>
        <button aria-current={tab === 'saved' ? 'page' : undefined} onClick={() => setTab('saved')}><BookmarkSimple size={18} />Saved</button>
        <span className={styles.ratingPill} title={`${level.name}${progress.attempts < 10 ? ' · provisional rating' : ''}`}><Target size={15} /><strong>{progress.rating}</strong><small>rating</small></span>
      </nav>
      {tab === 'practice' ? <div className={styles.practice}>
  <section className={styles.boardSection} aria-label="Chess puzzle"><div className={styles.boardGroup}>
    <div className={styles.boardCaption}>
      <span className={styles.turn}><i className={activeColor === 'b' ? styles.blackDisc : styles.whiteDisc} />{round ? `${activeColor === 'w' ? 'White' : 'Black'} to move` : 'Preparing puzzle'}</span>
      <span className={styles.puzzleBadge} aria-live="polite">{round && !loading && (completed || round.failed) ? `Puzzle rating: ${round.puzzle.rating}` : round?.review ? 'Review' : 'Rated puzzle'}</span>
    </div>
    <div className={styles.boardViewport}>
      <div id="puzzle-board" className={styles.boardFrame} data-animating={isAnimating}>
        {round && displayFen ? <AnimatedBoard key={round.puzzle.id} fen={displayFen} whiteBottom={whiteBottom} selected={selected} hint={round.hint} lastMove={round.status === 'playing' ? round.lastMove : frames[frame]?.move} canPlay={canPlay} playerColor={activeColor} duration={moveDuration} onSelect={selectSquare} onMove={(from, to) => { void attemptMove(from, to); }} /> : <div className={styles.boardPlaceholder} />}
        {(loading || !ready) && !error && <div className={styles.boardLoading} role="status"><Image src={`${pieceRoot}/wN.svg`} width={48} height={48} alt="" /><span>{ready ? 'Finding your next puzzle…' : 'Loading your practice…'}</span></div>}
        {error && <div className={styles.boardLoading} role="alert"><p>{error}</p><button className={styles.primary} onClick={() => manifest ? void nextPuzzle(difficulty) : void fetchManifest()}>Try again</button></div>}
        {promotion && <div className={styles.promotion} role="dialog" aria-label="Choose promotion piece"><p>Promote your pawn</p><div>{['q', 'r', 'b', 'n'].map(piece => <button key={piece} aria-label={`Promote to ${pieceNames[piece]}`} onClick={() => { void attemptMove(promotion.from, promotion.to, piece); }}><Image alt={pieceNames[piece]} src={`${pieceRoot}/${activeColor}${piece.toUpperCase()}.svg`} width={60} height={60} /></button>)}</div><button className={styles.textButton} onClick={() => setPromotion(null)}>Cancel</button></div>}
      </div>
    </div>
    <div className={styles.boardFooter}><span>{round ? `#${round.puzzle.id}` : 'Unlimited puzzles'}</span><div><button disabled={!round || !ready || loading} aria-label={puzzleSaved ? 'Remove puzzle from collection' : 'Save puzzle to collection'} aria-pressed={puzzleSaved} onClick={() => round && savePuzzle(round.puzzle.index, !puzzleSaved)}><BookmarkSimple size={15} weight={puzzleSaved ? 'fill' : 'regular'} /><span>{puzzleSaved ? 'Saved' : 'Save'}</span></button><button disabled={!round || loading || isAnimating} onClick={() => setFlipped(v => !v)} aria-label="Flip board"><ArrowsClockwise size={15} /><span>Flip</span></button></div></div>
  </div></section>
  <aside className={styles.sidebar}>
    <section className={styles.challenge} data-result={round?.status} aria-label="Puzzle feedback">
      <div className={styles.resultHeading}>
        <h2>{round?.analysis ? <><Horse size={20} />Explore position</> : round?.status === 'solved' ? <><Check size={20} weight="bold" />Puzzle solved</> : round?.status === 'revealed' ? <><Eye size={20} />The solution</> : phase === 'reply' ? <><ArrowsClockwise size={19} />Opponent’s reply</> : phase === 'return' ? <><ArrowCounterClockwise size={19} />Keep looking</> : <><Target size={20} />Find the best move</>}</h2>
        <span className={styles.resultMeta}>{round?.analysis ? 'Unrated' : completed ? round?.review ? 'Unrated review' : round?.status === 'solved' && !round.failed ? `${ratingChange >= 0 ? '+' : '−'}${Math.abs(ratingChange)} rating` : 'Practice complete' : 'No timer'}</span>
      </div>
      <p className={styles.feedback} role="status" aria-live="polite">{round?.analysis && displayFen ? analysisMessage(displayFen) : phase === 'reply' ? 'Watch their response, then find your next move.' : phase === 'player' ? 'Following your move…' : round?.message || 'Look for checks, captures, and threats.'}</p>
      <div className={styles.lineSlot}>
        {completed && round ? <div className={styles.playback}><button aria-label={round.analysis ? 'Undo analysis move' : 'Previous solution move'} disabled={frame === 0 || isAnimating || loading} onClick={() => step(-1)}><CaretLeft size={19} /></button><span>{frame === 0 ? 'Starting position' : `${frame} / ${frames.length - 1} · ${frames[frame]?.san}`}</span><button aria-label={round.analysis ? 'Redo analysis move' : 'Next solution move'} disabled={frame >= frames.length - 1 || isAnimating || loading} onClick={() => step(1)}><CaretRight size={19} /></button></div> : <p className={styles.moveLine}>{round?.san.length ? round.san.join('  ') : 'Your move. Take your time.'}</p>}
      </div>
      <div className={`${styles.actions} ${completed ? styles.completedActions : ''}`}>
        {completed ? <><button className={styles.secondary} disabled={loading || !ready || isAnimating} onClick={explore}>{round?.analysis ? <><ArrowCounterClockwise size={17} />Solution</> : <><Horse size={18} />Explore</>}</button><button className={styles.primary} disabled={loading || !ready || isAnimating} onClick={() => void nextPuzzle(difficulty)}>Next puzzle <ArrowRight size={19} /></button></> : <><button className={styles.secondary} disabled={!canPlay} onClick={hint}><Lightbulb size={18} />{round?.hint ? 'Show move' : 'Hint'}</button><button className={styles.secondary} disabled={!canPlay} onClick={reveal}><Eye size={18} />Solution</button><button className={styles.secondary} disabled={!canPlay} onClick={skip} aria-label="Skip puzzle"><SkipForward size={18} /><span>Skip</span></button></>}
      </div>
    </section>
    <div className={styles.desktopSummary}>
      <p className={styles.eyebrow}>Your practice</p><h3>{level.name}</h3>
      <div className={styles.skillTrack} role="progressbar" aria-label="Progress to next skill level" aria-valuemin={level.floor} aria-valuemax={level.next} aria-valuenow={progress.rating}><span style={{ width: `${Math.max(0, Math.min(100, (progress.rating - level.floor) / (level.next - level.floor) * 100))}%` }} /></div>
      <p>{progress.attempts < 10 ? `${10 - progress.attempts} puzzles to settle your starting rating.` : `${level.next - progress.rating} points to the next milestone.`}</p>
      <div className={styles.miniStats}><span><strong>{progress.solved}</strong>solved</span><span><strong>{accuracy}%</strong>accuracy</span><span><strong><Fire size={16} />{progress.streak}</strong>streak</span></div>
      <p className={styles.saveStatus}>{syncStatus}</p>
    </div>
  </aside>
</div>
 : tab === 'saved' ? <SavedPuzzles indexes={savedIndexes} manifest={manifest} loadBucket={loadBucket} onOpen={review} onRemove={index => savePuzzle(index, false)} ready={ready && !loading && !isAnimating} user={Boolean(user)} syncStatus={syncStatus} onLogin={() => setAuthOpen(true)} /> : <div className={styles.progressScroll}>
        {accountError && <p role="alert" className={styles.error}>{accountError}</p>}
        {guestAvailable && <div className={styles.importNotice}><p>Your guest practice and collection are saved separately on this device.</p><button onClick={importGuest}>Add them to my account <ArrowRight size={16} /></button></div>}
<section className={styles.progressPage} aria-labelledby="progress-title">
        <div className={styles.progressHeading}><div><p className={styles.eyebrow}>Every position adds up</p><h2 id="progress-title">Your game is growing.</h2></div><button className={styles.primary} onClick={() => setTab('practice')}>Keep practising <ArrowRight size={17} /></button></div>
        <div className={styles.stats}><div><small>Puzzle rating</small><strong>{progress.rating}</strong><span>{level.name}</span></div><div><small>Puzzles solved</small><strong>{progress.solved}</strong><span>of {progress.attempts} first attempts</span></div><div><small>Accuracy</small><strong>{accuracy}%</strong><span>First attempt, without hints</span></div><div><small>Personal best</small><strong>{progress.best}</strong><span>Longest solve streak: {progress.longest}</span></div></div>
        <div className={styles.progressGrid}><section className={styles.chart}><h3>Your rating over time</h3>{progress.history.length > 1 ? <><svg viewBox="0 0 600 185" role="img" aria-label={`Puzzle rating over the last ${progress.history.length} attempts: ${progress.history.map(h => h[0]).join(', ')}`}><path d="M20 155H580" stroke="currentColor" opacity=".16" /><polyline points={line} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" /></svg><div className={styles.chartLabels}><span>Recent {progress.history.length} attempts</span><strong>{progress.rating} now</strong></div></> : <p className={styles.empty}>Solve a few puzzles to see your rating take shape.</p>}<small>Your puzzle rating measures tactics practice in this app. It isn’t a game rating or an official Elo.</small></section><section className={styles.activity}><h3>Practice rhythm</h3><div className={styles.activityBars}>{Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setUTCDate(d.getUTCDate() - 13 + i); const date = d.toISOString().slice(0, 10); const n = progress.days.find(day => day[0] === date)?.[1] || 0; return <div key={date} title={`${date}: ${n} puzzles`}><span style={{ height: `${n ? Math.max(10, Math.min(100, n * 8)) : 4}%` }} /><small>{d.getUTCDate()}</small></div>; })}</div><p>{progress.days.reduce((n, d) => n + d[1], 0)} {progress.days.reduce((n, d) => n + d[1], 0) === 1 ? 'puzzle' : 'puzzles'} across your most recent 30 active days. Daily totals use UTC.</p></section></div>
        <section className={styles.review}><div><p className={styles.eyebrow}>Turn mistakes into patterns</p><h3>Worth another look.</h3><p>{progress.missed.length ? 'Revisit missed puzzles without affecting your rating.' : 'Missed puzzles will appear here for another try.'}</p></div><div className={styles.reviewList}>{progress.missed.slice(-8).reverse().map((index, i) => <button disabled={loading || !ready} key={index} onClick={() => review(index)}><span>Review position {i + 1}</span><ArrowRight size={18} /></button>)}</div></section>
      </section>
      {!user && <section className={styles.guestBanner}><UserCircle size={25} /><p><strong>Your progress has a home.</strong><span>Practise as a guest, or log in to take your rating with you.</span></p><button onClick={() => setAuthOpen(true)}>Save my progress <ArrowRight size={17} /></button></section>}
      <details className={styles.how}><summary>How puzzles and ratings work</summary><p>Solve the full line without a wrong move or hint to earn rating points. The first incorrect legal move, hint, solution reveal, or skip records one failed attempt. You can keep practising after a mistake. Illegal moves don’t count against you. Reviews never earn extra rating points.</p><p>Your rating uses Elo-style updates against each puzzle’s difficulty, with faster calibration for your first 10 attempts. Adaptive mode mixes comfortable positions with occasional harder challenges. Skill labels describe progress within this app.</p><p>There is no daily limit. The library contains {manifest?.count.toLocaleString() || 'over 11,000'} puzzles; after you finish it, you can continue reviewing. Account progress syncs online. Guest progress stays in this browser. Avoid solving on multiple devices at exactly the same time.</p></details>
      <footer className={styles.footer}><span>A better player, one position at a time.</span><span>Puzzles: <a href="https://database.lichess.org/" target="_blank" rel="noreferrer">Lichess · CC0</a><span className={styles.footerSep}>/</span>Pieces: <a href="https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces" target="_blank" rel="noreferrer">Cburnett · GPL 2.0+</a></span></footer>
      </div>}
    </div>
    {accountError && tab === 'practice' && <button className={styles.errorToast} role="alert" onClick={() => setAccountError('')}>{accountError} · Dismiss</button>}
    {settingsOpen && <PracticeDialog onClose={() => setSettingsOpen(false)}>
      <div className={styles.form}>
        <label htmlFor="difficulty">Challenge level<select id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value)}><option value="adaptive">Adaptive · matched to you</option><option value="gentle">Gentle · build confidence</option><option value="challenge">Stretch · think deeper</option></select><small>Applies to the next puzzle.</small></label>
        <label htmlFor="move-speed">Piece movement<select id="move-speed" value={moveDuration} onChange={e => setMoveDuration(Number(e.target.value))}><option value={SLOW_MOVE_MS}>Relaxed · slow and smooth</option><option value={300}>Standard</option><option value={0}>Instant</option></select><small>Your device’s reduced-motion preference takes priority.</small></label>
      </div>
      <div className={styles.sync}><span className={user ? styles.syncDot : styles.localDot} />{ready ? syncStatus : 'Loading your progress…'}{user && <button aria-label="Retry saving progress" onClick={() => void retrySync()}><ArrowsClockwise size={16} /></button>}</div>
      {guestAvailable && <button className={styles.secondary} onClick={importGuest}>Add guest progress and collection</button>}
      <details className={styles.how}><summary>How puzzles and ratings work</summary><p>Complete the full line without a mistake or hint to earn rating points. A wrong legal move, hint, reveal, or skip records one failed attempt. Illegal moves are free to retry. Reviews don’t change your rating.</p><p>Adaptive puzzles become harder as your rating improves. Your first 10 puzzles calibrate the starting rating. There’s no daily limit.</p></details>
      {completed && round && <div className={styles.puzzleDetails}><h3>About this position</h3><div className={styles.themes}>{round.puzzle.themes.filter(t => !['short', 'long', 'veryLong', 'oneMove', 'master', 'masterVsMaster'].includes(t)).map(t => <span key={t}>{themeLabel(t)}</span>)}</div><p>Puzzle rating: {round.puzzle.rating}</p><a href={round.puzzle.gameUrl} target="_blank" rel="noreferrer">View original game ↗</a></div>}
      <p className={styles.privacy}>Puzzles from Lichess (CC0). Classic pieces by Colin M. L. Burnett (GPL 2.0+). Your progress is private.</p>
    </PracticeDialog>}
    {authOpen && <AccountDialog onClose={() => setAuthOpen(false)} />}
  </main>;
}
