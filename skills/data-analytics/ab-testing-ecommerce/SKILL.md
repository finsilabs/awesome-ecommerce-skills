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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# A/B Testing for E-commerce

## Overview

A/B testing (split testing) runs controlled experiments where a random subset of visitors sees a variant while the rest see the control. Statistical analysis then determines whether any difference is real or due to chance. Good testing disciplines — calculating required sample size before starting, running tests for at least two full weeks, and never stopping early — separate genuine insights from noise.

This skill guides you through running A/B tests on your specific platform, choosing the right tools, and interpreting results correctly.

## When to Use This Skill

- When making product page, checkout, or pricing changes and wanting data-driven validation
- When migrating from a client-side A/B testing tool to server-side assignment for accuracy
- When needing statistical power calculations before starting an experiment
- When analyzing experiment results and determining when to ship or kill a variant
- When running a pricing test and needing to ensure consistent pricing per customer
- When wanting to understand what sample size is needed before a test is meaningful

## Core Instructions

### Step 1: Determine your platform and choose the right testing tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Google Optimize (free, sunsetting) → **Convert.com** or **Intelligems** | Intelligems is built specifically for Shopify and supports pricing tests with sticky assignment; Convert integrates via Shopify's theme |
| **Shopify** (pricing tests) | **Intelligems** | The only tool that does true server-side price testing on Shopify without flickering |
| **WooCommerce** | **Nelio A/B Testing** plugin or **Google Optimize** | Nelio integrates natively with WordPress/WooCommerce; tracks WooCommerce conversion events automatically |
| **BigCommerce** | **Convert.com** or **VWO** (via script injection) | Both integrate via the BigCommerce storefront script manager |
| **Custom / Headless** | **LaunchDarkly** (feature flags + experiments) or build with **GrowthBook** (open source) | Server-side assignment with no flickering; GrowthBook is free and self-hostable |

### Step 2: Calculate required sample size before launching

Never launch a test without knowing how many visitors each variant needs. Running a test without a pre-determined stopping rule leads to peeking and false positives.

