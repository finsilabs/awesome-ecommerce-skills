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
platforms: [platform-agnostic]
difficulty: intermediate
---

# Shipment Tracking

## Overview

Implement multi-carrier shipment tracking that ingests carrier status events via webhooks, normalizes them into a unified tracking event model, updates order status automatically, and surfaces real-time tracking information to customers. Using webhooks rather than polling eliminates the need for scheduled scraping and reduces carrier API rate-limit pressure.

## When to Use This Skill

- When customers need real-time package tracking on their order detail pages
- When building post-purchase notifications (email/SMS) triggered by shipping milestone events
- When you need to detect delivery exceptions (lost packages, failed delivery attempts) and trigger customer service alerts
- When aggregating tracking data across multiple carriers (UPS, FedEx, USPS, DHL) into a single interface
- When integrating with a carrier aggregator like EasyPost or Shippo that provides a unified webhook feed

## Prerequisites & Platform Notes

**Shopify**: Use Shopify Shipping (carrier-calculated rates), Shopify Fulfillment Network, or apps like ShipStation. The Fulfillment API handles custom fulfillment workflows.
**WooCommerce**: Use WooCommerce Shipping or plugins (ShipStation, WooCommerce Table Rate Shipping). Extend with woocommerce_shipping_methods filter.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A store with shipping configured, carrier API accounts if using custom rates

## Core Instructions

1. **Design the tracking schema**

   ```sql
   CREATE TABLE shipments (
     id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     order_id       UUID NOT NULL REFERENCES orders(id),
     fulfillment_id UUID REFERENCES fulfillments(id),
     tracking_number VARCHAR(64) NOT NULL,
     carrier        VARCHAR(32) NOT NULL,         -- 'ups', 'fedex', 'usps', 'dhl'
     carrier_service VARCHAR(64),                  -- 'UPS Ground', 'USPS Priority Mail', etc.
     status         VARCHAR(32) NOT NULL DEFAULT 'pre_transit'
                      CHECK (status IN ('pre_transit', 'in_transit', 'out_for_delivery',
                                        'delivered', 'exception', 'returned')),
     estimated_delivery DATE,
     actual_delivery TIMESTAMPTZ,
     created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE TABLE tracking_events (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     shipment_id UUID NOT NULL REFERENCES shipments(id),
     status      VARCHAR(32) NOT NULL,
     description TEXT NOT NULL,
     location    VARCHAR(128),
     carrier_code VARCHAR(64),
     occurred_at TIMESTAMPTZ NOT NULL,
     received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE UNIQUE INDEX idx_shipments_tracking ON shipments(carrier, tracking_number);
   CREATE INDEX idx_tracking_events_shipment ON tracking_events(shipment_id, occurred_at DESC);
   ```

2. **Receive and verify carrier webhooks (EasyPost example)**

   ```typescript
   import crypto from 'crypto';

   // POST /webhooks/easypost
   app.post('/webhooks/easypost', express.raw({ type: 'application/json' }), async (req, res) => {
     // Verify webhook signature
     const hmac = crypto.createHmac('sha256', process.env.EASYPOST_WEBHOOK_SECRET!);
     const expectedSig = hmac.update(req.body).digest('hex');
     const receivedSig = req.headers['x-hmac-signature'];

     if (expectedSig !== receivedSig) {
       return res.status(401).json({ error: 'Invalid signature' });
     }

     const event = JSON.parse(req.body.toString());

     // EasyPost sends different event types — we care about tracker events
     if (event.description === 'tracker.updated') {
       await processTrackerEvent(event.result);
     }

     // Always return 200 quickly — do heavy processing asynchronously
     res.json({ received: true });

     // Offload to queue for processing
     await queue.add('process-tracking-event', event.result);
   });
   ```

3. **Normalize carrier events to a unified model**

   ```typescript
   const STATUS_MAPPING: Record<string, string> = {
     // EasyPost statuses
     'pre_transit':     'pre_transit',
     'in_transit':      'in_transit',
     'out_for_delivery':'out_for_delivery',
     'delivered':       'delivered',
     'failure':         'exception',
     'return_to_sender':'returned',
     // Add carrier-specific codes as needed
   };

   interface NormalizedTrackingEvent {
     trackingNumber: string;
     carrier: string;
     status: string;
     description: string;
     location?: string;
     carrierCode: string;
     occurredAt: Date;
   }

   function normalizeEasyPostEvent(trackerData: any): NormalizedTrackingEvent[] {
     return (trackerData.tracking_details ?? []).map((detail: any) => ({
       trackingNumber: trackerData.tracking_code,
       carrier: trackerData.carrier.toLowerCase(),
       status: STATUS_MAPPING[detail.status] ?? 'in_transit',
       description: detail.message,
       location: [detail.tracking_location?.city, detail.tracking_location?.state]
         .filter(Boolean).join(', '),
       carrierCode: detail.status,
       occurredAt: new Date(detail.datetime),
     }));
   }
   ```

