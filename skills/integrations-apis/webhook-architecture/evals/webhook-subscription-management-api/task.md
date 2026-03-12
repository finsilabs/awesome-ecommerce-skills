# Partner Webhook Subscription API

## Problem/Feature Description

Your company is launching a partner integration program that allows third-party developers to subscribe to platform events and receive real-time notifications at their own endpoints. The developer relations team has asked for a self-service API where partners can register, update, and manage their webhook endpoints without requiring manual intervention from your team.

The security team has a firm requirement: each webhook subscription must be independently secured with a unique credential that partners use to verify that deliveries originate from your platform. This credential must be generated securely and may never be retrieved after creation — if a partner loses it, they must rotate or recreate the subscription. The team also wants the system to be observable: the support team needs to be notified automatically if the dead-letter queue for any subscriber grows large enough to indicate a systematic integration failure, rather than finding out from a frustrated partner days later.

Your task is to implement the webhook subscription management API and the DLQ monitoring logic.

## Output Specification

Produce the following files:

- `src/webhooks/subscriptions.ts` — The subscription creation endpoint logic (framework-agnostic: export a function accepting request data and returning a response object)
- `src/webhooks/monitoring.ts` — DLQ monitoring function that checks queue depth and sends an alert when a threshold is exceeded
- `src/webhooks/schema.sql` — Database schema for webhook subscriptions and any supporting tables
- `README.md` — Document the API contract, the security model for signing secrets, and the monitoring behaviour
