# Real-Time Inventory Synchronization Across Channels

## Problem/Feature Description

Meadowbrook Outdoors sells camping gear through their own DTC website, Amazon US, and Walmart Marketplace. During peak season last year, their operations team found that Amazon and Walmart were both showing 12 units available for a popular tent while only 8 were physically in stock. When both channels sold units at the same time, they ended up with 4 oversell incidents that required manual cancellations and refund processing — a nightmare for customer satisfaction scores.

Their engineering team has just migrated to a unified PostgreSQL database using a shared inventory table (with `quantity_on_hand` and `reserved` columns) alongside a `channel_listings` table and a `channel_inventory_allocations` table that lets certain channels be capped at a maximum allocation. They now need TypeScript service functions to (a) safely reserve inventory when an order arrives from any channel, and (b) push updated available quantities to each active channel listing after any stock change.

## Output Specification

Produce a `inventory-service.ts` file containing:
1. A `reserveInventory(productId, channelId, quantity, orderId)` function
2. A `pushInventoryToChannels(productId)` function that fans out to all active channel listings

You may stub out the external marketplace sync calls (e.g. `syncAmazonInventory`, `syncWalmartInventory`) and database access (e.g. `db.inventory.findByProductId`) as simple async function stubs — focus on the logic and control flow.

Also produce a `design-notes.md` explaining when inventory syncs should be triggered (what events should cause a sync to fire) and why using only a nightly scheduled job would be insufficient.