4. **Process tracking events and update order status**

   ```typescript
   async function processTrackerEvent(trackerData: any): Promise<void> {
     const events = normalizeEasyPostEvent(trackerData);
     const latestEvent = events.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())[0];
     if (!latestEvent) return;

     const shipment = await db.shipments.findByTrackingNumber(latestEvent.carrier, latestEvent.trackingNumber);
     if (!shipment) {
       console.warn(`Unknown tracking number: ${latestEvent.trackingNumber}`);
       return;
     }

     await db.transaction(async tx => {
       // Upsert all tracking events (idempotent — carrier may resend events)
       for (const event of events) {
         await tx.raw(`
           INSERT INTO tracking_events (shipment_id, status, description, location, carrier_code, occurred_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT (shipment_id, carrier_code, occurred_at) DO NOTHING
         `, [shipment.id, event.status, event.description, event.location, event.carrierCode, event.occurredAt]);
       }

       // Update shipment status
       await tx.shipments.update(shipment.id, {
         status: latestEvent.status,
         actual_delivery: latestEvent.status === 'delivered' ? latestEvent.occurredAt : null,
         estimated_delivery: trackerData.est_delivery_date ? new Date(trackerData.est_delivery_date) : null,
       });

       // Update order status on delivery
       if (latestEvent.status === 'delivered') {
         await tx.orders.update(shipment.order_id, { status: 'delivered', delivered_at: latestEvent.occurredAt });
       }
     });

     // Send customer notifications
     await sendTrackingNotification(shipment.order_id, latestEvent);
   }
   ```

5. **Send customer notifications at key milestones**

   ```typescript
   const NOTIFICATION_STATUSES = new Set(['in_transit', 'out_for_delivery', 'delivered', 'exception']);

   async function sendTrackingNotification(orderId: string, event: NormalizedTrackingEvent): Promise<void> {
     if (!NOTIFICATION_STATUSES.has(event.status)) return;

     const order = await db.orders.findById(orderId);
     const customer = await db.customers.findById(order.customer_id);

     // Deduplicate — only send once per status per order
     const alreadySent = await db.notificationLog.findOne({
       order_id: orderId,
       notification_type: `tracking_${event.status}`,
     });
     if (alreadySent) return;

     const templates: Record<string, string> = {
       in_transit:        'shipment-in-transit',
       out_for_delivery:  'shipment-out-for-delivery',
       delivered:         'shipment-delivered',
       exception:         'shipment-exception',
     };

     await emailService.send({
       to: customer.email,
       template: templates[event.status],
       data: {
         orderNumber: order.order_number,
         trackingNumber: event.trackingNumber,
         carrier: event.carrier,
         trackingUrl: buildTrackingUrl(event.carrier, event.trackingNumber),
         estimatedDelivery: order.shipment?.estimated_delivery?.toLocaleDateString(),
       },
     });

     await db.notificationLog.insert({ order_id: orderId, notification_type: `tracking_${event.status}` });
   }

   function buildTrackingUrl(carrier: string, trackingNumber: string): string {
     const urls: Record<string, string> = {
       ups:   `https://www.ups.com/track?tracknum=${trackingNumber}`,
       fedex: `https://www.fedex.com/apps/fedextrack/?tracknumbers=${trackingNumber}`,
       usps:  `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
       dhl:   `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
     };
     return urls[carrier.toLowerCase()] ?? `https://www.google.com/search?q=${carrier}+${trackingNumber}`;
   }
   ```

## Examples

### Customer-facing tracking page API endpoint

```typescript
// GET /api/orders/:orderId/tracking
app.get('/api/orders/:orderId/tracking', requireAuth, async (req, res) => {
  const order = await db.orders.findById(req.params.orderId);
  if (!order || order.customer_id !== req.user.id) return res.status(404).json({ error: 'Not found' });

  const shipments = await db.shipments.findByOrderId(order.id);
  const result = await Promise.all(shipments.map(async s => ({
    trackingNumber: s.tracking_number,
    carrier: s.carrier,
    status: s.status,
    estimatedDelivery: s.estimated_delivery,
    trackingUrl: buildTrackingUrl(s.carrier, s.tracking_number),
    events: await db.trackingEvents.findByShipmentId(s.id),
  })));

  res.json(result);
});
```

### Register a tracking number with EasyPost when a label is created

```typescript
import EasyPost from '@easypost/api';
const easypost = new EasyPost(process.env.EASYPOST_API_KEY);

async function registerTracking(shipmentId: string, trackingNumber: string, carrier: string): Promise<void> {
  const tracker = await easypost.Tracker.create({
    tracking_code: trackingNumber,
    carrier,
  });

  await db.shipments.update(shipmentId, {
    easypost_tracker_id: tracker.id,
  });
}
```

## Best Practices

- **Use webhooks over polling** — carrier-push webhooks deliver updates in near-real-time and don't count against API rate limits; polling is fragile and expensive
- **Process webhook events asynchronously** — acknowledge the webhook with 200 immediately, then process the event in a background queue; this prevents timeouts from causing missed webhooks
- **Make event ingestion idempotent** — carriers may deliver the same event multiple times; use `ON CONFLICT DO NOTHING` or check for existing events before inserting
- **Normalize statuses across carriers** — your application code should only deal with your own status enum, never raw carrier codes; keep the mapping in one place
- **Store carrier-native codes alongside normalized statuses** — preserve `carrierCode` for debugging and for future mapping updates
- **Alert on exceptions immediately** — a `status = 'exception'` event (failed delivery, lost package) should trigger an internal Slack alert, not just a customer email
- **Display estimated delivery on the order page from day 1** — customers check tracking most often in the first 24 hours; showing an EDD reduces "where is my order" contacts by 30-40%

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Webhook verification fails | Always use `express.raw()` (not `express.json()`) when reading the raw body for HMAC signature verification |
| Same event recorded multiple times | Add a unique constraint on `(shipment_id, carrier_code, occurred_at)` and use `ON CONFLICT DO NOTHING` |
| Order stays in "shipped" status after delivery | Subscribe to `delivered` events and update `orders.status` to `delivered` in the event handler |
| No tracking events for international shipments | International carriers sometimes have sparse tracking; log the gap and fall back to the carrier's native tracking URL |

## Related Skills

- @order-fulfillment-workflow
- @returns-management
- @international-shipping
- @order-management-system
- @same-day-delivery
