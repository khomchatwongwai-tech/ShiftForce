# Security Policy

Do not report credentials or sensitive employee data in public issues. Rotate any credential that is accidentally committed.

Production requirements:

- Keep Gemini and service-account credentials server-side only.
- Require verified Firebase authentication for privileged API routes.
- Provision manager/admin authority server-side; never trust a client-selected role.
- Deploy and test Firestore rules before storing real employee, wage, attendance, or schedule data.
- Keep demo authentication disabled in production.
