# Security Specification for ShiftForce Firestore

## 1. Data Invariants & Zero Trust Model
- User records `/users/{userId}` can only be written by the authenticated user matching `request.auth.uid`.
- Sensitive employee roster items and shifts can be read by authenticated staff and managed by managers/hosts.
- Timeclock punches `/punches/{punchId}` must have valid IDs, timestamps, and punch types (`CLOCK_IN` or `CLOCK_OUT`).
- Shift trades `/shiftTrades/{tradeId}` can be created by authenticated staff and updated by managers or the assigned target employee.
- All documents strictly enforce string length boundaries and data typing to prevent injection attacks.

## 2. The Dirty Dozen Payloads (Rejection Matrix)
1. **Ghost Field / Shadow Key Attack**: Inserting unlisted fields into User profiles (Rejected by validation blueprint).
2. **Identity Spoofing**: Creating a shift trade with `requestingEmployeeId` not matching user or authenticated context.
3. **ID Poisoning**: Injecting oversized or special-character document IDs > 128 characters.
4. **Denial of Wallet Attack**: Pushing oversized 500KB string payloads into announcements or punch notes.
5. **PII Extraction Attempt**: Anonymous read attempt on employee records.
6. **Clock-In Tampering**: Submitting invalid punch types.
7. **Time Inversion Attack**: Submitting invalid timestamp formats.
8. **Role Escalation Attack**: Client attempting to self-grant host or admin privileges without server-level verification.
9. **Orphan Shift Creation**: Creating a shift with an empty employee ID.
10. **Trade Status Bypass**: Arbitrary transition of trade status directly to settled without valid state transitions.
11. **Malicious Announcement Blast**: Non-admin write to announcements collection.
12. **Cross-Tenant Document Access**: Unauthenticated read/write access.
