# Order Event Processor for Saleor

## Problem/Feature Description

A logistics startup has recently integrated Saleor as their e-commerce backend and needs to build a lightweight service that reacts in real-time when orders are placed. Whenever a customer completes checkout, the service should receive the order data from Saleor and hand it off to their internal fulfillment pipeline. The engineering team has decided to build a dedicated Saleor App — a Node.js service that lives outside of Saleor itself and communicates with it via the app registration protocol and webhook events.

The team is starting from scratch and wants a minimal but correct implementation. They need the app manifest, the registration endpoint, and a working webhook handler that fires when an order is placed. Security is a priority: the service must authenticate incoming webhook payloads rather than blindly trusting them. The handler should log enough order details to hand off to the fulfillment pipeline.

## Output Specification

Write the TypeScript source files for a Next.js-based Saleor App. Produce the following files in your working directory:

- `package.json` — dependencies needed to run the app
- `pages/api/manifest.ts` — the app manifest handler
- `pages/api/register.ts` — the token registration endpoint
- `pages/api/webhooks/order-created.ts` — the order creation webhook handler

For each file include brief inline comments explaining key decisions.
