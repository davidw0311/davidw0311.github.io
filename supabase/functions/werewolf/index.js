import {WerewolfService} from './service.js';
import {SupabaseRoomStore} from './supabase-storage.js';
import {makeHandler} from './http.js';
const store=new SupabaseRoomStore(Deno.env.get('SUPABASE_URL'),Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
export const handler=makeHandler(new WerewolfService(store));
Deno.serve(handler);
