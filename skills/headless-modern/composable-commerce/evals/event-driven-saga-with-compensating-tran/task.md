# Order Checkout Workflow Across Multiple Services

## Problem Description

An e-commerce startup has decomposed their platform into separate services: an Order Service, a Payment Service, an Inventory Service, and a Fulfillment Service. When a customer completes checkout, a sequence of operations must happen: the order is recorded, payment is captured, inventory is reserved, and fulfillment is scheduled. If any step fails — particularly if payment capture fails — the system must roll back previously completed steps to leave the system in a consistent state (e.g. reserved inventory must be released, the order status updated, and the customer notified).

The team has been running into silent failures where a payment processor timeout leaves the order in a "pending" limbo — inventory held but the customer never charged, with no notification sent. They need a robust approach where each service publishes structured events, other services react, and failures trigger compensating actions automatically.

The engineering lead also wants each event payload to carry version metadata so that when event schemas evolve in the future, older consumers don't silently break.

## Output Specification

Implement the event-driven order workflow in TypeScript. Produce the following files:

- `services/order-service/handlers.ts` — event handlers for the order service (creating order, handling payment failure)
- `services/payment-service/handlers.ts` — event handler that captures payment on order creation
- `services/inventory-service/handlers.ts` — event handler that reserves stock and handles order cancellation
- `services/fulfillment-service/handlers.ts` — event handler that schedules fulfillment on payment success
- `services/shared/events.ts` — event type definitions and a publish helper

The code should demonstrate the full happy path and the payment-failure compensation path. Code does not need to connect to live infrastructure but should be complete and correct TypeScript.
