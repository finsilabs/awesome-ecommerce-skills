# Shopify Webhook Security Middleware

## Problem/Feature Description

A merchant platform company has built a Shopify app that receives order, product, and customer events via HTTP webhooks. Their current implementation has been flagging legitimate webhook deliveries as unauthorized, while the security team suspects some forged requests may be slipping through. After investigation, the team suspects the issue is in how the HMAC signatures are being checked.

You have been asked to write a clean, standalone TypeScript module that correctly verifies incoming Shopify webhook requests. The implementation must follow security best practices and handle the request body correctly so that the signature check works reliably. The team will integrate this module into their Express application.

## Output Specification

Produce the following files:

- `src/middleware/verify-shopify-webhook.ts` — The verification function that accepts the raw request body (as a Buffer), the HMAC header value, and the webhook secret, and returns a boolean.
- `src/routes/webhooks.ts` — An Express router that mounts webhook handling middleware on `/webhooks`, properly handles the body parsing pipeline, and includes a sample handler for the `POST /webhooks/orders-create` endpoint. The handler should respond immediately and then log that the order was received.
- `README.md` — A short explanation of how to integrate this middleware and why certain implementation choices were made.
