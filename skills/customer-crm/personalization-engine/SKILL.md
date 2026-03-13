---
name: personalization-engine
description: "Show each shopper personalized product recommendations using platform apps and recommendation tools based on browsing history and purchase patterns"
category: customer-crm
risk: safe
source: curated
date_added: "2026-03-12"
tags: [personalization, recommendations, collaborative-filtering, browsing-history, machine-learning, product-recommendations, similar-products]
triggers: ["product recommendations", "personalization engine", "collaborative filtering", "recommendation algorithm", "frequently bought together", "similar products", "you might also like"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Personalization Engine

## Overview

Personalized product recommendations increase average order value and session depth by surfacing the most relevant products for each customer. "Frequently Bought Together", "You Might Also Like", and personalized homepage sections are all forms of recommendation. Every major platform has apps that handle collaborative filtering and recommendation algorithms without custom code. Only build a custom recommendation engine if your catalog size, traffic volume, or recommendation logic exceeds what app-based solutions support.

## When to Use This Skill

- When adding "Frequently Bought Together" or "You Might Also Like" carousels to product pages
- When implementing a personalized homepage for returning customers
- When building a recommendation API for a mobile app or headless storefront
- When cold-start recommendations (no history) are returning irrelevant products
- When A/B testing the impact of personalization on AOV and revenue per session

## Core Instructions

### Step 1: Determine platform and choose the right recommendation tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | LimeSpot or Frequently Bought Together by Code Black Belt | LimeSpot provides personalized homepage, PDP, cart, and post-purchase recommendations powered by ML; Frequently Bought Together is purpose-built for the PDP |
| **WooCommerce** | YITH WooCommerce Frequently Bought Together or LimeSpot | YITH is the most popular; LimeSpot supports WooCommerce with ML-based recommendations |
| **BigCommerce** | LimeSpot or Boost AI Search & Discovery | Both provide personalized recommendations and are available on the BigCommerce App Marketplace |
| **Custom / Headless** | Build with co-purchase matrix + cosine similarity | Required for full control over algorithm, exclusion logic, and API response format |

---

### Step 2: Platform-specific setup

---

#### Shopify

**Option A: LimeSpot (recommended — full personalization suite)**

1. Install **LimeSpot Personalizer** from the Shopify App Store
2. LimeSpot automatically analyzes your order history and browsing data to build recommendation models
3. Configure placement for recommendation widgets:
   - Go to **LimeSpot → Recommendations → Configure placements**
   - Enable: PDP ("Frequently Bought Together"), Cart ("Customers also bought"), Homepage ("Recommended for you")
4. Choose the recommendation algorithm per placement:
   - **Frequently Bought Together**: item-item collaborative filtering (based on order co-occurrence)
   - **Recommended for You**: user-item collaborative filtering (based on browsing history)
   - **Similar Products**: content-based filtering (same category, similar price, similar attributes)
5. Configure exclusions: always exclude out-of-stock items, recently purchased items

**Option B: Frequently Bought Together by Code Black Belt (PDP-focused)**

1. Install from the App Store
2. The app analyzes your past orders and automatically identifies which products are most often purchased together
3. Displays a "Frequently Bought Together" section on the PDP with a bundle discount option
4. No manual configuration required — the model refreshes automatically from order data

**Testing and measuring:**
- In LimeSpot: go to **Analytics → A/B Tests** to compare recommendation algorithms
- Track click-through rate and add-to-cart rate per recommendation slot
- Run each test for at least 2 weeks with sufficient traffic before concluding

---

#### WooCommerce

**YITH WooCommerce Frequently Bought Together (free/premium):**

1. Install from the WordPress plugin directory
2. Go to **YITH → Frequently Bought Together → Settings**
3. Choose recommendation method: automatic (from order history) or manual (specify products per item)
4. Configure the display (position on PDP, number of products to show, discount type if any)
5. The free version supports manual product assignment; the premium version uses order history to generate automatic suggestions

**LimeSpot for WooCommerce:**
1. Install **LimeSpot Personalizer for WooCommerce**
2. Configuration is the same as the Shopify version — provides full homepage, PDP, and cart recommendations

**WooCommerce built-in cross-sells and upsells:**
- On any product, go to **Linked Products tab**
- Manually add upsell products (shown on PDP) and cross-sell products (shown in cart)
- This is manual but effective for small catalogs where you know the relationships well

---

#### BigCommerce

**LimeSpot for BigCommerce:**
1. Install from the BigCommerce App Marketplace
2. Same configuration and capabilities as the Shopify/WooCommerce version

**Boost AI Search & Discovery:**
1. Install from the App Marketplace
2. Includes recommendation widgets alongside search features
3. Configure "Frequently Bought Together" and "Similar Products" sections

---

#### Custom / Headless

For headless storefronts, build a recommendation pipeline with pre-computed similarity matrices for fast responses:

```typescript
// lib/recommendations.ts

// Step 1: Pre-compute co-purchase matrix nightly (run as a cron job)
// PostgreSQL: count how often each product pair appears in the same order
export const coPurchaseMatrixSQL = `
  INSERT INTO product_co_purchases (product_a_id, product_b_id, co_purchase_count, updated_at)
  SELECT
    a.product_id AS product_a_id,
    b.product_id AS product_b_id,
    COUNT(DISTINCT a.order_id) AS co_purchase_count,
    NOW() AS updated_at
  FROM order_items a
  JOIN order_items b ON a.order_id = b.order_id AND a.product_id < b.product_id
  GROUP BY a.product_id, b.product_id
  HAVING COUNT(DISTINCT a.order_id) >= 3  -- Minimum confidence threshold
  ON CONFLICT (product_a_id, product_b_id)
  DO UPDATE SET co_purchase_count = EXCLUDED.co_purchase_count, updated_at = NOW();
`;

// Step 2: Serve "Frequently Bought Together" from the pre-computed matrix
export async function getFrequentlyBoughtTogether(
  productId: string, limit = 6, excludeProductIds: string[] = []
): Promise<Product[]> {
  const pairs = await db.productCoPurchases.findMany({
    where: {
      OR: [{ productAId: productId }, { productBId: productId }],
      NOT: { OR: [{ productAId: { in: excludeProductIds } }, { productBId: { in: excludeProductIds } }] },
    },
    orderBy: { coPurchaseCount: 'desc' },
    take: limit * 2, // Fetch extra to filter out-of-stock
  });

  const relatedIds = pairs.map(p => p.productAId === productId ? p.productBId : p.productAId);
  const products = await db.products.findMany({ where: { id: { in: relatedIds }, status: 'active', inventoryQuantity: { gt: 0 } } });
  return products.slice(0, limit);
}

// Step 3: Browsing history recommendations using product vectors
function buildProductVector(product: Product, allCategoryIds: string[], allTags: string[]): number[] {
  const categoryEncoding = allCategoryIds.map(id => product.categoryId === id ? 1 : 0);
  const priceNormalized = product.priceInCents / 100000;  // Normalize to 0-1
  const tagEncoding = allTags.map(tag => product.tags.includes(tag) ? 1 : 0);
  return [...categoryEncoding, priceNormalized, ...tagEncoding];
}

export async function getRecommendationsFromBrowsingHistory(
  sessionProductIds: string[], limit = 8
): Promise<Product[]> {
  if (sessionProductIds.length === 0) return getBestSellers(limit);

  const [browsedProducts, allProducts, allCategoryIds, allTags] = await Promise.all([
    db.products.findMany({ where: { id: { in: sessionProductIds } } }),
    db.products.findMany({ where: { status: 'active', inventoryQuantity: { gt: 0 }, id: { notIn: sessionProductIds } }, take: 500 }),
    db.categories.findMany({ select: { id: true } }).then(cats => cats.map(c => c.id)),
    db.productTags.findMany({ distinct: ['tag'] }).then(tags => tags.map(t => t.tag)),
  ]);

  // Build "taste vector" by averaging vectors of browsed products
  const vectors = browsedProducts.map(p => buildProductVector(p, allCategoryIds, allTags));
  const tasteVector = vectors[0].map((_, i) => vectors.reduce((sum, v) => sum + v[i], 0) / vectors.length);

  // Rank all products by cosine similarity to taste vector
  const ranked = allProducts
    .map(p => {
      const vec = buildProductVector(p, allCategoryIds, allTags);
      const dot = tasteVector.reduce((sum, val, i) => sum + val * vec[i], 0);
      const mag = Math.sqrt(tasteVector.reduce((s, v) => s + v * v, 0)) * Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
      return { product: p, score: mag > 0 ? dot / mag : 0 };
    })
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, limit).map(r => r.product);
}

// Step 4: Unified recommendation API with caching
export async function getRecommendations(context: 'pdp' | 'homepage' | 'cart', productId?: string, sessionProductIds: string[] = []) {
  const cacheKey = `recs:${context}:${productId ?? 'none'}:${sessionProductIds.slice(0, 3).join('-')}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  let products: Product[];
  switch (context) {
    case 'pdp':
      products = await getFrequentlyBoughtTogether(productId!, 6, [productId!]);
      if (products.length < 4) {
        const extra = await getRecommendationsFromBrowsingHistory(sessionProductIds, 4 - products.length);
        products = [...products, ...extra];
      }
      break;
    case 'homepage':
      products = sessionProductIds.length > 0
        ? await getRecommendationsFromBrowsingHistory(sessionProductIds, 12)
        : await getBestSellers(12);
      break;
    default:
      products = await getBestSellers(8);
  }

  await redis.setex(cacheKey, 300, JSON.stringify(products));  // 5-minute cache
  return products;
}
```

**For stores with 10k+ customers:** Use the BG/NBD + ALS collaborative filtering (Python `implicit` library) for significantly more accurate user-item recommendations than the cosine similarity approach.

---

### Step 3: Configure recommendation exclusions

Every recommendation engine must exclude:

1. **Out-of-stock products** — never recommend products customers can't buy
2. **The product currently being viewed** — excluding the current product from "Related Products" on its own PDP
3. **Recently purchased products** — showing customers products they bought last week signals a poor experience

**In LimeSpot:** Configure exclusions under **Settings → Exclusions** — out-of-stock products are excluded automatically.

**In Frequently Bought Together:** The app automatically hides out-of-stock variants from the bundle suggestion.

**For custom builds:** Pass `excludeProductIds` containing the current product and the customer's recently purchased products to every recommendation function.

---

### Step 4: Measure recommendation performance

Track these weekly:

| Metric | Good Benchmark | Where to Find |
|--------|---------------|---------------|
| Click-through rate on "Frequently Bought Together" | 5–15% | LimeSpot Analytics or custom tracking |
| Add-to-cart rate from recommendations | 3–8% | LimeSpot Analytics |
| Recommendation-attributed revenue | 5–20% of total revenue | LimeSpot / Tidio attribution report |

## Best Practices

- **Use an app before building from scratch** — LimeSpot and Frequently Bought Together are well-calibrated and handle edge cases (cold start, out-of-stock, recently purchased exclusions) that take weeks to build correctly
- **Refresh the co-purchase matrix nightly** — new orders change which products are frequently bought together; stale data degrades recommendation quality
- **Filter out-of-stock products at query time**, not at model build time — inventory changes faster than the recommendation model refreshes
- **Cap recommendation carousels at 6–8 products** — more than 8 creates choice paralysis and lowers click-through rate
- **Implement a feedback loop** — track click-through and add-to-cart rates per recommendation slot to compare algorithm variants over time

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Recommendations always show the same popular products | Add diversity constraints — cap any single category to 30% of the recommendation slot; inject variety across price ranges |
| Cold-start users see irrelevant bestsellers | Collect even a single page view as a signal; use the first-browsed product's category to constrain bestseller fallback |
| Recommendations include the item being viewed | Always pass the current product ID as an exclusion to the recommendation function |
| Co-purchase matrix biased by bundle promotions | Filter orders where all items came from the same promotional bundle — those don't reflect genuine co-purchase affinity |

## Related Skills

- @customer-segmentation
- @customer-lifetime-value
- @product-reviews-ratings
- @user-generated-content
