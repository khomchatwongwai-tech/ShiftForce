# Workqora → Supabase Setup

This build keeps Firebase Authentication and moves workforce persistence/realtime/storage to Supabase.

## Why this is safe
Supabase hosted projects support Firebase Auth as a third-party authentication provider. The client sends the current Firebase ID token to Supabase. RLS authorizes every row using the Firebase JWT `sub`.

## Dashboard steps
1. Create a dedicated Supabase project for Workqora.
2. In Supabase Authentication → Third-Party Auth, add Firebase and enter the Workqora Firebase Project ID.
3. In SQL Editor, run `supabase/migrations/0001_workqora_foundation.sql` once and confirm it completes without errors.
4. Copy the Project URL and **publishable** key into:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Create/copy a **secret** key only for backend/admin scripts:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
   Never expose the secret key in a `VITE_*` variable.
6. Ensure Firebase users have the custom JWT claim `role: "authenticated"`. The included provisioning scripts now add this claim.
7. Bootstrap the first organization:
   `pnpm run supabase:bootstrap-org -- org-main "Your Company" FIREBASE_UID owner@example.com owner`
8. Sign out/in so Firebase refreshes claims.
9. Run `pnpm run supabase:check`.
10. In **Database → Publications**, confirm the `supabase_realtime` publication contains the workforce tables listed in the migration.
11. In **Storage**, confirm `workqora-files` is private. Upload paths must be `ORGANIZATION_ID/FIREBASE_UID/...`.
12. Run Database security and performance advisors and resolve every critical finding.

## Cutover
`src/App.tsx` and `FirebaseContext.tsx` now use `src/supabase/workforceService.ts` for persistent workforce data. Firebase remains the identity provider.

## Before production
- Run Supabase database/security advisors.
- Test owner, corporate admin, store manager, and employee accounts against RLS.
- Verify Company A cannot query Company B.
- Configure database backups/PITR appropriate to your plan.
