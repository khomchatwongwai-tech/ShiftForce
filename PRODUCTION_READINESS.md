# ShiftForce Production Readiness

## Current milestone: release-candidate code hardening complete

The application now passes all dependency-light security, enterprise-pricing, enterprise-billing, and release-hardening regression gates included in the repository. This means the **codebase is at the final release-candidate stage**, not that an unconfigured deployment is automatically production-live.

### Completed final hardening
- Server-authoritative employee, shift, punch, shift-trade, and announcement mutations.
- Browser direct writes denied for labor-impacting collections.
- Employee punch identity enforced server-side; admin punch correction requires a reason.
- Authenticated bulk synchronization for offline punches; the local queue clears only after server confirmation.
- Privileged labor mutations create server-authored audit events.
- Stripe Checkout and Customer Portal remain server-created.
- Stripe webhook signature verification uses the raw body and event IDs are idempotently recorded to prevent duplicate reconciliation.
- Production readiness endpoint reports Firebase Admin/Firestore, Supabase, Gemini, Stripe secret/webhook, app URL, and all Stripe Price configuration without exposing secret values or crashing when credentials are absent.
- Security headers and request IDs are applied by the server.
- Scheduler/reminder previews no longer claim SMS/WhatsApp delivery when no provider is connected.
- Company/store tenant isolation, invitations, store entitlements, employee plan limits, and server-side billing state remain enforced.
- AI remains authenticated, server-only, configured-required, and fail-closed.

### Validation results in this package
- Security gate: **17/17 PASS**.
- Enterprise pricing gate: **12/12 PASS**.
- Enterprise 85 gate: **20/20 PASS**.
- Final release hardening gate: **30/30 PASS**.
- TypeScript/TSX syntax-transpile gate: **66 files PASS**.

### External release blockers that code alone cannot complete
1. Install dependencies and complete semantic `npm run typecheck` + production `npm run build` in CI/staging. Dependency installation timed out in the current execution environment, so these two gates cannot be represented as passed here.
2. Restore GitHub write access and run the repository CI on the imported branch/PR.
3. Deploy Firebase rules/indexes and execute Firebase Emulator cross-tenant tests against real rules.
4. Configure real Stripe Product/Price IDs and webhook secret, then test trial/active/past_due/canceled lifecycle in Stripe test mode.
5. Configure production Firebase service identity, Gemini key, HTTPS `APP_URL`, monitoring, backups, and alerting.
6. Connect a transactional messaging provider before enabling delivery claims; current reminders intentionally remain preview/not-sent.
7. Replace or clearly disable any optional POS/payroll/hiring adapter that is still demonstration-only until a real provider is connected.
8. Perform browser E2E tests and final staging/production smoke tests using real configured services.

### Release status
**Code hardening: release candidate. Production-live certification: pending external configuration, CI/build, emulator/E2E, and staging validation.**
