---
name: ab-testing-pricing
description: "Test different price points with proper statistical rigor to find the revenue-maximizing price while tracking conversion rate and margin impact"
category: pricing-promotions
risk: critical
source: curated
date_added: "2026-03-12"
tags: [ab-testing, price-experiments, statistical-significance, revenue-tracking, conversion-rate, experimentation]
triggers: ["price A/B test", "price experiment", "test pricing", "price testing", "statistical significance pricing", "experiment framework"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# A/B Testing Pricing

## Overview

Implement a price experimentation framework that assigns users to price variants deterministically, tracks conversion and revenue metrics per variant, and calculates statistical significance so you know when an experiment has conclusively found a winner. Includes guardrails to prevent price inconsistency within a single user session and a clean experiment lifecycle (draft → running → concluded).

## When to Use This Skill

- When you need data-driven evidence for a price change before rolling it out site-wide
- When testing price sensitivity across different customer segments or product categories
- When evaluating the revenue impact of a new pricing model (e.g., switching from $49.99 to $45.00)
- When running multiple concurrent price experiments on different products without interference
- When regulatory or ethical requirements demand that price tests are documented, time-limited, and reversible

## Core Instructions

1. **Design the experiment schema**

   ```sql
   CREATE TABLE price_experiments (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name         VARCHAR(128) NOT NULL,
     product_id   UUID NOT NULL REFERENCES products(id),
     status       VARCHAR(16) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'running', 'paused', 'concluded')),
     traffic_pct  INTEGER NOT NULL DEFAULT 50, -- % of eligible traffic in the experiment
     started_at   TIMESTAMPTZ,
     concluded_at TIMESTAMPTZ,
     winner_variant_id UUID,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE TABLE price_experiment_variants (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     experiment_id   UUID NOT NULL REFERENCES price_experiments(id),
     name            VARCHAR(64) NOT NULL,   -- e.g. 'control', 'treatment_1'
     price           INTEGER NOT NULL,       -- cents
     traffic_split   INTEGER NOT NULL,       -- percentage of experiment traffic, must sum to 100
     impressions     INTEGER NOT NULL DEFAULT 0,
     add_to_carts    INTEGER NOT NULL DEFAULT 0,
     purchases       INTEGER NOT NULL DEFAULT 0,
     revenue         BIGINT NOT NULL DEFAULT 0, -- cents
     created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE TABLE price_experiment_assignments (
     session_id    VARCHAR(128) NOT NULL,
     experiment_id UUID NOT NULL REFERENCES price_experiments(id),
     variant_id    UUID NOT NULL REFERENCES price_experiment_variants(id),
     assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     PRIMARY KEY (session_id, experiment_id)
   );
   ```

2. **Assign a user to a variant (deterministic by session)**

   ```typescript
   import crypto from 'crypto';

   async function assignVariant(
     experimentId: string,
     sessionId: string
   ): Promise<PriceExperimentVariant | null> {
     const experiment = await db.priceExperiments.findById(experimentId);
     if (!experiment || experiment.status !== 'running') return null;

     // Check for existing assignment (sticky bucketing)
     const existing = await db.priceExperimentAssignments.findOne({ session_id: sessionId, experiment_id: experimentId });
     if (existing) {
       return db.priceExperimentVariants.findById(existing.variant_id);
     }

     // Determine if this session is in the experiment traffic bucket
     const trafficHash = parseInt(
       crypto.createHash('sha256').update(`traffic:${experimentId}:${sessionId}`).digest('hex').slice(0, 8),
       16
     ) % 100;

     if (trafficHash >= experiment.traffic_pct) return null; // not in experiment

     // Assign to a variant using deterministic hashing
     const variantHash = parseInt(
       crypto.createHash('sha256').update(`variant:${experimentId}:${sessionId}`).digest('hex').slice(0, 8),
       16
     ) % 100;

     const variants = await db.priceExperimentVariants.findByExperiment(experimentId);
     let cumulative = 0;
     let assignedVariant: PriceExperimentVariant | null = null;

     for (const variant of variants) {
       cumulative += variant.traffic_split;
       if (variantHash < cumulative) {
         assignedVariant = variant;
         break;
       }
     }

     if (!assignedVariant) return null;

     // Persist assignment
     await db.priceExperimentAssignments.insert({
       session_id: sessionId,
       experiment_id: experimentId,
       variant_id: assignedVariant.id,
     });

     return assignedVariant;
   }
   ```

3. **Get the experiment price for a product**

   ```typescript
   async function getExperimentPrice(
     productId: string,
     sessionId: string,
     defaultPrice: number
   ): Promise<{ price: number; variantId: string | null; experimentId: string | null }> {
     const activeExperiment = await db.priceExperiments.findOne({
       product_id: productId,
       status: 'running',
     });

     if (!activeExperiment) return { price: defaultPrice, variantId: null, experimentId: null };

     const variant = await assignVariant(activeExperiment.id, sessionId);
     if (!variant) return { price: defaultPrice, variantId: null, experimentId: null };

     // Track impression
     await db.raw(
       'UPDATE price_experiment_variants SET impressions = impressions + 1 WHERE id = ?',
       [variant.id]
     );

     return { price: variant.price, variantId: variant.id, experimentId: activeExperiment.id };
   }
   ```

4. **Track conversion events**

   ```typescript
   async function trackExperimentEvent(
     variantId: string,
     event: 'add_to_cart' | 'purchase',
     revenueCents = 0
   ): Promise<void> {
     if (event === 'add_to_cart') {
       await db.raw(
         'UPDATE price_experiment_variants SET add_to_carts = add_to_carts + 1 WHERE id = ?',
         [variantId]
       );
     } else if (event === 'purchase') {
       await db.raw(
         'UPDATE price_experiment_variants SET purchases = purchases + 1, revenue = revenue + ? WHERE id = ?',
         [revenueCents, variantId]
       );
     }
   }
   ```

5. **Calculate statistical significance using a two-proportion z-test**

   ```typescript
   function calculateZTest(
     controlConversions: number,
     controlImpressions: number,
     treatmentConversions: number,
     treatmentImpressions: number
   ): { zScore: number; pValue: number; significant: boolean } {
     if (controlImpressions === 0 || treatmentImpressions === 0) {
       return { zScore: 0, pValue: 1, significant: false };
     }

     const p1 = controlConversions / controlImpressions;
     const p2 = treatmentConversions / treatmentImpressions;
     const pPooled = (controlConversions + treatmentConversions) / (controlImpressions + treatmentImpressions);
     const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / controlImpressions + 1 / treatmentImpressions));

     if (se === 0) return { zScore: 0, pValue: 1, significant: false };

     const zScore = (p2 - p1) / se;
     // Approximate two-tailed p-value using standard normal CDF
     const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
     return { zScore, pValue, significant: pValue < 0.05 };
   }

   // Abramowitz and Stegun approximation for the normal CDF
   function normalCDF(z: number): number {
     const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
     const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
     const sign = z < 0 ? -1 : 1;
     const x = Math.abs(z) / Math.sqrt(2);
     const t = 1 / (1 + p * x);
     const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
     return 0.5 * (1 + sign * y);
   }

   async function getExperimentResults(experimentId: string) {
     const variants = await db.priceExperimentVariants.findByExperiment(experimentId);
     const control = variants.find(v => v.name === 'control')!;

     return variants.map(variant => {
       const conversionRate = variant.impressions > 0 ? variant.purchases / variant.impressions : 0;
       const revenuePerImpression = variant.impressions > 0 ? variant.revenue / variant.impressions : 0;
       const stats = variant.name !== 'control'
         ? calculateZTest(control.purchases, control.impressions, variant.purchases, variant.impressions)
         : null;
       return { ...variant, conversionRate, revenuePerImpression, stats };
     });
   }
   ```

## Examples

### Set up a $10 price reduction experiment with 50/50 split

```typescript
const experiment = await db.priceExperiments.insert({
  name: '$39.99 vs $29.99 — Widget Pro',
  product_id: 'prod_widget_pro',
  status: 'running',
  traffic_pct: 100, // all traffic participates
  started_at: new Date(),
});

await db.priceExperimentVariants.insertMany([
  { experiment_id: experiment.id, name: 'control',     price: 3999, traffic_split: 50 },
  { experiment_id: experiment.id, name: 'treatment_1', price: 2999, traffic_split: 50 },
]);
```

### Check significance from the admin dashboard

```typescript
const results = await getExperimentResults('exp_abc123');
for (const variant of results) {
  console.log(`${variant.name}: ${(variant.conversionRate * 100).toFixed(2)}% CVR, ` +
    `$${(variant.revenuePerImpression / 100).toFixed(2)} RPV` +
    (variant.stats ? ` | p=${variant.stats.pValue.toFixed(4)} ${variant.stats.significant ? '✓' : ''}` : ''));
}
// control:     3.20% CVR, $1.28 RPV
// treatment_1: 4.80% CVR, $1.44 RPV | p=0.0031 ✓
```

## Best Practices

- **Use sticky bucketing** — once a session is assigned to a variant, always show the same price; inconsistent prices within a session destroy trust and distort results
- **Require statistical significance before declaring a winner** — minimum p < 0.05 and at minimum 100 conversions per variant before making rollout decisions
- **Track revenue per impression (RPV), not just conversion rate** — a lower price may convert better but generate less revenue; RPV captures the full picture
- **Do not run experiments on the same product simultaneously** — overlapping experiments cause interaction effects that make results uninterpretable
- **Set a minimum experiment duration** — run for at least 7 days to account for weekday/weekend seasonality patterns
- **Exclude existing customers from new-customer price tests** — showing existing customers a different price than they paid previously causes churn and complaints
- **Log the variant ID in every order** — store the `variantId` in the order record so you can later reconcile experiment assignments against actual revenue

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| User sees different price across page loads (no stickiness) | Persist the assignment to DB and always read the assignment before generating a price |
| Peeking problem — stopping experiment as soon as p < 0.05 | Pre-register a minimum sample size (e.g., 500 conversions/variant) and only evaluate significance after reaching it |
| Bots inflate impressions and skew results | Filter out non-human sessions using bot detection before recording impressions |
| A/B test is active during a sale event, confounding results | Pause all price experiments during site-wide promotions or account for the promotion in your analysis |

## Related Skills

- @dynamic-pricing
- @price-rules-engine
- @coupon-management
- @discount-engine
- @demand-forecasting
