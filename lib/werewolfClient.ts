"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Language = "en" | "zh";
export type Localized = { en: string; zh: string };
export type Role = { id: string; name: Localized; team: string; description: Localized; nightStep?: string };
export type Catalogue = { version: string; ruleset: Localized; roles: Role[]; presets: { id: string; name: Localized; description: Localized; roles: string[] }[] };
export type Seat = { id: string; name: string; photo?: string | null; ready?: boolean; connected: boolean; occupied: boolean; alive: boolean; isHost: boolean; isSheriff: boolean; canVote: boolean; roleId?: string };
export type Phase = { id: string; kind: "sheriff" | "announcement" | "ready" | "disbanded" | "lobby" | "night" | "day" | "voting" | "reaction" | "finished"; step: string; number: number; deadline: number | null; paused: boolean; nightStage?: "opening" | "acting" | "closing"; nightCues?: string[]; nightRole?: string; publicCues?: string[] };
export type Settings = { nightSeconds: number; daySeconds: number; voteSeconds: number; autoAdvance: boolean; sheriff: boolean; winCondition: "edge" | "all" | "parity"; witchSelfSave: boolean | "firstNight"; guardAntidote: "save" | "kill"; [key: string]: unknown };
export type Action = { kind: string; step: string; targets: string[]; canSkip: boolean; input: "single" | "double" | "choice" | "none"; options?: (string | { id?: string; value?: string; name?: Localized; label?: Localized })[]; alreadySubmitted: boolean; ability?: string; minTargets?: number; maxTargets?: number; victimId?: string | null };
export type GameView = {
  serverTime?: number; clockOffset?: number;
  gameId?: string; speakingTimer?: {id: string; phaseId: string; speakerSeatId: string | null; seconds: number; endsAt: number | null; remainingMs?: number} | null;
  code: string; revision: number; hostSeatId: string; isHost: boolean; status: "lobby" | "playing" | "finished" | "disbanded"; settings: Settings; roleDeck: string[]; seats: Seat[];
  requests: { id: string; name: string; createdAt: number }[];
  me: { inspection?: {night:number; targetId:string; alignment:"wolf"|"good"} | null; ready?: boolean; packVotes?: {seatId: string; submitted: boolean; targetId: string | null}[]; history?: {night: number; step: string; action: {targetId?: string; targetIds?: string[]; ability?: string; choice?: string; skip?: boolean}}[]; seatId: string; roleId: string | null; team: string | null; alive: boolean; roleState: Record<string, unknown>; allies: string[]; privateLog: { night?: number; id?: string; text: Localized; at?: number }[]; action: Action | null; canDuel?: boolean; canExplode?: boolean; canPassBadge?: boolean } | null;
  election?: { round?: number; nominationsComplete?: boolean; candidateIds: string[]; withdrawnIds: string[]; declaredIds: string[]; voterIds: string[] } | null; lastNight?: {night: number; eliminatedSeatIds: string[]; numbers: number[]} | null;
  voteRound?: number; runoffIds?: string[]; phase: Phase; day: number; events: { id: string; text: Localized; at: number }[]; winner: { team?: string; text?: Localized; reason?: Localized } | string | null; speakerSeatId: string | null; pendingVoterIds?: string[]; voteCount?: number; lastVote?: { kind: string; votes: Record<string, string | null>; tally: Record<string, number> } | null; replay?: ({ type: "night"; night: number; actions: Record<string, Record<string, { targetId?: string; targetIds?: string[]; ability?: string; choice?: string; skip?: boolean }>>; eliminatedSeatIds: string[] } | { type: "vote"; day: number; kind: string; votes: Record<string, string | null>; tally: Record<string, number>; at: number })[];
  messages?: { id: string; seatId?: string; name?: string; text: string; channel: string; at: number }[];
};
export type Command = { type: string; [key: string]: unknown };
type Session = { code: string; token: string; name: string; recoveryKey?: string };
type Reply = { view: GameView; recoveryKey?: string };
const endpoint = process.env.NEXT_PUBLIC_WEREWOLF_API_URL || "https://speechlab-assessment-hfh9hpfwhdafh7gz.southeastasia-01.azurewebsites.net/api/werewolf";
const terminalErrors = new Set(["NOT_SEATED", "SESSION_REPLACED", "ROOM_NOT_FOUND", "ROOM_EXPIRED", "INVALID_TOKEN", "room-not-found", "room-expired", "invalid-session", "room-disbanded"]);
const sessionKey = "nightfall.session.v1";
const pendingKey = "nightfall.pending.v1";
export class RoomError extends Error { constructor(public code: string, message: string, public retryable = false) { super(message); } }
export function roomId() { return crypto.randomUUID(); }
function readStored<T>(key: string): T | null { try { return JSON.parse(localStorage.getItem(key) || "null") as T | null; } catch { return null; } }
function store(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private mode still permits this session to work in memory. */ } }
async function request(payload: Record<string, unknown>, signal?: AbortSignal): Promise<Reply> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 16000);
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  try {
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: controller.signal, cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.error) throw new RoomError(body.error || "server_error", body.message || "The room could not be reached.", response.status >= 500 || response.status === 429 || body.error === "room-busy");
    if (!body.view?.code) throw new RoomError("invalid_response", "The server returned an incomplete room.", true);
    return body;
  } catch (error) {
    if (error instanceof RoomError) throw error;
    throw new RoomError("connection", "Connection interrupted. Your seat and game are saved. Reconnecting…", true);
  } finally { clearTimeout(timeout); signal?.removeEventListener("abort", abort); }
}
async function reliableRequest(payload: Record<string, unknown>): Promise<Reply> {
  // A mutation keeps the same request ID on retry; the server deduplicates it.
  try { return await request(payload); } catch (error) {
    if (!(error instanceof RoomError) || !error.retryable) throw error;
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return request(payload);
  }
}
export function useWerewolfRoom() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<GameView | null>(null);
  const [connectivity, setConnectivity] = useState<"connecting" | "online" | "reconnecting" | "offline">("connecting");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<RoomError | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [restored, setRestored] = useState(false);
  const activeSession = useRef<Session | null>(null);
  const mutationLock = useRef(false);
  const syncNow = useRef<() => void>(() => {});
  const eject = useCallback(() => {
    const current = activeSession.current;
    activeSession.current = null; setSession(null); setView(null); setSessionExpired(false); setConnectivity("online");
    try { localStorage.removeItem(sessionKey); if (current) localStorage.removeItem(`${sessionKey}.${current.code}`); } catch { /* no-op */ }
    window.history.replaceState(null, "", window.location.pathname);
    setError(new RoomError("room-disbanded", "The host has disbanded this room."));
  }, []);
  const apply = useCallback((incoming: GameView) => { if (incoming.status === "disbanded") { eject(); return; } setView((current) => current && current.code === incoming.code && current.revision > incoming.revision ? current : { ...incoming, clockOffset: (incoming.serverTime || Date.now()) - Date.now() }); }, [eject]);
  const saveSession = useCallback((next: Session) => { activeSession.current = next; store(sessionKey, next); store(`${sessionKey}.${next.code}`, next); setSession(next); }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
    const code = new URLSearchParams(window.location.search).get("room")?.trim().toUpperCase();
    const saved = readStored<Session>(code ? `${sessionKey}.${code}` : sessionKey);
    if (saved?.code && saved.token && (!code || saved.code === code)) { activeSession.current = saved; setSession(saved); }
    else setConnectivity("online");
    setRestored(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!session) return;
    let stopped = false, failures = 0, inFlight = false, nightPolling = false, hostPolling = false;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | null = null;
    const sync = async () => {
      clearTimeout(timer);
      if (stopped || inFlight) return;
      if (!navigator.onLine) { setConnectivity("offline"); timer = setTimeout(sync, 5000); return; }
      inFlight = true;
      controller = new AbortController();
      try {
        const reply = await request({ op: "sync", code: session.code, token: session.token }, controller.signal);
        if (stopped) return;
        apply(reply.view); failures = 0; nightPolling = reply.view.phase.kind === "night" && !reply.view.phase.paused; hostPolling = reply.view.isHost; setConnectivity("online");
        if (reply.recoveryKey && reply.recoveryKey !== activeSession.current?.recoveryKey && activeSession.current?.token === session.token) { const updated = { ...session, recoveryKey: reply.recoveryKey }; activeSession.current = updated; store(sessionKey, updated); store(`${sessionKey}.${session.code}`, updated); setSession(updated); }
      } catch (caught) {
        if (stopped) return;
        failures += 1;
        setConnectivity(navigator.onLine ? "reconnecting" : "offline");
        if (caught instanceof RoomError && !caught.retryable) { setError(caught); if (terminalErrors.has(caught.code)) { stopped = true; if (caught.code === "room-disbanded") eject(); else setSessionExpired(true); } }
      } finally {
        inFlight = false;
        if (!stopped) timer = setTimeout(sync, failures ? Math.min(30000, 1500 * 2 ** Math.min(failures, 4)) : nightPolling ? hostPolling ? 1000 : document.hidden ? 3000 : 2000 : document.hidden ? 12000 : 3000);
      }
    };
    syncNow.current = () => { void sync(); };
    const wake = () => { if (!document.hidden) void sync(); };
    const offline = () => setConnectivity("offline");
    void sync(); window.addEventListener("online", wake); window.addEventListener("offline", offline); document.addEventListener("visibilitychange", wake);
    return () => { stopped = true; clearTimeout(timer); controller?.abort(); window.removeEventListener("online", wake); window.removeEventListener("offline", offline); document.removeEventListener("visibilitychange", wake); };
  }, [session, apply, eject]);
  const enter = useCallback(async (op: "create" | "join" | "recover", name: string, code = "", recoveryKey?: string) => {
    if (mutationLock.current) return;
    mutationLock.current = true; setBusy(op); setError(null); setSessionExpired(false);
    const signature = `${op}:${name.trim()}:${code.trim().toUpperCase()}`;
    const stored = readStored<{ signature: string; token: string; requestId: string }>(pendingKey);
    const pending = stored?.signature === signature ? stored : { signature, token: roomId(), requestId: roomId() };
    store(pendingKey, pending);
    try {
      if (op === "join") {
        const remembered = readStored<Session>(`${sessionKey}.${code.trim().toUpperCase()}`);
        if (remembered?.token && remembered.code === code.trim().toUpperCase()) {
          try {
            const restoredRoom = await reliableRequest({ op: "sync", code: remembered.code, token: remembered.token });
            const restoredName = restoredRoom.view.seats.find((seat) => seat.id === restoredRoom.view.me?.seatId)?.name || remembered.name;
            saveSession({ ...remembered, name: restoredName, recoveryKey: restoredRoom.recoveryKey || remembered.recoveryKey });
            apply(restoredRoom.view); setConnectivity("online");
            try { localStorage.removeItem(pendingKey); } catch { /* no-op */ }
            window.history.replaceState(null, "", `${window.location.pathname}?room=${restoredRoom.view.code}`);
            return;
          } catch (restoreError) {
            if (!(restoreError instanceof RoomError) || !terminalErrors.has(restoreError.code)) throw restoreError;
            try { localStorage.removeItem(`${sessionKey}.${remembered.code}`); } catch { /* no-op */ }
          }
        }
      }
      const reply = await reliableRequest({ op, name: name.trim(), code: code.trim().toUpperCase(), token: pending.token, requestId: pending.requestId, recoveryKey });
      const next = { code: reply.view.code, name: name.trim(), token: pending.token, recoveryKey: reply.recoveryKey || recoveryKey };
      saveSession(next); apply(reply.view); setConnectivity("online");
      try { localStorage.removeItem(pendingKey); } catch { /* no-op */ }
      window.history.replaceState(null, "", `${window.location.pathname}?room=${reply.view.code}`);
    } catch (caught) { setError(caught instanceof RoomError ? caught : new RoomError("unknown", String(caught))); }
    finally { mutationLock.current = false; setBusy(null); }
  }, [apply, saveSession]);
  const command = useCallback(async (command: Command): Promise<boolean> => {
    const current = activeSession.current;
    if (!current || mutationLock.current) return false;
    mutationLock.current = true; setBusy(command.type); setError(null);
    const mutationKey = `${sessionKey}.mutation.${current.code}`;
    const signature = JSON.stringify(command);
    const savedMutation = readStored<{ token: string; signature: string; requestId: string }>(mutationKey);
    const mutation = savedMutation?.token === current.token && savedMutation.signature === signature ? savedMutation : { token: current.token, signature, requestId: roomId() };
    store(mutationKey, mutation);
    try {
      const reply = await reliableRequest({ op: "command", code: current.code, token: current.token, requestId: mutation.requestId, command });
      try { localStorage.removeItem(mutationKey); } catch { /* no-op */ }
      // Ignore a late response if the user has moved to a different identity.
      if (activeSession.current?.token === current.token) { apply(reply.view); setConnectivity("online"); }
      return true;
    } catch (caught) {
      if (!(caught instanceof RoomError) || !caught.retryable) { try { localStorage.removeItem(mutationKey); } catch { /* no-op */ } }
      if (caught instanceof RoomError && caught.code === "room-disbanded") eject();
      else setError(caught instanceof RoomError ? caught : new RoomError("unknown", String(caught))); return false;
    }
    finally { mutationLock.current = false; setBusy(null); }
  }, [apply, eject]);
  // Narration completion is an automatic transport event, independent of the
  // player's action lock. Its phase-scoped receipt survives refresh and retries.
  const acknowledgeNightNarration = useCallback(async (phaseId: string): Promise<boolean> => {
    const current = activeSession.current;
    if (!current) return true;
    try {
      const reply = await reliableRequest({ op: "command", code: current.code, token: current.token, requestId: `narration-${phaseId}`, command: { type: "nightNarrationDone", expectedPhaseId: phaseId } });
      if (activeSession.current?.token === current.token) apply(reply.view);
      return true;
    } catch (caught) {
      // A different stage or host can legitimately win this race. Polling will
      // update the room; only transient failures need another acknowledgement.
      return caught instanceof RoomError && !caught.retryable;
    }
  }, [apply]);
  const disconnect = useCallback((forget = false) => {
    const current = activeSession.current;
    activeSession.current = null; setSession(null); setView(null); setError(null); setSessionExpired(false); setConnectivity("online");
    try { localStorage.removeItem(sessionKey); if (current && forget) localStorage.removeItem(`${sessionKey}.${current.code}`); } catch { /* no-op */ }
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  return { session, view, connectivity, busy, error, sessionExpired, restored, enter, command, acknowledgeNightNarration, disconnect, retry: () => syncNow.current(), clearError: () => setError(null) };
}
