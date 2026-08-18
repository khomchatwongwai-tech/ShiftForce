# ShiftForce → Supabase Setup

This build keeps Firebase Authentication and Firestore as the authoritative workforce and billing store. Supabase provides an RLS-protected read model, Realtime integration, and private file storage. Browser code cannot mutate workforce tables through Supabase; trusted labor changes go through the authenticated server endpoints so plan limits and audit guarantees cannot be bypassed.

## Why this is safe
Supabase hosted projects support Firebase Auth as a third-party authentication provider. The client sends the current Firebase ID token to Supabase. RLS authorizes every row using the Firebase JWT `sub`.

## Dashboard steps
1. Create a dedicated Supabase project for ShiftForce.
2. In Supabase Authentication → Third-Party Auth, add Firebase and enter the ShiftForce Firebase Project ID.
3. In SQL Editor, run `supabase/migrations/0001_shiftforce_foundation.sql` once and confirm it completes without errors.
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
11. In **Storage**, confirm `shiftforce-files` is private. Upload paths must be `ORGANIZATION_ID/FIREBASE_UID/...`.
12. Run Database security and performance advisors and resolve every critical finding.

## Runtime ownership
`src/App.tsx` and `FirebaseContext.tsx` use `src/firebase/firestoreService.ts`. That service routes privileged workforce mutations through `/api/workforce/*`; Firestore rules deny direct browser writes to labor-impacting collections. `src/supabase/workforceService.ts` is deliberately read-only and must not become an alternate mutation path.

## Before production
- Run Supabase database/security advisors.
- Test owner, corporate admin, store manager, and employee accounts against RLS.
- Verify Company A cannot query Company B.
- Configure database backups/PITR appropriate to your plan.
