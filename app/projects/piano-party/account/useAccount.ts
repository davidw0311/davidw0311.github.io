"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

export function useAccount() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const supabase = getSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) { setUser(session?.user ?? null); setLoading(false); }
    });
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      setUser(data.user);
      if (error && error.name !== "AuthSessionMissingError") setError(error.message);
      setLoading(false);
    }).catch(() => { if (active) { setError("Could not connect. Please reload and try again."); setLoading(false); } });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  return { user, loading, error };
}
