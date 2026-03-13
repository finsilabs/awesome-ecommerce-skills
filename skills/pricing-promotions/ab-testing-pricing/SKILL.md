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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# A/B Testing Pricing

## Overview

Price A/B testing lets you run controlled experiments — showing one price to a segment of visitors and a different price to another — before committing to a permanent change. This is one of the highest-leverage optimizations available, but also one of the riskiest: a poorly executed test destroys customer trust and produces misleading data. Most platforms do not have native price A/B testing, so this requires either a dedicated app or a custom implementation. This skill walks you through setting up price experiments correctly on each major platform.

## When to Use This Skill

- When you need data-driven evidence for a price change before rolling it out site-wide
- When testing price sensitivity across different customer segments or product categories
- When evaluating the revenue impact of a new pricing model (e.g., switching from $49.99 to $45.00)
- When running multiple concurrent price experiments on different products without interference
- When regulatory or ethical requirements demand that price tests are documented, time-limited, and reversible

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right approach

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Intelligems or Neat A/B Testing app | Native Shopify apps that handle price variant assignment, session stickiness, and statistical reporting without custom code |
| **Shopify Plus** | Intelligems + Shopify Functions | Shopify Functions allow server-side price overrides — the most reliable approach on Plus |
| **WooCommerce** | Nelio A/B Testing plugin or Split Hero | WordPress-native experiment plugins with WooCommerce price testing support |
| **BigCommerce** | Intelligems (supports BigCommerce) or Google Optimize alternatives | BigCommerce's Price Lists API can set variant-specific prices per customer segment |
| **Custom / Headless** | Build with your own session bucketing + platform pricing API | Full control but requires custom statistical tracking |

### Step 2: Design the experiment

Before setting up any tool, define these parameters:

