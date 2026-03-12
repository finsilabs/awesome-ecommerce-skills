# Personalized Homepage Recommendations with Analytics

## Problem Description

A home goods marketplace is adding personalized recommendations to their headless storefront. The site serves a mix of returning customers and first-time visitors. The product team wants recommendations that reflect what each visitor has been browsing during their session — but they also need a sensible experience for brand-new visitors who haven't browsed anything yet. Additionally, the growth team has asked for a way to measure which recommendation approach is performing better so they can run experiments over time.

The engineering team needs a TypeScript implementation of the recommendation logic that can run server-side. Each product in the catalog has a `categoryId`, a `priceInCents`, and an array of `tags`. There is no ML infrastructure available — the solution must work using only product metadata and a standard math approach. The catalog has approximately 2,000 active products, so in-memory computation is acceptable.

There is a constant `ALL_CATEGORY_IDS: string[]` and `ALL_TAGS: string[]` available globally for encoding. `MAX_PRICE_CENTS` is also available as a global constant.

## Output Specification

Produce the following files:

1. `product_vectors.ts` — A TypeScript module implementing:
   - `buildProductVector(product)` — converts a product into a numeric vector
   - `cosineSimilarity(a, b)` — computes similarity between two vectors
   - `getRecommendationsFromBrowsingHistory(sessionProductIds, limit)` — returns ranked products based on browsing history, falling back to bestsellers for empty sessions; excludes browsed products from results; filters to active, in-stock products only

2. `cold_start.md` — A short document explaining the cold-start strategy: what signals to collect from a visitor who has only viewed one or two products, and how to constrain recommendations when only limited browsing data is available.

3. `click_tracking.ts` — A TypeScript module exporting a `trackRecommendationClick(req, res)` Express handler that records which recommendation a user clicked.

Use placeholder database and session clients as needed — runtime correctness is not required, logical correctness is.
