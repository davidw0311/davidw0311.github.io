'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X } from '@phosphor-icons/react';
import { getSupabase, accountRoot } from '../piano-party/account/supabase';
import styles from './chess.module.css';

export default function AccountDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [name, setName] = useState(''); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [message, setMessage] = useState('');
  useEffect(() => { dialog.current?.showModal(); }, []);
  function changeMode(next: typeof mode) { setMode(next); setError(''); setMessage(''); setPassword(''); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const auth = getSupabase().auth;
      if (mode === 'login') {
        const { error } = await auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        onClose();
      } else if (mode === 'signup') {
        const { data, error } = await auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/projects/chess-practice/` } });
        if (error) throw error;
        setPassword('');
        if (data.session) onClose();
        else setMessage('Check your email and open the confirmation link to return to Chess Practice. You can keep solving as a guest while you wait.');
      } else {
        const { error } = await auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}${accountRoot}/profile/` });
        if (error) throw error;
        setMessage('If that account exists, a reset link is on its way. Set a new password on the account page, then return here.');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not connect. Please try again.';
      setError(/sending confirmation|email.*send|email_address_not_authorized/i.test(message) ? 'The email service could not send your confirmation. Existing accounts can still log in; guest progress stays on this device.' : message);
    } finally { setBusy(false); }
  }
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="account-heading" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget && !busy) onClose(); }}>
    <button className={styles.close} aria-label="Close account dialog" onClick={onClose}><X size={21} /></button>
    <p className={styles.eyebrow}>Your practice, remembered</p>
    <h2 id="account-heading">{mode === 'signup' ? 'Make your next move.' : mode === 'reset' ? 'Reset your password.' : 'Welcome back.'}</h2>
    <p>Log in to save your rating and progress across devices. Your Piano Party account works here too.</p>
    <div className={styles.accountTabs}>
      <button disabled={busy} aria-pressed={mode === 'login'} onClick={() => changeMode('login')}>Log in</button>
      <button disabled={busy} aria-pressed={mode === 'signup'} onClick={() => changeMode('signup')}>Create account</button>
    </div>
    <form onSubmit={submit} className={styles.form}>
      {mode === 'signup' && <label>Your name<input autoComplete="name" required maxLength={80} value={name} onChange={e => setName(e.target.value)} /></label>}
      <label>Email address<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      {mode !== 'reset' && <label>Password<input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 8 : undefined} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} />{mode === 'signup' && <small>At least 8 characters. We’ll email you a confirmation link.</small>}</label>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {message && <p className={styles.notice} role="status">{message}</p>}
      <button className={styles.primary} disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Log in'}</button>
    </form>
    <button className={styles.textButton} disabled={busy} onClick={() => changeMode(mode === 'reset' ? 'login' : 'reset')}>{mode === 'reset' ? 'Back to login' : 'Forgot password?'}</button>
    <small className={styles.privacy}>Progress is private to your account. No subscription or daily puzzle limit.</small>
  </dialog>;
}
