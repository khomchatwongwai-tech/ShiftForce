import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { auth } from '../firebase/config';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
export const isSupabaseConfigured = Boolean(url && publishableKey);
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  if (!client) {
    client = createClient(url!, publishableKey!, {
      accessToken: async () => auth.currentUser ? await auth.currentUser.getIdToken(false) : null,
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return client;
}