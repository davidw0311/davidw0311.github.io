"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Provider } from "@supabase/supabase-js";
import { accountRoot, getSupabase, loginUrl, supabaseKey, supabaseUrl } from "../account/supabase";
import { normalizePhone, validPhone, passwordCredentials } from "../account/accountData";
import { useAccount } from "../account/useAccount";
import styles from "../account/account.module.css";
const socialProviders: [Provider, string][] = [["google", "Google"], ["facebook", "Facebook"], ["apple", "Apple"], ["github", "GitHub"], ["discord", "Discord"], ["spotify", "Spotify"], ["twitter", "X"], ["linkedin_oidc", "LinkedIn"]];
type Mode = "login" | "signup" | "reset" | "verify";
export default function LoginForm() {
  const router = useRouter();
  const { user, loading } = useAccount();
  const [mode, setMode] = useState<Mode>("login");
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [settingsReady, setSettingsReady] = useState(false);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.has("error_description")) {
      // Read an external OAuth callback once after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(params.get("error_description") || "That sign-in link has expired. Please try again.");
      window.history.replaceState(null, "", window.location.pathname);
    }
    const abort = new AbortController();
    fetch(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: supabaseKey }, signal: abort.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(settings => { setEnabled(settings.external ?? {}); setSettingsReady(true); })
      .catch(() => { if (!abort.signal.aborted) setError("Could not load sign-in options. Please reload to try again."); });
    return () => abort.abort();
  }, []);
  useEffect(() => { if (!loading && user) router.replace(`${accountRoot}/profile/`); }, [loading, user, router]);
  function switchMode(next: Mode) { setMode(next); setError(""); setMessage(""); setPassword(""); setConfirmation(""); }
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(""); setMessage("");
    try { await action(); } catch (error) { setError(error instanceof Error ? error.message : "Something went wrong. Please try again."); }
    finally { setBusy(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const auth = getSupabase().auth;
      if (mode === "verify") {
        const { error } = await auth.verifyOtp({ phone: normalizePhone(identifier), token: token.trim(), type: "sms" });
        if (error) throw error;
        return;
      }
      if (mode === "reset") {
        if (method === "phone") {
          if (!validPhone(identifier)) throw new Error("Include your country code, such as +6591234567.");
          const { error } = await auth.signInWithOtp({ phone: normalizePhone(identifier), options: { shouldCreateUser: false } });
          if (error) throw error;
          setMode("verify"); setMessage("Enter the SMS code to sign in, then set a new password in your profile.");
        } else {
          const { error } = await auth.resetPasswordForEmail(identifier.trim(), { redirectTo: `${window.location.origin}${accountRoot}/profile/` });
          if (error) throw error;
          setMessage("If an account exists for that email, a password reset link is on its way. Check your inbox and spam folder.");
        }
        return;
      }
      if (mode === "signup") {
        if (!name.trim()) throw new Error("Please enter your name.");
        if (password !== confirmation) throw new Error("Your passwords do not match.");
        const { data, error } = await auth.signUp({ ...passwordCredentials(method, identifier, password), options: { data: { full_name: name.trim() }, emailRedirectTo: loginUrl() } });
        if (error) throw error;
        setPassword(""); setConfirmation("");
        if (!data.session) {
          if (method === "phone") { setMode("verify"); setMessage("Check your phone for a verification code."); }
          else setMessage("Check your email for a confirmation link. If you already have an account, log in or reset your password.");
        }
      } else {
        const { error } = await auth.signInWithPassword(passwordCredentials(method, identifier, password));
        if (error) throw error;
      }
    });
  }
  if (loading || user) return <p role="status">{user ? "Opening your profile…" : "Checking your session…"}</p>;
  return <>
    <div className={styles.tabs} aria-label="Account action">
      <button type="button" disabled={busy} aria-pressed={mode === "login"} className={mode === "login" ? styles.primary : styles.secondary} onClick={() => switchMode("login")}>Log in</button>
      <button type="button" disabled={busy} aria-pressed={mode === "signup"} className={mode === "signup" ? styles.primary : styles.secondary} onClick={() => switchMode("signup")}>Create account</button>
    </div>
    <h2>{mode === "signup" ? "Make yourself at home." : mode === "reset" ? "Forgot your password?" : mode === "verify" ? "Check your phone." : "Welcome back."}</h2>
    <p>{mode === "signup" ? "Start with your name and a way to sign in." : mode === "verify" ? "Enter the verification code from your SMS." : "Your next practice session is waiting."}</p>
    {error && <p role="alert" className={`${styles.notice} ${styles.error}`}>{error}</p>}
    {message && <p role="status" className={styles.notice}>{message}</p>}
    <form className={styles.form} onSubmit={submit}>
      {mode === "signup" && <label>Your name<input autoComplete="name" required maxLength={80} value={name} onChange={e => setName(e.target.value)} /></label>}
      {mode !== "verify" && <>
        <div className={styles.tabs} aria-label="Sign-in method">
          <button type="button" disabled={busy || !enabled.email} aria-pressed={method === "email"} className={method === "email" ? styles.primary : styles.secondary} onClick={() => { setMethod("email"); setIdentifier(""); }}>Email</button>
          <button type="button" disabled={busy || !enabled.phone} aria-pressed={method === "phone"} className={method === "phone" ? styles.primary : styles.secondary} onClick={() => { setMethod("phone"); setIdentifier(""); }}>Phone</button>
        </div>
        <label>{method === "email" ? "Email address" : "Phone number"}<input type={method === "email" ? "email" : "tel"} autoComplete={method === "email" ? "email" : "tel"} required value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder={method === "email" ? "you@example.com" : "+6591234567"} /></label>
      </>}
      {(mode === "login" || mode === "signup") && <label>Password<input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? 8 : undefined} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} />{mode === "signup" && <small>Use at least 8 characters.</small>}</label>}
      {mode === "signup" && <label>Confirm password<input type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>}
      {mode === "verify" && <label>Verification code<input autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6,10}" required value={token} onChange={e => setToken(e.target.value)} /></label>}
      <button className={styles.primary} disabled={busy || !settingsReady || !enabled[method]}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "reset" ? (method === "phone" ? "Send sign-in code" : "Send reset link") : mode === "verify" ? "Verify phone" : "Log in"}</button>
    </form>
    {mode === "login" && <button type="button" className={styles.textButton} disabled={busy} onClick={() => switchMode("reset")}>Forgot password?</button>}
    {mode === "verify" && <button type="button" className={styles.textButton} disabled={busy} onClick={() => switchMode("reset")}>Need a new code?</button>}
    <div className={styles.social}>
      <span className={styles.hint}>Or use a connected account</span>
      {socialProviders.filter(([provider]) => enabled[provider]).map(([provider, label]) => <button className={styles.secondary} key={provider} disabled={busy} onClick={() => run(async () => {
        const { error } = await getSupabase().auth.signInWithOAuth({ provider, options: { redirectTo: loginUrl() } });
        if (error) throw error;
      })}>Continue with {label}</button>)}
      {settingsReady && !socialProviders.some(([provider]) => enabled[provider]) && <p className={styles.hint}>Social sign-in isn’t available yet. Please use email for now.</p>}
      {settingsReady && !enabled.phone && <small className={styles.hint}>Phone sign-in is not available yet. You can add a contact number to your profile.</small>}
    </div>
  </>;
}
