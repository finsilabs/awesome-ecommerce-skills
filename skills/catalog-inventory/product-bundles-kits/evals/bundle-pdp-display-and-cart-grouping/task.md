# Bundle Product Page and Cart Display

## Problem/Feature Description

A home goods retailer sells curated product sets — for example, a "Bedroom Refresh Kit" that lets shoppers pick from several mattress sizes paired with a pre-selected comforter and pillow set. When a shopper lands on the bundle's product page, they need to see clearly how much they would spend buying the items separately versus the bundle price, and the savings should be highlighted. When a component the shopper wants is out of stock, the page should tell them specifically which item isn't available.

The front-end team also wants the shopping cart to feel cohesive: bundle items should appear visually grouped under the bundle name, with a clear savings indicator, so shoppers understand what they bought and why the prices look the way they do. The team needs a set of React components that handle both the bundle product detail page and the cart bundle group view, along with a working demo that exercises the full flow including a scenario where a component is out of stock.

## Output Specification

Produce React components (`.jsx` or `.tsx`) for:
- A bundle product detail page component
- A cart bundle group display component

Also produce a `demo.jsx` (or `App.jsx`) that renders both components with the provided sample data in at least two states:
1. All components available (with a dynamic kit variant that can be switched)
2. One component out of stock

Use a bundler/runner that can be started with a standard command (e.g. `npm start`, `npx vite`, or render to a static HTML file). Include a `README.md` explaining how to run it.

If a full browser environment is too complex to set up, producing the components plus a Node.js script that renders them to an HTML string and writes `output.html` is also acceptable.

## Input Files

Extract the following files before beginning.

=============== FILE: inputs/bundle-data.json ===============
{
  "bundle": {
    "id": "bundle_bedroom_refresh",
    "name": "Bedroom Refresh Kit",
    "bundle_type": "dynamic",
    "pricing_type": "discount_pct",
    "pricing_value": 12,
    "components": [
      {
        "id": "comp_mattress",
        "group_name": "Mattress",
        "is_required": true,
        "variant_id": null,
        "quantity": 1,
        "selectable_products": [
          {
            "id": "prod_queen_mattress",
            "name": "Queen Mattress",
            "variants": [
              { "id": "var_queen_plush", "name": "Plush", "price": 599.00 },
              { "id": "var_queen_firm", "name": "Firm", "price": 629.00 }
            ]
          },
          {
            "id": "prod_king_mattress",
            "name": "King Mattress",
            "variants": [
              { "id": "var_king_plush", "name": "Plush", "price": 749.00 },
              { "id": "var_king_firm", "name": "Firm", "price": 789.00 }
            ]
          }
        ]
      },
      {
        "id": "comp_comforter",
        "group_name": "Comforter",
        "is_required": true,
        "variant_id": "var_down_comforter",
        "quantity": 1,
        "selectable_products": []
      },
      {
        "id": "comp_pillows",
        "group_name": "Pillow Set",
        "is_required": true,
        "variant_id": "var_pillow_set_2pk",
        "quantity": 1,
        "selectable_products": []
      }
    ]
  },
  "variants": {
    "var_queen_plush":   { "id": "var_queen_plush",   "name": "Queen Plush Mattress",  "price": 599.00 },
    "var_queen_firm":    { "id": "var_queen_firm",    "name": "Queen Firm Mattress",   "price": 629.00 },
    "var_king_plush":    { "id": "var_king_plush",    "name": "King Plush Mattress",   "price": 749.00 },
    "var_king_firm":     { "id": "var_king_firm",     "name": "King Firm Mattress",    "price": 789.00 },
    "var_down_comforter":{ "id": "var_down_comforter","name": "Down Comforter",        "price": 149.00 },
    "var_pillow_set_2pk":{ "id": "var_pillow_set_2pk","name": "Pillow Set (2-pack)",   "price": 79.00  }
  },
  "inventory": {
    "var_queen_plush":    { "onHand": 8,  "reserved": 1 },
    "var_queen_firm":     { "onHand": 5,  "reserved": 0 },
    "var_king_plush":     { "onHand": 2,  "reserved": 2 },
    "var_king_firm":      { "onHand": 3,  "reserved": 0 },
    "var_down_comforter": { "onHand": 0,  "reserved": 0 },
    "var_pillow_set_2pk": { "onHand": 12, "reserved": 2 }
  },
  "sampleCartBundleGroup": {
    "id": "cbg_001",
    "bundleId": "bundle_bedroom_refresh",
    "bundleName": "Bedroom Refresh Kit",
    "bundlePrice": 730.56,
    "bundleSavings": 99.44,
    "items": [
      { "id": "li_001", "variantId": "var_queen_plush",    "name": "Queen Plush Mattress",  "unitPrice": 520.50, "quantity": 1, "bundleGroupId": "cbg_001" },
      { "id": "li_002", "variantId": "var_down_comforter", "name": "Down Comforter",        "unitPrice": 129.48, "quantity": 1, "bundleGroupId": "cbg_001" },
      { "id": "li_003", "variantId": "var_pillow_set_2pk", "name": "Pillow Set (2-pack)",   "unitPrice": 80.58,  "quantity": 1, "bundleGroupId": "cbg_001" }
    ]
  }
}
