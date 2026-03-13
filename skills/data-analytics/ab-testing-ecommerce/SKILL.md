---
name: ab-testing-ecommerce
description: "Run controlled experiments on product pages, checkout flows, and pricing to find what converts best using statistical significance testing"
category: data-analytics
risk: safe
source: curated
date_added: "2026-03-12"
tags: [ab-testing, experimentation, statistical-significance, feature-flags, checkout, pricing, conversion, hypothesis-testing]
triggers: ["A/B testing", "ab test", "experimentation platform", "split testing", "feature flags", "statistical significance", "conversion test", "pricing test"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# A/B Testing for E-commerce

## Overview

A/B testing (or split testing) is the practice of running controlled experiments where a random subset of users sees a variant and the rest see the control, then using statistical analysis to determine if the variant's effect is real or due to chance. This skill covers building an experimentation platform with server-side assignment, calculating minimum sample size before running tests, performing statistical significance testing with the chi-squared or t-test, and avoiding the most common errors (peeking, multiple comparisons, novelty effects).

## When to Use This Skill

- When making product page, checkout, or pricing changes and wanting data-driven validation
- When building an in-house feature flag and experiment management system
- When migrating from a client-side A/B testing tool (Optimizely, VWO) to server-side assignment for accuracy
- When needing statistical power calculations before starting an experiment
- When analyzing experiment results and determining when to ship or kill a variant
- When running a pricing test and needing to ensure consistent pricing per customer (no price flickering)

## Core Instructions

1. **Design the experiment and calculate minimum sample size**

   Always calculate the required sample size before starting — running tests without this leads to premature stopping:

   ```typescript
   interface SampleSizeParams {
     baselineConversionRate: number;  // e.g., 0.025 for 2.5%
     minimumDetectableEffect: number; // e.g., 0.003 for detecting a 0.3pp lift
     statisticalPower: number;        // e.g., 0.80 for 80% power
     significanceLevel: number;       // e.g., 0.05 for 95% confidence
   }

   function calculateRequiredSampleSize(params: SampleSizeParams): number {
     const { baselineConversionRate, minimumDetectableEffect, statisticalPower, significanceLevel } = params;

     // z-scores for common alpha and power levels
     const zAlpha = 1.96; // α = 0.05, two-tailed
     const zBeta = statisticalPower === 0.80 ? 0.842 : statisticalPower === 0.90 ? 1.282 : 1.645;

     const p1 = baselineConversionRate;
     const p2 = baselineConversionRate + minimumDetectableEffect;
     const pBar = (p1 + p2) / 2;

     const n = Math.pow(zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2) /
               Math.pow(p2 - p1, 2);

     return Math.ceil(n);
   }

   // Example: 2.5% baseline CVR, want to detect a 0.3pp lift
   // Required sample per variant: ~8,600 sessions
   const required = calculateRequiredSampleSize({
     baselineConversionRate: 0.025,
     minimumDetectableEffect: 0.003,
     statisticalPower: 0.80,
     significanceLevel: 0.05,
   });
   ```

2. **Build server-side variant assignment**

   Server-side assignment prevents variant flickering, works without JavaScript, and is required for pricing tests:

   ```typescript
   import { createHash } from 'crypto';

   interface Experiment {
     id: string;
     name: string;
     variants: Array<{ id: string; name: string; weight: number }>; // weights sum to 1.0
     status: 'draft' | 'running' | 'paused' | 'completed';
     startedAt: Date | null;
     endedAt: Date | null;
   }

   function assignVariant(experimentId: string, userId: string): string {
     // Hash the user+experiment combination for deterministic, sticky assignment
     const hash = createHash('md5').update(`${experimentId}:${userId}`).digest('hex');
     const bucket = parseInt(hash.slice(0, 8), 16) / 0xffffffff; // 0–1 uniform distribution

     const experiment = getExperiment(experimentId);
     let cumulative = 0;

     for (const variant of experiment.variants) {
       cumulative += variant.weight;
       if (bucket < cumulative) return variant.id;
     }

     return experiment.variants[experiment.variants.length - 1].id; // fallback
   }

   // Middleware: inject variant assignments into request context
   export async function experimentMiddleware(req: Request, res: Response, next: NextFunction) {
     const userId = req.session.customerId ?? req.session.anonymousId ?? getOrCreateAnonymousId(req, res);
     const activeExperiments = await getActiveExperiments();

     req.experiments = {};
     for (const exp of activeExperiments) {
       req.experiments[exp.id] = assignVariant(exp.id, userId);
     }

     next();
   }
   ```

3. **Track experiment exposure and conversions**

   ```typescript
   // Track when a user is exposed to an experiment variant
   async function trackExposure(experimentId: string, variantId: string, userId: string) {
     // Use upsert to avoid double-counting exposures
     await db.experimentExposures.upsert(
       { experimentId, userId },
       {
         experimentId,
         variantId,
         userId,
         firstExposedAt: new Date(),
       }
     );
   }

   // Track conversion events (order placed, checkout started, etc.)
   async function trackConversion(
     experimentId: string,
     userId: string,
     event: string,
     value?: number
   ) {
     const exposure = await db.experimentExposures.findOne({ experimentId, userId });
     if (!exposure) return; // Only count conversions from exposed users

     await db.experimentConversions.create({
       experimentId,
       variantId: exposure.variantId,
       userId,
       event,
       value: value ?? null,
       convertedAt: new Date(),
     });
   }
   ```

4. **Calculate statistical significance with chi-squared test**

   ```typescript
   interface ExperimentResults {
     control: { exposures: number; conversions: number };
     variant: { exposures: number; conversions: number };
   }

   function calculateChiSquaredSignificance(results: ExperimentResults): {
     pValue: number;
     significant: boolean;
     relativeLift: number;
     controlCVR: number;
     variantCVR: number;
   } {
     const { control, variant } = results;

     const controlCVR = control.conversions / control.exposures;
     const variantCVR = variant.conversions / variant.exposures;
     const relativeLift = (variantCVR - controlCVR) / controlCVR;

     // Chi-squared test for independence
     const total = control.exposures + variant.exposures;
     const totalConversions = control.conversions + variant.conversions;
     const totalNonConversions = total - totalConversions;

     const expectedControlConv = (control.exposures * totalConversions) / total;
     const expectedVariantConv = (variant.exposures * totalConversions) / total;
     const expectedControlNon = (control.exposures * totalNonConversions) / total;
     const expectedVariantNon = (variant.exposures * totalNonConversions) / total;

     const chiSquared =
       Math.pow(control.conversions - expectedControlConv, 2) / expectedControlConv +
       Math.pow(variant.conversions - expectedVariantConv, 2) / expectedVariantConv +
       Math.pow((control.exposures - control.conversions) - expectedControlNon, 2) / expectedControlNon +
       Math.pow((variant.exposures - variant.conversions) - expectedVariantNon, 2) / expectedVariantNon;

     // p-value approximation from chi-squared with 1 degree of freedom
     // Accurate for p between 0.001 and 0.5
     const pValue = Math.exp(-0.717 * chiSquared - 0.416 * chiSquared * chiSquared);

     return {
       pValue: Math.min(1, Math.max(0, pValue)),
       significant: pValue < 0.05,
       relativeLift,
       controlCVR,
       variantCVR,
     };
   }
   ```

5. **Build the experiment results API**

   ```typescript
   // GET /api/experiments/:id/results
   export async function getExperimentResults(req: Request, res: Response) {
     const { id } = req.params;

     const [exposures, conversions] = await Promise.all([
       db.experimentExposures.groupBy({ by: ['variantId'], _count: { userId: true }, where: { experimentId: id } }),
       db.experimentConversions.groupBy({ by: ['variantId'], _count: { userId: true }, where: { experimentId: id, event: 'order_placed' } }),
     ]);

     const variantMap = new Map(exposures.map((e: any) => [e.variantId, { exposures: e._count.userId, conversions: 0 }]));
     for (const c of conversions) {
       const v = variantMap.get(c.variantId);
       if (v) v.conversions = c._count.userId;
     }

     const control = variantMap.get('control') ?? { exposures: 0, conversions: 0 };
     const variants = [...variantMap.entries()].filter(([id]) => id !== 'control').map(([variantId, data]) => ({
       variantId,
       ...data,
       ...calculateChiSquaredSignificance({ control, variant: data }),
     }));

     const experiment = await db.experiments.findById(id);
     const requiredSampleSize = calculateRequiredSampleSize({ baselineConversionRate: control.conversions / Math.max(1, control.exposures), minimumDetectableEffect: 0.003, statisticalPower: 0.80, significanceLevel: 0.05 });

     res.json({
       experiment,
       control: { ...control, cvr: control.conversions / Math.max(1, control.exposures) },
       variants,
       sampleSize: { current: control.exposures, required: requiredSampleSize, reached: control.exposures >= requiredSampleSize },
     });
   }
   ```

## Examples

### Pricing test with consistent pricing per user

For pricing tests, you must show the same price to the same user every time to avoid legal and UX issues:

```typescript
// Server-side rendering: always use the server-assigned variant for pricing
export async function getProductPrice(productId: string, userId: string): Promise<number> {
  const activePricingTest = await db.experiments.findOne({
    where: { status: 'running', type: 'pricing', productId },
  });

  if (!activePricingTest) {
    const product = await db.products.findById(productId);
    return product.priceInCents;
  }

  const variantId = assignVariant(activePricingTest.id, userId);
  const variantConfig = activePricingTest.variants.find((v) => v.id === variantId);
  return variantConfig?.priceInCents ?? (await db.products.findById(productId)).priceInCents;
}
```

### Guardrail metrics — stop a test if it hurts key metrics

```typescript
async function checkExperimentGuardrails(experimentId: string): Promise<boolean> {
  const guardrails = {
    maxReturnRateIncrease: 0.05,  // Stop if variant increases returns by >5pp
    maxCartAbandonmentIncrease: 0.10,
  };

  const [controlReturns, variantReturns] = await Promise.all([
    db.query(returnRateByVariantSQL, [experimentId, 'control']),
    db.query(returnRateByVariantSQL, [experimentId, 'variant']),
  ]);

  const returnRateDiff = variantReturns.rate - controlReturns.rate;
  if (returnRateDiff > guardrails.maxReturnRateIncrease) {
    await db.experiments.update(experimentId, { status: 'paused', pauseReason: 'guardrail_return_rate' });
    await alertExperimentTeam(experimentId, `Return rate guardrail breached: +${(returnRateDiff * 100).toFixed(1)}pp`);
    return false;
  }
  return true;
}
```

## Best Practices

- **Calculate sample size before starting** — running until it "looks significant" is p-hacking; use the pre-calculated size as your stopping rule
- **Use server-side assignment** for any test involving pricing, checkout flow, or personalization — client-side JavaScript A/B tools create flickering and can be blocked by ad blockers
- **Never run more than 3–4 experiments on the same page simultaneously** — interaction effects between experiments contaminate all results
- **Set up guardrail metrics** for every test — even if your primary metric improves, monitor returns, cart abandonment, and customer service contacts for regression
- **Run experiments for at least 2 full weeks** — day-of-week effects mean a 1-week test may be accidentally biased if launch day is Monday
- **Exclude internal team traffic** from experiments by IP allowlist or user flag — internal browsing patterns differ from customers
- **Document the hypothesis and expected lift before starting** — post-hoc hypothesis generation leads to confirmation bias in result interpretation

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Test ends early because it "looks significant" — then the lift disappears | Use pre-calculated sample size as a mandatory stopping rule; never stop a test early based on interim results |
| Same user sees different variants on different sessions | Use server-side assignment keyed on a stable user ID (not session ID); stick to first-session assignment |
| Checkout test shows lift in CVR but drop in AOV | Always measure revenue per visitor as your primary metric, not CVR alone — they can move in opposite directions |
| Multiple tests running on checkout inflate false positive rate | Apply a Bonferroni correction (divide alpha by number of simultaneous tests) or use a sequential testing framework |
| Novelty effect inflates variant results in the first week | Report results with and without the first 3 days of data; a large week-1 spike that fades is usually novelty |

## Related Skills

- @conversion-rate-optimization
- @product-analytics
- @customer-analytics
- @sales-reporting-dashboard
- @attribution-modeling
