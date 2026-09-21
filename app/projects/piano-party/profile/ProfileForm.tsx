"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabase, accountRoot } from "../account/supabase";
import { profileMetadata } from "../account/accountData";
import { useAccount } from "../account/useAccount";
import styles from "../account/account.module.css";
function ProfileEditor({ user }: { user: User }) {
  const router = useRouter();
  const [name, setName] = useState(String(user.user_metadata.full_name || user.user_metadata.name || ""));
  const [phone, setPhone] = useState(String(user.user_metadata.contact_phone || (user.phone ? `+${user.phone.replace(/^\+/, "")}` : "")));
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(""); setMessage("");
    try { await action(); } catch (error) { setError(error instanceof Error ? error.message : "Could not save. Please try again."); }
    finally { setBusy(false); }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const { error } = await getSupabase().auth.updateUser({ data: profileMetadata(name, phone) });
      if (error) throw error;
      setMessage("Your profile is saved.");
    });
  }
  async function changePassword(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      if (password !== confirmation) throw new Error("Your passwords do not match.");
      const { error } = await getSupabase().auth.updateUser({ password });
      if (error) throw error;
      setPassword(""); setConfirmation(""); setMessage("Your password has been updated.");
    });
  }
  return <>
    <div className={styles.avatar} aria-hidden="true">{(name.trim()[0] || "♪").toUpperCase()}</div><h2>Your profile</h2><p>A name to call you by, and your account details.</p>
    {error && <p role="alert" className={`${styles.notice} ${styles.error}`}>{error}</p>}
    {message && <p role="status" className={styles.notice}>{message}</p>}
    <form className={styles.form} onSubmit={save}>
      <label>Your name<input required autoComplete="name" maxLength={80} value={name} onChange={e => setName(e.target.value)} /></label>
      {user.email && <label>Sign-in email<input type="email" readOnly value={user.email} /><small>{user.email_confirmed_at ? "Verified email" : "Email confirmation pending"}</small></label>}
      {user.phone && <label>Sign-in phone<input readOnly value={`+${user.phone.replace(/^\+/, "")}`} /><small>{user.phone_confirmed_at ? "Verified phone" : "Phone confirmation pending"}</small></label>}
      <label>Contact phone <small>Optional</small><input type="tel" autoComplete="tel" placeholder="+6591234567" value={phone} onChange={e => setPhone(e.target.value)} /><small>For your profile only. This does not change how you sign in.</small></label>
      <button className={styles.primary} disabled={busy}>{busy ? "Please wait…" : "Save profile"}</button>
    </form>
    <div className={styles.social}><h2>Set a new password</h2><form className={styles.form} onSubmit={changePassword}>
      <label>New password<input type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} /><small>Use at least 8 characters.</small></label>
      <label>Confirm new password<input type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
      <button className={styles.secondary} disabled={busy}>Update password</button>
    </form></div>
    <div className={styles.footer}><Link href={`${accountRoot}/`}>Back to Piano Party</Link><button className={styles.textButton} disabled={busy} onClick={() => run(async () => { const { error } = await getSupabase().auth.signOut(); if (error) throw error; router.replace(`${accountRoot}/login/`); })}>Log out</button></div>
  </>;
}
export default function ProfileForm() {
  const { user, loading, error } = useAccount();
  if (loading) return <p role="status">Loading your profile…</p>;
  if (!user) return <><h2>Make yourself at home.</h2><p>{error || "Log in or create an account to view your profile."}</p><Link href={`${accountRoot}/login/`}>Log in / Create account →</Link></>;
  return <ProfileEditor key={user.id} user={user} />;
}
