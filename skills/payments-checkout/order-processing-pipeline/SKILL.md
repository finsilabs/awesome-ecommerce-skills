---
name: order-processing-pipeline
description: "Implement a reliable order state machine that moves orders from pending through payment, fulfillment, and delivery with webhook-driven transitions"
category: payments-checkout
risk: critical
source: curated
date_added: "2026-03-12"
tags: [orders, state-machine, fulfillment, webhooks, order-management, pipeline, transitions]
triggers: ["order processing", "order state machine", "order fulfillment", "order status", "order pipeline", "order management"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Order Processing Pipeline

## Overview

Every ecommerce order follows a lifecycle: placed → payment confirmed → fulfillment started → shipped → delivered. Shopify, WooCommerce, and BigCommerce each implement this as a built-in order status system with webhook events at each transition. The goal is to configure these transitions correctly, wire your 3PL or fulfillment system to the right webhooks, and automate side effects (confirmation emails, inventory deduction, tracking notifications) at each stage.

Custom state machine code is only needed for headless storefronts or complex multi-step B2B workflows that platforms cannot handle natively.

## When to Use This Skill

- When order statuses become inconsistent (e.g., fulfilled orders showing as pending)
- When implementing automated order routing to a 3PL or fulfillment provider
- When adding order status webhooks for ERP, shipping, or returns integrations
- When building a custom headless order management system

## Core Instructions

### Step 1: Understand your platform's order statuses and transitions

| Platform | Order Statuses | Transition Mechanism |
|----------|---------------|---------------------|
| **Shopify** | Open → Partially Fulfilled → Fulfilled → Cancelled; Financial: Pending → Authorized → Paid → Refunded | Shopify Admin + webhooks; automated by Shopify Payments and fulfillment apps |
| **WooCommerce** | Pending → Processing → On Hold → Completed → Cancelled → Refunded → Failed | WooCommerce status system; transitions via admin, plugins, or `wc_update_order_status()` |
| **BigCommerce** | Pending → Awaiting Payment → Awaiting Fulfillment → Awaiting Shipment → Shipped → Completed + others | BigCommerce Admin + Orders API webhooks |
| **Custom / Headless** | Define your own state machine | Build with explicit transition validation |

### Step 2: Configure order processing automation

---

#### Shopify

**Configure payment → order confirmation flow:**
1. Shopify automatically moves orders from **Open** to **Paid** when Shopify Payments confirms the charge
2. Go to **Settings → Notifications** to verify the **Order confirmation** email is enabled — this fires automatically on payment
3. For non-Shopify payment methods, verify the gateway sends a payment success signal to Shopify; if orders stay **Pending payment** after payment, check your gateway settings

**Set up automatic fulfillment for digital products:**
1. Go to **Settings → Shipping and delivery → Fulfillment**
2. For digital products, enable **Automatically fulfill the digital items in the order**

**Connect a 3PL or fulfillment center:**
1. Install your fulfillment provider's Shopify app (ShipBob, ShipHero, Whiplash, Amazon FBA, etc.) from the Shopify App Store
2. Go to **Settings → Shipping and delivery → Fulfillment services** and add the service
3. The app subscribes to Shopify's **Order created** or **Order paid** webhooks and automatically receives new orders
4. When the 3PL ships an order, it pushes the tracking number back to Shopify via the Fulfillment API, which updates the order to **Fulfilled** and sends the shipping confirmation email automatically

**Manual fulfillment workflow:**
1. Go to **Orders → Unfulfilled** tab to see all orders awaiting fulfillment
2. Click an order and select **Mark as fulfilled** after shipping; enter the tracking number
3. The customer receives an automated tracking email when the order is marked fulfilled

**Set up order webhooks for external systems (ERP, etc.):**
1. Go to **Settings → Notifications → Webhooks** (or use the Partner Dashboard for app-level webhooks)
2. Add webhooks for: **Order creation**, **Order payment**, **Order fulfillment**, **Order cancellation**
3. Each webhook sends the full order JSON to your endpoint for processing

#### WooCommerce

**Understand the default order flow:**
- **Pending payment** → customer placed order, not yet paid
- **Processing** → payment received; order is being prepared (default for paid orders)
- **Completed** → order delivered; manually set or automated by shipping plugin
- **On hold** → payment uncertain (e.g., bank transfer awaiting confirmation)

**Configure automatic status transitions:**
1. Go to **WooCommerce → Settings → Payments → [Gateway] → Order status** for each payment method and set the status on payment (typically "Processing" for instant payment methods)
2. For virtual/downloadable orders, go to **WooCommerce → Settings → Products → Downloadable products** and set "Grant access to downloadable products after payment" to change orders to "Completed" automatically

**Connect a shipping/fulfillment plugin:**
1. Install your shipping plugin: **WooCommerce ShipStation**, **WooCommerce ShipBob**, or **ELEX WooCommerce DHL/FedEx/UPS**
2. Configure the plugin to pull orders with "Processing" status for fulfillment
3. When the plugin ships an order and gets a tracking number, it updates the order status to "Completed" and sends a tracking email automatically

**Custom status transitions via hooks:**
```php
// In functions.php or a custom plugin — auto-complete virtual orders
add_action('woocommerce_payment_complete', 'auto_complete_virtual_orders');
function auto_complete_virtual_orders($order_id) {
    $order = wc_get_order($order_id);
    if ($order && $order->get_status() === 'processing') {
        $all_virtual = true;
        foreach ($order->get_items() as $item) {
            $product = $item->get_product();
            if (!$product->is_virtual()) { $all_virtual = false; break; }
        }
        if ($all_virtual) {
            $order->update_status('completed', 'All virtual items — auto-completed.');
        }
    }
}
```

**Order webhooks:**
Install **WooCommerce Webhooks** (built-in) — go to **WooCommerce → Settings → Advanced → Webhooks** and add webhooks for order created, updated, and deleted events.

#### BigCommerce

**Configure order status flow:**
1. Go to **Orders → View** — BigCommerce automatically sets orders to **Awaiting Fulfillment** after payment is confirmed
2. Configure your payment gateway's order status mapping: go to **Settings → Payment Methods → [Gateway]** and set the post-payment status

**Connect a fulfillment provider:**
1. Go to the **BigCommerce App Marketplace** and install your fulfillment center's app (ShipBob, ShipStation, etc.)
2. The app connects to BigCommerce's Order webhooks and pulls new orders automatically
3. When the 3PL ships, it updates BigCommerce via the Orders API to set tracking number and change status to **Shipped**

**Order webhooks:**
Go to **Settings → Advanced Settings → WebHooks** and add webhooks for order status changes. These are used by integrations like ERPs and accounting systems.

---

#### Custom / Headless

For custom storefronts, implement a state machine with explicit transition validation:

```javascript
// Valid order state transitions
const VALID_TRANSITIONS = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped:    ['delivered', 'returned'],
  delivered:  ['returned', 'refunded'],
  cancelled:  ['refunded'],
};

async function transitionOrder(orderId, newStatus, metadata = {}) {
  return db.$transaction(async (tx) => {
    const order = await tx.orders.findUnique({ where: { id: orderId } });

    if (!VALID_TRANSITIONS[order.status]?.includes(newStatus)) {
      throw new Error(`Invalid transition: ${order.status} → ${newStatus}`);
    }

    const updated = await tx.orders.update({
      where: { id: orderId },
      data: { status: newStatus, [`${newStatus}At`]: new Date() },
    });

    // Append-only event log for audit trail
    await tx.orderEvents.create({
      data: { orderId, fromStatus: order.status, toStatus: newStatus, triggeredBy: metadata.triggeredBy ?? 'system' },
    });

    return updated;
  });
}

// Wire to Stripe webhook — payment confirmation drives the transition
async function onPaymentSucceeded(paymentIntent) {
  const orderId = paymentIntent.metadata.order_id;
  const order = await db.orders.findUnique({ where: { id: orderId } });

  // Idempotency — ignore if already confirmed
  if (order.status !== 'pending') return;

  await transitionOrder(orderId, 'confirmed', { triggeredBy: 'stripe_webhook' });
  await sendOrderConfirmationEmail(orderId);
  await deductInventory(orderId);
}
```

**Side effects at each transition** (run outside the DB transaction to avoid blocking):

- **confirmed**: send confirmation email, deduct inventory, notify fulfillment provider
- **shipped**: send shipping email with tracking number, update tracking in customer portal
- **delivered**: send delivery confirmation, schedule review request (3 days later)
- **cancelled**: release inventory reservation, initiate refund if paid, send cancellation email

### Step 3: Handle the most common edge cases

**Duplicate webhook delivery:**
All major payment processors can deliver the same webhook multiple times. Always check the current order status before processing a transition:
```javascript
if (order.status !== 'pending') return; // Already processed
```

**Inventory deduction timing:**
Only deduct inventory after payment is confirmed (the `confirmed` transition), not when the order is placed. If a payment fails, you do not want inventory reserved indefinitely.

**Order cancellation with partial fulfillment:**
If some items are shipped and others are not, platforms handle this differently. On Shopify, you can partially cancel unfulfilled line items while keeping the fulfilled items. On WooCommerce, install the **WooCommerce Cancel Abandoned Order** or manage this via the WooCommerce REST API.

## Best Practices

- **Use platform-native order management** — Shopify, WooCommerce, and BigCommerce handle the core payment → fulfillment → delivery flow correctly; build on top of them rather than replacing them
- **Wire fulfillment apps to the right status trigger** — fulfillment providers should receive orders on payment confirmation (`order.paid` on Shopify, `Processing` on WooCommerce), not on order creation
- **Log every status transition** — even on platforms, add an order note (Shopify/WooCommerce both support this) or record a database event for audit purposes
- **Handle idempotency on webhooks** — always check the current order status before applying a transition triggered by a webhook
- **Emit webhooks for external integrations** — configure webhooks for all order status changes so your ERP, accounting, and CRM integrations stay in sync

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Order confirmed twice on Shopify due to duplicate webhook | Shopify deduplicates with an idempotency header; on your end, check `order.financial_status !== 'paid'` before processing |
| WooCommerce order stuck in "Pending payment" after PayPal payment | PayPal IPN (Instant Payment Notification) must be enabled in your PayPal account; verify the IPN URL in **WooCommerce → Settings → Payments → PayPal** |
| Inventory not deducted until order is manually completed | Move inventory deduction to the payment confirmed webhook, not the fulfillment webhook |
| 3PL not receiving new orders automatically | Verify the fulfillment app is subscribed to the correct order status — most 3PL apps pull "Processing" (WooCommerce) or "Unfulfilled + Paid" (Shopify) |
| Order status webhooks not firing | Check webhook registration in **Shopify → Settings → Notifications → Webhooks** or **WooCommerce → Settings → Advanced → Webhooks** and verify the endpoint is returning 200 |

## Related Skills

- @stripe-integration
- @inventory-tracking
- @subscription-billing
- @guest-checkout
