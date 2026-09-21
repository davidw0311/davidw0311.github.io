import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Public browser credentials. Authorization remains enforced by Supabase Auth/RLS.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vxbhzddlhopsgbwmjzdm.supabase.co";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_nDzp9-G2TVUZ2_-NGsxrvA_sczyap7E";
export const accountRoot = "/projects/piano-party";
let client: SupabaseClient | undefined;
export function getSupabase() {
  client ??= createClient(supabaseUrl, supabaseKey, {
    auth: { flowType: "implicit", persistSession: true, detectSessionInUrl: true, autoRefreshToken: true },
  });
  return client;
}
export function loginUrl() { return `${window.location.origin}${accountRoot}/login/`; }
