---
name: webhook-architecture
description: "Build a reliable event delivery system with automatic retries, HMAC signature verification, and dead-letter queues so no webhook is ever lost"
category: integrations-apis
risk: safe
source: curated
date_added: "2026-03-12"
tags: [webhooks, reliability, retry, dead-letter-queue, signature-verification, outbox-pattern, event-delivery]
triggers: ["webhook architecture", "reliable webhooks", "webhook retry", "dead letter queue webhooks", "webhook signature", "outbox pattern", "webhook delivery"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Webhook Architecture

## Overview

Webhooks are HTTP callbacks used by commerce platforms (Shopify, Stripe) to push real-time event notifications to your application. Reliable webhook infrastructure requires: HMAC signature verification to prevent spoofed events, idempotent handlers that tolerate duplicate delivery, exponential backoff retry logic, and a dead-letter queue for events that exhaust all retries. This skill covers building a reliable webhook receiver and, for custom platforms, a webhook sender using the Outbox Pattern.

## When to Use This Skill

- When receiving webhooks from Shopify, Stripe, Square, or other platforms
- When debugging missed events or duplicate processing caused by webhook delivery issues
- When building a commerce platform or app that needs to notify external systems of events
- When designing event-driven architecture between commerce microservices
- When setting up webhook fanout (single event delivered to multiple consumers)

## Core Instructions

### Step 1: Determine your platform and what webhooks you need to handle

| Platform | Where Webhooks Are Configured | Most Important Topics to Subscribe |
|----------|------------------------------|-----------------------------------|
| **Shopify** | **Settings → Notifications → Webhooks** (or via Admin API) | `orders/create`, `orders/paid`, `orders/cancelled`, `inventory_levels/update`, `refunds/create` |
| **WooCommerce** | Install **WP Webhooks** plugin (free, wordpress.org) or use WooCommerce's built-in webhooks under **WooCommerce → Settings → Advanced → Webhooks** | Order status changes (processing, completed, refunded), stock updates |
| **BigCommerce** | **Advanced Settings → Legacy API Settings → Webhooks** or via API | `store/order/statusUpdated`, `store/product/inventory/updated`, `store/cart/abandoned` |
| **Custom / Headless** | Build your own webhook system | Use the Outbox Pattern for sending; HMAC verification + idempotency for receiving; see implementation below |

### Step 2: Platform-specific webhook setup

---

#### Shopify

**Register webhooks via the Shopify admin:**

1. Go to **Settings → Notifications** and scroll to **Webhooks**
2. Click **Create webhook**
3. Select the event topic (e.g., `Order creation`) and enter your endpoint URL
4. Choose **JSON** as the format

**Get your webhook secret for HMAC verification:**

The secret is shown when you create the webhook. Store it as an environment variable — Shopify signs each webhook with this secret using HMAC-SHA256.

**For apps using the Admin API**, register webhooks programmatically:

```typescript
const res = await fetch(`https://${shopDomain}/admin/api/2025-01/webhooks.json`, {
  method: 'POST',
  headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' },
  body: JSON.stringify({ webhook: {
    topic: 'orders/create',
    address: `${process.env.APP_URL}/api/webhooks/shopify/order-created`,
    format: 'json',
  }}),
});
```

---

#### WooCommerce

**Use WooCommerce's built-in webhooks:**

1. Go to **WooCommerce → Settings → Advanced → Webhooks**
2. Click **Add webhook**
3. Set **Name**, **Status: Active**, **Topic** (e.g., Order Created), and your **Delivery URL**
4. The **Secret** field generates an HMAC-SHA256 signature for each delivery — copy it for your endpoint's verification

**Or use WP Webhooks plugin for more control:**

1. Install **WP Webhooks** (free, wordpress.org) for advanced trigger conditions and payload customization
2. Go to **Settings → WP Webhooks** and configure triggers for WooCommerce order events
3. WP Webhooks supports retry logic and delivery logs out of the box

---

#### Custom / Headless

For custom storefronts, implement both reliable receiving (for incoming webhooks from Stripe, Shopify, etc.) and reliable sending (Outbox Pattern for notifying your own integrations).

**HMAC signature verification (Shopify and generic):**

```typescript
// lib/webhooks/verify.ts
import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyShopifyWebhook(rawBody: Buffer, hmacHeader: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('base64');
  const received = Buffer.from(hmacHeader);
  const expectedBuffer = Buffer.from(expected);
  if (received.length !== expectedBuffer.length) return false;
  return timingSafeEqual(received, expectedBuffer);
}

export function verifyStripeWebhook(rawBody: Buffer, signatureHeader: string, secret: string): boolean {
  const parts = signatureHeader.split(',');
  const timestamp = parts.find(p => p.startsWith('t='))?.replace('t=', '');
  const v1 = parts.find(p => p.startsWith('v1='))?.replace('v1=', '');
  if (!timestamp || !v1) return false;
  // Reject events older than 5 minutes (replay attack protection)
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 300) return false;
  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody.toString('utf8')}`)
    .digest('hex');
  return timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
}
```

**Idempotent webhook receiver** — deduplicate using the platform's event ID:

