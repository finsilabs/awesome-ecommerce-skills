---
name: cross-sell-upsell-engine
description: "Recommend complementary and premium products at checkout, in cart, and post-purchase using purchase patterns, browsing history, and margin optimization"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [cross-sell, upsell, recommendations, aov]
triggers: ["increase average order value", "add product recommendations"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: advanced
---

# Cross-Sell and Upsell Engine

## Overview

Cross-sells and upsells generate an average of 10–30% incremental revenue with minimal customer acquisition cost. The difference between an annoying recommendation widget and a revenue driver is relevance: affinity-based recommendations outperform category-based ones by 2–4×. This skill builds a full recommendation engine — from collaborative filtering on purchase history, to real-time cart-based affinity scoring, to rule-based manual overrides — with placement logic for PDP, cart, checkout, and post-purchase pages.

## When to Use This Skill

- When your average order value (AOV) is below industry benchmarks and you want to grow it without paid traffic
- When launching a new recommendation widget on PDP, cart, or checkout pages
- When replacing a generic "You may also like" carousel with affinity-based personalization
- When building a bundle builder or "complete the look" feature
- When you want to A/B test recommendation algorithms against each other
- When order data is rich enough to mine (typically 1,000+ orders to get meaningful affinity signals)

## Prerequisites & Platform Notes

**Shopify**: Most marketing features are handled by apps from the Shopify App Store (Klaviyo for email, Postscript for SMS, Stamped for reviews, etc.). Use the Shopify Admin API and webhooks to build custom integrations. Shopify's marketing_event API tracks campaign attribution.
**WooCommerce**: Install dedicated plugins (AutomateWoo, WooCommerce Points and Rewards, YITH plugins). Use WooCommerce hooks (woocommerce_order_status_completed, etc.) for custom automation.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store with product catalog API access, recommendation engine or Shopify Functions/WooCommerce hooks for custom logic

## Core Instructions

### 1. Data model and affinity score computation

Product affinity is the probability that a customer who buys product A also buys product B. Start with co-purchase frequency:

```typescript
// Run nightly via cron — computes affinity scores for all product pairs
async function computeProductAffinity() {
  // Step 1: build co-purchase matrix
  const orders = await db.orders.findAll({
    where: { status: 'completed' },
    include: [{ model: db.lineItems, attributes: ['productId'] }],
    attributes: ['id'],
  });

  const coMatrix: Record<string, Record<string, number>> = {};
  const productFrequency: Record<string, number> = {};

  for (const order of orders) {
    const productIds = [...new Set(order.lineItems.map((li: any) => li.productId))];

    // Count individual product occurrences
    for (const pid of productIds) {
      productFrequency[pid] = (productFrequency[pid] ?? 0) + 1;
    }

    // Count co-occurrences for every pair
    for (let i = 0; i < productIds.length; i++) {
      for (let j = i + 1; j < productIds.length; j++) {
        const [a, b] = [productIds[i], productIds[j]].sort();
        coMatrix[a] = coMatrix[a] ?? {};
        coMatrix[a][b] = (coMatrix[a][b] ?? 0) + 1;
      }
    }
  }

  // Step 2: compute lift (affinity score) = P(A∩B) / (P(A) * P(B))
  const totalOrders = orders.length;
  const affinityRecords: AffinityScore[] = [];

  for (const [productA, peers] of Object.entries(coMatrix)) {
    for (const [productB, coCount] of Object.entries(peers)) {
      const pA = productFrequency[productA] / totalOrders;
      const pB = productFrequency[productB] / totalOrders;
      const pAB = coCount / totalOrders;
      const lift = pAB / (pA * pB);
      const confidence = pAB / pA;  // P(B|A)

      if (coCount >= 3) {  // minimum support threshold
        affinityRecords.push({ productA, productB, coCount, lift, confidence });
        affinityRecords.push({ productA: productB, productB: productA, coCount, lift, confidence });
      }
    }
  }

  // Upsert into product_affinities table
  await db.productAffinities.bulkCreate(affinityRecords, {
    updateOnDuplicate: ['coCount', 'lift', 'confidence', 'updatedAt'],
  });
}
```

### 2. Recommendation API

```typescript
interface RecommendationRequest {
  productIds: string[];    // current product(s) being viewed or in cart
  customerId?: string;
  type: 'cross-sell' | 'upsell' | 'frequently-bought-together';
  limit?: number;          // default 4
  excludeIds?: string[];   // exclude items already in cart
}

interface RecommendationResult {
  productId: string;
  score: number;
  reason: 'affinity' | 'manual' | 'trending' | 'category-fallback';
}

async function getRecommendations(req: RecommendationRequest): Promise<RecommendationResult[]> {
  const limit = req.limit ?? 4;

  // Layer 1: Manual overrides (highest priority)
  const manualRecs = await db.manualRecommendations.findAll({
    where: { sourceProductId: { in: req.productIds }, type: req.type, active: true },
    order: [['priority', 'ASC']],
    limit,
  });

  if (manualRecs.length >= limit) {
    return manualRecs.map(r => ({ productId: r.targetProductId, score: 1, reason: 'manual' }));
  }

  // Layer 2: Affinity-based (co-purchase lift)
  const affinityRecs = await db.productAffinities.findAll({
    where: {
      productA: { in: req.productIds },
      productB: { notIn: [...req.productIds, ...(req.excludeIds ?? [])] },
      ...(req.type === 'upsell' ? { priceRatio: { gt: 1.1 } } : {}),
    },
    order: [['lift', 'DESC']],
    include: [{ model: db.products, as: 'productBDetails', where: { active: true, stockQuantity: { gt: 0 } } }],
    limit: limit * 3,  // over-fetch to allow deduplication
  });

  // Aggregate scores when multiple source products produce the same target
  const scoreMap: Record<string, number> = {};
  for (const rec of affinityRecs) {
    scoreMap[rec.productB] = (scoreMap[rec.productB] ?? 0) + rec.lift * rec.confidence;
  }

  const affinityResults = Object.entries(scoreMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit - manualRecs.length)
    .map(([productId, score]) => ({ productId, score, reason: 'affinity' as const }));

  const combined = [...manualRecs.map(r => ({ productId: r.targetProductId, score: 1, reason: 'manual' as const })), ...affinityResults];

  // Layer 3: Trending fallback if not enough results
  if (combined.length < limit) {
    const trendingRecs = await getTrendingProducts(req.productIds, req.excludeIds ?? [], limit - combined.length);
    combined.push(...trendingRecs);
  }

  return combined.slice(0, limit);
}
```

### 3. Upsell: same-category higher-priced products

```typescript
async function getUpsellCandidates(productId: string, limit = 3): Promise<RecommendationResult[]> {
  const product = await db.products.findByPk(productId);
  if (!product) return [];

  // Find same-category products priced 10–50% higher
  const upsells = await db.products.findAll({
    where: {
      categoryId: product.categoryId,
      id: { ne: productId },
      price: { gte: product.price * 1.10, lte: product.price * 1.50 },
      active: true,
      stockQuantity: { gt: 0 },
    },
    order: [
      ['reviewScore', 'DESC'],
      ['salesCount', 'DESC'],
    ],
    limit,
  });

  return upsells.map((p, i) => ({
    productId: p.id,
    score: 1 - i * 0.1,
    reason: 'affinity',
  }));
}
```

### 4. Bundle builder with dynamic pricing

```typescript
interface Bundle {
  primaryProductId: string;
  bundledProductIds: string[];
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  displayedSavings: number;
}

async function createBundle(primaryProductId: string): Promise<Bundle | null> {
  const primary = await db.products.findByPk(primaryProductId);
  if (!primary) return null;

  const recommendations = await getRecommendations({
    productIds: [primaryProductId],
    type: 'frequently-bought-together',
    limit: 2,
  });

  const bundleProducts = await db.products.findAll({
    where: { id: { in: recommendations.map(r => r.productId) } },
  });

  const totalOriginal = [primary, ...bundleProducts].reduce((sum, p) => sum + p.price, 0);
  const discountValue  = 10; // 10% off bundle
  const displayedSavings = totalOriginal * (discountValue / 100);

  return {
    primaryProductId,
    bundledProductIds: bundleProducts.map(p => p.id),
    discountType: 'percentage',
    discountValue,
    displayedSavings,
  };
}
```

### 5. React recommendation widget

```tsx
function CrossSellWidget({ productIds, type, title }: {
  productIds: string[];
  type: 'cross-sell' | 'upsell' | 'frequently-bought-together';
  title?: string;
}) {
  const { data: recs, isLoading } = useSWR(
    `/api/recommendations?productIds=${productIds.join(',')}&type=${type}&limit=4`,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading || !recs?.length) return null;

  const handleAddToCart = async (productId: string, position: number) => {
    await addToCart(productId);
    analytics.track('recommendation_added_to_cart', {
      recommendedProductId: productId,
      sourceProductIds: productIds,
      type,
      position,
      algorithm: recs.find(r => r.productId === productId)?.reason,
    });
  };

  return (
    <section aria-label={title ?? 'Recommended products'}>
      <h2 className="text-lg font-semibold mb-4">{title ?? 'Frequently Bought Together'}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recs.map((rec: RecommendationResult, i: number) => (
          <ProductCard
            key={rec.productId}
            productId={rec.productId}
            onAddToCart={() => handleAddToCart(rec.productId, i + 1)}
          />
        ))}
      </div>
    </section>
  );
}
```

### 6. Placement strategy by page type

```typescript
const PLACEMENT_CONFIG = {
  pdp: {
    type: 'frequently-bought-together',
    title: 'Frequently Bought Together',
    position: 'below-add-to-cart',
    limit: 4,
  },
  cart: {
    type: 'cross-sell',
    title: 'Complete Your Order',
    position: 'cart-sidebar',
    limit: 3,
  },
  checkout: {
    type: 'cross-sell',
    title: 'Add Before You Checkout',
    position: 'order-summary',
    limit: 2,
    maxPrice: 30,  // only show low-cost add-ons in checkout to reduce friction
  },
  'post-purchase': {
    type: 'cross-sell',
    title: 'Other Customers Also Bought',
    position: 'confirmation-page',
    limit: 4,
  },
};
```

### 7. Customer history personalization

```typescript
async function getPersonalizedRecommendations(customerId: string, limit = 8): Promise<RecommendationResult[]> {
  const recentPurchases = await db.lineItems.findAll({
    include: [{ model: db.orders, where: { customerId, status: 'completed' }, order: [['createdAt', 'DESC']], limit: 3 }],
  });

  const purchasedProductIds = recentPurchases.map(li => li.productId);
  const alreadyPurchasedIds = await db.lineItems.findAll({
    include: [{ model: db.orders, where: { customerId } }],
    attributes: ['productId'],
  }).then(rows => rows.map(r => r.productId));

  return getRecommendations({
    productIds: purchasedProductIds,
    customerId,
    type: 'cross-sell',
    limit,
    excludeIds: alreadyPurchasedIds,
  });
}
```

## Best Practices

- **Minimum support threshold**: require at least 3–5 co-purchases before including a pair in affinity scores; below this, the signal is noise
- **Exclude out-of-stock items**: always join product affinities with current inventory — nothing is more frustrating than clicking a recommendation that is unavailable
- **Price guardrails for upsells**: upsells should be 10–50% higher priced; going beyond 2× the original price tanks conversion
- **Checkout placement is highest-converting but highest-risk**: test one low-price item only; multiple recs at checkout increase abandon rate
- **Refresh affinity scores nightly**: purchasing patterns shift with seasons and new products; stale scores reduce relevance
- **Track recommendation attribution separately**: tag orders with `recommendation_source` to measure incremental AOV vs. organic multi-item orders
- **Manual overrides for new products**: new SKUs have no purchase history; manually configure them as recommended alongside bestsellers for the first 30 days
- **Avoid cannibalistic upsells**: do not upsell a variant (same product, larger size) as if it is a different product — this confuses customers

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Recommendations are out of stock | Always filter with `active = true AND stockQuantity > 0` in the query |
| Same product recommended to itself | Exclude source `productIds` from the results in all query layers |
| Cold-start for new products | Add manual override rules or fall back to trending/bestseller data |
| Algorithm recommends high-margin but irrelevant products | Prioritize lift score (affinity) over margin; irrelevant recs hurt trust |
| Checkout recs increase cart abandonment | Limit to 1–2 low-cost items; remove if A/B test shows negative impact |
| Widget renders empty on first visit | Implement trending fallback so the widget always has content |
| Affinity scores biased by bulk orders | Exclude orders with more than 15 line items from co-purchase computation |
| A/B test contamination | Assign recommendation algorithm variant at customer level, not session level |

## Testing and Validation

### A/B test setup

```typescript
function getRecommendationVariant(customerId: string): 'control' | 'affinity' | 'trending' {
  // Stable assignment by customer ID hash
  const hash = parseInt(customerId.slice(-4), 16) % 3;
  return ['control', 'affinity', 'trending'][hash] as any;
}
```

### Integration checklist

- [ ] Affinity computation job runs nightly and completes within 10 minutes for 10k+ SKU catalog
- [ ] API returns results in under 200ms (use Redis cache with 1-hour TTL)
- [ ] Out-of-stock products never appear in recommendations
- [ ] Recommendation click events tracked with product ID, source product, placement, and algorithm
- [ ] Manual overrides can be created and activated via admin UI without code deploy
- [ ] Bundle discount codes are generated uniquely per session

### KPIs

- **Recommendation CTR**: clicks / recommendation impressions (target: 8–15% on PDP, 15–25% on cart)
- **Recommendation attach rate**: orders with at least one recommended item / total orders
- **AOV lift**: AOV when recommendation clicked / AOV without click
- **Revenue attributable to recommendations**: total GMV from orders where at least one item came from a recommendation

## Related Skills

- @predictive-personalization
- @customer-retention-engine
- @product-launch-campaigns
- @loyalty-program-optimization
- @email-marketing-automation
