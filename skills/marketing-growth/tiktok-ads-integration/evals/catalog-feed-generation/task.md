# TikTok Product Catalog Feed for Dynamic Shopping Ads

## Problem Description

A home goods ecommerce company sells 200+ products across multiple categories (furniture, lighting, decor) and wants to run TikTok Dynamic Product Ads that automatically show the most relevant items to each user. To enable this, TikTok needs an up-to-date product catalog that it can pull from on a regular schedule.

The product catalog currently lives in a database, but the marketing platform team needs to expose it in a format that TikTok's Catalog Manager can ingest. They also need instructions for how to complete the setup in the TikTok Business Center. Products have HTML-formatted descriptions from a rich text editor, and the catalog must support multi-variant products (e.g., a sofa available in three colors and two sizes).

## Output Specification

Produce a Node.js/TypeScript script named `generate-catalog-feed.ts` (or `.js`) that:

1. Takes the sample product data provided below and generates a TikTok-compatible product catalog feed.
2. Writes the feed to a file named `tiktok-catalog.feed`.

Also produce a `SETUP.md` file that explains how to register the generated feed with TikTok and keep it up to date automatically.

## Input Files

The following sample product data is provided. Extract it before beginning.

=============== FILE: inputs/products.json ===============
[
  {
    "id": "prod-001",
    "name": "Oslo Oak Dining Table",
    "slug": "oslo-oak-dining-table",
    "description": "<p>A <strong>solid oak</strong> dining table with minimalist Scandinavian design. Seats 6 comfortably. <em>Assembly required.</em></p><ul><li>Dimensions: 180x90x75cm</li><li>Material: Solid oak</li></ul>",
    "brandName": "NordicHome",
    "gpcCategory": "436",
    "images": [
      { "url": "https://cdn.example.com/products/oslo-oak-dining-table/main.jpg" }
    ],
    "variants": [
      { "sku": "OSLO-OAK-NAT", "title": "Natural", "price": 849.00, "stockQuantity": 12, "images": [] },
      { "sku": "OSLO-OAK-WHT", "title": "White Washed", "price": 899.00, "stockQuantity": 0, "images": [] }
    ]
  },
  {
    "id": "prod-002",
    "name": "Arc Floor Lamp",
    "slug": "arc-floor-lamp",
    "description": "<p>Elegant arc floor lamp with a <strong>marble base</strong> and adjustable head. Perfect for reading corners and living rooms.</p>",
    "brandName": "LuminaHome",
    "gpcCategory": "594",
    "images": [
      { "url": "https://cdn.example.com/products/arc-floor-lamp/main.jpg" }
    ],
    "variants": [
      { "sku": "ARC-LAMP-BLK", "title": "Matte Black", "price": 249.00, "stockQuantity": 25, "images": [{ "url": "https://cdn.example.com/products/arc-floor-lamp/black.jpg" }] },
      { "sku": "ARC-LAMP-GLD", "title": "Brushed Gold", "price": 279.00, "stockQuantity": 8, "images": [{ "url": "https://cdn.example.com/products/arc-floor-lamp/gold.jpg" }] }
    ]
  },
  {
    "id": "prod-003",
    "name": "Woven Seagrass Basket",
    "slug": "woven-seagrass-basket",
    "description": "<p>Hand-woven seagrass storage basket. Ideal for blankets, toys, or plants. Each piece is <em>slightly unique</em> due to the natural material.</p>",
    "brandName": "NordicHome",
    "gpcCategory": "696",
    "images": [
      { "url": "https://cdn.example.com/products/woven-seagrass-basket/main.jpg" }
    ],
    "variants": [
      { "sku": "SEAGRASS-SM", "title": "Small (30cm)", "price": 34.99, "stockQuantity": 50, "images": [] },
      { "sku": "SEAGRASS-MD", "title": "Medium (45cm)", "price": 49.99, "stockQuantity": 30, "images": [] },
      { "sku": "SEAGRASS-LG", "title": "Large (60cm)", "price": 69.99, "stockQuantity": 0, "images": [] }
    ]
  }
]

The store URL base is: https://shop.nordichome-example.com
