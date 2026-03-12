# Product Page — Social Proof, SEO, and Performance

## Problem/Feature Description

A home goods brand has a working product detail page, but their SEO team reports that Google Shopping is not picking up their products correctly and their rich results test shows no structured data. They also want to add social proof elements to improve conversion: customer ratings, a stock availability indicator, and a recent purchases notification. However, the marketing team has strict guidelines against misleading customers — all urgency messaging must be based on real data, not manufactured scarcity.

Their frontend developer also flagged two performance issues: the large unoptimized product images are causing slow loads on mobile connections, and the reviews section (which fetches from an external API) is slowing down initial page render for users who never even scroll to it.

## Output Specification

Produce the following files:
- `ProductSeo.tsx` — a component that injects SEO structured data for the product
- `SocialProof.tsx` — a component containing the rating summary, stock indicator, and recent purchase notification
- `StockIndicator.tsx` — a standalone stock status component
- `IMPLEMENTATION_NOTES.md` — a brief explanation of how structured data is constructed, the stock indicator thresholds used, the approach to lazy-loading reviews, and how images are served for performance

Use the following mock data for the product (inline it in your components or a `mockData.ts`):

```
Product title: "Linen Duvet Set"
SKU: "LDS-001"
Brand: "Casa Nova"
Description: "100% stonewashed linen duvet set, available in natural and dove grey."
Images: ["/images/linen-duvet-1.jpg", "/images/linen-duvet-2.jpg"]
Price: 149.00 USD
In stock: true
Reviews: { averageRating: 4.7, totalCount: 83 }
```

Also produce a `productSchema.ts` file exporting a `buildProductSchema(product, reviews)` function that constructs the full JSON-LD object.

Do not set up a bundler — just the source files are needed.
