---
name: webhook-architecture
description: "Reliable webhook delivery with retries, signatures, dead-letter queues"
category: integrations-apis
risk: safe
source: curated
date_added: "2026-03-12"
tags: [webhooks, reliability, retry, dead-letter-queue, signature-verification, outbox-pattern, event-delivery]
triggers: ["webhook architecture", "reliable webhooks", "webhook retry", "dead letter queue webhooks", "webhook signature", "outbox pattern", "webhook delivery"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Webhook Architecture

## Overview

Webhooks are HTTP callbacks used by commerce platforms (Shopify, Stripe, Saleor) to push real-time event notifications to your application. Reliable webhook infrastructure requires: HMAC signature verification to prevent spoofed events, idempotent handlers that tolerate duplicate delivery, exponential backoff retry logic, and a dead-letter queue (DLQ) for events that exhaust all retries. This skill covers building a webhook sender (for platforms you build) and a reliable webhook receiver.

## When to Use This Skill

- When building a commerce platform or app that needs to notify external systems of events
- When receiving webhooks from Shopify, Stripe, Saleor, or other platforms
- When debugging missed events or duplicate processing caused by webhook delivery issues
- When designing event-driven architecture between commerce microservices
- When setting up webhook fanout (single event delivered to multiple consumers)

## Core Instructions

1. **Verify webhook signatures**

   Every webhook handler must verify the HMAC signature before processing the event:

   ```typescript
   // lib/webhooks/verify.ts
   import {createHmac, timingSafeEqual} from 'node:crypto';

   export function verifyShopifyWebhook(rawBody: Buffer, hmacHeader: string, secret: string): boolean {
     const expected = createHmac('sha256', secret).update(rawBody).digest('base64');
     const received = Buffer.from(hmacHeader);
     const expectedBuffer = Buffer.from(expected);

     if (received.length !== expectedBuffer.length) return false;
     return timingSafeEqual(received, expectedBuffer);
   }

   export function verifyStripeWebhook(rawBody: Buffer, signatureHeader: string, secret: string): boolean {
     // Stripe uses timestamp + payload HMAC to prevent replay attacks
     const parts = signatureHeader.split(',');
     const timestamp = parts.find(p => p.startsWith('t='))?.replace('t=', '');
     const v1 = parts.find(p => p.startsWith('v1='))?.replace('v1=', '');

     if (!timestamp || !v1) return false;

     // Reject events older than 5 minutes (replay attack protection)
     const timeDiff = Math.abs(Date.now() / 1000 - parseInt(timestamp));
     if (timeDiff > 300) return false;

     const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;
     const expected = createHmac('sha256', secret).update(signedPayload).digest('hex');

     return timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
   }

   // Generic HMAC verification used in your own platform
   export function verifyWebhookSignature(
     rawBody: Buffer,
     signatureHeader: string,
     secret: string,
     algorithm: 'sha256' | 'sha512' = 'sha256'
   ): boolean {
     const expected = createHmac(algorithm, secret).update(rawBody).digest('hex');
     const received = signatureHeader.replace(/^sha\d+=/, '');
     try {
       return timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex'));
     } catch {
       return false; // Lengths differ
     }
   }
   ```

2. **Build an idempotent webhook handler**

   Webhooks can be delivered multiple times. Use the event ID to deduplicate:

   ```typescript
   // app/api/webhooks/shopify/route.ts
   import {NextRequest, NextResponse} from 'next/server';

   export async function POST(req: NextRequest) {
     const rawBody = Buffer.from(await req.arrayBuffer());
     const hmac = req.headers.get('x-shopify-hmac-sha256') ?? '';
     const topic = req.headers.get('x-shopify-topic') ?? '';
     const eventId = req.headers.get('x-shopify-webhook-id') ?? '';

     // 1. Verify signature
     if (!verifyShopifyWebhook(rawBody, hmac, process.env.SHOPIFY_WEBHOOK_SECRET!)) {
       return NextResponse.json({error: 'Invalid signature'}, {status: 401});
     }

     // 2. Idempotency check — have we processed this event ID before?
     const alreadyProcessed = await db.processedWebhooks.exists(eventId);
     if (alreadyProcessed) {
       return NextResponse.json({received: true, status: 'already_processed'});
     }

     // 3. Mark as received BEFORE processing (prevents duplicate processing on concurrent delivery)
     await db.processedWebhooks.insert({id: eventId, topic, receivedAt: new Date(), status: 'processing'});

     try {
       const payload = JSON.parse(rawBody.toString('utf8'));
       await handleWebhookEvent(topic, payload, eventId);
       await db.processedWebhooks.update(eventId, {status: 'processed', processedAt: new Date()});
     } catch (err: any) {
       await db.processedWebhooks.update(eventId, {status: 'failed', error: err.message});
       // Return 200 to prevent Shopify from retrying — we'll handle retries ourselves
       return NextResponse.json({received: true, status: 'error', willRetry: true});
     }

     return NextResponse.json({received: true});
   }

   // Keep processed webhook IDs for 30 days (enough for any platform's retry window)
   // Use a TTL index in MongoDB or a scheduled cleanup job in PostgreSQL

   async function handleWebhookEvent(topic: string, payload: any, eventId: string) {
     switch (topic) {
       case 'orders/create':
         await importOrder(payload);
         break;
       case 'orders/cancelled':
         await cancelOrder(payload.id);
         break;
       case 'inventory_levels/update':
         await syncInventory(payload);
         break;
       default:
         console.warn(`Unhandled webhook topic: ${topic}`);
     }
   }
   ```

3. **Build a reliable webhook sender with the Outbox Pattern**

   The Outbox Pattern ensures events are never lost even if the network is unavailable when the event is created:

   ```typescript
   // lib/webhooks/outbox.ts
   // Instead of calling webhooks directly in your application code,
   // write to an outbox table in the same transaction as the business event.
   // A separate poller reads the outbox and delivers webhooks.

   export async function publishEvent(trx: Transaction, eventType: string, payload: object) {
     // This runs inside the same DB transaction as the business operation
     await trx.webhookOutbox.insert({
       id: crypto.randomUUID(),
       eventType,
       payload: JSON.stringify(payload),
       createdAt: new Date(),
       status: 'pending',
       attempts: 0,
       nextRetryAt: new Date(),
     });
   }

   // Outbox poller — runs every 10 seconds
   export async function processOutbox() {
     const pendingEvents = await db.webhookOutbox.findPending({
       status: ['pending', 'retrying'],
       nextRetryAt: {$lte: new Date()},
       limit: 100,
     });

     for (const event of pendingEvents) {
       await deliverEvent(event);
     }
   }

   async function deliverEvent(event: OutboxEvent) {
     const subscriptions = await db.webhookSubscriptions.findByEventType(event.eventType);

     for (const sub of subscriptions) {
       await deliverToSubscriber(event, sub);
     }
   }

   async function deliverToSubscriber(event: OutboxEvent, sub: WebhookSubscription) {
     const deliveryId = crypto.randomUUID();
     const payload = JSON.stringify({
       id: event.id,
       type: event.eventType,
       created: event.createdAt.toISOString(),
       data: JSON.parse(event.payload),
     });

     // Sign the payload
     const signature = createHmac('sha256', sub.signingSecret)
       .update(payload)
       .digest('hex');

     try {
       const res = await fetch(sub.url, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'X-Webhook-Signature': `sha256=${signature}`,
           'X-Webhook-Event': event.eventType,
           'X-Webhook-Delivery': deliveryId,
         },
         body: payload,
         signal: AbortSignal.timeout(10000), // 10 second timeout
       });

       if (res.ok) {
         await db.webhookDeliveries.insert({deliveryId, eventId: event.id, subscriptionId: sub.id, status: 'delivered', responseStatus: res.status, deliveredAt: new Date()});
         await db.webhookOutbox.update(event.id, {status: 'delivered', deliveredAt: new Date()});
       } else {
         throw new Error(`HTTP ${res.status}: ${await res.text()}`);
       }
     } catch (err: any) {
       await handleDeliveryFailure(event, sub, err.message);
     }
   }
   ```

4. **Implement exponential backoff retry with dead-letter queue**

   ```typescript
   // Exponential backoff schedule: 1m, 5m, 30m, 2h, 8h → DLQ after 5 attempts
   const RETRY_DELAYS_MS = [60_000, 300_000, 1_800_000, 7_200_000, 28_800_000];

   async function handleDeliveryFailure(event: OutboxEvent, sub: WebhookSubscription, error: string) {
     const nextAttempts = event.attempts + 1;

     await db.webhookDeliveries.insert({
       deliveryId: crypto.randomUUID(),
       eventId: event.id,
       subscriptionId: sub.id,
       status: 'failed',
       error,
       attemptNumber: nextAttempts,
     });

     if (nextAttempts >= RETRY_DELAYS_MS.length) {
       // Move to dead-letter queue
       await db.webhookOutbox.update(event.id, {status: 'dead_letter', lastError: error});
       await db.webhookDeadLetters.insert({
         eventId: event.id,
         subscriptionId: sub.id,
         failedAt: new Date(),
         reason: error,
         attempts: nextAttempts,
       });

       // Alert the team
       await sendSlackAlert(`Webhook permanently failed after ${nextAttempts} attempts`, {
         eventType: event.eventType,
         subscriptionUrl: sub.url,
         error,
       });
     } else {
       // Schedule retry with exponential backoff
       const nextRetryAt = new Date(Date.now() + RETRY_DELAYS_MS[nextAttempts - 1]);
       await db.webhookOutbox.update(event.id, {
         status: 'retrying',
         attempts: nextAttempts,
         nextRetryAt,
         lastError: error,
       });
     }
   }
   ```

5. **Build a webhook management API for subscribers**

   ```typescript
   // Allow customers or partners to register their own webhook endpoints
   // POST /api/webhooks/subscriptions
   export async function createSubscription(req: NextRequest) {
     const {url, events, description} = await req.json();
     const owner = await requireAuth(req);

     // Validate the URL is reachable
     try {
       const test = await fetch(url, {method: 'POST', body: '{}', signal: AbortSignal.timeout(5000)});
       // We just check it responds — any status is acceptable for validation
     } catch {
       return NextResponse.json({error: 'URL is not reachable. Ensure your endpoint accepts POST requests.'}, {status: 400});
     }

     const signingSecret = crypto.randomBytes(32).toString('hex');

     const subscription = await db.webhookSubscriptions.create({
       ownerId: owner.id,
       url,
       events,                  // e.g., ['order.created', 'order.cancelled']
       description,
       signingSecret,           // Return once — never show again
       isActive: true,
       createdAt: new Date(),
     });

     return NextResponse.json({
       id: subscription.id,
       url: subscription.url,
       events: subscription.events,
       signingSecret,           // Show once during creation
       note: 'Store the signing secret securely. It will not be shown again.',
     });
   }
   ```

6. **Replay dead-letter events**

   ```typescript
   // Allow manual replay of dead-letter events after fixing the subscriber endpoint
   export async function replayDeadLetter(deadLetterId: string, adminId: string) {
     const deadLetter = await db.webhookDeadLetters.findById(deadLetterId);
     if (!deadLetter) throw new Error('Dead letter event not found');

     const event = await db.webhookOutbox.findById(deadLetter.eventId);
     const subscription = await db.webhookSubscriptions.findById(deadLetter.subscriptionId);

     // Reset and re-queue the event
     await db.webhookOutbox.update(event.id, {
       status: 'pending',
       attempts: 0,
       nextRetryAt: new Date(),
       replayedBy: adminId,
       replayedAt: new Date(),
     });

     await db.webhookDeadLetters.update(deadLetterId, {replayedAt: new Date(), replayedBy: adminId});

     console.log(`Dead letter ${deadLetterId} re-queued for delivery`);
   }
   ```

## Examples

### Shopify webhook registration via Admin API

```typescript
// Register webhooks programmatically (instead of via dashboard)
export async function registerShopifyWebhooks(shopDomain: string, accessToken: string) {
  const webhooks = [
    {topic: 'orders/create', address: `${process.env.APP_URL}/api/webhooks/shopify/order-created`},
    {topic: 'orders/cancelled', address: `${process.env.APP_URL}/api/webhooks/shopify/order-cancelled`},
    {topic: 'inventory_levels/update', address: `${process.env.APP_URL}/api/webhooks/shopify/inventory-update`},
    {topic: 'refunds/create', address: `${process.env.APP_URL}/api/webhooks/shopify/refund-created`},
  ];

  for (const webhook of webhooks) {
    const res = await fetch(`https://${shopDomain}/admin/api/2025-01/webhooks.json`, {
       method: 'POST',
       headers: {'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json'},
       body: JSON.stringify({webhook: {...webhook, format: 'json'}}),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error(`Failed to register ${webhook.topic}:`, err);
    }
  }
}
```

### Webhook delivery dashboard query

```sql
-- Show delivery stats by event type and subscription
SELECT
  wo.event_type,
  ws.url AS subscription_url,
  COUNT(CASE WHEN wd.status = 'delivered' THEN 1 END) AS delivered,
  COUNT(CASE WHEN wd.status = 'failed' THEN 1 END) AS failed,
  COUNT(CASE WHEN wo.status = 'dead_letter' THEN 1 END) AS dead_lettered,
  AVG(CASE WHEN wd.status = 'delivered' THEN wd.attempt_number END) AS avg_attempts_to_deliver,
  MAX(wd.created_at) AS last_attempt
