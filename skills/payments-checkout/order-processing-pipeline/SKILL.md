---
name: order-processing-pipeline
description: "Order state machine: pending -> confirmed -> processing -> shipped -> delivered"
category: payments-checkout
risk: critical
source: curated
date_added: "2026-03-12"
tags: [orders, state-machine, fulfillment, webhooks, order-management, pipeline, transitions]
triggers: ["order processing", "order state machine", "order fulfillment", "order status", "order pipeline", "order management"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Order Processing Pipeline

## Overview

Implement a robust order state machine that governs transitions through the complete order lifecycle: pending → confirmed → processing → shipped → delivered, with side effects (emails, inventory deduction, webhooks) triggered at each transition. Uses an event-sourced approach — every state change is recorded as an immutable event — to provide a full audit log and enable replaying or debugging the order history.

## When to Use This Skill

- When building order management from scratch and need a reliable state transition system
- When order state becomes inconsistent (e.g., fulfilled orders still showing as pending)
- When implementing automated order processing with a 3PL or fulfillment provider
- When adding order status webhooks for third-party integrations (ERP, shipping, returns)

## Core Instructions

1. **Define the order state machine**

   ```javascript
   // lib/orderStateMachine.js

   export const ORDER_STATES = {
     PENDING:    'pending',     // Order placed, payment not yet confirmed
     CONFIRMED:  'confirmed',   // Payment confirmed, awaiting fulfillment start
     PROCESSING: 'processing',  // Being picked, packed, or printed
     SHIPPED:    'shipped',     // Handed to carrier, tracking number assigned
     DELIVERED:  'delivered',   // Confirmed delivery (carrier event or manual)
     CANCELLED:  'cancelled',   // Cancelled before shipment
     REFUNDED:   'refunded',    // Partially or fully refunded
     ON_HOLD:    'on_hold',     // Flagged for manual review (fraud, address issue)
   };

   // Valid transitions: current state → allowed next states
   export const VALID_TRANSITIONS = {
     [ORDER_STATES.PENDING]:    [ORDER_STATES.CONFIRMED, ORDER_STATES.CANCELLED, ORDER_STATES.ON_HOLD],
     [ORDER_STATES.CONFIRMED]:  [ORDER_STATES.PROCESSING, ORDER_STATES.CANCELLED, ORDER_STATES.ON_HOLD],
     [ORDER_STATES.PROCESSING]: [ORDER_STATES.SHIPPED, ORDER_STATES.CANCELLED, ORDER_STATES.ON_HOLD],
     [ORDER_STATES.SHIPPED]:    [ORDER_STATES.DELIVERED, ORDER_STATES.REFUNDED],
     [ORDER_STATES.DELIVERED]:  [ORDER_STATES.REFUNDED],
     [ORDER_STATES.ON_HOLD]:    [ORDER_STATES.PROCESSING, ORDER_STATES.CANCELLED],
     [ORDER_STATES.CANCELLED]:  [ORDER_STATES.REFUNDED],
     [ORDER_STATES.REFUNDED]:   [],
   };

   export function canTransition(fromState, toState) {
     return VALID_TRANSITIONS[fromState]?.includes(toState) ?? false;
   }
   ```

2. **Implement the state transition function with event sourcing**

   Every transition is recorded as an immutable event. The current status is derived from — or updated alongside — the event log.

   ```javascript
   // lib/orderTransitions.js
   import { canTransition } from './orderStateMachine';

   export async function transitionOrder(orderId, newStatus, metadata = {}) {
     return db.$transaction(async (tx) => {
       const order = await tx.orders.findUnique({
         where: { id: orderId },
         select: { id: true, status: true },
       });

       if (!order) throw new Error(`Order ${orderId} not found`);

       if (!canTransition(order.status, newStatus)) {
         throw new InvalidTransitionError(
           `Cannot transition order ${orderId} from '${order.status}' to '${newStatus}'`
         );
       }

       // Update order status
       const updated = await tx.orders.update({
         where: { id: orderId },
         data: {
           status: newStatus,
           [`${newStatus}At`]: new Date(), // e.g., confirmedAt, shippedAt
         },
       });

       // Record the event (append-only)
       await tx.orderEvents.create({
         data: {
           orderId,
           fromStatus: order.status,
           toStatus: newStatus,
           triggeredBy: metadata.triggeredBy ?? 'system',
           metadata: metadata.data ?? {},
           createdAt: new Date(),
         },
       });

       return updated;
     });
   }
   ```

3. **Wire side effects to state transitions**

   Each transition triggers a set of side effects. Keep these out of the transaction to avoid long-running DB transactions.

   ```javascript
   // lib/orderSideEffects.js

   const SIDE_EFFECTS = {
     confirmed: async (order) => {
       await sendOrderConfirmationEmail(order);
       await deductInventory(order);
       await notifyFulfillmentProvider(order);
     },
     shipped: async (order) => {
       await sendShippingConfirmationEmail(order);
       await updateTrackingInformation(order);
     },
     delivered: async (order) => {
       await sendDeliveryConfirmationEmail(order);
       await scheduleReviewRequest(order, { delayDays: 3 });
     },
     cancelled: async (order) => {
       await releaseInventoryReservations(order);
       await initiateRefundIfPaid(order);
       await sendCancellationEmail(order);
     },
   };

   export async function runTransitionSideEffects(orderId, toStatus) {
     const order = await db.orders.findUnique({
       where: { id: orderId },
       include: { lineItems: true, fulfillments: true },
     });

     const sideEffect = SIDE_EFFECTS[toStatus];
     if (sideEffect) {
       try {
         await sideEffect(order);
       } catch (err) {
         // Side effects should not block the transition itself
         // Log to a side_effect_errors table for retry
         await db.sideEffectErrors.create({
           data: { orderId, status: toStatus, error: err.message },
         });
         console.error(`Side effect error for order ${orderId} → ${toStatus}:`, err);
       }
     }
   }

   // Full transition with side effects:
   export async function processOrderTransition(orderId, newStatus, metadata = {}) {
     const order = await transitionOrder(orderId, newStatus, metadata);
     await runTransitionSideEffects(orderId, newStatus);
     await emitOrderWebhook(orderId, newStatus);
     return order;
   }
   ```

4. **Consume payment webhooks to drive transitions**

   ```javascript
   // api/webhooks/payment.js
   // Called by Stripe webhook: payment_intent.succeeded
   export async function onPaymentSucceeded(paymentIntent) {
     const orderId = paymentIntent.metadata.order_id;
     if (!orderId) return;

     // Idempotency check
     const order = await db.orders.findUnique({ where: { id: orderId } });
     if (order.status !== 'pending') {
       console.log(`Order ${orderId} already processed (status: ${order.status})`);
       return;
     }

     await processOrderTransition(orderId, 'confirmed', {
       triggeredBy: 'stripe_webhook',
       data: { paymentIntentId: paymentIntent.id, amount: paymentIntent.amount },
     });
   }

   // Called by shipping carrier webhook or 3PL
   export async function onShipmentCreated({ orderId, trackingNumber, carrier }) {
     await processOrderTransition(orderId, 'shipped', {
       triggeredBy: 'shipping_webhook',
       data: { trackingNumber, carrier },
     });

     await db.fulfillments.update({
       where: { orderId },
       data: { trackingNumber, carrier, shippedAt: new Date() },
     });
   }
   ```

5. **Expose order event history via API**

   ```javascript
   // api/admin/orders/[id]/events.js
   export async function getOrderEvents(req, res) {
     const events = await db.orderEvents.findMany({
       where: { orderId: req.params.id },
       orderBy: { createdAt: 'asc' },
     });
     res.json({ events });
   }

   // Sample response:
   // [
   //   { fromStatus: null,       toStatus: 'pending',    triggeredBy: 'customer', createdAt: '...' },
   //   { fromStatus: 'pending',  toStatus: 'confirmed',  triggeredBy: 'stripe_webhook', createdAt: '...' },
   //   { fromStatus: 'confirmed',toStatus: 'processing', triggeredBy: 'ops_team', createdAt: '...' },
   //   { fromStatus: 'processing',toStatus: 'shipped',   triggeredBy: 'shipstation', createdAt: '...' },
   // ]
   ```

## Examples

### Order timeline component

```jsx
function OrderTimeline({ events }) {
  const STATUS_LABELS = {
    pending: 'Order placed',
    confirmed: 'Payment confirmed',
    processing: 'Preparing your order',
    shipped: 'Order shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  return (
    <ol className="order-timeline">
      {events.map(event => (
        <li key={event.id} className={`timeline-step timeline-step--${event.toStatus}`}>
          <div className="timeline-indicator" />
          <div className="timeline-content">
            <p className="timeline-label">{STATUS_LABELS[event.toStatus]}</p>
            <time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time>
            {event.metadata?.trackingNumber && (
              <p>Tracking: {event.metadata.trackingNumber}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
```

### Manual order hold and release (fraud review)

```javascript
// PUT /api/admin/orders/:id/hold
async function holdOrder(req, res) {
  await processOrderTransition(req.params.id, 'on_hold', {
    triggeredBy: req.session.userId,
    data: { reason: req.body.reason },
  });
  res.json({ status: 'on_hold' });
}

// PUT /api/admin/orders/:id/release
async function releaseHold(req, res) {
  await processOrderTransition(req.params.id, 'processing', {
    triggeredBy: req.session.userId,
    data: { releasedReason: req.body.reason },
  });
  res.json({ status: 'processing' });
}
```

## Best Practices

- **Enforce transitions via the state machine** — never allow arbitrary status updates; every change must go through `canTransition` validation
- **Make side effects async and non-blocking** — side effects (emails, inventory) should not be inside the DB transaction; a slow email provider should not roll back the order status update
- **Log every transition as an immutable event** — the `order_events` table is your audit trail; it enables debugging, reporting, and customer support lookups
- **Handle idempotency for webhook-driven transitions** — payment webhooks can fire multiple times; check the current order status before transitioning
- **Separate the transition from its side effects** — if a side effect fails, the order should still be in the new status; use a retry queue for failed side effects
- **Emit webhooks for external systems** — ERP, 3PL, and CRM integrations depend on order status changes; emit a `order.status_changed` webhook event for each transition

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Order confirmed twice due to duplicate webhook delivery | Check `order.status !== 'pending'` before processing `payment_intent.succeeded`; return early if already confirmed |
| Side effect (email) fails and rolls back the order status | Separate side effects from the DB transaction; run them after committing the status change |
| Inventory deducted before payment confirmed | Only deduct inventory in the `confirmed` side effect, triggered by the payment webhook — not at order creation |
| Invalid status transitions cause corrupted order state | Enforce `canTransition` on every update endpoint; throw `InvalidTransitionError` for disallowed transitions |
| Order event log grows very large | Partition the `order_events` table by month; archive events for orders older than 2 years to cold storage |

## Related Skills

- @stripe-integration
- @inventory-tracking
- @multi-warehouse
- @subscription-billing