Use the free calculator at [https://www.evanmiller.org/ab-testing/sample-size.html](https://www.evanmiller.org/ab-testing/sample-size.html) or follow this guide:

- **Baseline conversion rate:** Pull your current CVR from your platform analytics (last 30 days)
- **Minimum detectable effect:** The smallest lift you care about detecting (typically 0.3–1 percentage point)
- **Statistical power:** 80% is standard
- **Significance level:** 95% confidence (alpha = 0.05)

**Example:** A Shopify store with 2.5% CVR wanting to detect a 0.3pp lift needs approximately 8,600 sessions per variant. At 500 sessions/day, that is 17 days per variant minimum.

Write down the required sample size before the test starts. This is your mandatory stopping rule.

### Step 3: Set up the experiment on your platform

---

#### Shopify

**Option A: Theme-based tests with Convert.com**

1. Install Convert.com and add the tracking script via **Online Store → Themes → Edit code → theme.liquid**
2. In Convert.com, go to **Experiences → Create Experience → A/B Test**
3. Use the visual editor to create your variant (change button color, headline, layout)
4. Set goals: **Add to Cart** or **Purchase** (Convert tracks Shopify purchase events automatically)
5. Set traffic allocation (50/50 for most tests)
6. Set the **minimum sample size** you calculated as the stopping condition

**Option B: Pricing tests with Intelligems**

1. Install **Intelligems** from the Shopify App Store
2. Go to **Intelligems → Price Tests → New Test**
3. Select the product(s) to test and set variant prices
4. Intelligems handles sticky assignment server-side — the same customer always sees the same price
5. Set the test duration to your pre-calculated sample size
6. Review results in Intelligems' dashboard: it shows revenue per visitor (not just CVR) as the primary metric

**For Shopify checkout tests (Shopify Plus only):**
- Use **Checkout Extensibility** or **Shopify Functions** to create checkout variants
- Shopify's built-in A/B testing via **Checkout profiles** is available on Plus

---

#### WooCommerce

**Using Nelio A/B Testing (recommended)**

1. Install **Nelio A/B Testing** from the WordPress plugin directory
2. Go to **Nelio A/B Testing → Add New Test**
3. Choose the test type:
   - **Page Test:** Test different landing page or product page variants
   - **WooCommerce Test:** Test product pricing, descriptions, or images
   - **Headline Test:** Test page titles or CTAs
4. Set your goal to **WooCommerce Order** (conversion event)
5. Nelio tracks statistical significance in real time — do not stop early just because significance is reached; wait for your pre-calculated sample size
6. View results at **Nelio A/B Testing → Results**

**Alternative: Google Optimize (free, requires Google Analytics 4)**
1. Create a Google Optimize account and link it to your GA4 property
2. Add the Optimize container ID to your WordPress site via **MonsterInsights** plugin (simplest method) or manually in the `<head>`
3. Create an A/B test in Optimize pointing to your WooCommerce product or checkout URLs
4. Set objectives using GA4 events (e.g., `purchase`)

---

#### BigCommerce

1. Go to **Storefront → Script Manager → Create a Script**
2. Add your A/B testing tool script (Convert.com, VWO, or Optimizely) with placement **Head** and **All pages**
3. In your testing tool, create an experiment targeting your BigCommerce product or category page URL
4. Set the conversion goal to track the order confirmation page URL (`/order-confirmation`)
5. BigCommerce also has built-in **Multivariate Testing** under **Marketing → Banner Manager** for banner-level tests (limited to visual banner content)

---

#### Custom / Headless

For headless storefronts, use server-side assignment to avoid flickering and to support pricing tests:

**Using GrowthBook (open source, recommended)**

1. Install GrowthBook: `npm install @growthbook/growthbook`
2. Initialize on the server side with your user ID for sticky assignment:

```typescript
import { GrowthBook } from "@growthbook/growthbook";

const gb = new GrowthBook({
  apiHost: "https://cdn.growthbook.io",
  clientKey: process.env.GROWTHBOOK_CLIENT_KEY,
  attributes: {
    id: userId, // stable user ID for consistent assignment
    loggedIn: !!customerId,
  },
});

await gb.loadFeatures();

// Assign variant — deterministic for the same userId
const checkoutButtonVariant = gb.getFeatureValue("checkout-button-color", "blue");
```

3. Track exposures and conversions back to GrowthBook:

```typescript
gb.setTrackingCallback((experiment, result) => {
  analytics.track("Experiment Viewed", {
    experimentId: experiment.key,
    variationId: result.key,
  });
});

// On order completion:
analytics.track("Purchase", { revenue: order.total });
```

4. View statistical results in the GrowthBook UI — it runs Bayesian or frequentist significance tests on your data

### Step 4: Interpret results correctly

When reviewing results:

1. **Wait for the pre-calculated sample size** — do not stop because it "looks significant"
2. **Check revenue per visitor, not just CVR** — a checkout test might increase CVR but decrease AOV; measure both
3. **Run for at least 2 full weeks** — day-of-week effects distort 7-day tests
4. **Look at guardrail metrics** — even if your primary metric improved, check return rates and customer service ticket volume

| Metric | What to Check |
|--------|--------------|
| Primary | Revenue per visitor (not CVR alone) |
| Guardrail | Return rate (variant should not increase returns) |
| Guardrail | Cart abandonment rate |
| Confidence | p < 0.05 AND minimum sample size reached |

## Best Practices

- **Calculate sample size before starting** — running until it "looks significant" is p-hacking; use the pre-calculated size as your stopping rule
- **Use server-side assignment for pricing tests** — client-side tools create flickering and can show different prices on page reload, which is a legal and UX risk
- **Never run more than 3–4 experiments on the same page simultaneously** — interaction effects between experiments contaminate all results
- **Exclude internal team traffic** — add your office IP to an exclusion list in your testing tool to prevent internal browsing from polluting results
- **Document the hypothesis before starting** — write down what you expect to happen and why; post-hoc hypothesis generation leads to confirmation bias
- **Run experiments for at least 2 full business weeks** — account for day-of-week and weekend shopping pattern differences

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Test ends early because it "looks significant" — then the lift disappears | Use pre-calculated sample size as a mandatory stopping rule; configure your testing tool to lock results until sample size is reached |
| Same user sees different variants on different sessions | Use server-side assignment keyed on a stable user ID (not session ID); Intelligems and GrowthBook handle this correctly by default |
| Checkout test shows lift in CVR but drop in AOV | Always measure revenue per visitor as your primary metric; CVR and AOV can move in opposite directions |
| Price flickering on Shopify pricing tests | Use Intelligems instead of client-side tools — it assigns prices server-side before the page renders |
| Novelty effect inflates variant results in the first week | Report results with and without the first 3 days of data; a large week-1 spike that fades is usually novelty |

## Related Skills

- @conversion-rate-optimization
- @product-analytics
- @customer-analytics
- @sales-reporting-dashboard
- @attribution-modeling
