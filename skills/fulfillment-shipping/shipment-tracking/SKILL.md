---
name: shipment-tracking
description: "Give customers live package tracking by aggregating carrier status updates via webhooks and sending proactive delivery notifications"
category: fulfillment-shipping
risk: safe
source: curated
date_added: "2026-03-12"
tags: [shipment-tracking, carrier-webhooks, tracking-updates, UPS, FedEx, USPS, EasyPost, Shippo]
triggers: ["shipment tracking", "track package", "carrier tracking", "tracking updates", "shipping status", "delivery status webhook"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Shipment Tracking

## Overview

Shipment tracking lets customers follow their package from warehouse to doorstep, and proactively notifies them at key milestones (shipped, out for delivery, delivered). Most platforms send tracking emails automatically when a label is created — but a branded tracking page and proactive exception alerts (lost packages, failed delivery) require a dedicated tracking app or service.

## When to Use This Skill

- When customers need real-time package tracking on their order detail pages
- When building post-purchase notifications (email/SMS) triggered by shipping milestone events
- When you need to detect delivery exceptions (lost packages, failed delivery attempts) and trigger customer service alerts
- When aggregating tracking data across multiple carriers (UPS, FedEx, USPS, DHL) into a single interface
- When integrating with a carrier aggregator like EasyPost or Shippo for unified tracking webhooks

## Core Instructions

### Step 1: Determine your platform and choose the right tracking tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | AfterShip or Route | AfterShip provides a branded tracking page, proactive email/SMS notifications, and exception alerts across all carriers |
| **WooCommerce** | AfterShip for WooCommerce or Shipment Tracking by WooCommerce | AfterShip integrates with all major carriers; the official WooCommerce extension handles basic carrier tracking |
| **BigCommerce** | AfterShip (BigCommerce App Marketplace) or ShipStation tracking | AfterShip has a native BigCommerce integration; ShipStation also provides tracking if you use it for label creation |
| **Custom / Headless** | EasyPost Tracker API or Shippo tracking webhooks | EasyPost and Shippo normalize tracking events across all carriers into a single webhook feed |

### Step 2: Set up carrier tracking notifications

#### Shopify

**Shopify's built-in tracking (no extra app needed for basics):**
1. When you fulfill an order and add a tracking number, Shopify automatically sends the customer a "Your order is on its way" email with the tracking link
2. The tracking link goes to the carrier's website (e.g., ups.com for UPS) — it's functional but not branded
3. Customers can check their order status at `yourstore.com/orders/[order-id]`

**AfterShip (recommended for branded tracking + proactive notifications):**
1. Install AfterShip from the Shopify App Store (free plan available)
2. AfterShip automatically detects new fulfillments in Shopify and begins tracking the package
3. In AfterShip → Notifications, configure email and SMS notifications at each milestone:
   - "In transit" — when the package leaves your facility
   - "Out for delivery" — day of delivery
   - "Delivered" — confirmation
   - "Exception" — failed delivery attempt or package delay
4. Customize the tracking page at AfterShip → Tracking Page with your logo, colors, and product recommendations
5. AfterShip's branded tracking page is hosted at `yourstore.aftership.com` or you can embed it on your own domain

**For Shopify Plus:** Use Klaviyo to trigger shipping notification emails based on AfterShip tracking events via Klaviyo's AfterShip integration — this gives you full control over the email design and content.

#### WooCommerce

**Using WooCommerce Shipment Tracking (official extension):**
1. Install from WooCommerce.com (or use the free community version on WordPress.org)
2. When fulfilling an order, enter the tracking number and carrier in WooCommerce → Orders → [Order] → Add Tracking Number
3. WooCommerce sends the customer an updated order email with the tracking link
4. Customers see the tracking link in My Account → Orders

**Using AfterShip for WooCommerce:**
1. Install the AfterShip plugin from WordPress.org
2. AfterShip syncs WooCommerce orders and begins tracking when tracking numbers are added
3. Configure notification emails in AfterShip dashboard → Notifications
4. The branded tracking page works the same as the Shopify version

**ShipStation tracking (if using ShipStation for fulfillment):**
- ShipStation automatically emails customers when a label is created with a tracking link
- Go to ShipStation → Account Settings → Notifications to configure which carrier events trigger emails

#### BigCommerce

1. Install **AfterShip Returns Center** or **AfterShip** from the BigCommerce App Marketplace
2. AfterShip syncs with BigCommerce orders automatically
3. Configure notifications and the branded tracking page in the AfterShip dashboard (same as above)

**BigCommerce's built-in tracking:**
- BigCommerce automatically sends shipping confirmation emails with tracking links when an order is marked as "Shipped" with a tracking number
- Go to **Store Setup → Email Templates → Shipped Email** to customize the email content

### Step 3: Handle tracking exceptions

Delivery exceptions (lost packages, failed delivery attempts) need fast resolution to protect customer satisfaction.

#### Setting up exception alerts

**AfterShip:**
1. Go to AfterShip → Notifications → Exceptions
2. Enable email alerts to your team for these exception types:
   - "Exception" — carrier-reported issue
   - "Failed Attempt" — delivery attempt failed, needs rescheduling
   - "Returned to Sender" — package coming back
3. AfterShip can trigger Slack or email alerts to your ops team alongside the customer notification

**Shopify Flow (Plus):**
```
Trigger: AfterShip tracking event received
Condition: Status is "Exception" or "Failed Attempt"
Action: Create customer service task in Gorgias or Zendesk
Action: Send internal Slack notification to #shipping-exceptions
```

#### Responding to exceptions

When AfterShip or your tracking tool flags an exception:
1. Check the carrier's native tracking portal for the most current status
2. For lost packages: file a claim with the carrier (UPS, FedEx, USPS all have online claims portals)
3. For failed delivery: contact the customer to update their delivery address or arrange pickup
4. For returned packages: coordinate with the customer on re-shipping vs. refund

### Step 4: Add a branded tracking page to your store

A branded tracking page keeps customers on your site (vs. carrier sites), allows product recommendations, and reduces "where is my order" contacts.

**AfterShip** generates this automatically at `yourstore.aftership.com`. To put it on your own domain:

1. In AfterShip → Tracking Page → Custom Domain, enter your subdomain (e.g., `tracking.yourstore.com`)
2. Add a CNAME DNS record pointing `tracking.yourstore.com` to AfterShip's servers
3. Update your shipping confirmation email to link to `tracking.yourstore.com/[tracking-number]` instead of the carrier URL

**Embed tracking in your existing order status page:**
- For Shopify: AfterShip has a theme app extension that embeds the tracking widget directly in the Shopify order status page
- For WooCommerce: the AfterShip plugin adds a tracking section to the WooCommerce "My Account → Orders" page automatically

### Step 5: Custom / Headless — webhook-based tracking

For headless implementations, use EasyPost or Shippo to receive carrier webhooks and normalize tracking events:

```typescript
// Register a tracking number with EasyPost to receive webhook updates
async function registerEasyPostTracker(params: {
  trackingNumber: string;
  carrier: string; // 'UPS', 'FedEx', 'USPS', 'DHL'
  orderId: string;
}): Promise<void> {
  const response = await fetch('https://api.easypost.com/v2/trackers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EASYPOST_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tracker: {
        tracking_code: params.trackingNumber,
        carrier: params.carrier,
      },
    }),
  });
  const tracker = await response.json();
  // Store tracker.id to correlate future webhook events with this order
  await db.shipments.update({ tracking_number: params.trackingNumber }, {
    easypost_tracker_id: tracker.id,
  });
}

// Receive EasyPost webhook and update order status
// POST /webhooks/easypost
async function handleEasyPostWebhook(rawBody: Buffer, signature: string): Promise<void> {
  // Verify webhook signature
  const expectedSig = crypto
    .createHmac('sha256', process.env.EASYPOST_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex');
  if (expectedSig !== signature) throw new Error('Invalid webhook signature');

  const event = JSON.parse(rawBody.toString());
  if (event.description !== 'tracker.updated') return;

  const tracker = event.result;
  const shipment = await db.shipments.findByEasyPostTrackerId(tracker.id);
  if (!shipment) return;

  // Normalize EasyPost status to your internal status
  const statusMap: Record<string, string> = {
    pre_transit: 'label_created',
    in_transit: 'in_transit',
    out_for_delivery: 'out_for_delivery',
    delivered: 'delivered',
    failure: 'exception',
    return_to_sender: 'returned',
  };
  const normalizedStatus = statusMap[tracker.status] ?? 'in_transit';

  await db.shipments.update(shipment.id, { status: normalizedStatus });

  // Update order to delivered when package arrives
  if (normalizedStatus === 'delivered') {
    await db.orders.update(shipment.order_id, { status: 'delivered', delivered_at: new Date() });
  }

  // Send notification email at key milestones
  if (['in_transit', 'out_for_delivery', 'delivered', 'exception'].includes(normalizedStatus)) {
    await sendTrackingNotificationEmail(shipment.order_id, normalizedStatus, tracker.tracking_code);
  }
}
```

## Best Practices

- **Use webhooks over polling** — carrier webhooks deliver updates in near-real-time; polling every few hours misses same-day events like "out for delivery" and "delivered"
- **Send proactive notifications for exceptions** — a delay or failed delivery email from you, before the customer notices, transforms a bad situation into a positive brand moment
- **Show estimated delivery date from day one** — AfterShip and most carriers provide an EDD when the label is first scanned; display it on the tracking page and order confirmation email immediately
- **Alert your ops team on exceptions, not just customers** — create an internal Slack/email alert for every exception event so your team can proactively resolve issues
- **Deduplicate notification emails** — carriers sometimes send duplicate events; ensure your tracking app or custom webhook handler deduplicates based on event type per shipment

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Customer doesn't receive shipping confirmation | Check that Shopify/WooCommerce shipping notification emails are enabled and that the customer's email address was captured at checkout |
| Tracking page shows "no information available" for days | This is normal for USPS for 24–48 hours after label creation; set customer expectations in the shipping confirmation email |
| Exception events not triggering alerts | Verify your AfterShip notification settings include exception types; test by using a test tracking number that simulates an exception event |
| International tracking stops updating mid-journey | International handoffs between carriers often cause gaps; log the carrier's native tracking URL and fall back to it when events stop for 48+ hours |

## Related Skills

- @order-fulfillment-workflow
- @returns-management
- @international-shipping
- @order-management-system
- @same-day-delivery
