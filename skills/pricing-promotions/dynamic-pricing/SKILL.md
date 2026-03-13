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
platforms: [platform-agnostic]
difficulty: advanced
---

# Dynamic Pricing

## Overview

Implement an algorithmic pricing engine that adjusts product prices in real time based on demand signals, inventory levels, competitor prices, and configurable business rules. The system comprises a data ingestion layer (competitor scraping, internal telemetry), a pricing model, guardrail enforcement, and a price-push mechanism that updates your catalog without manual intervention.

## When to Use This Skill

- When high-velocity SKUs lose revenue because prices are set-and-forgotten while competitors adjust hourly
- When you need to liquidate slow-moving inventory through automatic markdown schedules
- When running a marketplace where seller prices must respond to competitive pressure
- When building a revenue management system for perishable or time-sensitive inventory (event tickets, hotel rooms, last-minute flights)
- When A/B testing price elasticity at scale and need a framework to safely roll out price changes

## Core Instructions

1. **Model the pricing inputs and output schema**

   ```typescript
   interface PricingContext {
     productId: string;
     currentPrice: number;       // cents
     costPrice: number;          // cents — never go below this
     inventoryLevel: number;     // units on hand
     reorderPoint: number;
     demandSignals: {
       viewsLast24h: number;
       addToCartLast24h: number;
       salesLast24h: number;
       salesVelocity7d: number;  // units/day rolling average
     };
     competitorPrices: CompetitorPrice[];
     floorPrice: number;         // business rule: never go below
     ceilingPrice: number;       // business rule: never go above
   }

   interface CompetitorPrice {
     competitor: string;
     price: number;
     fetchedAt: Date;
     inStock: boolean;
   }

   interface PricingDecision {
     productId: string;
     recommendedPrice: number;
     previousPrice: number;
     changeReason: string;
     confidenceScore: number;    // 0-1
     effectiveAt: Date;
   }
   ```

2. **Implement the pricing algorithm**

   ```typescript
   function computeRecommendedPrice(ctx: PricingContext): PricingDecision {
     let price = ctx.currentPrice;
     const reasons: string[] = [];

     // --- Demand signal: high demand → increase price ---
     const conversionRate = ctx.demandSignals.salesLast24h / Math.max(ctx.demandSignals.viewsLast24h, 1);
     if (conversionRate > 0.08 && ctx.inventoryLevel > ctx.reorderPoint) {
       price = Math.round(price * 1.05); // +5% when demand is strong
       reasons.push('high_conversion_rate');
     }

     // --- Inventory pressure: near stockout → raise price to slow demand ---
     if (ctx.inventoryLevel <= ctx.reorderPoint * 0.5) {
       price = Math.round(price * 1.08);
       reasons.push('low_inventory');
     }

     // --- Competitor pricing: be the lowest in-stock price ---
     const inStockCompetitors = ctx.competitorPrices.filter(c => c.inStock);
     if (inStockCompetitors.length > 0) {
       const lowestCompetitor = Math.min(...inStockCompetitors.map(c => c.price));
       if (price > lowestCompetitor * 1.02) {
         // We're more than 2% above the lowest competitor — match minus 1%
         price = Math.round(lowestCompetitor * 0.99);
         reasons.push('competitor_undercut');
       }
     }

     // --- Slow mover: markdown if no sales for 72h ---
     if (ctx.demandSignals.salesVelocity7d < 0.1) {
       price = Math.round(price * 0.95);
       reasons.push('slow_mover_markdown');
     }

     // --- Enforce guardrails ---
     price = Math.max(price, ctx.floorPrice);
     price = Math.min(price, ctx.ceilingPrice);

     // --- Enforce minimum margin ---
     const minPriceForMargin = Math.round(ctx.costPrice * 1.15); // 15% gross margin floor
     price = Math.max(price, minPriceForMargin);

     return {
       productId: ctx.productId,
       recommendedPrice: price,
       previousPrice: ctx.currentPrice,
       changeReason: reasons.join(',') || 'no_change',
       confidenceScore: inStockCompetitors.length > 0 ? 0.85 : 0.6,
       effectiveAt: new Date(),
     };
   }
   ```

3. **Set up competitor price monitoring**

   ```typescript
   import { chromium } from 'playwright';

   interface CompetitorMonitorConfig {
     productId: string;
     urls: { competitor: string; url: string; priceSelector: string }[];
   }

   async function fetchCompetitorPrices(
     config: CompetitorMonitorConfig
   ): Promise<CompetitorPrice[]> {
     const browser = await chromium.launch({ headless: true });
     const results: CompetitorPrice[] = [];

     for (const { competitor, url, priceSelector } of config.urls) {
       const page = await browser.newPage();
       try {
         await page.goto(url, { timeout: 15000 });
         const priceText = await page.textContent(priceSelector);
         const price = parsePriceCents(priceText ?? '');
         const inStock = !(await page.isVisible('[data-testid="out-of-stock"]').catch(() => false));
         results.push({ competitor, price, fetchedAt: new Date(), inStock });
       } catch (err) {
         console.warn(`Failed to fetch price from ${competitor}:`, err);
       } finally {
         await page.close();
       }
     }

     await browser.close();
     return results;
   }

   function parsePriceCents(text: string): number {
     const match = text.replace(/[,$]/g, '').match(/[\d.]+/);
     if (!match) throw new Error(`Cannot parse price from: ${text}`);
     return Math.round(parseFloat(match[0]) * 100);
   }
   ```

