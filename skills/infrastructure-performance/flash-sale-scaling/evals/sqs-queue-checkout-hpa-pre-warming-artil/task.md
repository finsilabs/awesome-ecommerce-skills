# Black Friday Checkout Service and Infrastructure Readiness

## Problem/Feature Description

A fashion retailer is preparing for their biggest Black Friday sale. Last year the checkout API made a synchronous database write for every order, which worked fine at normal traffic but collapsed under the 40× spike when the sale opened. The database became the bottleneck, latency climbed above 30 seconds, and customers saw timeout errors before the team could scale. This year, the engineering team wants three things in place before the sale goes live.

First, the checkout API needs a fast path: accept an order, do the minimum work necessary, and immediately return a confirmation to the customer — without touching the database synchronously. Orders queued this way must be processed reliably in the background, with inventory reservations released and customers notified if processing fails. Second, the Kubernetes deployment needs an autoscaling configuration that can sustain the initial traffic surge, because reactive scaling alone won't spin up pods fast enough when thousands of visitors arrive simultaneously. Third, before the sale, the team needs to run a load test that simulates realistic Black Friday traffic — both shoppers racing to checkout and visitors browsing the catalog — to verify the system can handle more than just the expected peak.

## Output Specification

Produce the following files:

- `checkout.ts` — the Next.js-style route handler (`POST` export) and the SQS consumer (`processOrder` export) implementing the fast-path checkout and background order processor
- `hpa.yaml` — Kubernetes HorizontalPodAutoscaler manifest for the checkout-service deployment
- `load-test.yml` — Artillery load test configuration file

You may stub external calls (e.g., `capturePayment`, `sendOrderConfirmationEmail`, `reserveInventory`) — focus on the SQS message structure, queue routing, and the shape of the configuration files.