```typescript
// app/api/webhooks/shopify/route.ts
export async function POST(req: NextRequest) {
  const rawBody = Buffer.from(await req.arrayBuffer());
  const hmac = req.headers.get('x-shopify-hmac-sha256') ?? '';
  const topic = req.headers.get('x-shopify-topic') ?? '';
  const eventId = req.headers.get('x-shopify-webhook-id') ?? '';

  // 1. Verify signature — reject invalid requests immediately
  if (!verifyShopifyWebhook(rawBody, hmac, process.env.SHOPIFY_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 2. Idempotency check — deduplicate by event ID
  const alreadyProcessed = await db.processedWebhooks.exists(eventId);
  if (alreadyProcessed) return NextResponse.json({ received: true, status: 'already_processed' });

  // 3. Mark as received BEFORE processing (prevents duplicate on concurrent delivery)
  await db.processedWebhooks.insert({ id: eventId, topic, receivedAt: new Date(), status: 'processing' });

  // 4. Return 200 immediately, process asynchronously
  processWebhookAsync(topic, rawBody, eventId); // Don't await — return fast

  return NextResponse.json({ received: true });
}

async function processWebhookAsync(topic: string, rawBody: Buffer, eventId: string) {
  try {
    const payload = JSON.parse(rawBody.toString('utf8'));
    switch (topic) {
      case 'orders/create': await importOrder(payload); break;
      case 'orders/cancelled': await cancelOrder(payload.id); break;
      case 'inventory_levels/update': await syncInventory(payload); break;
    }
    await db.processedWebhooks.update(eventId, { status: 'processed', processedAt: new Date() });
  } catch (err: any) {
    await db.processedWebhooks.update(eventId, { status: 'failed', error: err.message });
  }
}
```

**Outbox Pattern for reliable webhook sending** — guarantees at-least-once delivery even if your sender crashes:

```typescript
// lib/webhooks/outbox.ts
// Write to outbox in the SAME transaction as the business event
export async function publishEvent(trx: Transaction, eventType: string, payload: object) {
  await trx.webhookOutbox.insert({
    id: crypto.randomUUID(),
    eventType,
    payload: JSON.stringify(payload),
    status: 'pending',
    attempts: 0,
    nextRetryAt: new Date(),
  });
}

// Outbox poller — runs every 10 seconds, separate from your main app
export async function processOutbox() {
  const pending = await db.webhookOutbox.findPending({ status: ['pending', 'retrying'], nextRetryAt: { $lte: new Date() }, limit: 100 });
  for (const event of pending) await deliverEvent(event);
}

// Retry schedule: 1min, 5min, 30min, 2hr, 8hr → DLQ after 5 attempts
const RETRY_DELAYS_MS = [60_000, 300_000, 1_800_000, 7_200_000, 28_800_000];

async function handleDeliveryFailure(event: OutboxEvent, error: string) {
  const nextAttempts = event.attempts + 1;

  if (nextAttempts >= RETRY_DELAYS_MS.length) {
    await db.webhookOutbox.update(event.id, { status: 'dead_letter', lastError: error });
    await db.webhookDeadLetters.insert({ eventId: event.id, failedAt: new Date(), reason: error });
    await alertOpsTeam(`Webhook permanently failed after ${nextAttempts} attempts`, { eventType: event.eventType, error });
  } else {
    const nextRetryAt = new Date(Date.now() + RETRY_DELAYS_MS[nextAttempts - 1]);
    await db.webhookOutbox.update(event.id, { status: 'retrying', attempts: nextAttempts, nextRetryAt, lastError: error });
  }
}
```

**Replay dead-letter events** (after fixing the subscriber endpoint):

```typescript
export async function replayDeadLetter(deadLetterId: string) {
  const deadLetter = await db.webhookDeadLetters.findById(deadLetterId);
  await db.webhookOutbox.update(deadLetter.eventId, {
    status: 'pending', attempts: 0, nextRetryAt: new Date(),
  });
  await db.webhookDeadLetters.update(deadLetterId, { replayedAt: new Date() });
}
```

## Best Practices

- **Always return 2xx immediately** — a slow webhook handler blocks delivery and may cause the sender to time out and retry; enqueue events on receipt and process asynchronously
- **Use the Outbox Pattern for reliable sending** — writing to an outbox table in the same DB transaction as your domain event guarantees at-least-once delivery even if your webhook sender crashes
- **Make handlers idempotent** — use the event's unique ID to deduplicate; "at-least-once" delivery is the standard for all webhook platforms; you must tolerate receiving the same event twice
- **Log every delivery attempt** — store delivery attempts with response codes, timing, and errors; this is essential for debugging and provides audit evidence for compliance
- **Implement a dead-letter queue with alerting** — events that exhaust retries need human intervention; alert via Slack/PagerDuty and provide a replay mechanism

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Duplicate order processing from retried webhooks | Implement idempotency using the webhook event ID as a unique key in a `processed_webhooks` table with a TTL of 30 days |
| Webhook handler times out causing retries | Process webhooks async: write to queue on receipt, return 200 immediately, process from queue |
| WooCommerce webhook delivery failures | Check the **WooCommerce → System Status → Logs** for delivery errors; common causes are SSL certificate issues and timeout on slow shared hosting |
| Shopify webhook HMAC mismatch | Compute HMAC over the raw request body; do NOT parse the JSON first — body parsers may reformat the JSON and change the signature |
| Dead letters pile up silently | Alert when the dead letter count exceeds a threshold (e.g., 10 events); dead letters indicate a systematic subscriber failure requiring investigation |

## Related Skills

- @analytics-integration
- @erp-integration
- @marketplace-connectors
- @monitoring-alerting-commerce