4. **Build the pricing job that runs on a schedule**

   ```typescript
   import { CronJob } from 'cron';

   async function runPricingJob(): Promise<void> {
     const products = await db.products.findAll({ dynamicPricingEnabled: true });

     for (const product of products) {
       const [demandSignals, competitorPrices] = await Promise.all([
         fetchDemandSignals(product.id),
         fetchCompetitorPrices(product.competitorMonitorConfig),
       ]);

       const ctx: PricingContext = {
         productId: product.id,
         currentPrice: product.price,
         costPrice: product.costPrice,
         inventoryLevel: product.inventoryLevel,
         reorderPoint: product.reorderPoint,
         demandSignals,
         competitorPrices,
         floorPrice: product.floorPrice,
         ceilingPrice: product.ceilingPrice,
       };

       const decision = computeRecommendedPrice(ctx);

       if (decision.recommendedPrice !== ctx.currentPrice) {
         await applyPriceChange(decision);
       }
     }
   }

   async function applyPriceChange(decision: PricingDecision): Promise<void> {
     await db.transaction(async tx => {
       await tx.products.update(decision.productId, { price: decision.recommendedPrice });
       await tx.priceHistory.insert({
         product_id: decision.productId,
         old_price: decision.previousPrice,
         new_price: decision.recommendedPrice,
         reason: decision.changeReason,
         changed_at: decision.effectiveAt,
       });
     });

     // Push to CDN/search index
     await searchIndex.updatePrice(decision.productId, decision.recommendedPrice);
   }

   // Run every 30 minutes during business hours
   new CronJob('*/30 6-22 * * *', runPricingJob, null, true, 'America/New_York');
   ```

5. **Implement price change guardrails and human review queue**

   ```typescript
   const MAX_SINGLE_CHANGE_PCT = 0.20; // never change more than 20% in one run
   const LARGE_CHANGE_THRESHOLD = 0.10; // changes > 10% require human approval

   async function applyPriceChangeWithGuardrails(decision: PricingDecision): Promise<void> {
     const changePct = Math.abs(decision.recommendedPrice - decision.previousPrice) / decision.previousPrice;

     if (changePct > MAX_SINGLE_CHANGE_PCT) {
       // Cap the change
       const direction = decision.recommendedPrice > decision.previousPrice ? 1 : -1;
       decision.recommendedPrice = Math.round(decision.previousPrice * (1 + direction * MAX_SINGLE_CHANGE_PCT));
     }

     if (changePct > LARGE_CHANGE_THRESHOLD) {
       // Queue for human review instead of auto-applying
       await db.priceReviewQueue.insert({
         ...decision,
         status: 'pending_review',
       });
       return;
     }

     await applyPriceChange(decision);
   }
   ```

## Examples

### Price history table for analytics and rollback

```sql
CREATE TABLE price_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id),
  old_price   INTEGER NOT NULL,  -- cents
  new_price   INTEGER NOT NULL,  -- cents
  reason      TEXT NOT NULL,
  changed_by  VARCHAR(64) NOT NULL DEFAULT 'dynamic_pricing_engine',
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_history_product ON price_history(product_id, changed_at DESC);
```

### Admin dashboard query: products with most price volatility this week

```sql
SELECT
  p.name,
  COUNT(ph.id) AS price_changes,
  MIN(ph.new_price) / 100.0 AS min_price,
  MAX(ph.new_price) / 100.0 AS max_price,
  (MAX(ph.new_price) - MIN(ph.new_price))::float / MIN(ph.new_price) * 100 AS volatility_pct
FROM price_history ph
JOIN products p ON p.id = ph.product_id
WHERE ph.changed_at > NOW() - INTERVAL '7 days'
GROUP BY p.id, p.name
ORDER BY price_changes DESC
LIMIT 20;
```

## Best Practices

- **Always enforce a floor price tied to cost** — compute `floor = cost * 1 + min_margin` and treat it as inviolable; no algorithm override should be permitted below cost
- **Cap single-run price changes** — limit any single job run to ±20% to prevent runaway repricing from bad data or bugs
- **Store a full price history** — every price change needs a row with timestamp, old price, new price, and reason; enables rollback, audits, and elasticity analysis
- **Separate recommendation from application** — the engine should propose a price and a separate step applies it; this enables human review queues and dry-run mode
- **Monitor competitor scraping legality** — review the target site's `robots.txt` and terms of service; consider using authorized data feeds (Google Shopping, price comparison APIs) where available
- **Deduplicate competitor data** — stale competitor prices (fetched > 4 hours ago) should be excluded from the algorithm to avoid chasing outdated signals
- **A/B test price changes** — randomly assign 10% of sessions to the new price before rolling out; measure conversion impact before full deployment
- **Alert on large automatic changes** — send a Slack/PagerDuty alert whenever the engine applies a change > 10% so a human can review

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Price drops below cost during competitor war | Enforce `Math.max(recommendedPrice, costPrice * 1.15)` as the absolute floor |
| Stale competitor prices cause bad repricing decisions | Store `fetchedAt` on every competitor price; skip prices older than 4 hours |
| Price oscillation — engine keeps raising then lowering the same SKU | Add a minimum time-between-changes (e.g., 2 hours) and a hysteresis band (only change if new price differs by >2%) |
| CDN/search index serves old price after update | Purge product page cache and update search index in the same `applyPriceChange` transaction callback |
| Repricing during a flash sale overwrites manually set sale prices | Add an `is_price_locked` flag or check for active promotions before applying algorithmic price changes |

## Related Skills

- @ab-testing-pricing
- @flash-sale-engine
- @price-rules-engine
- @volume-pricing
- @discount-engine
