# Bundle Add-to-Cart Service

## Problem/Feature Description

An outdoor gear retailer offers product bundles — for example, a "Camping Essentials" bundle containing a tent, sleeping bag, and camp stove at a discounted price. When a customer clicks "Add Bundle to Cart," the system needs to correctly record all the items, track the discount, and ensure everything is actually in stock.

The backend team is building a cart service module responsible for handling bundle additions. A key requirement from the fulfillment team is that each product in a bundle must remain a standard, independently trackable line item in the cart so it can be picked, packed, and shipped normally. At the same time, the finance team needs to know how the bundle discount was distributed across items for tax and accounting purposes. The service must also block shoppers from adding a bundle when any component lacks sufficient inventory, and it must clearly communicate which component caused the problem.

## Output Specification

Implement a JavaScript (or TypeScript) module in `cartBundles.js` (or `cartBundles.ts`) that exports an add-to-cart function for bundles. Use the in-memory data provided below to simulate database state (products, inventory levels, and cart).

Also produce a `demo.js` script that runs at least two scenarios:
1. A successful bundle addition where all items are in stock
2. A failed addition where one or more components have insufficient inventory

The demo should print the resulting cart state (line items, bundle group records) and any error/unavailability details to stdout. Include a short `README.md` with run instructions.

## Input Files

Extract the following files before beginning.

=============== FILE: inputs/catalog.json ===============
{
  "variants": [
    { "id": "var_tent", "productId": "prod_tent", "name": "2-Person Tent", "price": 189.00 },
    { "id": "var_sleeping_bag", "productId": "prod_sleeping_bag", "name": "20°F Sleeping Bag", "price": 129.00 },
    { "id": "var_stove", "productId": "prod_stove", "name": "Backpacking Stove", "price": 69.00 },
    { "id": "var_headlamp", "productId": "prod_headlamp", "name": "LED Headlamp", "price": 45.00 },
    { "id": "var_trekking_poles", "productId": "prod_poles", "name": "Trekking Poles (pair)", "price": 89.00 }
  ],
  "inventory": [
    { "variantId": "var_tent", "onHand": 10, "reserved": 2 },
    { "variantId": "var_sleeping_bag", "onHand": 5, "reserved": 4 },
    { "variantId": "var_stove", "onHand": 20, "reserved": 1 },
    { "variantId": "var_headlamp", "onHand": 3, "reserved": 3 },
    { "variantId": "var_trekking_poles", "onHand": 7, "reserved": 1 }
  ]
}

=============== FILE: inputs/bundles.json ===============
{
  "bundles": [
    {
      "id": "bundle_camping_essentials",
      "name": "Camping Essentials",
      "bundle_type": "fixed",
      "pricing_type": "discount_pct",
      "pricing_value": 15,
      "components": [
        { "variantId": "var_tent", "quantity": 1, "isRequired": true },
        { "variantId": "var_sleeping_bag", "quantity": 1, "isRequired": true },
        { "variantId": "var_stove", "quantity": 1, "isRequired": true }
      ]
    },
    {
      "id": "bundle_headlamp_kit",
      "name": "Light & Pole Kit",
      "bundle_type": "fixed",
      "pricing_type": "discount_abs",
      "pricing_value": 20,
      "components": [
        { "variantId": "var_headlamp", "quantity": 2, "isRequired": true },
        { "variantId": "var_trekking_poles", "quantity": 1, "isRequired": true }
      ]
    }
  ]
}
