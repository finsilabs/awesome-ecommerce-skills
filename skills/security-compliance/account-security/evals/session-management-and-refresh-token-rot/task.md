# Secure Session Management Module

## Problem/Feature Description

An e-commerce startup is redesigning its authentication layer after a security review flagged that all customer tokens are stored as long-lived JWTs with no mechanism to revoke them. Once a token is issued, it remains valid indefinitely unless the secret key changes — which invalidates all sessions globally. The team also discovered that a support ticket from last month was actually a stolen session: a customer's refresh token had been lifted from their browser's localStorage, giving the attacker permanent access.

The engineering team wants a new session management module that balances security with usability: short-lived access credentials that limit the blast radius of a token leak, paired with a long-lived rotation mechanism that detects and responds to replay attacks. The solution should integrate naturally with a Next.js API routes architecture and set cookies in a way that blocks common web attack vectors.

## Output Specification

Produce the following files:

- `lib/auth/session.ts` — TypeScript module implementing session creation, access token generation, and refresh token rotation logic
- `lib/auth/session.test.ts` — tests that demonstrate session creation behavior, rotation, replay detection (what happens when a used token is presented again), and cookie configuration
- `README.md` — explains the token lifetimes, rotation strategy, replay attack detection behavior, and cookie security settings

All database interactions may be stubbed with an in-memory store so tests run without a real database. Show the cookie-setting logic clearly in the code or tests.
