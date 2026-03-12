# Password Reset Flow

## Problem/Feature Description

An online marketplace has received complaints from customers who are locked out of their accounts. The engineering team needs to build a self-service password reset flow. Security is critical here — a competitor recently suffered an account-takeover attack because their reset tokens were predictable, and another service leaked user account existence when customers entered emails to request resets.

The team wants a robust implementation: when a customer requests a reset, a time-limited link is emailed to them; when they follow the link, they can set a new password. The reset mechanism needs to be safe against token prediction, token theft (e.g., if the database is breached), and account takeover through stale reset links or old sessions.

The codebase already uses bcrypt for password hashing during registration. The reset flow should be consistent with that approach.

## Output Specification

Produce a TypeScript file named `password-reset.ts` containing:
- The `POST /api/customers/forgot-password` handler
- The `POST /api/customers/reset-password` handler
- Any helper functions and type definitions needed

You may stub out database operations and the email-sending function with placeholder functions. Focus on the security logic: token generation, storage strategy, expiry, and the actions taken after a successful reset.

Also produce a short `security-notes.md` explaining the key design decisions made in the implementation (3-5 bullet points).
