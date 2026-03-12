# Supplier Order Routing Engine

## Problem/Feature Description

A furniture retailer operates a dropshipping model with five active supplier partners. When a customer places an order containing multiple products, each product may be fulfilled by a different supplier depending on who has stock and at what cost. The platform needs a routing engine that automatically assigns each order line to the best available supplier and then dispatches the order to that supplier through whatever integration method the supplier supports.

Some suppliers offer a REST API for order placement, while others use email. The company has experienced occasional timeouts when contacting supplier APIs, and a handful of duplicate orders have already been sent to suppliers as a result of retry attempts — causing costly double-shipments to customers. Supplier API credentials are sensitive and must not be used or stored in plaintext anywhere in the codebase.

## Output Specification

Write a TypeScript module named `orderRouting.ts` that exports:

1. A `selectBestSupplier(productId, requiredQty)` function that picks the optimal supplier for a given product and required quantity
2. A `routeOrderToSupplier(orderId)` function that groups all order lines and creates the appropriate dropship order records
3. A `submitDropshipOrder(dropshipOrderId)` function that sends a pending dropship order to the supplier

You may use stub implementations for database access (e.g., a `db` object with methods like `db.supplierProducts.findOne(...)`) and for any helper functions like `decryptApiKey` or `submitViaEmail`. The logic and structure of the code is what matters.

Include a brief `DESIGN.md` explaining your approach to preventing duplicate submissions.
