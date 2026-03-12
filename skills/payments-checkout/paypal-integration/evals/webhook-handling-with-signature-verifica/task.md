# Build a PayPal Webhook Handler for Order Fulfillment

## Problem/Feature Description

A consumer electronics retailer processes hundreds of PayPal transactions per day. They currently trigger order fulfillment (warehouse pick-and-pack, shipping label generation) immediately when the PayPal popup closes on the frontend. This has caused problems: occasionally the funds are never actually settled, yet orders get shipped. They also had an incident where a webhook retry — caused by a temporary network blip on their end — created duplicate shipments for the same order.

The engineering team wants to move to a webhook-driven fulfillment model where the backend listens for confirmed payment events from PayPal and only triggers fulfillment once the payment is definitively settled. They also want to handle refunds and chargebacks automatically by updating internal order records. A previous contractor started a webhook endpoint but left it incomplete — the team needs a production-ready implementation.

## Output Specification

Produce the webhook handler as a Node.js file:

1. **`api/webhooks/paypal.js`** — an Express-compatible request handler for `POST /api/webhooks/paypal`. It should:
   - Authenticate the incoming request before processing
   - Route payment events to appropriate handlers
   - Prevent duplicate processing if the same event is delivered more than once
   - Return appropriate HTTP responses

2. **`implementation-notes.md`** — a short document describing:
   - How your handler authenticates incoming requests
   - Which events it handles and what action each triggers
   - How it prevents duplicate order fulfillment on webhook retries

Assume the following environment variables are available: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`. Read PayPal credentials from these variables. You do not need a real database — use mock functions or console.log to represent database lookups and order updates. The implementation should be complete enough that a reviewer can assess the security and reliability properties from reading the code.
