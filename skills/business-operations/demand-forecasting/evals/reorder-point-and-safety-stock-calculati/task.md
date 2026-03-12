# Inventory Replenishment Recommendations

## Problem/Feature Description

A mid-size e-commerce retailer carries about 200 active SKUs across several product categories. The purchasing team currently relies on gut instinct to decide when and how much to reorder, which has led to a string of costly stockouts during peak periods and excessive overstock on slower-moving items. Management wants an automated replenishment recommendation engine that ingests a product catalog with inventory levels and recent demand data, then outputs a prioritized list of items that need to be ordered — along with exactly how much to order.

The company works with suppliers that have varying lead times, and some products have minimum order quantities imposed by the supplier. There are also several open purchase orders already in flight that must be accounted for so the system doesn't double-order. The purchasing team should only see items that actually need attention; anything with comfortable stock levels should not appear in the report.

## Output Specification

Write a self-contained TypeScript script (`replenishment.ts`) that:

1. Reads the product and inventory data provided below
2. For each product, computes the recommended replenishment action
3. Writes a JSON file `replenishment_report.json` containing only the products that need action, sorted so the most urgent items appear first

The report should include for each item: `productId`, `currentStock`, `reorderPoint`, `recommendedOrderQty`, `daysOfSupply`, and `urgency`.

Also write a brief `notes.md` (3-5 bullet points) explaining the key formulas and thresholds your implementation uses.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/products.json ===============
[
  { "id": "SKU-001", "name": "Wireless Headphones", "supplier_lead_time_days": 10, "min_order_quantity": 50, "velocity_tier": "high" },
  { "id": "SKU-002", "name": "Phone Case 6-inch", "supplier_lead_time_days": 5, "min_order_quantity": 100, "velocity_tier": "high" },
  { "id": "SKU-003", "name": "Laptop Stand", "supplier_lead_time_days": 14, "min_order_quantity": 20, "velocity_tier": "low" },
  { "id": "SKU-004", "name": "USB-C Cable 2m", "supplier_lead_time_days": null, "min_order_quantity": 200, "velocity_tier": "high" },
  { "id": "SKU-005", "name": "Desk Lamp", "supplier_lead_time_days": 7, "min_order_quantity": 10, "velocity_tier": "low" }
]

=============== FILE: inputs/inventory.json ===============
[
  { "productId": "SKU-001", "quantity_on_hand": 45, "quantity_on_order": 0 },
  { "productId": "SKU-002", "quantity_on_hand": 310, "quantity_on_order": 200 },
  { "productId": "SKU-003", "quantity_on_hand": 8, "quantity_on_order": 0 },
  { "productId": "SKU-004", "quantity_on_hand": 180, "quantity_on_order": 0 },
  { "productId": "SKU-005", "quantity_on_hand": 95, "quantity_on_order": 50 }
]

=============== FILE: inputs/demand_stats.json ===============
[
  { "productId": "SKU-001", "avg_daily_demand": 4.8, "residual_std_dev": 2.1 },
  { "productId": "SKU-002", "avg_daily_demand": 18.5, "residual_std_dev": 5.3 },
  { "productId": "SKU-003", "avg_daily_demand": 0.6, "residual_std_dev": 0.4 },
  { "productId": "SKU-004", "avg_daily_demand": 12.2, "residual_std_dev": 3.8 },
  { "productId": "SKU-005", "avg_daily_demand": 0.0, "residual_std_dev": 0.1 }
]
