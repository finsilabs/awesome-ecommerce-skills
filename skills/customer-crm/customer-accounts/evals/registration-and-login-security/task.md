# Customer Authentication API

## Problem/Feature Description

A mid-size online retailer is building a new backend service for their storefront. The engineering team needs to implement the customer-facing authentication layer: a registration endpoint and a login endpoint. Security is a top concern — a previous vendor had a breach because they stored passwords insecurely and their login error messages made it easy for attackers to enumerate which email addresses had accounts.

The team has chosen TypeScript with Express for the API. They need you to implement the two endpoints (`POST /api/customers/register` and `POST /api/customers/login`) with proper input validation, secure password handling, session token issuance, and defensive error handling. The implementation should be production-quality — not a prototype.

## Output Specification

Produce a single TypeScript file named `auth.ts` containing:
- The register handler function
- The login handler function
- The session creation helper
- Any necessary type definitions, imports, and schemas

You may stub out external dependencies (database calls, email sending) with placeholder functions or comments — the goal is the core logic and security decisions. Do not require a running database or mail server.

Also produce a short `notes.md` file explaining the key security decisions made in the implementation (2-4 bullet points).
