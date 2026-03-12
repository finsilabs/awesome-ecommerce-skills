# Payment and Shipping Webhook Handlers

## Problem Description

A mid-size e-commerce platform has integrated with Stripe for payment processing and ShipStation as their 3PL for fulfillment. Both services send webhook notifications when key events occur: Stripe fires `payment_intent.succeeded` when a customer's payment is captured, and ShipStation fires a shipment event when a carrier label is generated and the package is handed off.

The development team has observed that Stripe occasionally delivers the same `payment_intent.succeeded` event two or three times within minutes of each other — particularly during periods of high load. This has caused orders to be double-confirmed and inventory to be deducted twice. The ShipStation integration is new and needs to be built from scratch, capturing tracking details from the webhook payload.

A `processOrderTransition(orderId, newStatus, metadata)` function is available and handles the full transition pipeline (DB update, side effects, external webhooks). The `db` object (Prisma-like ORM) is available in scope.

## Output Specification

Produce the following JavaScript files:

- `api/webhooks/payment.js` — handler for Stripe's `payment_intent.succeeded` event
- `api/webhooks/shipping.js` — handler for shipment creation events from the 3PL

Also produce a `test-idempotency.js` script at the project root that demonstrates what happens when the payment webhook is called twice for the same order (i.e., that the second call is safely ignored). The script should `console.log` the result of each call so the behavior is visible from the output file.
