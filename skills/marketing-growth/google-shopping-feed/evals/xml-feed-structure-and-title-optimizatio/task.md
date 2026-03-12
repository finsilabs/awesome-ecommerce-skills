# Google Shopping Feed Generator

## Problem Description

Sole Collective is a mid-sized footwear brand selling through their own online store. Their marketing team has decided to launch Google Shopping ads but needs a standards-compliant product data feed that Google Merchant Center can crawl. The catalog contains multiple product lines, each with color and size variants, and products that sometimes have GTINs and sometimes don't (for their private-label styles).

The development team needs a TypeScript/Node.js feed generator that produces a well-structured XML product feed. Past attempts using string concatenation or ad-hoc XML were rejected by Merchant Center's feed validator; the team wants a proper implementation built with a solid XML library that handles all the required fields correctly. The feed must also be performant enough that Google's frequent crawls don't overload the database.

## Output Specification

Write a TypeScript file `feed.ts` that exports a function `generateGoogleShoppingFeed(req, res)` which, when called, builds and returns the XML product feed.

Your implementation should:
- Query a mock set of products with variants (you can define the data inline or as a helper function — no real database needed)
- Include at least 2 products, each with 2+ variants, at least one product with a GTIN and one without
- Set the appropriate HTTP response headers
- Produce a valid XML feed body

The mock product data should be defined inline in the file so the output is self-contained and runnable. Include a brief `README.md` explaining any notable design decisions.

## Input Files (optional)

The following file provides example product data you should use as the basis for your implementation. Extract it before beginning.

=============== FILE: inputs/products.json ===============
[
  {
    "id": "prod-001",
    "name": "Cloud Runner",
    "brand": "Sole Collective",
    "description": "A lightweight daily trainer designed for long-distance comfort. Features a responsive foam midsole, breathable mesh upper, and durable rubber outsole. Suitable for road and light trail running. Built for runners who log 40+ miles per week and need reliable cushioning without excess weight.",
    "slug": "cloud-runner",
    "googleProductCategory": 3 ,
    "gtin": "00012345678905",
    "mpn": "SCR-001",
    "weightKg": 0.32,
    "categories": [{ "name": "Athletic" }, { "name": "Running" }],
    "images": [
      { "url": "https://example.com/images/cloud-runner-main.jpg" },
      { "url": "https://example.com/images/cloud-runner-side.jpg" },
      { "url": "https://example.com/images/cloud-runner-sole.jpg" },
      { "url": "https://example.com/images/cloud-runner-back.jpg" }
    ],
    "variants": [
      { "id": "v-001-wh-9",  "sku": "SCR-001-WH-9",  "color": "White", "size": "9",  "inventory": 12, "priceInCents": 12999, "salePriceInCents": null },
      { "id": "v-001-wh-10", "sku": "SCR-001-WH-10", "color": "White", "size": "10", "inventory": 7,  "priceInCents": 12999, "salePriceInCents": null },
      { "id": "v-001-bk-9",  "sku": "SCR-001-BK-9",  "color": "Black", "size": "9",  "inventory": 0,  "priceInCents": 12999, "salePriceInCents": 9999 }
    ]
  },
  {
    "id": "prod-002",
    "name": "Heritage Low",
    "brand": null,
    "description": "Our signature canvas sneaker, handcrafted using traditional techniques. The vulcanized rubber sole and unbleached canvas upper give it an authentic retro look. A wardrobe staple for those who appreciate timeless footwear without logos or branding noise.",
    "slug": "heritage-low",
    "googleProductCategory": 3,
    "gtin": null,
    "mpn": "HL-002",
    "weightKg": 0.28,
    "categories": [{ "name": "Casual" }, { "name": "Lifestyle" }],
    "images": [
      { "url": "https://example.com/images/heritage-low-main.jpg" },
      { "url": "https://example.com/images/heritage-low-angle.jpg" }
    ],
    "variants": [
      { "id": "v-002-nt-8",  "sku": "HL-002-NT-8",  "color": "Natural", "size": "8",  "inventory": 20, "priceInCents": 7999, "salePriceInCents": null },
      { "id": "v-002-nt-9",  "sku": "HL-002-NT-9",  "color": "Natural", "size": "9",  "inventory": 15, "priceInCents": 7999, "salePriceInCents": null }
    ]
  }
]
