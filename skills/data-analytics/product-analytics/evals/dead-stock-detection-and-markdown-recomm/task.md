# Seasonal Inventory Clearance Planner

## Problem/Feature Description

A fashion retailer is approaching the end of the season and the buying team needs to clear slow-moving inventory before the next collection arrives. Capital tied up in unsold stock affects cash flow and warehouse space. The team wants an automated analysis that flags which products are candidates for clearance and generates specific pricing recommendations — with enough detail for the merchandising team to act on immediately.

The retailer has a mix of fashion-forward items and perennial basics, and the buying team has found that fashion pieces tend to stale out much faster than basics. They need the analysis to reflect this: more aggressive thresholds for trend items, more lenient ones for timeless basics. The output should make it clear how much money is tied up in each flagged product, not just how many units are on hand.

## Output Specification

Write a self-contained TypeScript script (`clearance_analysis.ts`) that:

1. Processes the sample product inventory data provided below.
2. Identifies which products qualify as dead stock.
3. For each dead stock item, produces a markdown recommendation with a specific suggested price.
4. Prints a JSON report to stdout containing all flagged products and their recommendations.

The JSON report should include for each flagged product: product id, product name, current price, suggested price, markdown percentage, inventory value (units × cost), days on hand, and a short human-readable reason string.

The script must be runnable with `npx ts-node clearance_analysis.ts` (no database connection required — operate on the inline data below).

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/products.json ===============
[
  {
    "id": "P001", "name": "Floral Wrap Dress", "sku": "FWD-001",
    "category": "fashion", "status": "active",
    "price_cents": 8900, "cost_cents": 3200,
    "first_available_at": "2025-09-15T00:00:00Z",
    "inventory_received": 120, "inventory_on_hand": 98,
    "units_sold": 22, "last_sale_date": "2026-01-10T00:00:00Z"
  },
  {
    "id": "P002", "name": "Classic White Oxford Shirt", "sku": "CWO-002",
    "category": "basics", "status": "active",
    "price_cents": 5500, "cost_cents": 1800,
    "first_available_at": "2025-06-01T00:00:00Z",
    "inventory_received": 200, "inventory_on_hand": 60,
    "units_sold": 140, "last_sale_date": "2026-03-10T00:00:00Z"
  },
  {
    "id": "P003", "name": "Sequin Mini Skirt", "sku": "SMS-003",
    "category": "fashion", "status": "active",
    "price_cents": 7200, "cost_cents": 2600,
    "first_available_at": "2025-10-01T00:00:00Z",
    "inventory_received": 80, "inventory_on_hand": 72,
    "units_sold": 8, "last_sale_date": "2025-12-20T00:00:00Z"
  },
  {
    "id": "P004", "name": "Merino Wool Crewneck", "sku": "MWC-004",
    "category": "basics", "status": "active",
    "price_cents": 9500, "cost_cents": 4100,
    "first_available_at": "2025-08-01T00:00:00Z",
    "inventory_received": 150, "inventory_on_hand": 115,
    "units_sold": 35, "last_sale_date": "2026-02-28T00:00:00Z"
  },
  {
    "id": "P005", "name": "Neon Utility Jacket", "sku": "NUJ-005",
    "category": "fashion", "status": "active",
    "price_cents": 14500, "cost_cents": 5800,
    "first_available_at": "2025-11-01T00:00:00Z",
    "inventory_received": 40, "inventory_on_hand": 38,
    "units_sold": 2, "last_sale_date": "2025-11-15T00:00:00Z"
  },
  {
    "id": "P006", "name": "Linen Blend Trousers", "sku": "LBT-006",
    "category": "basics", "status": "active",
    "price_cents": 6800, "cost_cents": 2200,
    "first_available_at": "2026-02-20T00:00:00Z",
    "inventory_received": 90, "inventory_on_hand": 88,
    "units_sold": 2, "last_sale_date": "2026-03-05T00:00:00Z"
  },
  {
    "id": "P007", "name": "Vintage Band Tee", "sku": "VBT-007",
    "category": "fashion", "status": "active",
    "price_cents": 3500, "cost_cents": 800,
    "first_available_at": "2025-07-01T00:00:00Z",
    "inventory_received": 300, "inventory_on_hand": 241,
    "units_sold": 59, "last_sale_date": "2026-01-30T00:00:00Z"
  }
]
