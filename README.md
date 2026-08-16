# ShiftForce

ShiftForce is a restaurant workforce scheduling and operations platform built with React, TypeScript, Firebase Authentication, Supabase, Express, Stripe, and Gemini.

## Local development

1. Install dependencies: `pnpm install --frozen-lockfile`
2. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`.
3. For backend Firebase token verification, authenticate Application Default Credentials or set `GOOGLE_APPLICATION_CREDENTIALS` to a service-account file stored outside this repository.
4. Configure the dedicated ShiftForce Supabase project as described in `SUPABASE_SETUP.md`.
5. Run `pnpm run dev`.

## Production security

- Keep `VITE_ENABLE_DEMO_AUTH=false`.
- Apply `supabase/migrations/0001_shiftforce_foundation.sql`, run Supabase advisors, and verify tenant RLS before enabling real customer data.
- Provision manager/admin access server-side via Firebase custom claims or the protected `admins/{uid}` collection.
- Gemini endpoints require a valid Firebase ID token and are rate-limited.
- Never expose `GEMINI_API_KEY` in browser code or as a `VITE_*` variable.

## Validation

Run `pnpm run test`, `pnpm run typecheck`, all security/enterprise/release gates, and `pnpm run build` before release.

## Enterprise billing and stores

ShiftForce bills paid organizations by active location count. Subscription activation is server-authoritative and reconciled from Stripe webhooks. Configure the Stripe variables in `.env.example`; never put Stripe secret keys or webhook secrets in the browser. Company admins can initialize a tenant, manage plan-entitled locations, and create single-use invitations from **Company Locations**.

## Release candidate validation

Before deployment, follow `RELEASE_RUNBOOK.md`. A deployment is considered ready only when `/api/health/ready` returns HTTP 200 and the full CI typecheck/build plus staging acceptance checks pass.
