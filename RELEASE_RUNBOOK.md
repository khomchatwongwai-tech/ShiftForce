# ShiftForce Release Runbook

## Release-candidate gates
Run before every staging or production deployment:

```bash
npm run security:check
npm run pricing:check
npm run enterprise:check
npm run release:check
npm run typecheck
npm run build
```

The first four gates are dependency-light policy regressions. Typecheck and build are mandatory once dependencies are installed in CI/staging.

## Required production configuration
- Firebase Admin via Application Default Credentials and correct `FIREBASE_PROJECT_ID`.
- Deploy the included Firestore security rules and required indexes.
- Set `APP_URL` to the HTTPS production origin.
- Set `GEMINI_API_KEY` only on the server.
- Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and every paid-plan monthly/annual Stripe Price ID.
- Keep `ENABLE_AI_DEMO_FALLBACK=false`, `VITE_ENABLE_DEMO_AUTH=false`, and `VITE_ENABLE_DEMO_DATA=false`.
- Configure a real notification provider before claiming SMS/WhatsApp/email delivery. Until then reminder results remain `preview_not_sent`.

## Staging acceptance
1. `/api/health` returns 200.
2. `/api/health/ready` returns 200 with all configuration flags true.
3. Owner signs in and sees only their organization.
4. Corporate admin can view authorized stores; store manager cannot view unauthorized stores.
5. Attempted cross-organization Firestore reads/writes are denied.
6. Create/update/delete a shift and confirm an immutable audit event.
7. Employee records own clock-in; another employee cannot punch for them.
8. Admin correction requires a reason and produces an audit event.
9. Offline punch batch stays queued on failure and clears only after server confirmation.
10. Free plan blocks the 11th active employee and second active location.
11. Paid tier Checkout opens Stripe-hosted checkout; no app card fields exist.
12. Signed Stripe webhook updates subscription state once; replayed event is idempotently acknowledged.
13. Stripe Portal opens only for the current organization customer.
14. Missing Gemini configuration returns unavailable; AI failure never invents a successful result.
15. Messaging without a provider is displayed as preview/not sent.

## Production cutover
- Deploy staging commit unchanged to production.
- Run database/rules deployment before serving traffic.
- Verify Stripe webhook endpoint against production secret.
- Run the staging acceptance list against production test organization.
- Monitor error rate, auth failures, webhook failures, Firestore permission denials, and AI upstream failures.
- Keep the previous deployment revision available for rollback.

## Incident / rollback
If auth isolation, billing reconciliation, or labor mutation integrity fails, disable the affected feature or roll back immediately. Do not manually edit tenant IDs, subscription status, punches, or audit logs in the client. Use trusted server/admin tooling and record the correction.
