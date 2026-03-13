# Product Similarity Engine

## Problem/Feature Description

Bloom & Thread, a specialty apparel e-commerce brand, has been running for three years and has accumulated a substantial purchase history database. Their current "You May Also Like" section is hand-curated by a merchandising team and only covers the top 200 products. The engineering team has been tasked with automating this using machine learning on their existing transaction data, so every product in the catalog gets a list of related items based on real shopper behavior.

The data science team has agreed on an approach: mine the purchase and cart-add history to find which products are frequently bought or carted together in the same shopping session. Products that are co-purchased frequently are likely complementary or related. The resulting similarity scores should be precomputed and cached so that the storefront can serve "also bought" suggestions in milliseconds, and the model should refresh automatically so that seasonal patterns and new products are picked up without manual intervention.

## Output Specification

Produce a TypeScript module at `src/models/collaborative-filter.ts` that:
- Queries session-based co-occurrence from purchase/cart history
- Computes similarity scores between products
- Stores the results in Redis for low-latency serving

Also produce a `src/jobs/nightly-rebuild.ts` file that shows how the model rebuild is triggered on a schedule.

Finally, write a `design-notes.md` documenting:
- Which similarity metric is used and why
- How many similar products are stored per item
- How long results are cached before refresh
- How far back in time purchase history is used
- How the nightly rebuild job fits into the overall architecture

You may stub out the `db` and `redis` dependencies with type-compatible interfaces. The TypeScript code should be complete and illustrate the full computation pipeline.
