---
name: attribution-modeling
description: "Understand which marketing channels drive purchases by implementing multi-touch attribution models across UTM-tracked campaigns and channels"
category: data-analytics
risk: safe
source: curated
date_added: "2026-03-12"
tags: [attribution, multi-touch, marketing-analytics, utm, last-click, first-click, data-driven, channel-analysis]
triggers: ["attribution modeling", "multi-touch attribution", "marketing attribution", "channel attribution", "first touch vs last touch", "data-driven attribution", "marketing spend optimization", "UTM attribution"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Attribution Modeling

## Overview

Attribution modeling determines which marketing touchpoints receive credit for a conversion, enabling informed decisions about where to allocate ad spend. This skill covers building four attribution models (last-click, first-click, linear, and time-decay) from first-party UTM data, comparing model outputs to identify channel discrepancies, and implementing a data-driven attribution approach using Markov chains for stores with sufficient data volume.

## When to Use This Skill

- When marketing channels (Google Ads, Meta, email) each claim different shares of the same revenue
- When needing to make budget allocation decisions across acquisition channels
- When moving beyond last-click attribution to understand the full customer journey
- When building a marketing analytics report that compares channel performance under multiple attribution models
- When implementing first-party attribution to replace data lost from iOS tracking changes
- When affiliate, influencer, and paid search all contributed to the same order and each claims 100% credit

## Core Instructions

1. **Capture the full customer touchpoint journey**

   Every marketing touch must be recorded with a consistent schema:

   ```typescript
   interface MarketingTouchpoint {
     sessionId: string;
     customerId: string | null;   // Null for anonymous visitors
     anonymousId: string;         // Cookie-based ID for pre-login tracking
     utmSource: string;
     utmMedium: string;
     utmCampaign: string;
     utmContent: string | null;
     utmTerm: string | null;
     landingPage: string;
     touchedAt: Date;
     touchType: 'organic' | 'paid' | 'email' | 'social' | 'direct' | 'referral';
   }

   // Client-side: fire on every page load where UTM params are present
   function captureUTMTouchpoint() {
     const params = new URLSearchParams(window.location.search);
     if (!params.get('utm_source') && !params.get('gclid') && !params.get('fbclid')) return;

     const anonymousId = getOrCreateAnonymousId();

     fetch('/api/analytics/touchpoint', {
       method: 'POST',
       body: JSON.stringify({
         sessionId: getSessionId(),
         anonymousId,
         utmSource: params.get('utm_source') ?? inferSource(document.referrer),
         utmMedium: params.get('utm_medium') ?? 'organic',
         utmCampaign: params.get('utm_campaign') ?? '(none)',
         utmContent: params.get('utm_content'),
         utmTerm: params.get('utm_term'),
         landingPage: window.location.pathname,
         touchedAt: new Date().toISOString(),
       }),
     });
   }
   ```

2. **Link touchpoints to conversions at order time**

   When an order is placed, fetch all touchpoints for that user's conversion path:

   ```typescript
   async function buildConversionPath(orderId: string): Promise<ConversionPath> {
     const order = await db.orders.findById(orderId, { include: ['customer'] });
     const anonymousId = order.anonymousId ?? order.session?.anonymousId;
     const customerId = order.customerId;

     // Get all touchpoints from the 30-day look-back window before the order
     const lookbackStart = new Date(order.createdAt.getTime() - 30 * 86400000);

     const touchpoints = await db.marketingTouchpoints.findMany({
       where: {
         OR: [
           { customerId },
           { anonymousId },
         ],
         touchedAt: { gte: lookbackStart, lte: order.createdAt },
       },
       orderBy: { touchedAt: 'asc' },
     });

     await db.conversionPaths.upsert(
       { orderId },
       {
         orderId,
         orderRevenue: order.subtotalCents / 100,
         touchpoints: touchpoints.map((t) => ({
           source: t.utmSource,
           medium: t.utmMedium,
           campaign: t.utmCampaign,
           touchedAt: t.touchedAt.toISOString(),
         })),
         pathLength: touchpoints.length,
         createdAt: new Date(),
       }
     );

     return { orderId, orderRevenue: order.subtotalCents / 100, touchpoints };
   }
   ```

3. **Implement the four standard attribution models**

   ```typescript
   type TouchpointCredit = { source: string; medium: string; campaign: string; credit: number };

   function applyLastClickAttribution(path: ConversionPath): TouchpointCredit[] {
     if (path.touchpoints.length === 0) return [{ source: 'direct', medium: 'none', campaign: '(none)', credit: path.orderRevenue }];
     const last = path.touchpoints[path.touchpoints.length - 1];
     return [{ source: last.source, medium: last.medium, campaign: last.campaign, credit: path.orderRevenue }];
   }

   function applyFirstClickAttribution(path: ConversionPath): TouchpointCredit[] {
     if (path.touchpoints.length === 0) return [{ source: 'direct', medium: 'none', campaign: '(none)', credit: path.orderRevenue }];
     const first = path.touchpoints[0];
     return [{ source: first.source, medium: first.medium, campaign: first.campaign, credit: path.orderRevenue }];
   }

   function applyLinearAttribution(path: ConversionPath): TouchpointCredit[] {
     if (path.touchpoints.length === 0) return [{ source: 'direct', medium: 'none', campaign: '(none)', credit: path.orderRevenue }];
     const creditPerTouch = path.orderRevenue / path.touchpoints.length;
     return path.touchpoints.map((t) => ({ source: t.source, medium: t.medium, campaign: t.campaign, credit: creditPerTouch }));
   }

   function applyTimeDecayAttribution(path: ConversionPath): TouchpointCredit[] {
     if (path.touchpoints.length === 0) return [{ source: 'direct', medium: 'none', campaign: '(none)', credit: path.orderRevenue }];

     // Half-life: 7 days — touchpoints from 7 days ago get half the weight of the final touch
     const halfLifeDays = 7;
     const orderTime = new Date(path.touchpoints[path.touchpoints.length - 1].touchedAt).getTime();

     const weights = path.touchpoints.map((t) => {
       const daysBeforeConversion = (orderTime - new Date(t.touchedAt).getTime()) / 86400000;
       return Math.pow(0.5, daysBeforeConversion / halfLifeDays);
     });

     const totalWeight = weights.reduce((sum, w) => sum + w, 0);

     return path.touchpoints.map((t, i) => ({
       source: t.source,
       medium: t.medium,
       campaign: t.campaign,
       credit: path.orderRevenue * (weights[i] / totalWeight),
     }));
   }
   ```

4. **Aggregate attribution credits by channel**

   ```typescript
   async function buildChannelAttributionReport(
     startDate: Date,
     endDate: Date,
     model: 'last_click' | 'first_click' | 'linear' | 'time_decay'
   ) {
     const paths = await db.conversionPaths.findMany({
       where: { createdAt: { gte: startDate, lte: endDate } },
     });

     const attributionFn = {
       last_click: applyLastClickAttribution,
       first_click: applyFirstClickAttribution,
       linear: applyLinearAttribution,
       time_decay: applyTimeDecayAttribution,
     }[model];

     const channelCredits: Record<string, { revenue: number; orders: number }> = {};

     for (const path of paths) {
       const credits = attributionFn(path);
       for (const credit of credits) {
         const key = `${credit.source}/${credit.medium}`;
         channelCredits[key] = channelCredits[key] ?? { revenue: 0, orders: 0 };
         channelCredits[key].revenue += credit.credit;
         channelCredits[key].orders += credit.credit / path.orderRevenue; // fractional order count
       }
     }

     return Object.entries(channelCredits)
       .map(([channel, stats]) => ({ channel, revenue: stats.revenue, orders: stats.orders }))
       .sort((a, b) => b.revenue - a.revenue);
   }
   ```

5. **Implement data-driven attribution using a Markov chain model**

   For stores with 10,000+ conversion paths, a Markov chain model is more accurate than rule-based models:

   ```typescript
   // Build transition probability matrix from conversion paths
   function buildMarkovTransitionMatrix(paths: ConversionPath[]): Map<string, Map<string, number>> {
     const transitions = new Map<string, Map<string, number>>();

     const addTransition = (from: string, to: string) => {
       if (!transitions.has(from)) transitions.set(from, new Map());
       const row = transitions.get(from)!;
       row.set(to, (row.get(to) ?? 0) + 1);
     };

     for (const path of paths) {
       const channels = ['start', ...path.touchpoints.map((t) => `${t.source}/${t.medium}`), 'conversion'];
       for (let i = 0; i < channels.length - 1; i++) {
         addTransition(channels[i], channels[i + 1]);
       }
     }

     // Normalize to probabilities
     for (const [from, toMap] of transitions) {
       const total = [...toMap.values()].reduce((sum, v) => sum + v, 0);
       for (const [to, count] of toMap) {
         toMap.set(to, count / total);
       }
     }

     return transitions;
   }

   // Removal effect: channel credit = (overall CVR - CVR without channel) / overall CVR
   function calculateRemovalEffect(transitions: Map<string, Map<string, number>>, channel: string, paths: ConversionPath[]): number {
     const overallCVR = paths.filter((p) => p.touchpoints.length > 0).length / paths.length;

     // Simulate paths with the channel removed (transition to null/non-converting)
     const pathsWithoutChannel = paths.map((p) => ({
       ...p,
       touchpoints: p.touchpoints.filter((t) => `${t.source}/${t.medium}` !== channel),
     }));

     const pathsWithConversion = pathsWithoutChannel.filter((p) => {
       if (p.touchpoints.length === 0) return false;
       // Simple simulation: path converts if it still has touchpoints
       return Math.random() < 0.7; // simplified; full implementation uses matrix multiplication
     });

     const cvrWithout = pathsWithConversion.length / paths.length;
     return (overallCVR - cvrWithout) / overallCVR;
   }
   ```

## Examples

### Side-by-side model comparison report

```typescript
async function compareAttributionModels(startDate: Date, endDate: Date) {
  const models = ['last_click', 'first_click', 'linear', 'time_decay'] as const;

  const results = await Promise.all(
    models.map(async (model) => {
      const report = await buildChannelAttributionReport(startDate, endDate, model);
      return { model, channels: report.slice(0, 10) };
    })
  );

  // Find channels with the biggest discrepancy between last-click and linear
  const lastClick = results.find((r) => r.model === 'last_click')!.channels;
  const linear = results.find((r) => r.model === 'linear')!.channels;

  const discrepancies = lastClick.map((lc) => {
    const lin = linear.find((l) => l.channel === lc.channel);
    return {
      channel: lc.channel,
      lastClickRevenue: lc.revenue,
      linearRevenue: lin?.revenue ?? 0,
      difference: lc.revenue - (lin?.revenue ?? 0),
    };
  }).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

  return { models: results, discrepancies };
}
```

### ROAS by channel under different attribution models

```sql
-- Compare ROAS across models by joining attribution results with ad spend
SELECT
  ac.channel,
  ac.model,
  ac.attributed_revenue,
  as_.ad_spend,
  ROUND(ac.attributed_revenue / NULLIF(as_.ad_spend, 0), 2) AS roas
FROM (
  SELECT channel, model, SUM(attributed_revenue) AS attributed_revenue
  FROM channel_attribution_results
  WHERE period BETWEEN :start AND :end
  GROUP BY channel, model
) ac
LEFT JOIN (
  SELECT source || '/' || medium AS channel, SUM(spend) AS ad_spend
  FROM ad_spend_by_channel
  WHERE date BETWEEN :start AND :end
  GROUP BY channel
) as_ ON ac.channel = as_.channel
ORDER BY ac.model, roas DESC;
```

## Best Practices

- **Always build multiple models and compare them** — no single model is "correct"; the comparison reveals which channels are over/under-credited in your current setup
- **Use first-party data for attribution** — iOS privacy changes have made third-party pixel attribution unreliable; server-side UTM + server-side Conversions API is now essential
- **Standardize UTM naming conventions strictly** — `utm_source=google` and `utm_source=Google` are treated as different channels; enforce lowercase and a controlled vocabulary
- **Apply a 30-day look-back window** — most e-commerce conversions occur within 30 days of first touch; longer windows create noise from irrelevant past touchpoints
- **Store raw touchpoint data indefinitely** — you can always rerun attribution models on historical data as your model improves, but you cannot reconstruct lost touchpoint events
- **Benchmark attribution model revenue against actual revenue** — the sum of attributed revenue across all models should equal total order revenue; a mismatch indicates tracking gaps
- **Account for view-through attribution separately** — display and video ads may not generate direct clicks but influence conversions; track impression data separately and report it as an add-on to click-based models

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Total attributed revenue exceeds actual revenue | Linear and time-decay models distribute fractions of revenue; if summing across models, total will be correct but cross-model comparison will not match |
| Anonymous touchpoints not linked to orders | Implement anonymous ID stitching: store `anonymousId` in both the touchpoint and the order; stitch when the user logs in or creates an account |
| UTM parameters stripped by third-party redirect domains | Use Google's URL builder and test that redirects preserve query parameters; some URL shorteners strip UTM params |
| Attribution shows 80% direct traffic (dark traffic) | Investigate: brand search often appears as direct when users type the brand name; UTM deep-links in email often lose parameters on mobile apps |
| Markov chain model gives 0% credit to email | Email appears late in the path in most journeys; ensure the look-back window is long enough (30 days) to capture the initial awareness touchpoints |

## Related Skills

- @influencer-tracking
- @affiliate-program
- @sales-reporting-dashboard
- @customer-analytics
- @ab-testing-ecommerce
