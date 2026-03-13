# Product Page Trust Widgets: Review Badge and Stock Urgency Indicator

## Problem/Feature Description

A retailer's SEO team has noticed that competitor product pages appear with star ratings in Google search results (rich snippets), while theirs do not — costing them click-through rate. At the same time, their UX team wants to add a stock urgency indicator to create honest purchase urgency for products that are genuinely running low. Both of these features need to be added to the server-side template rendering layer so they are available on first load.

The backend already has a `product` object available during server-side rendering with `avgRating` (a number 0–5) and `reviewCount` (integer). For the stock indicator, a `stockLevel` integer (quantity on hand) is available. The team wants the review badge to contribute to SEO and the stock indicator to reflect real inventory tiers accurately.

## Output Specification

Produce a TypeScript file `trust-widgets.ts` containing:
- A `renderReviewBadge(product)` function that returns an HTML string
- A `renderStockIndicator(stockLevel: number)` function that returns an HTML string

Also produce a `widget-spec.md` that documents:
- The exact stock level thresholds used and the message shown for each tier
- What happens when a product has zero reviews
- Why the review badge HTML should be rendered on the server rather than the client
