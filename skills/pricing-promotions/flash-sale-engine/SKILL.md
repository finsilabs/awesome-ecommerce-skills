---
name: flash-sale-engine
description: "Time-limited sales with countdown timers, stock limits, and queue management"
category: pricing-promotions
risk: critical
source: curated
date_added: "2026-03-12"
tags: [flash-sale, countdown-timer, queue, stock-limits, promotions, time-limited, waiting-room]
triggers: ["flash sale", "limited time offer", "countdown timer sale", "flash deal", "time-limited discount", "sale queue"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Flash Sale Engine

## Overview

Implement a flash sale system that handles high-concurrency traffic spikes with countdown timers, per-sale stock limits, and an optional virtual waiting room queue. The engine coordinates sale scheduling, atomic stock reservations, and real-time timer synchronization across all client sessions without overselling.

## When to Use This Skill

- When launching time-limited sale events (e.g., 24-hour deals, Black Friday doorbusters) that must end at an exact time
- When a product has limited flash-sale quantity separate from the main inventory
- When expecting traffic spikes large enough to cause overselling with naive inventory checks
- When you need a waiting room / queue to fairly admit customers during high-demand drops
- When building a deals platform where multiple flash sales run simultaneously across different products

## Core Instructions

1. **Design the flash sale schema**

   ```sql
   CREATE TABLE flash_sales (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     product_id      UUID NOT NULL REFERENCES products(id),
     sale_price      INTEGER NOT NULL,           -- cents
     original_price  INTEGER NOT NULL,           -- cents, for display
     sale_quantity   INTEGER NOT NULL,           -- total units available for this sale
     sold_count      INTEGER NOT NULL DEFAULT 0,
     starts_at       TIMESTAMPTZ NOT NULL,
     ends_at         TIMESTAMPTZ NOT NULL,
     status          VARCHAR(16) NOT NULL DEFAULT 'scheduled'
                       CHECK (status IN ('scheduled', 'active', 'sold_out', 'ended')),
     queue_enabled   BOOLEAN NOT NULL DEFAULT false,
     created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE INDEX idx_flash_sales_status_time ON flash_sales(status, starts_at, ends_at);
   ```

2. **Activate and deactivate sales on schedule**

   ```typescript
   import { CronJob } from 'cron';

   // Check every minute for sales that need status transitions
   new CronJob('* * * * *', async () => {
     const now = new Date();

     // Activate sales that just started
     await db.raw(`
       UPDATE flash_sales
       SET status = 'active'
       WHERE status = 'scheduled' AND starts_at <= ? AND ends_at > ?
     `, [now, now]);

     // End sales that have expired
     await db.raw(`
       UPDATE flash_sales
       SET status = 'ended'
       WHERE status = 'active' AND ends_at <= ?
     `, [now]);
   }, null, true);

   // Real-time check when serving a product page
   async function getActiveSale(productId: string): Promise<FlashSale | null> {
     const now = new Date();
     return db.flashSales.findOne({
       product_id: productId,
       status: 'active',
       starts_at: { lte: now },
       ends_at: { gt: now },
     });
   }
   ```

3. **Atomically reserve flash sale stock**

   ```typescript
   // Uses a Redis counter for high-throughput reservation, synced to DB
   import { Redis } from 'ioredis';
   const redis = new Redis(process.env.REDIS_URL);

   async function reserveFlashSaleUnit(
     saleId: string,
     customerId: string
   ): Promise<{ reserved: boolean; reason?: string }> {
     const sale = await db.flashSales.findById(saleId);

     if (!sale || sale.status !== 'active') {
       return { reserved: false, reason: 'SALE_NOT_ACTIVE' };
     }
     if (new Date() > sale.ends_at) {
       return { reserved: false, reason: 'SALE_ENDED' };
     }

     // Atomic increment in Redis — avoids DB lock contention
     const redisKey = `flash_sale:${saleId}:sold`;
     const newCount = await redis.incr(redisKey);

     if (newCount > sale.sale_quantity) {
       // Decrement back — we overshot
       await redis.decr(redisKey);
       return { reserved: false, reason: 'SOLD_OUT' };
     }

     // Persist reservation to DB asynchronously (fire and forget — can reconcile later)
     db.flashSaleReservations.insert({ sale_id: saleId, customer_id: customerId, reserved_at: new Date() })
       .catch(err => console.error('Failed to persist reservation:', err));

     return { reserved: true };
   }
   ```

4. **Implement a virtual waiting room queue**

   ```typescript
   // Queue backed by Redis Sorted Set — score = join timestamp
   const QUEUE_TTL_SECONDS = 300; // 5 minutes to complete purchase once admitted

   async function joinQueue(saleId: string, customerId: string): Promise<number> {
     const score = Date.now();
     await redis.zadd(`flash_sale:${saleId}:queue`, score, customerId);
     const position = await redis.zrank(`flash_sale:${saleId}:queue`, customerId);
     return (position ?? 0) + 1; // 1-indexed position
   }

   async function admitNextBatch(saleId: string, batchSize: number): Promise<string[]> {
     // Atomically pop the front N customers from the queue
     const admitted = await redis.zpopmin(`flash_sale:${saleId}:queue`, batchSize);
     const customerIds: string[] = [];

     for (let i = 0; i < admitted.length; i += 2) {
       const customerId = admitted[i];
       customerIds.push(customerId);
       // Give them a time-limited admission token
       await redis.setex(`flash_sale:${saleId}:admitted:${customerId}`, QUEUE_TTL_SECONDS, '1');
     }

     return customerIds;
   }

   async function isAdmitted(saleId: string, customerId: string): Promise<boolean> {
     const token = await redis.get(`flash_sale:${saleId}:admitted:${customerId}`);
     return token === '1';
   }
   ```

5. **Provide the countdown timer to clients via SSE or WebSocket**

   ```typescript
   // Server-Sent Events endpoint for real-time countdown
   app.get('/api/flash-sales/:saleId/timer', async (req, res) => {
     const sale = await db.flashSales.findById(req.params.saleId);
     if (!sale) return res.status(404).end();

     res.setHeader('Content-Type', 'text/event-stream');
     res.setHeader('Cache-Control', 'no-cache');
     res.setHeader('Connection', 'keep-alive');

     const interval = setInterval(() => {
       const now = Date.now();
       const remaining = Math.max(0, sale.ends_at.getTime() - now);
       const stockLeft = sale.sale_quantity - sale.sold_count;

       res.write(`data: ${JSON.stringify({ remaining, stockLeft, status: sale.status })}\n\n`);

       if (remaining === 0) {
         clearInterval(interval);
         res.end();
       }
     }, 1000);

     req.on('close', () => clearInterval(interval));
   });
   ```

   Client-side countdown:
   ```typescript
   const eventSource = new EventSource(`/api/flash-sales/${saleId}/timer`);
   eventSource.onmessage = (e) => {
     const { remaining, stockLeft } = JSON.parse(e.data);
     const hours = Math.floor(remaining / 3600000);
     const minutes = Math.floor((remaining % 3600000) / 60000);
     const seconds = Math.floor((remaining % 60000) / 1000);
     document.getElementById('countdown').textContent =
       `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
     document.getElementById('stock-left').textContent = `${stockLeft} left`;
   };
   ```

## Examples

### Schedule a flash sale for a specific product

```typescript
await db.flashSales.insert({
  product_id: 'prod_abc123',
  sale_price: 1999,        // $19.99
  original_price: 4999,    // $49.99 — 60% off
  sale_quantity: 200,
  starts_at: new Date('2026-11-29T08:00:00Z'), // Black Friday 8am UTC
  ends_at:   new Date('2026-11-29T20:00:00Z'), // ends at 8pm UTC
  queue_enabled: true,
});
```

### React countdown timer component

```tsx
function FlashSaleCountdown({ saleId }: { saleId: string }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [stockLeft, setStockLeft] = useState<number | null>(null);

  useEffect(() => {
    const es = new EventSource(`/api/flash-sales/${saleId}/timer`);
    es.onmessage = (e) => {
      const { remaining, stockLeft } = JSON.parse(e.data);
      setTimeLeft({
        hours: Math.floor(remaining / 3600000),
        minutes: Math.floor((remaining % 3600000) / 60000),
        seconds: Math.floor((remaining % 60000) / 1000),
      });
      setStockLeft(stockLeft);
    };
    return () => es.close();
  }, [saleId]);

  return (
    <div className="flash-sale-banner">
      <span className="timer">{timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</span>
      {stockLeft !== null && <span className="stock">{stockLeft} remaining</span>}
    </div>
  );
}
```

## Best Practices

- **Use Redis for the sold counter, not a SELECT + UPDATE** — a Redis `INCR` is atomic and handles thousands of concurrent requests per second without locking
- **Reconcile Redis counters to the database** — run a periodic job that reads the Redis counter and updates `sold_count` in the DB; never rely solely on Redis for permanent state
- **Use server-authoritative end times** — never let the client calculate the end time; always send the authoritative UTC end timestamp from the server to prevent timer drift
- **Set sale quantity separately from main inventory** — flash sale stock is a separate allocation; decrement both flash sale `sold_count` and main inventory when an order is confirmed
- **Expire queue admission tokens** — give admitted customers a 5-minute window to complete checkout; expire the token and re-queue them if they don't
- **Pre-warm your infrastructure** — for high-traffic drops, pre-scale your app servers and Redis connections 30 minutes before sale start
- **Display "while supplies last" if stock is low** — showing live stock counts (e.g., "12 left") creates urgency, but avoid showing exact counts for large quantities as it looks artificial
- **Test the queue under load** — use k6 or Locust to simulate the expected spike and verify the queue admission logic holds up

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Overselling when Redis and DB are out of sync | On order confirmation, do a final DB-level `UPDATE flash_sales SET sold_count = sold_count + 1 WHERE sold_count < sale_quantity` and rollback if no rows updated |
| Countdown timer drifts across browsers | Send the absolute `ends_at` UTC timestamp from the server; calculate `remaining = ends_at - Date.now()` client-side on each tick |
| Sale activates a few seconds late due to cron interval | Use `starts_at <= NOW()` check in the product API response rather than relying solely on the cron status flip |
| Bots exhaust all stock before real customers can buy | Implement admission rate limiting, CAPTCHA on queue join, and IP velocity checks |
| Queue position updates require polling | Push queue position updates via WebSocket or SSE; polling at scale creates unnecessary server load |

## Related Skills

- @coupon-management
- @dynamic-pricing
- @price-rules-engine
- @order-management-system
- @shipment-tracking
