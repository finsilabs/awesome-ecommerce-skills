# Privacy Portal and Marketing Consent System

## Problem/Feature Description

Luminos Retail has been growing rapidly across Europe and recently brought on a dedicated data protection officer. The DPO's first audit identified two critical gaps: customers have no self-service way to access or download their personal data, and the marketing team has been sending promotional emails to customers without a robust system to enforce consent or allow easy opt-out.

The DPO wants a privacy portal where customers can submit requests for their data (access, deletion, correction, objection) and receive a machine-readable download of everything the platform holds about them. The portal must also accommodate the right to opt out of marketing at any time with a single click. Additionally, the marketing engineering team needs a utility function for sending promotional emails that enforces consent checks before delivery and embeds a signed unsubscribe link. The DPO has also noted that whenever someone opts into marketing — whether during checkout or on a newsletter signup page — the platform needs to record enough metadata to demonstrate consent if ever challenged.

Assume a `db` object is available with standard CRUD methods. Assume `sendGrid` and `sendVerificationEmail` helper functions are available. Use Next.js API route conventions (`NextApiRequest`, `NextApiResponse`).

## Output Specification

Produce the following files:

- `pages/api/gdpr/export.ts` — the data export endpoint (authenticated, returns all customer data as a downloadable file)
- `pages/api/gdpr/request.ts` — the request intake endpoint that accepts a request type and email address, validates identity before processing, and sets an appropriate deadline
- `lib/marketing-email.ts` — the marketing email send function, the unsubscribe handler, and a function for recording a new marketing opt-in with the required metadata fields
- `PRIVACY_PORTAL.md` — a short overview of how the three endpoints fit together and what the self-service flow looks like from a customer's perspective
