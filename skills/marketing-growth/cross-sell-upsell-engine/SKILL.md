---
name: cross-sell-upsell-engine
description: "Recommend complementary and premium products at checkout, in cart, and post-purchase using purchase patterns, browsing history, and margin optimization"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [cross-sell, upsell, recommendations, aov]
triggers: ["increase average order value", "add product recommendations", "cross-sell", "upsell", "frequently bought together"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Cross-Sell and Upsell Engine

## Overview

Cross-sells and upsells generate 10–30% incremental revenue with minimal customer acquisition cost. Every major e-commerce platform has apps that handle the recommendation logic without custom code. The key decisions are: which placement to start with (PDP, cart, or post-purchase), what recommendation logic to use (manual bundles vs. algorithm-based), and how to avoid checkout friction. Start with one placement and measure before expanding.

## When to Use This Skill

- When average order value (AOV) is below industry benchmarks and you want to grow it without paid traffic
- When launching a new recommendation widget on PDP, cart, or checkout pages
- When replacing a generic "You may also like" carousel with affinity-based personalization
- When building a bundle builder or "complete the look" feature
- When wanting to A/B test recommendation placements

## Core Instructions

### Step 1: Choose the right tool for your platform

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Rebuy (most powerful) or Frequently Bought Together | Rebuy uses AI-based recommendations with multiple placement types; FBT is simpler and cheaper for basic "people also bought" |
| **Shopify (Plus)** | Rebuy + Shopify Functions | Shopify Functions allows custom cart transforms for bundle discounts |
| **WooCommerce** | WooCommerce built-in cross-sell/upsell + YITH WooCommerce Frequently Bought Together | WooCommerce has native upsell and cross-sell fields on every product; YITH adds the "FBT" widget |
| **BigCommerce** | Also Bought or Boost Commerce (App Marketplace) | Both integrate natively with BigCommerce product catalog |
| **Custom / Headless** | Rebuy API or Recombee | Both offer recommendation APIs; Rebuy integrates directly with Shopify/BigCommerce backends |

### Step 2: Decide on placement — start with one

| Placement | Expected AOV Lift | Conversion Risk | Start Here? |
|-----------|------------------|-----------------|-------------|
| Product page (below Add to Cart) | Moderate | Low | Yes — best starting point |
| Cart page (sidebar or bottom) | High | Low | Yes — high intent, low friction |
| Post-purchase page | High | None (order already placed) | Yes — zero risk to conversion |
| Checkout page | High | Medium-High | No — test this last; can hurt CVR |

**Recommendation**: start with product page + cart page. Add post-purchase after measuring results. Only add checkout recommendations if you have data showing they lift revenue without hurting CVR.

### Step 3: Set up recommendations on your platform

---

#### Shopify

**Using Rebuy (recommended for full-featured setup):**

1. Install Rebuy from the Shopify App Store
2. Go to **Rebuy → Smart Cart** to enable AI-powered cart recommendations — configure the number of products to show (2–3) and placement (cart drawer or cart page)
3. Go to **Rebuy → Product Page Widgets** to add a "Frequently Bought Together" widget below the Add to Cart button
4. Go to **Rebuy → Post-Purchase Offers** to add a one-click upsell on the order confirmation page
5. Rebuy uses Shopify's order history to compute co-purchase affinity automatically — no manual configuration needed
6. To create manual bundles: go to **Rebuy → Data Sources → Manual Recommendations** and pair specific products

**Using Frequently Bought Together (simpler, cheaper):**

1. Install from the Shopify App Store
2. The app automatically analyzes order history to suggest product pairs
3. Review auto-generated bundles under **FBT → Bundles** and remove irrelevant pairs
4. Configure the widget appearance to match your theme
5. Set a bundle discount (optional) — 5–10% off when both products are added together

**For post-purchase upsells on Shopify:**
- Use **ReConvert** or **CartHook** for post-purchase one-click upsell pages
- These show immediately after checkout is completed but before the thank-you page

---

#### WooCommerce

**Using WooCommerce native cross-sells and upsells:**

1. Go to **WooCommerce → Products → [Edit any product]**
2. In the **Linked Products** tab, add:
   - **Upsells**: products to show on the product page as "You may also like" (higher-priced alternatives)
   - **Cross-sells**: products to show in the cart sidebar
3. WooCommerce shows cross-sells in the cart automatically — no additional plugin needed

**Using YITH WooCommerce Frequently Bought Together (free version available):**

1. Install from the WordPress plugin directory
2. Go to **YITH → Frequently Bought Together → General Settings** and configure the widget title and discount amount
3. On each product's edit page, go to the **FBT** tab and manually select companion products, or enable auto-recommendations
4. The widget appears below the Add to Cart button automatically

**For post-purchase upsells on WooCommerce:**
- Use **CartFlows** + **AutomateWoo** for post-purchase funnel pages
- Or use **WooFunnels / FunnelKit** which includes post-purchase upsell flows

---

#### BigCommerce

1. Install **Also Bought** from the BigCommerce App Marketplace
2. The app analyzes your order history and automatically generates "Customers Also Bought" recommendations
3. Configure placement (product page, cart page) and number of products shown in the app settings
4. For manual control: go to the product editor in BigCommerce Admin and use the **Related Products** feature to manually specify related items

---

#### Custom / Headless

Use Rebuy's API or Recombee for headless storefronts:

**Rebuy API (if your backend is Shopify/BigCommerce):**
```typescript
// Fetch recommendations from Rebuy for a given product
const response = await fetch(
  `https://rebuyengine.com/api/v1/products/recommended?key=${REBUY_API_KEY}&shopify_product_ids=${productId}&limit=4`
);
const { data } = await response.json();
```

**Build co-purchase recommendations from order data (only if no third-party tool):**
```typescript
// Compute product affinity from co-purchase frequency
// Run nightly — minimum 1,000 orders for meaningful signal
async function computeProductAffinity() {
  const orders = await db.orders.findAll({ where: { status: 'completed' }, include: ['lineItems'] });

  const coMatrix: Record<string, Record<string, number>> = {};
  for (const order of orders) {
    const productIds = [...new Set(order.lineItems.map((li: any) => li.productId))];
    for (let i = 0; i < productIds.length; i++) {
      for (let j = i + 1; j < productIds.length; j++) {
        const [a, b] = [productIds[i], productIds[j]].sort();
        coMatrix[a] = coMatrix[a] ?? {};
        coMatrix[a][b] = (coMatrix[a][b] ?? 0) + 1;
      }
    }
  }
  // Store results and filter to pairs with at least 3 co-purchases
  // Serve from a cached API endpoint with 1-hour TTL
}
```

### Step 4: Configure pricing and discount strategy

- **Bundle discounts**: 5–10% off when both products are added together — enough to motivate, not enough to erode margin
- **Upsell price range**: show upsells priced 10–50% above the current product; upsells above 2× the original price rarely convert
- **Checkout recommendations**: limit to 1–2 low-cost add-ons (under $30) — multiple recommendations at checkout increase abandonment
- **Post-purchase offers**: these can be higher-priced since the customer is already in a buying mindset

### Step 5: Measure results

Track these metrics weekly in your recommendation app's analytics:

| Metric | Target | Where to Find |
|--------|--------|---------------|
| Recommendation CTR | 8–15% (PDP), 15–25% (cart) | Rebuy → Analytics, FBT → Reports |
| Orders with recommended item added | 5–15% of all orders | App dashboard → Attach rate |
| AOV lift from recommendations | $5–$20 depending on catalog | Compare AOV of orders with/without recommendation clicks |

## Best Practices

- **Exclude out-of-stock items from recommendations** — always — nothing is more frustrating than clicking a recommendation that is unavailable (Rebuy and most apps handle this automatically)
- **Start with 3–4 recommendations max** — showing more products creates decision paralysis and reduces CTR
- **Manual overrides for new products** — new SKUs have no purchase history; manually configure them as recommended alongside bestsellers for the first 30 days (all major apps have manual override)
- **Refresh auto-recommendations after seasonal changes** — purchasing patterns shift; review recommendations quarterly
- **Track recommendation attribution separately** — tag orders where a recommended item was added so you can measure true incremental AOV

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Checkout recommendations increase cart abandonment | A/B test before enabling; limit to 1 low-cost item under $30; remove if test shows negative impact |
| Recommendations show the same product being viewed | Exclude the current product from recommendations (most apps do this automatically; verify in settings) |
| Cold start — no recommendations for new products | Add manual recommendations in your app's admin panel; pair new products with bestsellers |
| Recommendations irrelevant (e.g., suggest a phone case with a t-shirt) | Review auto-generated recommendations and block irrelevant pairs using the "block" feature in your app |
| Bundle discount codes being shared publicly | Use your app's built-in auto-apply discount (no code to share) rather than coupon codes |

## Related Skills

- @predictive-personalization
- @customer-retention-engine
- @conversion-rate-optimization
- @loyalty-program-optimization
- @email-marketing-automation
