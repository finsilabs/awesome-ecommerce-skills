# Real-Time Merchant Center Sync Service

## Problem Description

Bloom & Branch is a fast-moving home goods retailer with a dynamic catalog: flash sales can start and end within hours, and warehouse inventory fluctuates throughout the day. Their current setup relies on Google's automatic 24-hour feed re-crawl, meaning a product can show as in-stock in Shopping ads long after it has sold out — or worse, customers click on an ad only to find the sale price has already expired.

The engineering team wants to build two TypeScript services:

1. **A real-time inventory and price sync** — When the warehouse management system triggers a webhook listing SKUs that have changed (price or stock level), the service should push updated product data directly to Google Merchant Center as quickly as possible. The team expects batches of up to several hundred SKUs at once during peak restock or repricing events, so efficiency is critical.

2. **A promotions overlay feed** — The marketing team runs scheduled promotions configured in a database. Rather than touching the primary product feed (which could introduce crawl lag), they want a separate endpoint that Merchant Center can fetch to get current sale prices with start and end dates.

Build a TypeScript implementation covering both of these services. Since no real database or Merchant Center account is available, define mock data inline (a few product variants with prices and a couple of active promotions) and demonstrate the structure of both services. Write the output to `sync-service.ts` and include comments explaining key decisions.

## Output Specification

- `sync-service.ts`: Contains both the batch sync function and the supplemental feed endpoint handler
- The batch sync function should accept an array of SKU strings and push the corresponding product data to Merchant Center
- The supplemental feed handler should return the promotions data in the appropriate format with correct HTTP headers
- Use realistic mock data (at least 3 product variants and 2 active promotions) defined inline

No large files should be left on disk. The implementation does not need to connect to a real API — just demonstrate the correct structure and calls.
