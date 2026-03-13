# Product Recommendation API for a Multi-Page E-Commerce Store

## Problem/Feature Description

A fashion accessories brand is launching a recommendation engine to grow their average order value. They sell across four main surfaces: product detail pages (PDP), a cart drawer, a checkout summary panel, and a post-purchase confirmation page. The marketing team wants different recommendation types and limits on each surface, with a particular concern about the checkout page — past experiments have shown that showing too many suggestions there increases cart abandonment.

The team already has a `product_affinities` table populated by a nightly job, and a `manual_recommendations` table where merchandisers can pin specific product pairings (e.g., new arrivals that have no purchase history yet). They need a single `getRecommendations` API function plus a `PLACEMENT_CONFIG` object that drives what each page surface requests. The API must gracefully handle cases where affinity data is sparse (new store, new products) and must never surface out-of-stock items or recommend a product to itself. For upsell recommendations, the candidates must come from the same category and sit within a specific price band relative to the source product.

## Output Specification

Write `recommendations.ts` containing:
- A `getRecommendations(req)` function
- A `getUpsellCandidates(productId, limit?)` function
- A `PLACEMENT_CONFIG` constant

Write `recommendations.test.ts` with at least 5 unit tests covering key behaviors of the functions above (mock the db layer as needed).

Also write a short `api-notes.md` describing:
- The layering strategy used when combining recommendation sources
- How the checkout page configuration differs from other placements and why
