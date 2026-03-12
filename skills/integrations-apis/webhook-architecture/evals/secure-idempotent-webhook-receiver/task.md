# Stripe Webhook Handler for Payment Processing

## Problem/Feature Description

Your company has integrated Stripe as its payment processor. The engineering team has been getting reports of duplicate order fulfillments and failed payments being silently ignored. Investigation revealed that the webhook handler doesn't guard against duplicate deliveries (Stripe retries for up to 72 hours), and the current HMAC verification implementation is vulnerable to timing-based attacks. Additionally, security review flagged that the system isn't rejecting replayed events — a credential that was briefly exposed could allow an attacker to replay captured webhook payloads indefinitely.

Your task is to implement a production-quality Stripe webhook receiver endpoint in TypeScript. The handler must correctly verify Stripe's HMAC signature format, protect against replay attacks, deduplicate repeated event deliveries, and respond correctly so that Stripe stops retrying events even when internal processing fails.

## Output Specification

Produce the following files:

- `src/webhooks/verify.ts` — HMAC verification utilities
- `src/webhooks/stripe-handler.ts` — The webhook handler endpoint logic (framework-agnostic: export a function that accepts rawBody: Buffer, headers: Record<string, string>, and returns {status: number, body: object})
- `src/webhooks/schema.sql` — SQL schema for any tables needed to support the implementation
- `README.md` — Brief explanation of the security properties provided by your implementation and why each design decision was made

The implementation should be demonstrably correct TypeScript. You do not need a running server — focus on the handler logic and its correctness.
