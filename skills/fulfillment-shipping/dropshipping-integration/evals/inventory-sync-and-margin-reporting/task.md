# Dropship Inventory Sync and Margin Reporting

## Problem/Feature Description

A sporting goods retailer has been running a dropshipping operation with multiple suppliers for six months. Some suppliers provide their inventory data through a REST API, while others upload a CSV file to an FTP server each morning. The ops team has been burned twice recently: once when a product showed as available on the storefront but the supplier had already sold out (the inventory sync was too infrequent), and once when a product was discontinued by a supplier but continued to show in-stock because the old record was never cleared.

The finance team also needs a monthly vendor performance report showing gross margin by supplier so they can negotiate better pricing with underperforming partners. The existing codebase already has database access helpers (a `db` object), an `downloadFtpFile(ftpConfig, filename)` utility, and a `decryptApiKey(encryptedKey)` function available.

## Output Specification

Produce the following files:

1. `inventorySync.ts` — A TypeScript module implementing:
   - A `syncSupplierInventory(supplierId)` function that handles both API and CSV/FTP feed sources
   - A scheduled job that automatically syncs all active suppliers on a regular cadence

2. `marginCalculation.ts` — A TypeScript module implementing:
   - A `calculateDropshipMargin(orderId)` function that returns revenue, cost, gross margin in cents, and gross margin percentage for a given order

3. `marginReport.sql` — A SQL query that produces a per-supplier margin summary, returning supplier name, order count, total revenue, total cost, gross margin amount, and gross margin percentage. Only include fulfilled orders and limit to recent activity.

You may use stub database access patterns (e.g., `db.suppliers.findAll(...)`, `db.raw(...)`) for the TypeScript code.
