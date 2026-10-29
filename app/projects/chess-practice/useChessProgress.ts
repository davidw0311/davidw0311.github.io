'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '../piano-party/account/supabase';
import { initialProgress, PROGRESS_KEY, readProgress, recordAttempt, type Attempt, type Progress } from '@/lib/chessPuzzles';
import { changeCollection, collectionIndexes, COLLECTION_KEY, readCollection, type CollectionChange } from '@/lib/chessCollection';

type Cache = { progress: Progress; pending: Attempt[]; collection: string; collectionPending: CollectionChange[] };
const cacheKey = (owner: string | null) => `chess-practice.v1.${owner || 'guest'}`;
function readCache(owner: string | null): Cache {
  try {
    const data = JSON.parse(localStorage.getItem(cacheKey(owner)) || 'null');
    return { progress: readProgress(data?.progress), pending: Array.isArray(data?.pending) ? data.pending.filter((a: Attempt) => Number.isInteger(a?.index) && Number.isFinite(a?.rating) && typeof a?.won === 'boolean' && typeof a?.at === 'string' && Number.isFinite(Date.parse(a.at))) : [], collection: readCollection(data?.collection), collectionPending: Array.isArray(data?.collectionPending) ? data.collectionPending.filter((c: CollectionChange) => Number.isInteger(c?.index) && c.index >= 0 && c.index < 20000 && typeof c.saved === 'boolean') : [] };
  } catch { return { progress: initialProgress(), pending: [], collection: '', collectionPending: [] }; }
}
export function useChessProgress() {
  const [progress, setProgress] = useState(initialProgress);
  const [collection, setCollection] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Loading progress…');
  const [guestAvailable, setGuestAvailable] = useState(false);
  const owner = useRef<string | null>(null);
  const current = useRef(initialProgress());
  const pending = useRef<Attempt[]>([]);
  const saved = useRef('');
  const collectionPending = useRef<CollectionChange[]>([]);
  const generation = useRef(0);
  const activeSync = useRef(false);
  const mounted = useRef(true);
  const readyRef = useRef(false);
  const persist = useCallback(() => {
    try { localStorage.setItem(cacheKey(owner.current), JSON.stringify({ progress: current.current, pending: pending.current, collection: saved.current, collectionPending: collectionPending.current })); return true; }
    catch { setSyncStatus('Browser storage unavailable. Keep this tab open until your account saves.'); return false; }
  }, []);
  const sync = useCallback(async () => {
    if (!owner.current || activeSync.current || (!pending.current.length && !collectionPending.current.length)) return;
    activeSync.current = true;
    const id = owner.current, version = generation.current;
    setSyncStatus('Saving progress…');
    const run = async () => {
      const { data, error } = await getSupabase().auth.getUser();
      if (error || data.user?.id !== id) throw new Error('Please log in again to save your progress.');
      if (generation.current !== version) return;
      const batch = [...pending.current];
      const collectionBatch = [...collectionPending.current];
      let merged = readProgress(data.user.user_metadata[PROGRESS_KEY]);
      for (const attempt of batch) merged = recordAttempt(merged, attempt);
      const mergedCollection = collectionBatch.reduce(changeCollection, readCollection(data.user.user_metadata[COLLECTION_KEY]));
      const { error: saveError } = await getSupabase().auth.updateUser({ data: { [PROGRESS_KEY]: merged, [COLLECTION_KEY]: mergedCollection } });
      if (saveError) throw saveError;
      if (!mounted.current || generation.current !== version) return;
      pending.current = pending.current.filter(a => !batch.includes(a));
      collectionPending.current = collectionPending.current.filter(c => !collectionBatch.includes(c));
      // Results completed while the save was in flight are replayed on the saved state.
      current.current = pending.current.reduce(recordAttempt, merged);
      saved.current = collectionPending.current.reduce(changeCollection, mergedCollection);
      setCollection(saved.current); setProgress(current.current); persist();
      setSyncStatus(pending.current.length || collectionPending.current.length ? 'Changes waiting to save' : 'Saved to your account');
    };
    try {
      // Coordinate browser tabs before reading and updating the remote snapshot.
      if (navigator.locks) await navigator.locks.request(`chess-save-${id}`, run); else await run();
    } catch {
      if (mounted.current && generation.current === version) setSyncStatus('Saved on this device. Cloud sync will retry when you reconnect.');
    } finally { activeSync.current = false; }
  }, [persist]);
  useEffect(() => {
    mounted.current = true;
    let loadNumber = 0;
    const load = async (nextUser: User | null) => {
      const n = ++loadNumber;
      // Auth metadata updates and token refreshes must not replace an active solving session.
      if (readyRef.current && owner.current === (nextUser?.id || null)) return;
      generation.current++; readyRef.current = false; setReady(false);
      owner.current = nextUser?.id || null;
      const cached = readCache(owner.current);
      let value = cached.progress;
      let collectionValue = cached.collection;
      pending.current = cached.pending;
      collectionPending.current = cached.collectionPending;
      let cloudLoaded = !nextUser;
      if (nextUser) {
        try {
          const { data, error } = await getSupabase().auth.getUser();
          if (n !== loadNumber || !mounted.current) return;
          if (!error && data.user?.id === nextUser.id) { value = cached.pending.reduce(recordAttempt, readProgress(data.user.user_metadata[PROGRESS_KEY])); collectionValue = cached.collectionPending.reduce(changeCollection, readCollection(data.user.user_metadata[COLLECTION_KEY])); cloudLoaded = true; }
        } catch { /* Keep the account's isolated device cache available offline. */ }
      }
      if (n !== loadNumber || !mounted.current) return;
      current.current = value; setProgress(value); setUser(nextUser);
      saved.current = collectionValue; setCollection(collectionValue);
      const guest = readCache(null);
      setGuestAvailable(Boolean(nextUser && (guest.progress.attempts || guest.collection)));
      readyRef.current = true; setReady(true); persist();
      setSyncStatus(nextUser ? (!cloudLoaded ? 'Using device progress. Reconnect to sync your account.' : pending.current.length || collectionPending.current.length ? 'Changes waiting to save' : 'Saved to your account') : 'Saved on this device');
      if (nextUser) void sync();
    };
    const { data: { subscription } } = getSupabase().auth.onAuthStateChange((_event, session) => {
      // Supabase callbacks must return before another auth method is invoked.
      setTimeout(() => { if (mounted.current) void load(session?.user || null); }, 0);
    });
    const retry = () => { if (document.visibilityState === 'visible') void sync(); };
    const timer = window.setInterval(() => { void sync(); }, 15000);
    window.addEventListener('online', retry); document.addEventListener('visibilitychange', retry);
    return () => { mounted.current = false; loadNumber++; subscription.unsubscribe(); clearInterval(timer); window.removeEventListener('online', retry); document.removeEventListener('visibilitychange', retry); };
  }, [persist, sync]);
  function record(attempt: Attempt) {
    if (!readyRef.current) return;
    const next = recordAttempt(current.current, attempt);
    if (next === current.current) return current.current;
    current.current = next;
    pending.current.push(attempt); setProgress(current.current);
    if (persist()) setSyncStatus(owner.current ? 'Saving progress…' : 'Saved on this device');
    if (owner.current) void sync();
    return next;
  }
  function importGuest() {
    const guest = readCache(null);
    if (!owner.current || (!guest.progress.attempts && !guest.collection)) return;
    for (const attempt of guest.pending) current.current = recordAttempt(current.current, attempt);
    for (const index of collectionIndexes(guest.collection)) {
      const change = { index, saved: true };
      saved.current = changeCollection(saved.current, change); collectionPending.current.push(change);
    }
    setCollection(saved.current);
    pending.current.push(...guest.pending); setProgress(current.current); persist(); setGuestAvailable(false); void sync();
  }
  function savePuzzle(index: number, keep: boolean) {
    if (!readyRef.current) return;
    const next = changeCollection(saved.current, { index, saved: keep });
    if (next === saved.current) return;
    saved.current = next; setCollection(next);
    collectionPending.current = [...collectionPending.current.filter(c => c.index !== index), { index, saved: keep }];
    if (persist()) setSyncStatus(owner.current ? 'Saving progress…' : 'Saved on this device');
    if (owner.current) void sync();
  }
  return { progress, collection, savePuzzle, user, ready, syncStatus, record, retrySync: sync, guestAvailable, importGuest };
}
