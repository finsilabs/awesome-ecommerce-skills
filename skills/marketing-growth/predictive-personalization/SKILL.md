---
name: predictive-personalization
description: "Use machine learning models to predict customer preferences and dynamically personalize product recommendations, search results, and content across your store"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [personalization, machine-learning, recommendations, ai, customer-experience]
triggers: ["personalize recommendations", "predict customer preferences", "ML product recommendations", "dynamic personalization", "personalized shopping experience"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: advanced
---

# Predictive Personalization

## Overview

Predictive personalization uses machine learning to anticipate what each shopper wants before they search for it. Instead of showing every visitor the same homepage, category pages, and recommendations, you tailor the experience based on behavioral signals (browse history, purchase history, cart contents, time-on-page), demographic data, and collaborative filtering patterns from similar customers. The result is higher conversion rates, larger average order values, and stronger retention.

This skill covers building a personalization pipeline: data collection, feature engineering, model selection (collaborative filtering, content-based, hybrid), real-time scoring, and integration into product recommendations, search ranking, email content, and homepage merchandising. It applies to any ecommerce platform — Shopify, headless, WooCommerce, or custom.

## When to Use This Skill

- When your store shows the same products to every visitor regardless of their behavior
- When you want to add "Recommended for You" sections to your homepage, PDP, or cart
- When search results don't account for individual shopper preferences
- When email campaigns send the same products to your entire list
- When you're ready to move beyond rule-based merchandising to data-driven personalization
- When conversion rates are plateauing and you need a lift from relevance

## Core Instructions

### 1. Collect behavioral events

Track every meaningful user interaction and store it in an event stream:

```typescript
// events/track.ts
interface PersonalizationEvent {
  userId: string | null;       // null for anonymous visitors
  sessionId: string;
  eventType: 'view' | 'add_to_cart' | 'purchase' | 'search' | 'wishlist' | 'remove_from_cart';
  productId: string;
  categoryId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;  // price, quantity, search query, etc.
}

export async function trackEvent(event: PersonalizationEvent) {
  // Write to event store (Kafka, Redis Streams, or database)
  await eventStore.append('personalization-events', {
    ...event,
    timestamp: event.timestamp.toISOString(),
  });

  // Update real-time user profile
  await updateUserProfile(event);
}

async function updateUserProfile(event: PersonalizationEvent) {
  const key = event.userId ?? `anon:${event.sessionId}`;
  const profile = await redis.hgetall(`user-profile:${key}`) || {};

  // Maintain recent interactions (sliding window of last 50)
  const recentViews = JSON.parse(profile.recentViews || '[]');
  if (event.eventType === 'view') {
    recentViews.unshift({ productId: event.productId, ts: Date.now() });
    if (recentViews.length > 50) recentViews.pop();
  }

  // Maintain category affinity scores
  const categoryScores = JSON.parse(profile.categoryScores || '{}');
  if (event.categoryId) {
    const weight = { view: 1, add_to_cart: 3, purchase: 5, wishlist: 2 }[event.eventType] || 1;
    categoryScores[event.categoryId] = (categoryScores[event.categoryId] || 0) + weight;
  }

  await redis.hmset(`user-profile:${key}`, {
    recentViews: JSON.stringify(recentViews),
    categoryScores: JSON.stringify(categoryScores),
    lastActive: Date.now().toString(),
  });
  await redis.expire(`user-profile:${key}`, 30 * 24 * 60 * 60); // 30 day TTL
}
```

### 2. Build collaborative filtering model

Use item-item collaborative filtering — find products that are frequently co-viewed or co-purchased:

```typescript
// models/collaborative-filter.ts
export async function buildCooccurrenceMatrix() {
  // Query purchase sessions from last 90 days
  const sessions = await db.query(`
    SELECT session_id, array_agg(DISTINCT product_id) as products
    FROM events
    WHERE event_type IN ('purchase', 'add_to_cart')
      AND timestamp > NOW() - INTERVAL '90 days'
    GROUP BY session_id
    HAVING COUNT(DISTINCT product_id) >= 2
  `);

  // Build co-occurrence counts
  const cooccurrence: Map<string, Map<string, number>> = new Map();

  for (const session of sessions.rows) {
    const products = session.products;
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        increment(cooccurrence, products[i], products[j]);
        increment(cooccurrence, products[j], products[i]);
      }
    }
  }

  // Normalize to similarity scores (Jaccard or cosine)
  const productCounts = await getProductInteractionCounts();
  const similarities: Map<string, Array<{ productId: string; score: number }>> = new Map();

  for (const [productA, coProducts] of cooccurrence) {
    const countA = productCounts.get(productA) || 1;
    const scored = [];

    for (const [productB, coCount] of coProducts) {
      const countB = productCounts.get(productB) || 1;
      // Jaccard similarity
      const score = coCount / (countA + countB - coCount);
      scored.push({ productId: productB, score });
    }

    scored.sort((a, b) => b.score - a.score);
    similarities.set(productA, scored.slice(0, 50)); // Top 50 similar items
  }

  // Store in Redis for real-time access
  for (const [productId, similar] of similarities) {
    await redis.set(
      `similar:${productId}`,
      JSON.stringify(similar),
      'EX', 24 * 60 * 60  // Refresh daily
    );
  }
}

function increment(map: Map<string, Map<string, number>>, a: string, b: string) {
  if (!map.has(a)) map.set(a, new Map());
  const inner = map.get(a)!;
  inner.set(b, (inner.get(b) || 0) + 1);
}
```

### 3. Score and serve recommendations

```typescript
// api/recommendations.ts
export async function getRecommendations(
  userId: string | null,
  sessionId: string,
  context: { page: 'home' | 'pdp' | 'cart' | 'category'; productId?: string; cartItems?: string[] },
  limit = 12
): Promise<string[]> {
  const profileKey = userId ?? `anon:${sessionId}`;
  const profile = await redis.hgetall(`user-profile:${profileKey}`);

  let candidates: Map<string, number> = new Map();

  // Source 1: Similar items to current product (PDP context)
  if (context.productId) {
    const similar = JSON.parse(await redis.get(`similar:${context.productId}`) || '[]');
    for (const { productId, score } of similar) {
      candidates.set(productId, (candidates.get(productId) || 0) + score * 2.0);
    }
  }

  // Source 2: Items similar to recent views
  if (profile?.recentViews) {
    const recentViews = JSON.parse(profile.recentViews).slice(0, 10);
    for (const { productId } of recentViews) {
      const similar = JSON.parse(await redis.get(`similar:${productId}`) || '[]');
      for (const { productId: simId, score } of similar.slice(0, 20)) {
        candidates.set(simId, (candidates.get(simId) || 0) + score * 1.0);
      }
    }
  }

  // Source 3: Category affinity — boost products in preferred categories
  if (profile?.categoryScores) {
    const catScores = JSON.parse(profile.categoryScores);
    const topCategories = Object.entries(catScores)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5);

    for (const [catId, catScore] of topCategories) {
      const catProducts = await redis.smembers(`category-products:${catId}`);
      for (const pid of catProducts.slice(0, 20)) {
        candidates.set(pid, (candidates.get(pid) || 0) + (catScore as number) * 0.1);
      }
    }
  }

  // Remove already-viewed and already-in-cart items
  const recentViewIds = new Set(
    JSON.parse(profile?.recentViews || '[]').map((v: any) => v.productId)
  );
  const cartSet = new Set(context.cartItems || []);

  const ranked = [...candidates.entries()]
    .filter(([id]) => !recentViewIds.has(id) && !cartSet.has(id) && id !== context.productId)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([id]) => id);

  // Fallback to popular items if not enough personalized results
  if (ranked.length < limit) {
    const popular = await redis.zrevrange('popular-products', 0, limit - ranked.length - 1);
    const existing = new Set(ranked);
    for (const pid of popular) {
      if (!existing.has(pid) && !cartSet.has(pid)) ranked.push(pid);
      if (ranked.length >= limit) break;
    }
  }

  return ranked;
}
```

### 4. Personalize search results

Boost search results based on user's category affinity:

```typescript
// search/personalize.ts
export function personalizeSearchResults(
  results: SearchResult[],
  userProfile: UserProfile
): SearchResult[] {
  if (!userProfile?.categoryScores) return results;

  const catScores = JSON.parse(userProfile.categoryScores);
  const maxCatScore = Math.max(...Object.values(catScores) as number[], 1);

  return results.map(result => {
    const affinityBoost = catScores[result.categoryId]
      ? (catScores[result.categoryId] / maxCatScore) * 0.3  // Up to 30% relevance boost
      : 0;

    return {
      ...result,
      personalizedScore: result.relevanceScore * (1 + affinityBoost),
    };
  }).sort((a, b) => b.personalizedScore - a.personalizedScore);
}
```

### 5. A/B test personalization impact

Always run personalization behind a feature flag and measure lift:

```typescript
// middleware/personalization-experiment.ts
export function getPersonalizationVariant(userId: string): 'control' | 'personalized' {
  // Deterministic assignment based on user ID hash
  const hash = createHash('md5').update(userId).digest('hex');
  const bucket = parseInt(hash.substring(0, 8), 16) % 100;
  return bucket < 50 ? 'control' : 'personalized';
}
```

Track conversion rate, AOV, and revenue per visitor for both groups. Only graduate personalization to 100% when it shows statistically significant lift (p < 0.05 over 2+ weeks).

## Best Practices

- **Start with collaborative filtering** — it requires no product metadata, just behavioral data; content-based models can be added later as a second signal
- **Decay old signals** — a product viewed 30 days ago should carry less weight than one viewed yesterday; apply exponential time decay to interaction scores
- **Rebuild models daily** — run the co-occurrence matrix job nightly; serve recommendations from the precomputed Redis cache for sub-10ms response times
- **Merge anonymous and logged-in profiles** — when a visitor logs in, merge their anonymous session profile into their user profile to avoid cold-start after login
- **Diversify recommendations** — don't show 12 items from the same category; enforce a maximum of 4 items per category to expose breadth
- **Handle cold-start gracefully** — new users with no history get trending/popular items; new products with no interaction data get boosted in their category for the first 7 days
- **Respect privacy** — honor DNT headers and cookie consent; let users opt out of personalization; don't personalize based on sensitive categories without explicit consent

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Recommendations are stale or repetitive | Apply diversity constraints — max 4 items per category, exclude recently viewed items, mix in trending items |
| Cold-start users get empty recommendations | Fall back to popularity-based recommendations; use category-level trends when user history is sparse |
| Personalization hurts conversion for some segments | Always A/B test; some user segments (new visitors, gift shoppers) may convert better with editorial curation |
| Model training is too slow for real-time | Pre-compute similarity matrices offline (nightly batch); serve from Redis; only update user profiles in real-time |
| Filter bubble — users only see familiar products | Reserve 20% of recommendation slots for serendipity — trending items, new arrivals, or items from unexplored categories |
| Privacy compliance issues | Store only hashed/anonymized behavioral data; provide clear opt-out; comply with GDPR right-to-erasure by deleting user profiles on request |

## Related Skills

- @customer-analytics
- @ab-testing-ecommerce
- @customer-segmentation
- @search-autocomplete
- @product-page-design
