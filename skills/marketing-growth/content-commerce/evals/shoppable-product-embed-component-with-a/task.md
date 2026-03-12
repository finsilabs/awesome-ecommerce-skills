# Shoppable Product Widget for a Lifestyle Blog

## Problem/Feature Description

A direct-to-consumer lifestyle brand runs a content-heavy blog on a Next.js headless frontend, separate from their Shopify storefront. Writers frequently mention specific products in articles — running gear reviews, gift guides, seasonal lookbooks — and the marketing team wants those mentions to become purchasable product cards embedded directly in the article body. Readers should see a product image, name, price, and a call-to-action button without leaving the article.

The marketing team also needs to understand which specific articles and which specific in-article product placements are driving purchases. This data will feed a monthly content ROI report. Without knowing which embedded product within which article a reader clicked before buying, the team can only attribute revenue to the whole site, not to individual pieces of content.

Build a React TypeScript component called `ProductEmbed` that can be dropped into an article renderer. The component should handle all the product data fetching, display, and analytics concerns.

## Output Specification

Create the following files:

- `components/ProductEmbed.tsx` — the React component
- `components/ProductEmbed.types.ts` — the TypeScript interfaces/types it uses (or inline them in the component file)

The component must:
- Accept at minimum `productId`, `displayStyle`, `ctaText`, and one more prop needed for revenue attribution
- Fetch product data from `/api/products/{productId}?fields=name,price,images,slug,inStock`
- Show an appropriate loading state while data is being fetched
- Render the product image, name, price, and a CTA button
- Handle the case where a product is out of stock
- Send an analytics event when the CTA is clicked

The CTA button should navigate to the product page. Include the `articleId` in a way that allows the analytics team to join article clicks to orders.

Write a short `IMPLEMENTATION_NOTES.md` explaining any attribution decisions you made.
