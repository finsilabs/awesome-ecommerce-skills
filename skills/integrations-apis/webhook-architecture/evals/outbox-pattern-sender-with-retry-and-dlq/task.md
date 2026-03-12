# Reliable Webhook Delivery System for a SaaS Platform

## Problem/Feature Description

You are building the webhook delivery infrastructure for a multi-tenant SaaS platform. Partners register endpoints to receive events (such as `invoice.paid`, `subscription.cancelled`, `user.created`) whenever relevant things happen in the platform. The previous implementation called partner endpoints directly during the request lifecycle — this caused partner timeouts to slow down the main application and meant events were silently lost whenever a partner's server was down during the moment an event fired.

The platform team wants a robust, at-least-once delivery system. Events must survive application crashes between generation and delivery, failed deliveries must be retried automatically with increasing delays, and events that ultimately cannot be delivered must be moved to a dead-letter queue where an alert is triggered and an operator can manually re-queue them later. The system must also correctly authenticate outbound requests so partners can verify that payloads come from your platform.

## Output Specification

Produce the following files:

- `src/webhooks/outbox.ts` — The outbox writer (called from within business transactions) and the outbox poller that delivers pending events
- `src/webhooks/delivery.ts` — HTTP delivery logic including signing, headers, and timeout handling
- `src/webhooks/retry.ts` — Retry scheduling and dead-letter queue promotion logic
- `src/webhooks/schema.sql` — Database schema for all required tables
- `src/webhooks/replay.ts` — Admin function to re-queue a dead-letter event for delivery
- `README.md` — Architecture overview explaining the reliability guarantees and the retry schedule

The implementation should be TypeScript. You do not need a running server or real database — focus on the logic, structure, and correctness of the code. Stub out database calls as needed (e.g., `db.webhookOutbox.findPending(...)`) but implement the full business logic around them.
