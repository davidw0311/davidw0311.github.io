'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, BookmarkSimple, CaretLeft, CaretRight, Trash } from '@phosphor-icons/react';
import { themeLabel, type Puzzle, type PuzzleManifest } from '@/lib/chessPuzzles';
import styles from './chess.module.css';

const PAGE_SIZE = 12;
export default function SavedPuzzles({ indexes, manifest, loadBucket, onOpen, onRemove, ready, user, syncStatus, onLogin }: {
  indexes: number[]; manifest: PuzzleManifest | null;
  loadBucket: (bucket: { rating: number; offset: number }) => Promise<Puzzle[]>;
  onOpen: (index: number) => void; onRemove: (index: number) => void;
  ready: boolean; user: boolean; syncStatus: string; onLogin: () => void;
}) {
  const [requestedPage, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ key: string; rows: Puzzle[]; error: string }>({ key: '', rows: [], error: '' });
  const available = indexes.filter(index => !manifest || index < manifest.count);
  const page = Math.min(requestedPage, Math.max(0, Math.ceil(available.length / PAGE_SIZE) - 1));
  const key = available.slice().reverse().slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).join(',');
  useEffect(() => {
    if (!manifest || !key) return;
    let cancelled = false;
    const wanted = key.split(',').map(Number);
    const buckets = manifest.buckets.filter(b => wanted.some(i => i >= b.offset && i < b.offset + b.count));
    void Promise.all(buckets.map(loadBucket)).then(groups => {
      if (cancelled) return;
      const rows = new Map(groups.flat().map(p => [p.index, p]));
      setResult({ key, rows: wanted.flatMap(i => rows.get(i) ? [rows.get(i)!] : []), error: '' });
    }).catch(() => { if (!cancelled) setResult({ key, rows: [], error: 'Could not load your saved puzzles. Check your connection and retry.' }); });
    return () => { cancelled = true; };
  }, [key, manifest, loadBucket, retry]);

  return <section className={styles.progressScroll} aria-labelledby="collection-title">
    <div className={styles.progressHeading}><div><p className={styles.eyebrow}>Keep the positions that teach you</p><h2 id="collection-title">Your collection</h2><p className={styles.collectionCount}>{available.length} saved {available.length === 1 ? 'puzzle' : 'puzzles'} · {syncStatus}</p></div></div>
    {!user && <p className={styles.collectionNote}>Saved on this device. <button onClick={onLogin}>Log in</button> to keep a collection with your account. You can add your guest saves after signing in.</p>}
    {!available.length ? <div className={styles.collectionEmpty}><BookmarkSimple size={36} /><h3>A position worth keeping?</h3><p>Tap Save below the board on any puzzle. Come back here to practise it again.</p></div> : result.key !== key || !manifest ? <p role="status" className={styles.empty}>Loading saved puzzles…</p> : result.error ? <div role="alert"><p>{result.error}</p><button className={styles.secondary} onClick={() => setRetry(n => n + 1)}>Retry loading collection</button></div> : <div className={styles.collectionGrid}>
      {result.rows.map(puzzle => <article className={styles.savedPuzzle} key={puzzle.index}><div><BookmarkSimple weight="fill" size={18} /><span>Puzzle #{puzzle.id}</span><strong>{puzzle.rating}</strong></div><p>{puzzle.themes.filter(t => !['short', 'long', 'veryLong', 'oneMove', 'master', 'masterVsMaster'].includes(t)).slice(0, 3).map(themeLabel).join(' · ') || 'Tactical practice'}</p><footer><button className={styles.secondary} disabled={!ready} onClick={() => onOpen(puzzle.index)}>Practise again <ArrowRight size={17} /></button><button className={styles.iconButton} disabled={!ready} aria-label={`Remove puzzle ${puzzle.id} from collection`} onClick={() => onRemove(puzzle.index)}><Trash size={18} /></button></footer></article>)}
    </div>}
    {available.length > PAGE_SIZE && <nav className={styles.collectionPages} aria-label="Collection pages"><button className={styles.secondary} disabled={page === 0} onClick={() => setPage(page - 1)}><CaretLeft size={18} />Previous</button><span>{page + 1} / {Math.ceil(available.length / PAGE_SIZE)}</span><button className={styles.secondary} disabled={(page + 1) * PAGE_SIZE >= available.length} onClick={() => setPage(page + 1)}>Next<CaretRight size={18} /></button></nav>}
  </section>;
}