1. **Hypothesis** — "Reducing the price from $49.99 to $44.99 will increase revenue per visitor by more than 5%"
2. **Primary metric** — Revenue per visitor (RPV), not just conversion rate. A lower price converts better but may earn less per order
3. **Traffic split** — 50/50 is standard; never run more than 2 variants simultaneously on the same product
4. **Minimum duration** — At least 7 days to capture weekday/weekend variation; ideally 14 days
5. **Minimum sample size** — Calculate using a significance calculator (use [abtestguide.com](https://abtestguide.com/abtestsize/)). Aim for at least 100 conversions per variant before declaring a winner
6. **Exclusion rules** — Existing customers who paid the old price should not be shown the new price mid-experiment

### Step 3: Platform-specific setup

---

#### Shopify

**Option A: Intelligems (recommended for most merchants)**

Intelligems is the leading Shopify app for price testing. It handles session stickiness, statistical significance, and integrates with Shopify's checkout natively.

1. Install Intelligems from the Shopify App Store
2. Go to **Intelligems → Tests → New Price Test**
3. Select the product(s) to test
4. Set your variant prices (e.g., $49.99 vs $44.99)
5. Set traffic split (50/50 recommended)
6. Set a start date and estimated end date based on your sample size calculator
7. Intelligems assigns visitors to variants via a persistent cookie and reports RPV, conversion rate, and statistical significance in their dashboard

Key settings to configure:
- **Sticky bucketing** — ensure the same visitor always sees the same price (enabled by default)
- **Returning customer exclusion** — under **Advanced Settings**, exclude customers who have previously purchased the product at the original price
- **Minimum detectable effect** — set to the minimum revenue change that would justify the price change (e.g., 5%)

**Option B: Neat A/B Testing**

A lighter-weight alternative if you only need simple price split tests:
1. Install Neat A/B Testing from the App Store
2. Create a test targeting a specific product or collection
3. Set the price variant and traffic split
4. Monitor results in the Neat dashboard

**Option C: Shopify Plus — Shopify Functions (advanced)**

For Plus merchants who need full control:
1. Create a Shopify Function (Discount Function type)
2. The function receives cart context and customer ID
3. Use deterministic hashing on the customer/session ID to assign to a variant
4. Apply a fixed-amount or percentage discount equal to the price difference
5. Track conversions via Shopify's order webhook + a custom analytics store

---

#### WooCommerce

**Option A: Nelio A/B Testing plugin**

1. Install Nelio A/B Testing from the WordPress plugin directory
2. Go to **Nelio A/B Testing → Add New Experiment → WooCommerce Product Experiment**
3. Select the product and set the alternative price
4. Configure the conversion goal (purchase of that product)
5. The plugin tracks sessions and reports conversion rates with statistical significance

**Option B: Manual with Google Optimize (sunsetted) replacements**

Since Google Optimize was discontinued in 2023, consider:
- **VWO (Visual Website Optimizer)** — supports WooCommerce price testing via JavaScript
- **AB Tasty** — enterprise-grade with WooCommerce native integration
- **Convert.com** — WooCommerce-compatible with server-side testing support

**Important WooCommerce note**: Client-side price changes (JavaScript-based) are cosmetic only — they do not change the actual checkout price. Always ensure your A/B testing tool changes the price at the WooCommerce product level or through the `woocommerce_get_price` filter, not just the displayed number.

---

#### BigCommerce

1. Use BigCommerce's **Price Lists** feature (available on Plus and above):
   - Go to **Products → Price Lists → Add Price List**
   - Create a price list for your "treatment" price
   - Assign the price list to a specific customer group
2. Split customers into control/treatment groups by assigning them to the customer group
3. Track conversions using BigCommerce's built-in analytics or Google Analytics with custom dimensions

Alternatively, use **Intelligems for BigCommerce** which manages the visitor bucketing automatically.

---

#### Custom / Headless

For headless storefronts, you need to implement session bucketing, price resolution, and conversion tracking:

```typescript
import crypto from 'crypto';

// Deterministic variant assignment by session ID
function assignVariant(
  experimentId: string,
  sessionId: string,
  variants: { id: string; weight: number }[]  // weights must sum to 100
): string {
  const hash = parseInt(
    crypto.createHash('sha256')
      .update(`${experimentId}:${sessionId}`)
      .digest('hex')
      .slice(0, 8),
    16
  ) % 100;

  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (hash < cumulative) return variant.id;
  }
  return variants[variants.length - 1].id;
}

// Usage: get the price for a visitor
const variantId = assignVariant('exp_price_widget_pro', sessionId, [
  { id: 'control',   weight: 50 },  // $49.99
  { id: 'treatment', weight: 50 },  // $44.99
]);

const prices = { control: 4999, treatment: 4499 };  // cents
const priceForVisitor = prices[variantId];
```

Track conversions and calculate statistical significance:

```typescript
// Two-proportion z-test for statistical significance
function zTest(
  controlConversions: number,
  controlVisitors: number,
  treatmentConversions: number,
  treatmentVisitors: number
): { pValue: number; significant: boolean } {
  const p1 = controlConversions / controlVisitors;
  const p2 = treatmentConversions / treatmentVisitors;
  const pPooled = (controlConversions + treatmentConversions) / (controlVisitors + treatmentVisitors);
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / controlVisitors + 1 / treatmentVisitors));
  if (se === 0) return { pValue: 1, significant: false };
  const z = Math.abs((p2 - p1) / se);
  // Approximate p-value (two-tailed)
  const pValue = 2 * (1 - normalCDF(z));
  return { pValue, significant: pValue < 0.05 };
}
```

Use your platform's pricing API (Shopify Admin API, BigCommerce Catalog API) to push price updates once a winner is declared.

### Step 4: Monitor and conclude the experiment

Track these metrics during the experiment:

| Metric | Where to find it |
|--------|-----------------|
| Revenue per visitor (RPV) | Intelligems dashboard; or calculate from your orders data |
| Conversion rate by variant | Your A/B tool's analytics |
| Statistical significance (p-value) | Your A/B tool; aim for p < 0.05 |
| Sample size per variant | Ensure you hit your pre-calculated minimum before concluding |

**Declare a winner only when:**
- You have reached the pre-calculated minimum sample size (not before)
- The p-value is below 0.05
- The experiment has run for at least 7 days

After declaring a winner, update the product price permanently and end the experiment.

## Best Practices

- **Use Revenue Per Visitor (RPV), not just conversion rate** — a lower price may convert better but generate less revenue; RPV captures the full picture
- **Require sticky bucketing** — once a session is assigned to a variant, always show the same price; inconsistent prices destroy trust and distort results
- **Pre-register your minimum sample size** — decide before the experiment starts how many conversions you need; stopping as soon as p < 0.05 (peeking) inflates false positive rates
- **Exclude existing customers** — showing an existing customer a price lower than what they paid triggers complaints and churn
- **Run only one experiment per product at a time** — overlapping experiments on the same product create interaction effects that make results uninterpretable
- **Pause experiments during promotions** — site-wide sales or marketing campaigns confound price experiment results
- **Log the variant assignment on every order** — store the variant ID in the order metadata so you can later audit revenue attribution

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Visitor sees different price on refresh | Ensure your A/B tool uses persistent cookies or server-side session storage for bucketing |
| Peeking — stopping at first p < 0.05 | Pre-register a minimum conversion count (e.g., 200 per variant) and only check significance after reaching it |
| Price change only affects the product page, not checkout | Ensure the test tool changes the actual price, not just a displayed number — verify in the cart and checkout |
| Bots inflate visitor counts and skew results | Filter bot traffic before recording impressions; most A/B tools have bot filtering built in |
| Experiment runs during a flash sale | Pause all price experiments during site-wide promotions |

## Related Skills

- @dynamic-pricing
- @price-rules-engine
- @coupon-management
- @discount-engine
- @demand-forecasting
