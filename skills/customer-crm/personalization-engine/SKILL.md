---
name: personalization-engine
description: "Show each shopper personalized product recommendations based on their browsing history and what similar customers bought using collaborative filtering"
category: customer-crm
risk: safe
source: curated
date_added: "2026-03-12"
tags: [personalization, recommendations, collaborative-filtering, browsing-history, machine-learning, product-recommendations, similar-products]
triggers: ["product recommendations", "personalization engine", "collaborative filtering", "recommendation algorithm", "frequently bought together", "similar products", "you might also like"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Personalization Engine

## Overview

A personalization engine increases average order value and session depth by surfacing the most relevant products for each customer. This skill covers three recommendation strategies: item-based collaborative filtering ("customers who bought X also bought Y"), browsing history-based recommendations using cosine similarity, and fallback bestseller rankings for anonymous or cold-start users. All strategies are designed to run in real-time with pre-computed similarity matrices for sub-10ms response times.

## When to Use This Skill

- When adding "Frequently Bought Together" or "You Might Also Like" carousels to product pages
- When implementing a personalized homepage for returning customers
- When building a recommendation API for a mobile app or headless storefront
- When cold-start recommendations (no history) are returning irrelevant products
- When A/B testing the impact of personalization on AOV and revenue per session
- When needing to exclude out-of-stock items and recently purchased products from recommendations

## Core Instructions

1. **Build a co-purchase matrix for item-based collaborative filtering**

   Pre-compute which products are frequently purchased together across all orders:

   ```sql
   -- PostgreSQL: co-purchase count matrix
   -- For each pair of products that appear in the same order, count co-occurrences
   INSERT INTO product_co_purchases (product_a_id, product_b_id, co_purchase_count)
   SELECT
     a.product_id AS product_a_id,
     b.product_id AS product_b_id,
     COUNT(DISTINCT a.order_id) AS co_purchase_count
   FROM order_items a
   JOIN order_items b ON a.order_id = b.order_id AND a.product_id < b.product_id
   GROUP BY a.product_id, b.product_id
   ON CONFLICT (product_a_id, product_b_id)
   DO UPDATE SET co_purchase_count = EXCLUDED.co_purchase_count, updated_at = NOW();
   ```

   ```typescript
   // Refresh nightly via cron
   async function refreshCoPurchaseMatrix() {
     await db.query(coPurchaseMatrixSQL);
     console.log('Co-purchase matrix refreshed');
   }
   ```

2. **Implement item-based "Frequently Bought Together" recommendations**

   ```typescript
   async function getFrequentlyBoughtTogether(
     productId: string,
     limit = 6,
     excludeProductIds: string[] = []
   ): Promise<Product[]> {
     const pairs = await db.productCoPurchases.findMany({
       where: {
         OR: [
           { productAId: productId },
           { productBId: productId },
         ],
         NOT: {
           OR: [
             { productAId: { in: excludeProductIds } },
             { productBId: { in: excludeProductIds } },
           ],
         },
       },
       orderBy: { coPurchaseCount: 'desc' },
       take: limit * 2, // Fetch extra to filter out-of-stock
     });

     const relatedIds = pairs.map((p) =>
       p.productAId === productId ? p.productBId : p.productAId
     );

     const products = await db.products.findManyById(relatedIds, {
       where: { status: 'active', inventory: { gt: 0 } },
     });

     return products.slice(0, limit);
   }
   ```

3. **Build a browsing-history based recommendation using product embeddings**

   Represent each product as a vector (using category, price range, tags) and find the closest products to what a user has been browsing:

   ```typescript
   // Simple attribute-based product vector (no ML required)
   function buildProductVector(product: Product): number[] {
     const categoryEncoding = oneHotEncode(product.categoryId, ALL_CATEGORY_IDS);
     const priceNormalized = product.priceInCents / MAX_PRICE_CENTS; // 0–1
     const tagEncoding = oneHotEncode(product.tags, ALL_TAGS);
     return [...categoryEncoding, priceNormalized, ...tagEncoding];
   }

   function cosineSimilarity(a: number[], b: number[]): number {
     const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
     const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
     const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
     return magA && magB ? dot / (magA * magB) : 0;
   }

   async function getRecommendationsFromBrowsingHistory(
     sessionProductIds: string[],
     limit = 8
   ): Promise<Product[]> {
     if (sessionProductIds.length === 0) return getBestSellers(limit);

     // Build a "user taste vector" by averaging the vectors of browsed products
     const browsedProducts = await db.products.findByIds(sessionProductIds);
     const vectors = browsedProducts.map(buildProductVector);
     const tasteVector = vectors[0].map((_, i) => vectors.reduce((sum, v) => sum + v[i], 0) / vectors.length);

     // Compare to all products and rank by similarity
     const allProducts = await db.products.findAll({
       where: { status: 'active', inventory: { gt: 0 }, id: { notIn: sessionProductIds } },
     });

     const ranked = allProducts
       .map((p) => ({ product: p, score: cosineSimilarity(tasteVector, buildProductVector(p)) }))
       .sort((a, b) => b.score - a.score);

     return ranked.slice(0, limit).map((r) => r.product);
   }
   ```

4. **Serve recommendations with a unified API and caching**

   ```typescript
   // GET /api/recommendations?context=pdp&productId=xxx&userId=yyy
   export async function getRecommendations(req: Request, res: Response) {
     const { context, productId, userId } = req.query as Record<string, string>;
     const sessionProductIds = getSessionBrowsingHistory(req); // from cookie or session

     const cacheKey = `recs:${context}:${productId ?? 'none'}:${userId ?? 'anon'}`;
     const cached = await redis.get(cacheKey);
     if (cached) return res.json(JSON.parse(cached));

     let products: Product[];

     switch (context) {
       case 'pdp':
         products = await getFrequentlyBoughtTogether(productId, 6, [productId]);
         if (products.length < 4) {
           // Backfill with browsing history recs if FBT is sparse
           const extra = await getRecommendationsFromBrowsingHistory(sessionProductIds, 4 - products.length);
           products = [...products, ...extra];
         }
         break;
       case 'homepage':
         if (userId) {
           products = await getRecommendationsFromBrowsingHistory(sessionProductIds, 12);
         } else {
           products = await getBestSellers(12);
         }
         break;
       case 'cart':
         products = await getFrequentlyBoughtTogether(productId, 4);
         break;
       default:
         products = await getBestSellers(8);
     }

     await redis.setex(cacheKey, 300, JSON.stringify(products)); // 5-minute cache
     res.json(products);
   }
   ```

5. **Implement cold-start fallback with bestsellers**

   ```typescript
   async function getBestSellers(limit = 8, categoryId?: string): Promise<Product[]> {
     return db.products.findMany({
       where: {
         status: 'active',
         inventory: { gt: 0 },
         ...(categoryId && { categoryId }),
       },
       orderBy: { salesCount: 'desc' },
       take: limit,
     });
   }
   ```

## Examples

### Machine learning upgrade with ALS collaborative filtering

For stores with 10k+ orders, replace the cosine similarity approach with Alternating Least Squares (ALS) matrix factorization using the Implicit library (Python):

```python
import implicit
import numpy as np
import scipy.sparse as sparse

# Build user-item interaction matrix from order history
def build_interaction_matrix(orders):
    user_ids = {uid: i for i, uid in enumerate(orders['customer_id'].unique())}
    item_ids = {pid: i for i, pid in enumerate(orders['product_id'].unique())}

    rows = orders['customer_id'].map(user_ids)
    cols = orders['product_id'].map(item_ids)
    data = np.ones(len(orders))  # implicit feedback: purchased = 1

    return sparse.csr_matrix((data, (rows, cols))), user_ids, item_ids

matrix, user_ids, item_ids = build_interaction_matrix(orders_df)

# Train ALS model
model = implicit.als.AlternatingLeastSquares(factors=50, iterations=20)
model.fit(matrix.T)  # item-user matrix

# Get recommendations for a user
reverse_item_ids = {v: k for k, v in item_ids.items()}
def get_als_recommendations(customer_id, n=10):
    user_idx = user_ids.get(customer_id)
    if user_idx is None:
        return []  # cold start
    ids, scores = model.recommend(user_idx, matrix[user_idx], N=n)
    return [reverse_item_ids[i] for i in ids]
```

### Track recommendation click-through for A/B testing

```typescript
// POST /api/recommendations/click
export async function trackRecommendationClick(req: Request, res: Response) {
  const { sourceProductId, clickedProductId, context, algorithm } = req.body;
  await db.recommendationClicks.create({
    sourceProductId,
    clickedProductId,
    context,
    algorithm,
    customerId: req.session.customerId ?? null,
    sessionId: req.session.id,
    clickedAt: new Date(),
  });
  res.json({ ok: true });
}
```

## Best Practices

- **Refresh the co-purchase matrix nightly** — new orders change which products are frequently bought together; stale matrices degrade recommendation quality
- **Always filter out-of-stock products** at query time, not at matrix build time — inventory changes faster than the recommendation model refreshes
- **Exclude recently purchased products** from recommendations — showing a customer a product they bought last week is unhelpful and signals a poor experience
- **Cache recommendation API responses for 5–15 minutes** — recommendation computation is expensive; customers rarely need millisecond-fresh results
- **Implement a feedback loop** — track click-through rate (CTR) and add-to-cart rate per recommendation slot to compare algorithm variants
- **Cap recommendation carousels at 6–8 products** — more than 8 creates choice paralysis and reduces click-through rate
- **Use category affinity for new users** — if a visitor browses only shoes, constrain recommendations to the footwear category until broader behavior is captured

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Recommendations always show the same popular products | Add diversity by capping any single category to 30% of the recommendation slot; inject category variety |
| Cold-start users see irrelevant bestsellers | Collect even one page-view as a signal; use the first-browsed product's category to constrain bestseller fallback |
| Recommendations include the item the customer is currently viewing | Always pass `excludeProductIds: [currentProductId]` to the recommendation function |
| Co-purchase matrix biased by bundle promotions | Filter orders where all items were part of the same promotion bundle, as those don't reflect genuine co-purchase affinity |
| High co-purchase between unrelated products | Check if co-purchase is driven by a single viral order — apply a confidence threshold (e.g., min 10 co-occurrences) |

## Related Skills

- @customer-segmentation
- @customer-lifetime-value
- @product-analytics
- @ab-testing-ecommerce
- @user-generated-content
