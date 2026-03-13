---
name: conversion-rate-optimization
description: "Systematically improve your store's revenue per visitor by auditing checkout drop-off, running heatmaps, and implementing CRO best practices"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [cro, conversion-rate, heatmap, funnel, checkout-optimization, a-b-testing, ux, analytics]
triggers: ["conversion rate optimization", "CRO audit", "improve checkout conversion", "heatmap analysis", "funnel optimization", "reduce checkout abandonment"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Conversion Rate Optimization

## Overview

Conversion rate optimization (CRO) is the systematic process of increasing the percentage of visitors who complete a desired action — add to cart, begin checkout, or purchase. This skill covers instrumenting a checkout funnel with step-by-step analytics, implementing heatmap and session recording hooks, running structured CRO audits, and applying the highest-impact checkout improvements backed by large-scale research.

## When to Use This Skill

- When overall store conversion rate is below 2% and you need a structured diagnostic approach
- When implementing analytics to identify where users drop off in the checkout funnel
- When preparing an A/B test backlog based on data rather than guesses
- When optimizing a newly launched checkout flow before scaling ad spend
- When post-redesign metrics show a conversion regression and root cause analysis is needed
- When stakeholders need a prioritized roadmap of CRO experiments with expected impact

## Core Instructions

1. **Instrument the checkout funnel with step-level tracking**

   Track every micro-conversion step to identify the highest drop-off point:

   ```typescript
   // Funnel steps: view_product → add_to_cart → begin_checkout →
   //               enter_email → enter_shipping → enter_payment → purchase

   type FunnelStep =
     | 'view_product'
     | 'add_to_cart'
     | 'begin_checkout'
     | 'enter_email'
     | 'enter_shipping'
     | 'enter_payment'
     | 'purchase';

   function trackFunnelStep(step: FunnelStep, properties: Record<string, unknown> = {}) {
     // Push to dataLayer for GA4
     window.dataLayer?.push({
       event: 'funnel_step',
       funnel_step: step,
       ...properties,
     });

     // Also send to your analytics warehouse
     fetch('/api/analytics/funnel', {
       method: 'POST',
       body: JSON.stringify({ step, sessionId: getSessionId(), userId: getCurrentUserId(), ts: Date.now(), ...properties }),
     });
   }

   // Usage at each step transition:
   // On checkout page load:
   trackFunnelStep('begin_checkout', { cartValue: cart.total, itemCount: cart.items.length });

   // On payment form render:
   trackFunnelStep('enter_payment', { shippingMethod: selectedShipping });
   ```

2. **Build a funnel drop-off report**

   Query step counts and calculate step-to-step conversion rates:

   ```sql
   -- PostgreSQL: daily funnel report
   WITH step_counts AS (
     SELECT
       DATE_TRUNC('day', created_at) AS day,
       funnel_step,
       COUNT(DISTINCT session_id) AS sessions
     FROM funnel_events
     WHERE created_at >= NOW() - INTERVAL '30 days'
     GROUP BY 1, 2
   ),
   pivoted AS (
     SELECT
       day,
       MAX(CASE WHEN funnel_step = 'view_product'   THEN sessions END) AS view_product,
       MAX(CASE WHEN funnel_step = 'add_to_cart'    THEN sessions END) AS add_to_cart,
       MAX(CASE WHEN funnel_step = 'begin_checkout' THEN sessions END) AS begin_checkout,
       MAX(CASE WHEN funnel_step = 'enter_payment'  THEN sessions END) AS enter_payment,
       MAX(CASE WHEN funnel_step = 'purchase'       THEN sessions END) AS purchase
     FROM step_counts
     GROUP BY 1
   )
   SELECT
     day,
     ROUND(100.0 * add_to_cart    / NULLIF(view_product,   0), 1) AS pdp_to_atc_pct,
     ROUND(100.0 * begin_checkout / NULLIF(add_to_cart,    0), 1) AS atc_to_checkout_pct,
     ROUND(100.0 * enter_payment  / NULLIF(begin_checkout, 0), 1) AS checkout_to_payment_pct,
     ROUND(100.0 * purchase       / NULLIF(enter_payment,  0), 1) AS payment_to_purchase_pct,
     ROUND(100.0 * purchase       / NULLIF(view_product,   0), 2) AS overall_cvr_pct
   FROM pivoted
   ORDER BY day DESC;
   ```

3. **Implement a CRO audit checklist programmatically**

   Run automated checks against your checkout pages to flag common issues:

   ```typescript
   interface AuditCheck {
     id: string;
     description: string;
     impact: 'high' | 'medium' | 'low';
     check: (page: Page) => Promise<boolean>;
   }

   const CRO_AUDIT_CHECKS: AuditCheck[] = [
     {
       id: 'guest-checkout',
       description: 'Guest checkout available without forced account creation',
       impact: 'high',
       check: async (page) => page.hasElement('[data-testid="guest-checkout-btn"]'),
     },
     {
       id: 'trust-badges',
       description: 'Security trust badges visible on payment step',
       impact: 'medium',
       check: async (page) => page.hasElement('[data-testid="trust-badges"]'),
     },
     {
       id: 'error-messages-inline',
       description: 'Form validation errors are inline (not toast/alert)',
       impact: 'high',
       check: async (page) => !page.hasElement('[role="alertdialog"]') && page.hasElement('.field-error'),
     },
     {
       id: 'autofill-support',
       description: 'Address fields have correct autocomplete attributes',
       impact: 'medium',
       check: async (page) => page.hasAttribute('input[name="address1"]', 'autocomplete', 'address-line1'),
     },
     {
       id: 'progress-indicator',
       description: 'Multi-step checkout shows progress indicator',
       impact: 'medium',
       check: async (page) => page.hasElement('[data-testid="checkout-progress"]'),
     },
     {
       id: 'cta-above-fold',
       description: 'Primary CTA button visible without scrolling on mobile',
       impact: 'high',
       check: async (page) => page.isAboveFold('[data-testid="place-order-btn"]', { viewport: 'mobile' }),
     },
   ];

   async function runCROAudit(checkoutUrl: string) {
     const page = await loadPage(checkoutUrl);
     const results = await Promise.all(
       CRO_AUDIT_CHECKS.map(async (check) => ({
         ...check,
         passed: await check.check(page),
       }))
     );

     const failed = results.filter((r) => !r.passed);
     console.table(failed.map((r) => ({ id: r.id, impact: r.impact, description: r.description })));
     return results;
   }
   ```

4. **Integrate heatmap tracking with Hotjar or Microsoft Clarity**

   Add event hooks to surface high-friction areas:

   ```typescript
   // Identify rage clicks on disabled or non-interactive elements
   function initCROEventTracking() {
     // Track form field abandonment
     document.querySelectorAll<HTMLInputElement>('form input, form select').forEach((field) => {
       field.addEventListener('blur', () => {
         if (!field.value && field.required) {
           window.hj?.('event', 'required_field_abandoned');
           trackFunnelStep('field_abandoned', { fieldName: field.name, step: getCurrentCheckoutStep() });
         }
       });
     });

     // Track scroll depth on product pages
     const milestones = [25, 50, 75, 100];
     const triggered = new Set<number>();
     window.addEventListener('scroll', () => {
       const pct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
       for (const m of milestones) {
         if (pct >= m && !triggered.has(m)) {
           triggered.add(m);
           window.hj?.('event', `scroll_depth_${m}`);
         }
       }
     });
   }
   ```

5. **Prioritize experiments with ICE scoring**

   Use the ICE framework (Impact, Confidence, Ease) to rank your experiment backlog:

   ```typescript
   interface CROExperiment {
     id: string;
     hypothesis: string;
     impact: 1 | 2 | 3 | 4 | 5;      // Expected lift to primary metric
     confidence: 1 | 2 | 3 | 4 | 5;  // Evidence strength (data, heuristics, research)
     ease: 1 | 2 | 3 | 4 | 5;        // Dev effort (5 = easiest)
   }

   function rankByICE(experiments: CROExperiment[]) {
     return experiments
       .map((e) => ({ ...e, iceScore: e.impact * e.confidence * e.ease }))
       .sort((a, b) => b.iceScore - a.iceScore);
   }

   // Example backlog:
   const backlog: CROExperiment[] = [
     { id: 'guest-checkout', hypothesis: 'Removing forced registration increases checkout starts by 15%', impact: 5, confidence: 5, ease: 3 },
     { id: 'express-pay', hypothesis: 'Adding Apple/Google Pay above fold increases mobile CVR by 10%', impact: 4, confidence: 4, ease: 4 },
     { id: 'urgency-copy', hypothesis: 'Adding "X left in stock" copy increases PDP-to-ATC rate', impact: 3, confidence: 3, ease: 5 },
   ];
   ```

## Examples

### Measure the revenue impact of a CRO fix

Before implementing any change, calculate the expected revenue lift to justify prioritization:

```typescript
function estimateRevenueImpact(params: {
  monthlyVisitors: number;
  currentCVR: number;         // e.g., 0.025 for 2.5%
  expectedCVRLift: number;    // e.g., 0.003 for +0.3pp
  avgOrderValue: number;
}) {
  const { monthlyVisitors, currentCVR, expectedCVRLift, avgOrderValue } = params;
  const currentRevenue = monthlyVisitors * currentCVR * avgOrderValue;
  const newRevenue = monthlyVisitors * (currentCVR + expectedCVRLift) * avgOrderValue;
  const monthlyLift = newRevenue - currentRevenue;

  return {
    currentRevenue: currentRevenue.toFixed(2),
    newRevenue: newRevenue.toFixed(2),
    monthlyLift: monthlyLift.toFixed(2),
    annualLift: (monthlyLift * 12).toFixed(2),
  };
}

// Example: 100k visitors/month, 2.5% CVR, +0.3pp lift, $65 AOV
// → $23,400 additional monthly revenue
```

### Checkout field error instrumentation

Track which form fields cause the most validation errors to prioritize UX fixes:

```typescript
const fieldErrorCounts: Record<string, number> = {};

document.querySelectorAll<HTMLFormElement>('form').forEach((form) => {
  form.addEventListener('invalid', (e) => {
    const field = e.target as HTMLInputElement;
    fieldErrorCounts[field.name] = (fieldErrorCounts[field.name] ?? 0) + 1;
    fetch('/api/analytics/field-error', {
      method: 'POST',
      body: JSON.stringify({ fieldName: field.name, errorType: field.validity }),
    });
  }, true);
});
```

## Best Practices

- **Fix drop-off at the worst-performing step first** — always optimize the highest-volume drop-off before moving to smaller steps
- **Enable guest checkout** — forcing account creation before purchase remains the #1 checkout abandonment cause; 35% of users abandon rather than register
- **Surface trust signals near the payment form** — SSL badge, return policy, and accepted card logos at the point of highest anxiety
- **Use real-time inline validation** — tell users about errors as they fill each field, not after form submission
- **Minimize form fields** — each additional required field reduces conversion; use address autocomplete (Google Places) to fill multiple fields from one input
- **Add express payment methods above the fold** — Apple Pay, Google Pay, and PayPal reduce checkout time from 2 minutes to 15 seconds on mobile
- **Never run more than 3 experiments simultaneously** — overlapping tests contaminate results unless using a proper orthogonal experimental design
- **Set a minimum detectable effect before running a test** — running tests without a pre-calculated sample size leads to early stopping and false positives

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| A/B test shows conflicting results week over week | Use a fixed experiment duration based on statistical power calculation, not "when it looks significant" |
| High cart-to-checkout rate but low checkout completion | The drop-off is inside checkout — instrument each checkout step individually to pinpoint the failing step |
| CRO changes improve CVR but reduce AOV | Track revenue per visitor, not just CVR; sometimes a higher-pressure checkout reduces basket size |
| Heatmaps show rage clicks on non-clickable elements | Make these elements interactive or remove the visual affordance suggesting they are clickable |
| Funnel metrics inconsistent between GA4 and internal DB | Use server-side order count as ground truth; GA4 can miss orders due to ad blockers and script errors |

## Related Skills

- @ab-testing-ecommerce
- @cart-abandonment-recovery
- @exit-intent-popups
- @product-analytics
- @attribution-modeling
