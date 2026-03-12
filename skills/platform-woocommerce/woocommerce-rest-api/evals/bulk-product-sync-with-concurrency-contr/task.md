# Supplier Catalog Sync to WooCommerce

## Problem/Feature Description

A fashion retailer runs their storefront on WooCommerce and receives daily price and stock updates from their supplier in a JSON feed. Currently, a team member manually downloads the feed and updates products one by one in WordPress Admin, which takes hours and introduces errors. The operations team wants a Node.js script that reads the supplier feed and automatically updates prices and stock in WooCommerce.

The challenge is that the supplier catalog contains thousands of products, and naively firing off requests in parallel risks overwhelming the store's server — the hosting plan has limited PHP workers. The team also wants the script to handle partial failures gracefully: if a handful of updates fail, the rest should continue and a failure count should be reported at the end.

Additionally, for products where only prices and stock need changing across many items at once, the script should take advantage of WooCommerce's bulk endpoint to reduce the number of HTTP round-trips.

## Output Specification

Produce a Node.js TypeScript project with the following structure:
- `package.json` with required dependencies
- `src/sync.ts` — the main sync script that:
  - Reads the supplier feed from `supplier-feed.json` (provided below)
  - Updates prices and stock for each matching WooCommerce product (matched by SKU)
  - Uses concurrency control to avoid overwhelming the server
  - Reports how many products were updated, skipped (SKU not found), and failed
- `src/lib/woocommerce.ts` — WooCommerce client initialization
- `README.md` describing how to set the required environment variables and run the script

Do not include any real credentials in the code. The script should read configuration from environment variables.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: supplier-feed.json ===============
[
  { "sku": "SHIRT-RED-M", "price": 29.99, "stock": 45 },
  { "sku": "SHIRT-RED-L", "price": 29.99, "stock": 12 },
  { "sku": "SHIRT-BLUE-M", "price": 27.99, "stock": 0 },
  { "sku": "PANTS-BLK-32", "price": 59.99, "stock": 8 },
  { "sku": "PANTS-BLK-34", "price": 59.99, "stock": 3 },
  { "sku": "JACKET-GRN-L", "price": 149.99, "stock": 20 },
  { "sku": "JACKET-GRN-XL", "price": 149.99, "stock": 7 },
  { "sku": "HAT-ONE-SIZE", "price": 19.99, "stock": 100 }
]
