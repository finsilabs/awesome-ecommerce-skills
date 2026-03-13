---
name: flash-sale-scaling
description: "Prepare for Black Friday and flash sales with auto-scaling, queue-based order processing, and circuit breakers to prevent site outages"
category: infrastructure-performance
risk: critical
source: curated
date_added: "2026-03-12"
tags: [scaling, auto-scaling, queue, circuit-breaker, flash-sale, redis, sqs, kubernetes, traffic-spike]
triggers: ["flash sale scaling", "traffic spike handling", "auto scaling ecommerce", "queue based ordering", "circuit breaker commerce", "high traffic sale", "black friday scaling"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Flash Sale Scaling

## Overview

Flash sales and product drops generate traffic spikes 50–100× normal load, arriving within seconds of sale start. Without preparation, the checkout service collapses, inventory oversells, and customers see error pages. This skill covers the infrastructure patterns needed to handle extreme traffic: pre-warming, queue-based order intake with back-pressure, Redis-based atomic inventory reservation, and circuit breakers that degrade gracefully under load.

## When to Use This Skill

- When planning a flash sale, limited product drop, or major promotional event
- When past sales have caused checkout timeouts, oversells, or database failures
- When Black Friday/Cyber Monday planning is underway and infrastructure needs review
- When a new product announcement is expected to drive sudden high-demand traffic

## Core Instructions

### Step 1: Determine your platform and what you can control

| Platform | Flash Sale Scaling Strategy | Key Actions |
|----------|---------------------------|------------|
| **Shopify** | Shopify scales automatically — no infrastructure work needed | Focus on theme speed (cache pages, optimize images), enable Shopify's **queue page** for high-demand launches, use **Launchpad** (Shopify Plus) to schedule and automate the sale |
| **WooCommerce** | You own the server — significant prep required | Upgrade to a scalable host (Cloudways, Kinsta, WP Engine), enable Redis Object Cache + WP Rocket page cache, configure Cloudflare, run load tests 1–2 weeks before |
| **BigCommerce** | BigCommerce scales automatically | Use **BigCommerce's flash sale feature** (preview: shows estimated wait time); focus on catalog readiness and theme performance |
| **Custom / Headless** | Full infrastructure control needed | Apply all patterns below: pre-warm scaling, Redis inventory, queue-based checkout, circuit breakers |

### Step 2: Platform-specific flash sale preparation

---

#### Shopify

Shopify handles scaling automatically and can handle virtually any traffic spike. Your prep work is:

1. **Enable Shopify's high-demand checkout queue** (Shopify Plus):
   - Go to **Online Store → Preferences → Checkout**
   - Enable **Checkout concurrency** — this activates Shopify's virtual waiting room for high-traffic drops
   - For limited-inventory products (product drops): use the built-in inventory reservation so customers who enter checkout have their item held for 10 minutes

2. **Use Launchpad (Shopify Plus) for sale scheduling**:
   - Install **Launchpad** from the Shopify App Store (free for Plus merchants)
   - Schedule sale start/end times, price changes, and inventory availability in advance
   - Launchpad handles atomic activation at the scheduled time — avoid manual price changes under load

3. **Pre-test your store performance** (all Shopify plans):
   - Go to **Online Store → Themes** and click **View report** to see your store's Core Web Vitals
   - Run Google PageSpeed Insights on your most critical pages (product page, collection page, checkout)
   - Fix any red/orange issues before the sale — compressing images is the most common fix

4. **Notify Shopify support before major launches** (Shopify Plus):
   - Submit a **Flash Sale notification** via your Plus support channel — Shopify can pre-allocate resources and monitor your store during the event

---

#### WooCommerce

WooCommerce requires significant infrastructure work before a high-traffic event:

**Hosting upgrade (most critical):**
1. Ensure your hosting plan can scale: use **Cloudways** (horizontal scaling with one click), **Kinsta** (auto-scaling), or **WP Engine** (auto-scaling add-on) — not shared hosting
2. If on shared hosting, migrate to a VPS or managed WordPress host at least 1 week before the sale to allow stabilization
3. On Cloudways: go to **Servers → [server] → Vertical Scaling** before the event and select a larger server size; scale back down after

**Cache stack:**
1. Install and configure **WP Rocket** (page cache) + **Redis Object Cache** (database query cache)
2. WP Rocket: enable **Preload cache** to warm pages before the sale starts
3. Redis Object Cache: verify Redis is active (green status in **Settings → Redis**)
4. Enable Cloudflare and set **Caching level** to **Standard**; add your store URLs to Cloudflare Page Rules with **Cache Everything** for product and shop pages

**Inventory oversell prevention:**
1. Enable WooCommerce's built-in inventory management: **WooCommerce → Settings → Products → Inventory** → check **Enable Stock Management**
2. Set **Hold stock** (minutes) to 60 — this holds an item in a customer's cart for 60 minutes before releasing it back to inventory
3. For limited items: set **Allow backorders** to **Do not allow** so the product goes out-of-stock exactly at 0 inventory

**Load test before the sale:**
1. Use **Loader.io** (free tier: 1 target, 10K connections) to simulate your expected peak traffic against your staging site
2. Test the checkout flow specifically — product browse is usually cached; checkout hits the database
3. Fix any failures or slow responses before the sale date

---

#### Custom / Headless

**Pre-warm infrastructure (run 30 minutes before sale start):**
```bash
# Kubernetes: scale checkout deployment up before sale
kubectl scale deployment checkout-service --replicas=50

# Or schedule automatic scaling with a CronJob
# See the CronJob example below
```

**Atomic inventory reservation with Redis (prevents oversells):**
```javascript
// lib/inventory.js
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Initialize inventory in Redis before the sale
export async function initializeInventory(productId, quantity) {
  await redis.set(`inventory:${productId}`, quantity);
}

// Atomic check-and-decrement using Lua script (runs on Redis server, no race conditions)
const LUA_RESERVE = `
  local current = tonumber(redis.call('GET', KEYS[1]))
  if current == nil then return -1 end
  if current < tonumber(ARGV[1]) then return 0 end
  redis.call('DECRBY', KEYS[1], tonumber(ARGV[1]))
  return 1
`;

export async function reserveInventory(productId, quantity) {
  const result = await redis.eval(LUA_RESERVE, 1, `inventory:${productId}`, quantity);
  if (result === 1) return 'reserved';
  if (result === 0) return 'out_of_stock';
  return 'not_found';
}

export async function releaseInventory(productId, quantity) {
  await redis.incrby(`inventory:${productId}`, quantity);
}
```

**Queue-based order intake (fast response, async processing):**
```javascript
// checkout API — responds instantly, processes in background
export async function POST(req) {
  const order = await req.json();

  // 1. Reserve inventory atomically
  const reservation = await reserveInventory(order.productId, order.quantity);
  if (reservation === 'out_of_stock') {
    return Response.json({ error: 'Sold out' }, { status: 409 });
  }

  // 2. Enqueue — responds to user in <100ms
  const orderId = crypto.randomUUID();
  await sqs.send(new SendMessageCommand({
    QueueUrl: process.env.ORDER_QUEUE_URL,
    MessageBody: JSON.stringify({ orderId, ...order }),
  }));

  return Response.json({
    orderId,
    status: 'queued',
    message: 'Your order is being processed. You will receive a confirmation email shortly.',
  });
}

// Background order processor (separate service consuming SQS)
export async function processOrder(message) {
  const order = JSON.parse(message.Body);
  try {
    await capturePayment(order);
    await db.orders.create(order);
    await sendOrderConfirmationEmail(order);
  } catch (err) {
    await releaseInventory(order.productId, order.quantity); // release on failure
    throw err; // let SQS retry
  }
}
```

**Circuit breaker for payment processor:**
```javascript
import CircuitBreaker from 'opossum';

const paymentBreaker = new CircuitBreaker(captureStripePayment, {
  timeout: 5000,                 // 5s timeout per call
  errorThresholdPercentage: 30,  // open if 30% fail
  resetTimeout: 30000,           // try again after 30s
});

// Fallback: queue for retry instead of failing the customer
paymentBreaker.fallback(async (order) => {
  await sqs.send(new SendMessageCommand({
    QueueUrl: process.env.PAYMENT_RETRY_QUEUE_URL,
    MessageBody: JSON.stringify(order),
    DelaySeconds: 30,
  }));
  return { status: 'payment_queued' };
});
```

**Kubernetes pre-scale CronJob:**
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: flash-sale-prescale
spec:
  schedule: "30 11 * * 5"  # 30 min before noon Friday sale
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: scaler
              image: bitnami/kubectl
              command: [kubectl, scale, deployment/checkout-service, --replicas=100]
          restartPolicy: OnFailure
```

**Redis waiting room for extremely high-demand drops:**
```javascript
// Fair queue: customers get a position number when they arrive
export async function enterWaitingRoom(sessionId, productId) {
  const queueKey = `sale_queue:${productId}`;
  await redis.zadd(queueKey, Date.now(), sessionId); // sorted set, score = timestamp (FIFO)
  const position = await redis.zrank(queueKey, sessionId);
  return { position: (position ?? 0) + 1 };
}

// Periodically admit batches to checkout
export async function admitFromQueue(productId, batchSize) {
  const admitted = await redis.zpopmin(`sale_queue:${productId}`, batchSize);
  // Notify each admitted customer they can proceed to checkout
  for (let i = 0; i < admitted.length; i += 2) {
    await notifyCustomerAdmitted(admitted[i], productId);
  }
}
```

## Best Practices

- **Reserve inventory in Redis, not the database** — atomic Redis operations handle thousands of concurrent reservations per second; PostgreSQL row locking under the same load causes timeouts and deadlocks
- **Accept orders into a queue during spikes** — the user-facing checkout should respond in under 100ms even at peak; defer payment capture, DB writes, and emails to background workers
- **Set aggressive timeouts on every external call** — a 30-second Stripe timeout under load multiplies into thousands of held connections; use 5-second timeouts with circuit-breaker escalation
- **Load test at 2–3× expected peak** — test at exactly expected capacity leaves no headroom; size for 3× to account for uneven traffic distribution
- **Communicate queue status to customers** — show real-time position in the waiting room; customers with visible progress are far more patient than those staring at a spinner

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Oversells despite inventory check | Use Redis atomic Lua script for check-and-decrement; never check inventory in the application layer then update separately in two operations |
| Auto-scaling too slow to respond | Pre-warm to minimum capacity 30 minutes before the event; configure scale-out cooldown to 30 seconds, not the default 5 minutes |
| Circuit breaker opens on brief latency spike | Tune `volumeThreshold` and `errorThresholdPercentage` conservatively; use `timeout` as the primary trigger rather than error rate for flash sales |
| WooCommerce oversells during a spike | Enable WooCommerce stock management and set **Hold stock** to 60 minutes; upgrade to a host with Redis Object Cache to reduce database lock contention |

## Related Skills

- @database-optimization-commerce
- @ecommerce-caching
- @monitoring-alerting-commerce
- @load-testing-commerce
- @edge-commerce
