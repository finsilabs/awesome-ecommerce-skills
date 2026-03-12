# Bundle Pricing Engine

## Problem/Feature Description

A retail platform sells product bundles — curated sets of items offered at various price points. The merchandising team needs flexible control over how bundles are priced: sometimes a bundle should cost exactly whatever its components add up to, sometimes it should be sold at a flat rate, and sometimes they want to offer a percentage or dollar-amount discount off the component total. The same pricing engine must be reliable for all of these cases.

The platform's engineering team is building a standalone pricing utility that can be called server-side whenever a shopper views or adds a bundle. The utility must accept a bundle configuration and a list of selected product variants (with quantities), look up the current prices for those variants, and produce a complete pricing breakdown. The output needs to power the display of both the bundle's final price and the savings a shopper receives, so all relevant figures must be returned.

## Output Specification

Produce a self-contained JavaScript (or TypeScript) module in a file called `bundlePricing.js` (or `bundlePricing.ts`) that exports a pricing function. The module should work with the sample data provided below — you may use in-memory data structures to simulate a database lookup.

Also produce a `demo.js` (or equivalent) script that calls the function with test inputs covering all the different ways a bundle can be priced, and writes the results to stdout. Running `node demo.js` (or equivalent) should print the pricing output for each case.

Include a short `README.md` explaining how to run the demo.

## Input Files

The following data represents your product catalog and bundle configurations. Extract them before beginning.

=============== FILE: inputs/products.json ===============
{
  "variants": [
    { "id": "var_camera_body", "productId": "prod_camera", "name": "Sony A6000 Body", "price": 499.00 },
    { "id": "var_lens_kit", "productId": "prod_lens", "name": "16-50mm Kit Lens", "price": 149.00 },
    { "id": "var_bag", "productId": "prod_bag", "name": "Camera Bag", "price": 59.00 },
    { "id": "var_tripod", "productId": "prod_tripod", "name": "Travel Tripod", "price": 79.00 },
    { "id": "var_memory_card", "productId": "prod_card", "name": "64GB SD Card", "price": 25.00 }
  ]
}

=============== FILE: inputs/bundles.json ===============
{
  "bundles": [
    {
      "id": "bundle_sum",
      "name": "Starter Set (Sum Pricing)",
      "bundle_type": "fixed",
      "pricing_type": "sum",
      "pricing_value": null,
      "components": [
        { "variant_id": "var_camera_body", "quantity": 1 },
        { "variant_id": "var_memory_card", "quantity": 2 }
      ]
    },
    {
      "id": "bundle_fixed",
      "name": "Lens + Bag Bundle (Fixed Price)",
      "bundle_type": "fixed",
      "pricing_type": "fixed",
      "pricing_value": 179.00,
      "components": [
        { "variant_id": "var_lens_kit", "quantity": 1 },
        { "variant_id": "var_bag", "quantity": 1 }
      ]
    },
    {
      "id": "bundle_discount_pct",
      "name": "Camera Kit (10% Off)",
      "bundle_type": "fixed",
      "pricing_type": "discount_pct",
      "pricing_value": 10,
      "components": [
        { "variant_id": "var_camera_body", "quantity": 1 },
        { "variant_id": "var_lens_kit", "quantity": 1 },
        { "variant_id": "var_bag", "quantity": 1 }
      ]
    },
    {
      "id": "bundle_discount_abs",
      "name": "Travel Kit ($50 Off)",
      "bundle_type": "fixed",
      "pricing_type": "discount_abs",
      "pricing_value": 50,
      "components": [
        { "variant_id": "var_camera_body", "quantity": 1 },
        { "variant_id": "var_tripod", "quantity": 1 },
        { "variant_id": "var_memory_card", "quantity": 2 }
      ]
    }
  ]
}
