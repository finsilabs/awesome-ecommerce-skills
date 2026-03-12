# Real-Time Inventory Sync: Square POS Webhook Handler

## Problem/Feature Description

Pinnacle Sports is a multi-location sporting goods retailer with an online store built on Next.js and several physical locations running Square POS terminals. When a staff member rings up a sale at any store, the online store needs to reflect the updated stock immediately — customers have been completing purchases online for items that were already sold in-store, leading to oversells and angry order cancellations.

The team wants to build a webhook endpoint that Square will call whenever inventory changes, payments complete, or catalog updates occur. Security is critical: Square signs every webhook delivery, and the handler must reject any unsigned or tampered requests. The online store should never expose the full physical stock count directly — the visible quantity should account for the fact that in-store sales can happen faster than the sync propagates.

The endpoint will be deployed as a Next.js App Router API route at `/api/webhooks/square`.

## Output Specification

Produce the following files:

- `app/api/webhooks/square/route.ts` — the Next.js App Router POST handler
- `lib/pos/inventory-handler.ts` — the inventory update logic called from the webhook (may be inlined into route.ts if you prefer)

Also produce a `NOTES.md` file (max 200 words) that explains:
1. How the signature verification works and why it is constructed the way it is
2. How online-visible inventory is calculated from the raw location counts

Assume the following are already implemented (do not redefine them, just import/reference them):
- `db.variants.findBySquareCatalogId(variationId)` — returns a variant object with `.sku`
- `db.inventory.updateLocationQuantity(sku, locationId, qty)` — sets qty for one location
- `db.inventory.getTotalAvailable(sku)` — returns total available (you must implement the safety stock logic here or in the webhook handler)
- `syncInventoryAcrossChannels({sku, quantity, source})` — pushes the quantity to the online store
- `syncCatalogFromSquare()` — re-fetches catalog from Square
- `handleSquarePayment(obj)` and `handleSquareRefund(obj)` — stubs you may reference
