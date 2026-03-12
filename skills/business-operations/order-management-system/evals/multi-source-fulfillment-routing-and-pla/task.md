# Distributed Fulfillment Routing Engine

## Problem/Feature Description

RetailFlow is launching a new multi-channel e-commerce platform that will integrate three company-owned warehouses (in Seattle, Chicago, and Atlanta) with two dropship suppliers. When a customer places an order, the platform needs to automatically decide where each item should ship from — ideally the company's own stock (cheaper margins) and always from the location closest to the customer to minimize shipping time and cost. If no warehouse has stock, the system should fall back to a dropship supplier, preferring the cheapest one. Items that are unavailable anywhere should not block the rest of the order from shipping.

Because checkout latency is critical (the company targets sub-200ms API responses), the actual shipment planning and creation of fulfillment records must not happen synchronously during checkout. The checkout endpoint confirms payment and hands off to background processing. Additionally, the platform's product manager has flagged a user experience concern: customers who order both an in-stock and an out-of-stock item have previously complained about receiving an unexpected second shipment with no warning. The new system should address this.

## Output Specification

Produce the following TypeScript files:

- `fulfillment-router.ts` — contains the routing logic for a single order line and the fulfillment planning logic that groups lines into shipment groups
- `fulfillment-service.ts` — contains the function that persists the fulfillment plan to the database and the integration point with the async background queue

Also produce `fulfillment-design.md` explaining:
- How the system handles orders that will arrive in multiple shipments from the customer's perspective
- The data model relationship between orders, fulfillments, and fulfillment lines

Stub out any database or queue calls — the code does not need to be runnable, but the logic, data structures, and flow must be complete.

## Input Files

The following configuration file describes the available fulfillment sources. Extract it before beginning.

=============== FILE: inputs/fulfillment-sources.json ===============
{
  "warehouses": [
    { "id": "wh-sea", "name": "Seattle Warehouse", "location": { "lat": 47.6062, "lng": -122.3321 } },
    { "id": "wh-chi", "name": "Chicago Warehouse", "location": { "lat": 41.8781, "lng": -87.6298 } },
    { "id": "wh-atl", "name": "Atlanta Warehouse", "location": { "lat": 33.7490, "lng": -84.3880 } }
  ],
  "dropshipSuppliers": [
    { "id": "sup-alpha", "name": "Alpha Goods", "costTier": "economy" },
    { "id": "sup-beta",  "name": "Beta Direct",  "costTier": "premium" }
  ]
}
