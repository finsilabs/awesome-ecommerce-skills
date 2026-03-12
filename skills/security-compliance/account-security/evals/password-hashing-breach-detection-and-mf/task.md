# Customer Account Security: Password and MFA Module

## Problem/Feature Description

A growing online retailer wants to strengthen how it stores customer passwords and provide optional two-factor authentication. The security team has just completed an audit and found two gaps: passwords are currently stored with bcrypt at a work factor that may be insufficient for modern hardware, and there is no check to warn customers when they choose passwords that have appeared in public data breaches. Additionally, customers have been requesting an authenticator app option ever since a competitor suffered an account takeover incident that made the news.

The team wants a self-contained TypeScript module that handles both concerns: secure password storage with breach detection, and a complete TOTP-based MFA enrollment and verification flow (including backup codes for account recovery). The module will be imported into the Next.js API routes for registration, login, and account settings pages.

## Output Specification

Produce the following files:

- `lib/auth/password.ts` — password hashing, verification, and breach-checking functions
- `lib/auth/mfa.ts` — MFA setup, TOTP verification, and backup code management functions
- `lib/auth/auth.test.ts` — tests that demonstrate the behavior of both modules (e.g., hashing round-trip, breach check request structure, TOTP verification, backup code exhaustion)
- `README.md` — brief explanation of library choices and configuration parameters selected

All TypeScript code should be complete and importable. Mock or stub any database calls (e.g., use a simple in-memory object) so the tests can run without a real DB.