FROM webhook_outbox wo
JOIN webhook_subscriptions ws ON ws.id = wo.subscription_id
LEFT JOIN webhook_deliveries wd ON wd.event_id = wo.id
WHERE wo.created_at > NOW() - INTERVAL '7 days'
GROUP BY wo.event_type, ws.url
ORDER BY dead_lettered DESC;
```

## Best Practices

- **Always return 2xx immediately** — a slow webhook handler blocks the delivery and may cause the sender to time out and retry; enqueue events on receipt and process asynchronously
- **Use the Outbox Pattern for reliable sending** — writing to an outbox table in the same transaction as your domain event guarantees at-least-once delivery even if your webhook sender crashes
- **Make handlers idempotent** — use the event's unique ID to deduplicate; "at-least-once" delivery is the standard; you must tolerate duplicate events
- **Log every delivery attempt** — store delivery attempts with response codes, timing, and errors; this is essential for debugging and provides audit evidence for compliance
- **Implement a dead-letter queue with alerting** — events that exhaust retries need human intervention; alert via Slack/PagerDuty and provide a replay mechanism
- **Use `AbortSignal.timeout` on all webhook fetch calls** — without a timeout, a slow subscriber can hold threads indefinitely; 10 seconds is a typical timeout for webhook delivery
- **Provide a webhook testing tool** — allow partners to send test events and see the delivery log in your dashboard; this dramatically reduces integration support burden

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Duplicate order processing from retried webhooks | Implement idempotency using the webhook event ID as a unique key in a `processed_webhooks` table |
| Webhook handler times out causing retries | Process webhooks async: write to queue on receipt, return 200 immediately, process from queue separately |
| HMAC verification passes with expired event | Check the `t=` timestamp in Stripe-style signatures; reject events older than 5 minutes to prevent replay attacks |
| Outbox poller causing high DB load | Use `FOR UPDATE SKIP LOCKED` in PostgreSQL to select pending events without blocking; process in batches of 100 with a delay between batches |
| Dead letters pile up silently | Set up an alert when the dead letter queue exceeds a threshold (e.g., 10 events); dead letters indicate a systematic subscriber failure |

## Related Skills

- @saleor-development
- @stripe-integration
- @analytics-integration
- @composable-commerce
- @marketplace-connectors
