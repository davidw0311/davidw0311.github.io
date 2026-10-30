'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabaseKey, supabaseUrl } from '@/app/projects/piano-party/account/supabase';

export type RoomView = {
  code: string; revision: number; setupRevision: number; status: 'lobby' | 'playing' | 'finished' | 'closed'; isHost: boolean;
  me: { color: 'w' | 'b'; name: string };
  players: { name: string; color: 'w' | 'b'; ready: boolean; connected: boolean; isMe: boolean; isHost: boolean }[];
  removed: string[]; initialFen: string; fen: string; turn: 'w' | 'b'; check: boolean;
  moves: { uci: string; san: string; fen: string }[];
  result: { winner: 'w' | 'b' | null; reason: string } | null;
  pending: { type: 'takeback' | 'draw'; plies: number; mine: boolean; name: string; expiresAt: number } | null;
  serverTime: number; expiresAt: number;
};
type Session = { code: string; token: string };
type Payload = { op: string; token: string; code?: string; requestId?: string; [key: string]: unknown };
type Pending = { signature: string; payload: Payload };
const root = 'chess-rooms.v1';
const endpoint = process.env.NEXT_PUBLIC_CHESS_ROOM_API_URL || `${supabaseUrl}/functions/v1/chess`;
const terminal = new Set(['room-not-found', 'room-expired', 'room-closed', 'invalid-session']);
class RoomError extends Error {
  constructor(public code: string, message: string, public retryable = false) { super(message); }
}
function read<T>(key: string): T | null { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }
function write(key: string, value: unknown) { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); } catch { /* An open tab can still play without browser storage. */ } }
async function request(payload: Payload, signal?: AbortSignal): Promise<{ view: RoomView | { code: string; status: 'left' } }> {
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 20000);
  const abort = () => controller.abort(); signal?.addEventListener('abort', abort, { once: true });
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }, body: JSON.stringify(payload), signal: controller.signal, cache: 'no-store' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.error) throw new RoomError(body.error || 'service-error', body.message || 'The room could not be reached. Please retry.', response.status >= 500 || response.status === 429 || body.error === 'room-busy');
    if (!body.view?.code) throw new RoomError('invalid-response', 'The server returned an incomplete room. Please retry.', true);
    return body;
  } catch (error) {
    if (error instanceof RoomError) throw error;
    throw new RoomError('connection', 'Connection lost. Retry to confirm your action safely.', true);
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
}
export function useChessRoom() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<RoomView | null>(null);
  const [restored, setRestored] = useState(false);
  const [invitedCode, setInvitedCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [connectivity, setConnectivity] = useState<'connecting' | 'online' | 'reconnecting'>('connecting');
  const active = useRef<Session | null>(null), latest = useRef<RoomView | null>(null);
  const lock = useRef(false), pending = useRef<Pending | null>(null), mounted = useRef(true);
  const refresh = useRef<() => void>(() => {});
  const apply = useCallback((incoming: RoomView) => {
    if (latest.current?.code === incoming.code && latest.current.revision > incoming.revision) return;
    latest.current = incoming; setView(incoming);
  }, []);
  const disconnect = useCallback(() => {
    active.current = null; latest.current = null; pending.current = null;
    setSession(null); setView(null); setError(''); setExpired(false); setUncertain(false); setConnectivity('online'); setInvitedCode('');
    write(`${root}.active`, null);
    window.history.replaceState(null, '', window.location.pathname);
  }, []);
  useEffect(() => {
    mounted.current = true;
    const timer = setTimeout(() => {
      const code = new URLSearchParams(window.location.search).get('room')?.trim().toUpperCase() || '';
      setInvitedCode(code);
      const saved = read<Session>(code ? `${root}.seat.${code}` : `${root}.active`);
      if (saved?.token && /^[A-HJ-NP-Z2-9]{6}$/.test(saved.code) && (!code || code === saved.code)) {
        active.current = saved; setSession(saved);
        const mutation = read<Pending>(`${root}.mutation.${saved.code}`);
        if (mutation?.payload.token === saved.token) { pending.current = mutation; setUncertain(true); setError('A previous action needs confirmation. Retry it safely below.'); }
      } else setConnectivity('online');
      setRestored(true);
    }, 0);
    return () => { mounted.current = false; clearTimeout(timer); };
  }, []);
  useEffect(() => {
    if (!session) return;
    let stopped = false, inFlight = false, failures = 0;
    let timer: ReturnType<typeof setTimeout>, controller: AbortController;
    const sync = async () => {
      clearTimeout(timer); if (stopped || inFlight) return; inFlight = true;
      controller = new AbortController();
      try {
        const reply = await request({ op: 'sync', code: session.code, token: session.token }, controller.signal);
        if (stopped || reply.view.status === 'left') return;
        apply(reply.view); failures = 0; setConnectivity('online');
      } catch (caught) {
        if (stopped) return;
        failures++; setConnectivity('reconnecting');
        if (caught instanceof RoomError && terminal.has(caught.code)) { stopped = true; setExpired(true); setError(caught.message); }
      } finally {
        inFlight = false;
        if (!stopped) timer = setTimeout(sync, failures ? Math.min(15000, 1500 * 2 ** Math.min(failures, 3)) : document.hidden ? 10000 : 1500);
      }
    };
    refresh.current = () => { void sync(); };
    const wake = () => { if (!document.hidden) void sync(); };
    void sync(); window.addEventListener('online', wake); document.addEventListener('visibilitychange', wake);
    return () => { stopped = true; clearTimeout(timer); controller?.abort(); window.removeEventListener('online', wake); document.removeEventListener('visibilitychange', wake); };
  }, [session, apply]);
  async function enter(op: 'create' | 'join', name: string, code = '', color: 'w' | 'b' = 'w') {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    const signature = JSON.stringify({ op, name: name.trim(), code: code.trim().toUpperCase(), color });
    const previous = read<Pending>(`${root}.entry`);
    const entry = previous?.signature === signature ? previous : { signature, payload: { op, name: name.trim(), code: code.trim().toUpperCase(), color, removed: [], token: crypto.randomUUID(), requestId: crypto.randomUUID() } };
    write(`${root}.entry`, entry);
    try {
      let reply, restoredSeat = false;
      const remembered = op === 'join' ? read<Session>(`${root}.seat.${code.trim().toUpperCase()}`) : null;
      if (remembered?.token) {
        try { reply = await request({ op: 'sync', code: remembered.code, token: remembered.token }); restoredSeat = true; }
        catch (caught) { if (!(caught instanceof RoomError) || !terminal.has(caught.code)) throw caught; }
      }
      if (!reply) {
        try { reply = await request(entry.payload); }
        catch (caught) { if (!(caught instanceof RoomError) || !caught.retryable) throw caught; reply = await request(entry.payload); }
      }
      if (!mounted.current || reply.view.status === 'left') return;
      const next = { code: reply.view.code, token: restoredSeat && remembered ? remembered.token : entry.payload.token };
      active.current = next; latest.current = null; apply(reply.view); setSession(next); setExpired(false); setConnectivity('online');
      write(`${root}.active`, next); write(`${root}.seat.${next.code}`, next); write(`${root}.entry`, null);
      window.history.replaceState(null, '', `${window.location.pathname}?room=${next.code}`);
    } catch (caught) { if (mounted.current) setError(caught instanceof Error ? caught.message : 'Could not enter the room.'); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  async function sendPending(): Promise<boolean> {
    const action = pending.current, current = active.current;
    if (!action || !current || lock.current) return false;
    lock.current = true; setBusy(true); setError('');
    try {
      const reply = await request(action.payload);
      if (!mounted.current || active.current?.token !== current.token) return false;
      pending.current = null; setUncertain(false); write(`${root}.mutation.${current.code}`, null);
      if (reply.view.status === 'left') { write(`${root}.seat.${current.code}`, null); disconnect(); }
      else { apply(reply.view); setConnectivity('online'); }
      return true;
    } catch (caught) {
      if (!mounted.current || active.current?.token !== current.token) return false;
      if (caught instanceof RoomError && !caught.retryable) { pending.current = null; setUncertain(false); write(`${root}.mutation.${current.code}`, null); }
      else setUncertain(true);
      setError(caught instanceof Error ? caught.message : 'Could not send the action.');
      if (caught instanceof RoomError && terminal.has(caught.code)) setExpired(true);
      refresh.current(); return false;
    } finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  async function command(value: Record<string, unknown>): Promise<boolean> {
    const current = active.current, room = latest.current;
    if (!current || !room || lock.current || pending.current || expired) return false;
    pending.current = { signature: JSON.stringify(value), payload: { op: 'command', code: current.code, token: current.token, requestId: crypto.randomUUID(), command: { ...value, revision: room.revision } } };
    write(`${root}.mutation.${current.code}`, pending.current);
    return sendPending();
  }
  return { view, session, restored, invitedCode, busy, uncertain, expired, error, connectivity, enter, command, disconnect, retryAction: sendPending, refresh: () => refresh.current(), clearError: () => setError('') };
}
