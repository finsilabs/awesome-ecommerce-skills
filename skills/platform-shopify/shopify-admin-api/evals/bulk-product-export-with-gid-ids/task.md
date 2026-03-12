# Large-Scale Product Catalog Export

## Problem/Feature Description

A mid-sized e-commerce company runs a Shopify store with over 8,000 active products. Their data analytics team needs a complete snapshot of the product catalog — including each product's ID, title, status, and all variant details (SKU, price, inventory quantity) — to feed into their business intelligence dashboard. Previously, a developer tried to fetch everything with paginated API calls and the job kept timing out or hitting rate limits after a few hundred products.

The team wants a Node.js TypeScript script that reliably exports all products to a local JSONL file. The script should be executable from the command line, handle the entire product catalog without manual pagination, and be robust enough to run as a nightly job. Since the exported file will eventually be piped downstream, it should write results only when the export is fully finished. The team also wants to understand how the process works, so the script should log its progress to the console.

## Output Specification

Produce a working TypeScript script (`export-products.ts`) that exports all products from a Shopify store. The script should:

- Accept Shopify store credentials via environment variables (`SHOPIFY_ADMIN_API_TOKEN`, `SHOPIFY_SHOP`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`)
- Export product data including id, title, status, and all variants (id, sku, price, inventoryQuantity)
- Write the results to `products-export.jsonl` (one JSON object per line)
- Print progress/status messages to stdout as it runs

Also produce a brief `README.md` explaining how to install dependencies and run the script.
