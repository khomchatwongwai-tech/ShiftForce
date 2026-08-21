// Backward-compatible import path for legacy callers. Workforce persistence is
// Supabase-backed; browser Firebase is deliberately limited to Authentication.
export { firestoreService } from '../supabase/workforceService';
