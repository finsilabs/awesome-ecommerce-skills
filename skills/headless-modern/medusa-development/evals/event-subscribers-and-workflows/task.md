# Automated Fulfillment Notification System

## Problem/Feature Description

A growing e-commerce company fulfills orders through a third-party logistics (3PL) partner. Currently, staff manually export new orders each morning and email them to the 3PL — a process that causes delays and occasional missed shipments. The engineering team has been asked to automate this: whenever an order is placed, the system should automatically send the order details to the 3PL's webhook endpoint and record a fulfillment request in the database so the operations team can audit what was sent.

The team has an existing `FulfillmentRequestModuleService` already registered under the key `'fulfillmentRequestModuleService'` that exposes `createFulfillmentRequest(data)` and `deleteFulfillmentRequest(id)` methods — you do not need to reimplement it. Focus on the event-driven automation layer: the subscriber that reacts to placed orders and the workflow that does the actual work.

## Output Specification

Produce the following files:

- `src/subscribers/order-placed.ts` — the event subscriber that triggers when an order is placed
- `src/workflows/notify-fulfillment-partner.ts` — the workflow responsible for calling the 3PL and persisting the fulfillment record
- `workflow-design.md` — a brief document describing each workflow step, what it does, and how failure at any step is handled

The 3PL webhook URL is `https://3pl.example.com/api/inbound-orders`. For authentication use a Bearer token from an environment variable `FULFILLMENT_PARTNER_TOKEN`. The fulfillment request record should capture at minimum: the order ID, the 3PL's response reference ID, and a status field.
