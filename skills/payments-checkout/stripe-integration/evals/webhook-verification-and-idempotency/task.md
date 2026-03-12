# Stripe Webhook Order Fulfillment Handler

## Problem/Feature Description

FreshPrint, an on-demand print shop, processes hundreds of custom orders per day. When a customer pays, FreshPrint's backend needs to trigger print queue submission, send a confirmation email, and mark the order fulfilled in their database. Currently this logic runs on the browser redirect after payment, which means orders frequently go unfulfilled when customers close their tabs or lose internet connectivity before the redirect completes.

The engineering team wants to move fulfillment to a server-side webhook handler so that every successful payment reliably triggers the fulfillment pipeline. They also need the system to handle Stripe's delivery guarantees — Stripe may redeliver the same event multiple times, and the team has been burned before by orders being double-processed and double-emailed. In addition, they need the webhook endpoint to be hardened against spoofed requests, since a forged `payment_intent.succeeded` could trigger free order shipments.

## Output Specification

Produce a Node.js/Express implementation of the Stripe webhook endpoint. Write the code to a file called `webhook-handler.js`. The handler should:

- Accept POST requests at `/api/webhooks/stripe`
- Validate the authenticity of incoming Stripe events
- Process the following event types: payment succeeded, payment failed, and charge refunded
- Implement fulfillment logic that is safe to call multiple times for the same order

Include a `README.md` explaining:
- How to configure the required environment variables
- How to test the webhook locally during development

You may stub out the database and email functions (e.g., `db.orders.findById`, `sendConfirmationEmail`) rather than implementing them fully. Focus on the structure and correctness of the webhook handler itself.
