---
name: dynamic-pricing
description: "Automatically adjust prices based on demand signals, competitor prices, and inventory levels to maximize revenue and stay competitive"
category: pricing-promotions
risk: critical
source: curated
date_added: "2026-03-12"
tags: [dynamic-pricing, demand-pricing, price-optimization, competitor-monitoring, repricing, algorithmic-pricing]
triggers: ["dynamic pricing", "demand-based pricing", "price optimization", "competitor price monitoring", "repricing engine", "algorithmic pricing"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Dynamic Pricing

## Overview

Dynamic pricing automatically adjusts product prices based on demand signals, inventory levels, competitor prices, and business rules. The goal is to maximize revenue per unit sold — raising prices when demand is strong or inventory is scarce, and reducing them to clear slow-moving stock. Most Shopify and WooCommerce merchants accomplish this with a repricing app rather than custom code. Custom implementations are reserved for headless storefronts or merchants with unique repricing logic that apps cannot handle.

## When to Use This Skill

- When high-velocity SKUs lose revenue because prices are set-and-forgotten while competitors adjust hourly
- When you need to liquidate slow-moving inventory through automatic markdown schedules
- When running a marketplace where seller prices must respond to competitive pressure
- When building a revenue management system for perishable or time-sensitive inventory
- When A/B testing price elasticity at scale and needing a framework to safely roll out price changes

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Prisync, Wiser, or Skio Pricing | Prisync monitors competitor prices and pushes price updates via Shopify Admin API; Wiser uses demand signals and inventory |
| **Shopify Plus** | Prisync + Shopify Flow automations | Shopify Flow can trigger price changes via webhooks based on inventory or sales velocity signals |
| **WooCommerce** | Prisync, Repricer.com (via WooCommerce API), or custom via WooCommerce REST API | Most repricers support WooCommerce through the product API |
| **BigCommerce** | Prisync, Linnworks, or ChannelAdvisor | BigCommerce's Price Lists API is designed for dynamic segment-based pricing |
| **Amazon/Multi-channel** | RepricerExpress, BQool, or Seller Snap | Purpose-built for Amazon repricing with Buy Box optimization |
| **Custom / Headless** | Build a pricing job that calls your platform's pricing API | Full control; required when custom logic exceeds what apps can handle |

### Step 2: Define your pricing rules before configuring any tool

Before touching any tool, document your guardrails — these prevent the repricing algorithm from making decisions that destroy margin or customer trust:

| Rule | Example |
|------|---------|
| **Floor price** | Never go below cost × 1.15 (15% gross margin minimum) |
| **Ceiling price** | Never exceed MSRP or a set maximum |
| **Maximum change per cycle** | Never change more than 20% in a single repricing run |
| **Change threshold** | Only update if the new price differs by more than 2% (prevents micro-oscillation) |
| **Lock-out periods** | Do not reprice during active flash sales or promotions |
| **Human review threshold** | Any change greater than 10% must be queued for human approval before applying |

### Step 3: Platform-specific setup

---

#### Shopify

**Option A: Prisync (competitor-based repricing)**

1. Sign up at prisync.com and connect your Shopify store via the integration
2. Add competitor product URLs to track in the Prisync dashboard
3. Set repricing rules: "Match lowest competitor price", "Beat by X%", or "Match and beat"
4. Set your floor and ceiling prices per product
5. Prisync pushes price updates to Shopify automatically on your configured schedule (hourly, daily)

**Option B: Shopify Flow (inventory/demand-based, Shopify Plus)**

1. In your Shopify admin, go to **Apps → Flow**
2. Create a new workflow triggered by **Inventory level changed** or a custom webhook
3. Add a condition: e.g., "Inventory quantity is less than 10"
4. Add an action: **Update product variant** and set the price to a higher value
5. Add a separate workflow for when inventory recovers to restore the original price

Keep the original prices stored as a product metafield (`product.metafields.pricing.original_price`) so you can always restore them.

**Option C: Third-party apps for demand-based repricing**

- **Wiser** (Shopify App Store): uses sales velocity, add-to-cart rates, and inventory to suggest and apply price changes
- **Bold Commerce's Pricing**: allows scheduling price changes and automated rules

---

#### WooCommerce

**Option A: Prisync + WooCommerce REST API**

1. Connect Prisync to WooCommerce using the REST API credentials (WooCommerce **Settings → Advanced → REST API → Add key**)
2. Map your products in Prisync to competitor URLs
3. Configure repricing rules and schedules in Prisync
4. Prisync calls `PUT /wp-json/wc/v3/products/{id}/variations/{id}` to update prices

**Option B: Custom scheduled repricing via WP-Cron**

For demand-based repricing in WooCommerce, use a scheduled task:
1. Write a PHP function that checks inventory levels and sales velocity via WooCommerce's order history
2. Schedule it with WP-Cron or a server cron
3. Call `wc_get_product()->set_price()` and `save()` to update prices programmatically
4. Log every price change to a custom table for audit and rollback

**Option C: YITH Dynamic Pricing plugin**

For time-based price changes (scheduled markdowns):
1. Install **YITH WooCommerce Dynamic Pricing & Discounts**
2. Create rules that apply a percentage discount during specific date ranges
3. This is simpler than full dynamic repricing but covers "end of season" markdown use cases

---

#### BigCommerce

BigCommerce's **Price Lists** feature is ideal for dynamic customer-segment pricing:

1. Go to **Products → Price Lists**
2. Create price lists per customer group (e.g., "demand_high_inventory_low")
3. Use the BigCommerce **Price Lists API** to update prices programmatically based on your pricing logic
4. Assign price lists to customer groups via **Customers → Customer Groups**

For site-wide dynamic pricing without customer segmentation, use the BigCommerce **Catalog API** to update `sale_price` on products based on your repricing schedule.

Third-party tools: **Linnworks** and **ChannelAdvisor** both integrate with BigCommerce and include competitor monitoring and automated repricing.

---

#### Custom / Headless

For headless storefronts, implement a repricing job that runs on a schedule:

```typescript
import { CronJob } from 'cron';

interface PricingContext {
  productId: string;
  currentPriceCents: number;
  costCents: number;
  inventoryLevel: number;
  salesVelocity7d: number;       // units/day rolling average
  competitorLowestCents?: number; // from price intelligence feed
  floorCents: number;
  ceilingCents: number;
}

function computeNewPrice(ctx: PricingContext): { priceCents: number; reason: string } {
  let price = ctx.currentPriceCents;
  const reasons: string[] = [];

  // Inventory pressure: near stockout → slow demand with a price increase
  if (ctx.inventoryLevel <= 5 && ctx.salesVelocity7d > 0.5) {
    price = Math.round(price * 1.08);
    reasons.push('low_inventory');
  }

  // Slow mover: markdown if no meaningful sales in 7 days
  if (ctx.salesVelocity7d < 0.1) {
    price = Math.round(price * 0.95);
    reasons.push('slow_mover_markdown');
  }

  // Competitor pricing: stay competitive
  if (ctx.competitorLowestCents && price > ctx.competitorLowestCents * 1.05) {
    price = Math.round(ctx.competitorLowestCents * 0.99); // undercut by 1%
    reasons.push('competitor_undercut');
  }

  // Enforce guardrails
  const marginFloor = Math.round(ctx.costCents * 1.15);
  price = Math.max(price, marginFloor, ctx.floorCents);
  price = Math.min(price, ctx.ceilingCents);

  // Only apply if change exceeds 2% threshold
  const changePct = Math.abs(price - ctx.currentPriceCents) / ctx.currentPriceCents;
  if (changePct < 0.02) return { priceCents: ctx.currentPriceCents, reason: 'below_threshold' };

  // Cap single-run change at 20%
  if (changePct > 0.20) {
    const direction = price > ctx.currentPriceCents ? 1 : -1;
    price = Math.round(ctx.currentPriceCents * (1 + direction * 0.20));
    reasons.push('capped_at_20pct');
  }

  return { priceCents: price, reason: reasons.join(',') || 'no_change' };
}

// Run every 30 minutes during business hours
new CronJob('*/30 6-22 * * *', async () => {
  const products = await db.products.findAll({ dynamicPricingEnabled: true });
  for (const product of products) {
    const ctx = await buildPricingContext(product);
    const { priceCents, reason } = computeNewPrice(ctx);
    if (priceCents !== ctx.currentPriceCents) {
      await platformApi.updatePrice(product.id, priceCents);
      await db.priceHistory.insert({ productId: product.id, oldPrice: ctx.currentPriceCents, newPrice: priceCents, reason, changedAt: new Date() });
    }
  }
}, null, true, 'America/New_York');
```

## Best Practices

- **Always enforce a floor price tied to cost** — compute `floor = cost × 1 + min_margin` and make it inviolable; no algorithm override permitted below cost
- **Store a full price history** — every price change needs a row with timestamp, old price, new price, and reason for rollback, audits, and elasticity analysis
- **Cap single-run price changes** — limit any single job run to ±20% to prevent runaway repricing from bad data or bugs
- **Separate recommendation from application** — the engine proposes a price; a separate step applies it; this enables human review queues and dry-run mode
- **Alert on large automatic changes** — send a Slack or email alert when the engine applies a change greater than 10% so a human can review
- **A/B test price changes** — before rolling out a new price site-wide, run a test on a segment of visitors using the A/B testing pricing skill

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Price drops below cost during competitor war | Enforce `Math.max(newPrice, costCents * 1.15)` as an absolute floor that the algorithm cannot bypass |
| Stale competitor prices cause bad repricing | Store `fetched_at` on every competitor price record; skip prices older than 4 hours |
| Price oscillation — engine keeps raising then lowering | Add a minimum 2-hour cooldown between changes and a 2% hysteresis band |
| Repricing fires during an active flash sale | Check for active promotions before applying algorithmic changes; add an `is_price_locked` flag to products in active sales |
| CDN/search index serves old price after update | Purge the product page cache and update the search index immediately after each price change |

## Related Skills

- @ab-testing-pricing
- @flash-sale-engine
- @price-rules-engine
- @volume-pricing
- @discount-engine
