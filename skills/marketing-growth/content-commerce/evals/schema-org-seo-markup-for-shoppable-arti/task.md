# Structured Data for a Product-Rich Buying Guide

## Problem/Feature Description

The SEO team at a home goods retailer has published a "Best Ergonomic Office Chairs 2026" buying guide — a long-form article that recommends five specific chairs, each with pricing and stock status. The team wants Google to show this article as a rich result in search, specifically the kind that surfaces an article alongside a product carousel in Google Search. Without structured data, the page is treated as plain editorial content and misses these high-value placements.

Your task is to write a TypeScript function that generates the correct JSON-LD structured data for this type of article. The data will be injected into the page's `<head>` as a `<script type="application/ld+json">` block. The structured data must contain all the information Google needs to understand both the article and the products it features.

## Output Specification

Write a TypeScript file `schema.ts` that exports a function `buildArticleSchema(article, products)` which returns a valid JSON-LD object. Also write a `schema.test.ts` file (or a plain `schema_output.json`) that calls the function with realistic sample data and writes (or logs/exports) the result so the output can be inspected.

Use the following types as your starting point — do not modify them, but you may import or copy them:

```typescript
interface Article {
  id: string;
  slug: string;
  title: string;
  body: string;
  featuredProductIds: string[];
  categories: string[];
  publishedAt: Date;
  updatedAt: Date;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  images: { url: string }[];
  priceInCents: number;
  inventory: number;
}
```

The STORE_NAME is `"ErgoHome"` and the STORE_URL is `"https://ergohome.example.com"`. Hardcode these or use them as constants.

Produce a file `schema_output.json` containing the result of calling `buildArticleSchema` with a sample article (slug: `"best-ergonomic-chairs-2026"`, title: `"Best Ergonomic Office Chairs 2026"`) and at least 3 sample products. Make the sample data realistic.
