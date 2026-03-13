---
name: flash-sale-engine
description: "Run time-limited sales with live countdown timers, per-item quantity caps, virtual waiting rooms, and automatic price restoration on expiry"
category: pricing-promotions
risk: critical
source: curated
date_added: "2026-03-12"
tags: [flash-sale, countdown-timer, queue, stock-limits, promotions, time-limited, waiting-room]
triggers: ["flash sale", "limited time offer", "countdown timer sale", "flash deal", "time-limited discount", "sale queue"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Flash Sale Engine

## Overview

Flash sales are time-limited discounts — typically 2–24 hours — that create urgency and drive conversion spikes. They require three things to work reliably: a countdown timer visible to shoppers, per-sale quantity limits that prevent overselling, and automatic price restoration when the sale ends. For high-traffic launches (product drops, Black Friday doorbusters), a virtual waiting room is also essential to prevent bot scalping. Most platforms have apps that handle this without custom code.

## When to Use This Skill

- When launching time-limited sale events (e.g., 24-hour deals, Black Friday doorbusters) that must end at an exact time
- When a product has limited flash-sale quantity separate from the main inventory
- When expecting traffic spikes large enough to cause overselling with naive inventory checks
- When you need a waiting room or queue to fairly admit customers during high-demand drops
- When building a deals platform where multiple flash sales run simultaneously across different products

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Countdown Timer Bar, FOMO, or Hextom Flash Sales app | These apps handle countdown timers, scheduled price changes, and inventory display without custom code |
| **Shopify Plus** | Launchpad (free for Plus) | Shopify's official flash sale app — schedules price changes, enables/disables discount codes, and restores prices automatically |
| **WooCommerce** | YITH WooCommerce Flash Sales or WooCommerce Sales Countdown | Manage sale prices with countdown timers directly on product pages |
| **BigCommerce** | BigCommerce Promotions with custom script for countdown timer | BigCommerce's promotions engine handles discounts; use a storefront script for the timer UI |
| **High-traffic drops (any platform)** | Cloudflare Waiting Room | Cloudflare's managed waiting room queues visitors fairly; prevents scalper bots from monopolizing limited stock |
| **Custom / Headless** | Build with Redis for atomic stock and SSE/WebSocket for timer | Full control for custom platforms where apps don't apply |

### Step 2: Configure the flash sale on your platform

---

#### Shopify

**Option A: Shopify Launchpad (Plus only, free)**

Launchpad is the official Shopify tool for scheduling promotional events:

1. In your Shopify admin, go to **Apps → Launchpad**
2. Click **Create event**
3. Set the event name (e.g., "Black Friday Flash Sale 2026"), start time, and end time
4. Under **Price changes**: select products and set the sale price for each
5. Under **Publish/unpublish collections**: optionally show/hide sale collections during the event
6. Under **Discount codes**: enable or disable specific discount codes during the event
7. Click **Schedule** — Launchpad activates the changes at the start time and reverses them automatically at the end time

**Important**: Set sale quantities separately from your main inventory. If you only want to sell 100 units at the flash sale price, reduce the product's available inventory to 100 before the sale, then restock after. Launchpad does not manage sale quantities natively.

**Option B: Hextom Flash Sales app (non-Plus)**

1. Install **Hextom Flash Sales** from the Shopify App Store (~$10/month)
2. Create a sale with a specific product list, discount percentage, and duration
3. The app adds a countdown timer widget to product pages and updates prices automatically
4. Configure the countdown timer appearance in the app settings

**Per-product quantity caps:**
Use Shopify's built-in **inventory tracking** to set flash sale quantities:
1. Edit the product variant → set inventory quantity to your flash sale cap
2. Enable **Track quantity** and **Stop selling when out of stock**
3. After the sale ends, restock the inventory to the real quantity

---

#### WooCommerce

**Option A: YITH WooCommerce Flash Sales plugin**

1. Install **YITH WooCommerce Flash Sales** from the plugin directory or YITH.com
2. Go to **YITH → Flash Sales → Add New Flash Sale**
3. Set:
   - Products included in the sale
   - Sale price or discount percentage
   - Start date/time and end date/time
   - Maximum quantity available at the flash sale price (separate from main stock)
4. The plugin automatically shows a countdown timer on product pages and reverts prices at the end time

**Option B: WooCommerce native sale pricing with an add-on for countdown**

WooCommerce supports **Sale price** and **Schedule** natively on every product:
1. Edit the product → **Pricing** tab
2. Enter the **Sale price**
3. Click **Schedule** to set start and end dates
4. The sale price activates and deactivates automatically

Add a countdown timer with **Countdown Timer for WooCommerce** (free plugin) or **WooCommerce Sales Countdown Timer**.

**Per-product flash sale quantity:**
Reduce the product's stock quantity to the flash sale cap before the sale begins, then restore it manually or via a scheduled script afterward.

---

#### BigCommerce

1. Go to **Marketing → Promotions → Create Promotion**
2. Set:
   - **Promotion type**: Percentage off, or dollar amount off
   - **Applies to**: Specific products or categories
   - **Active date range**: Start and end time (BigCommerce restores prices automatically)
3. For a countdown timer, add a custom script:
   - Go to **Storefront → Script Manager → Create a Script**
   - Scope: Specific pages → Product pages
   - Add a JavaScript timer that counts down to the promotion end time

**Quantity limits on BigCommerce:**
Set a **Maximum uses** limit on the promotion to cap how many orders can use the flash sale discount, or use the product's inventory tracking to limit stock.

---

#### Waiting Room for High-Demand Drops (Any Platform)

For product drops expecting high traffic (limited sneakers, concert tickets, exclusive merchandise):

**Cloudflare Waiting Room (recommended)**

1. In your Cloudflare dashboard, go to **Traffic → Waiting Room**
2. Click **Create Waiting Room**
3. Set:
   - **Hostname** and **Path**: the product page URL pattern (e.g., `/products/limited-edition-*`)
   - **Total active users**: maximum concurrent users allowed on the page
   - **New users per minute**: rate at which waiting customers are admitted
4. Cloudflare serves a customizable waiting room page to queued visitors
5. Customers are admitted in FIFO order; bots are filtered by Cloudflare's bot management

This requires a Cloudflare Business or Enterprise plan. For lower-cost alternatives, consider **Queue-it** or **Fastly's Waiting Room**.

---

#### Custom / Headless

For custom storefronts, implement atomic stock reservation using Redis for high-concurrency safety:

```typescript
import { Redis } from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Atomically reserve one unit from the flash sale allocation
async function reserveFlashSaleUnit(saleId: string, customerId: string): Promise<boolean> {
  const key = `flash_sale:${saleId}:sold`;
  const maxKey = `flash_sale:${saleId}:max`;
  const max = parseInt(await redis.get(maxKey) ?? '0');
  if (max === 0) return false; // sale not configured

  // Atomic increment — safe under high concurrency
  const newCount = await redis.incr(key);
  if (newCount > max) {
    await redis.decr(key); // Undo the over-increment
    return false; // Sold out
  }
  return true;
}

// Send countdown timer data to the client via Server-Sent Events
app.get('/api/sales/:saleId/timer', async (req, res) => {
  const { endsAt, maxQuantity } = await db.flashSales.findById(req.params.saleId);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  const interval = setInterval(async () => {
    const remaining = Math.max(0, new Date(endsAt).getTime() - Date.now());
    const sold = parseInt(await redis.get(`flash_sale:${req.params.saleId}:sold`) ?? '0');
    res.write(`data: ${JSON.stringify({ remaining, stockLeft: maxQuantity - sold })}\n\n`);
    if (remaining === 0) { clearInterval(interval); res.end(); }
  }, 1000);

  req.on('close', () => clearInterval(interval));
});
```

## Best Practices

- **Use server-authoritative end times** — never let the client calculate when the sale ends; always read the UTC end timestamp from the server to prevent timer drift across browsers
- **Set sale quantity separately from main inventory** — flash sale stock is a separate allocation; do not reduce your total inventory by the flash sale quantity until an order is confirmed
- **Pre-scale infrastructure before high-traffic drops** — load test your checkout with expected peak traffic 48 hours before a major sale; scale your hosting accordingly
- **Display "while supplies last" when stock is low** — showing live stock counts (e.g., "8 left") creates urgency, but avoid showing exact counts for large quantities as it appears artificial
- **Test the full sale cycle in staging** — run a complete sale from scheduled start through automatic price restoration before going live
- **Never manually edit prices during an active Launchpad/app-managed sale** — manual edits can prevent the automatic restoration from working correctly

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Price not restored after sale ends | Use Launchpad or a countdown app with auto-restore; if using manual scheduling, set a calendar reminder and verify restoration; build a fallback check that validates prices against a "source of truth" table |
| Overselling during traffic spike | Use Redis atomic increment for custom builds; for platforms, set product inventory to the flash sale cap before the sale starts |
| Countdown timer shows different time in different timezones | Always base the countdown on the sale's absolute UTC end time; calculate `remaining = endsAt - Date.now()` client-side |
| Bots exhaust all stock before real customers can buy | Use Cloudflare Waiting Room or a similar queuing system; enforce per-customer purchase limits in your order system |
| App-managed countdown timer conflicts with manual price changes | Do not modify prices through the Shopify admin while a Launchpad event or countdown app is active |

## Related Skills

- @coupon-management
- @dynamic-pricing
- @price-rules-engine
- @bot-protection
- @order-management-system
