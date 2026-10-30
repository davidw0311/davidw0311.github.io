import { ChessService } from './service.js';
import { SupabaseRoomStore } from './supabase-storage.js';
import { makeHandler } from './http.js';
const store = new SupabaseRoomStore(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
Deno.serve(makeHandler(new ChessService(store)));
