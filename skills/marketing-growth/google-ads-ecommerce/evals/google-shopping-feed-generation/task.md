# Build a Google Merchant Center Product Feed Generator

## Problem/Feature Description

A mid-sized outdoor gear retailer, Summit Supply Co., is launching Google Shopping ads for the first time. Their catalog of 200+ products is managed in an internal database, and the marketing team needs a script that exports the catalog into a format that Google Merchant Center will accept. Each product has multiple variants (sizes and colors), varying profit margins, and some are new arrivals from this season's collection.

The engineering team has given you access to a mock product dataset (provided below). Your job is to write a TypeScript or JavaScript module that transforms this raw product data into a valid Google Merchant Center product feed. The resulting feed file must be uploadable to Google Merchant Center and structured so that the marketing team can later use it to drive campaign segmentation in Google Ads.

## Output Specification

- A `feed-generator.ts` (or `feed-generator.js`) script that takes the mock product data and writes a feed file to disk
- A generated feed output file named `shopping-feed.xml`
- The feed must include all required Google Shopping feed attributes for each product variant

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/products.json ===============
[
  {
    "id": "prod-001",
    "name": "Trail Runner Pro",
    "slug": "trail-runner-pro",
    "description": "<p>The <strong>Trail Runner Pro</strong> is our most popular hiking shoe. Designed for serious trail runners who demand grip, durability, and comfort over long distances. Features a Vibram outsole and breathable mesh upper.</p>",
    "brandName": "Summit Supply Co.",
    "gpcCategory": "Apparel & Accessories > Shoes",
    "categories": [{"name": "Footwear"}, {"name": "Trail Running"}],
    "isNewArrival": false,
    "images": [{"url": "https://example.com/images/trail-runner-hero.jpg"}],
    "variants": [
      {
        "sku": "TRP-BLK-9",
        "title": "Black / Size 9",
        "price": 129.99,
        "compareAtPrice": null,
        "stockQuantity": 45,
        "gtin": "012345678901",
        "mpn": "TRP-001-BK",
        "images": [{"url": "https://example.com/images/trail-runner-black.jpg"}]
      },
      {
        "sku": "TRP-BLU-10",
        "title": "Blue / Size 10",
        "price": 129.99,
        "compareAtPrice": null,
        "stockQuantity": 0,
        "gtin": "012345678902",
        "mpn": "TRP-001-BL",
        "images": []
      }
    ],
    "margin": 0.45
  },
  {
    "id": "prod-002",
    "name": "Alpine Base Layer",
    "slug": "alpine-base-layer",
    "description": "<p>Stay warm and dry with the Alpine Base Layer. <em>Merino wool blend</em> with 4-way stretch. Perfect for layering in cold conditions.</p><p>Available in multiple colors and sizes.</p>",
    "brandName": "Summit Supply Co.",
    "gpcCategory": "Apparel & Accessories > Clothing",
    "categories": [{"name": "Clothing"}, {"name": "Base Layers"}],
    "isNewArrival": true,
    "images": [{"url": "https://example.com/images/base-layer-hero.jpg"}],
    "variants": [
      {
        "sku": "ABL-GRY-S",
        "title": "Gray / Small",
        "price": 59.95,
        "compareAtPrice": 79.95,
        "stockQuantity": 120,
        "gtin": null,
        "mpn": "ABL-GRY-S",
        "images": [{"url": "https://example.com/images/base-layer-gray.jpg"}]
      },
      {
        "sku": "ABL-NVY-M",
        "title": "Navy / Medium",
        "price": 59.95,
        "compareAtPrice": null,
        "stockQuantity": 88,
        "gtin": "012345678910",
        "mpn": "ABL-NVY-M",
        "images": []
      }
    ],
    "margin": 0.32
  },
  {
    "id": "prod-003",
    "name": "Summit Trekking Poles",
    "slug": "summit-trekking-poles",
    "description": "Lightweight adjustable trekking poles made from aircraft-grade aluminum. Collapsible to 60cm for easy pack storage. Anti-shock system reduces impact on joints during descents.",
    "brandName": "Summit Supply Co.",
    "gpcCategory": "Sporting Goods > Outdoor Recreation",
    "categories": [{"name": "Gear"}, {"name": "Hiking Accessories"}],
    "isNewArrival": true,
    "images": [{"url": "https://example.com/images/poles-hero.jpg"}],
    "variants": [
      {
        "sku": "STP-ONE-SZ",
        "title": "Silver / One Size",
        "price": 89.00,
        "compareAtPrice": null,
        "stockQuantity": 34,
        "gtin": "012345678920",
        "mpn": "STP-001",
        "images": [{"url": "https://example.com/images/poles-silver.jpg"}]
      }
    ],
    "margin": 0.55
  }
]
