# Outdoor Gear Product Data Enrichment

## Problem/Feature Description

OutdoorPeak is an outdoor equipment retailer running a Shopify store with 150+ products. To comply with new EU product regulations, they need to surface structured technical data — weight, dimensions (length, width, height in cm), and primary material — for every product on both the product pages and via the storefront API for a companion mobile app.

Their developer team has been storing this data in product descriptions as unstructured text, which means it can't be queried programmatically or displayed consistently. The solution is to introduce properly typed custom fields that can be read in themes and through the API. The team has heard that fields not set up correctly won't show up in the storefront, and that bulk operations are needed to set data across all products without hitting rate limits.

You've been provided with a sample dataset of 30 products and asked to write a TypeScript script that sets up the required fields and populates them from the provided data. The script should run standalone without requiring a running Shopify store — it should output a dry-run log showing exactly what Admin API mutations it would execute (the mutation names, variables, and batch structure), but should NOT actually call any live API.

## Output Specification

Produce the following files:

- `setup-metafields.ts` — A TypeScript script that:
  1. Defines and would create the necessary field type definitions (one per attribute) on the PRODUCT owner type
  2. Bulk-sets metafield values for all 30 products using the provided data
  3. Logs to stdout the mutations and batched variable payloads it would send (dry-run mode, no live API calls)

- `dry-run-output.txt` — The actual stdout output produced by running the script (capture it with `npx ts-node setup-metafields.ts > dry-run-output.txt` or equivalent). This must include the mutation names called and at least one example of the variable payload for each mutation type, showing the batch structure.

- `schema-notes.md` — A short document listing each field's namespace, key, and type, plus a brief explanation of any batching strategy used.

## Input Files

The following product data is provided as input. Extract it before beginning.

=============== FILE: inputs/products.json ===============
[
  { "id": "gid://shopify/Product/1001", "weight_grams": 450, "length_cm": 32.5, "width_cm": 18.0, "height_cm": 12.0, "material": "Aluminum" },
  { "id": "gid://shopify/Product/1002", "weight_grams": 1200, "length_cm": 55.0, "width_cm": 30.0, "height_cm": 25.0, "material": "Nylon" },
  { "id": "gid://shopify/Product/1003", "weight_grams": 85, "length_cm": 15.0, "width_cm": 8.0, "height_cm": 3.0, "material": "Stainless Steel" },
  { "id": "gid://shopify/Product/1004", "weight_grams": 600, "length_cm": 40.0, "width_cm": 22.0, "height_cm": 15.0, "material": "Polycarbonate" },
  { "id": "gid://shopify/Product/1005", "weight_grams": 320, "length_cm": 28.0, "width_cm": 14.0, "height_cm": 9.5, "material": "Carbon Fiber" },
  { "id": "gid://shopify/Product/1006", "weight_grams": 2400, "length_cm": 70.0, "width_cm": 45.0, "height_cm": 30.0, "material": "Canvas" },
  { "id": "gid://shopify/Product/1007", "weight_grams": 150, "length_cm": 20.0, "width_cm": 10.0, "height_cm": 5.0, "material": "Titanium" },
  { "id": "gid://shopify/Product/1008", "weight_grams": 980, "length_cm": 48.0, "width_cm": 28.0, "height_cm": 20.0, "material": "Polyester" },
  { "id": "gid://shopify/Product/1009", "weight_grams": 75, "length_cm": 12.0, "width_cm": 6.0, "height_cm": 2.5, "material": "Rubber" },
  { "id": "gid://shopify/Product/1010", "weight_grams": 1800, "length_cm": 60.0, "width_cm": 35.0, "height_cm": 28.0, "material": "Gore-Tex" },
  { "id": "gid://shopify/Product/1011", "weight_grams": 560, "length_cm": 38.0, "width_cm": 20.0, "height_cm": 14.0, "material": "Aluminum" },
  { "id": "gid://shopify/Product/1012", "weight_grams": 3200, "length_cm": 80.0, "width_cm": 50.0, "height_cm": 35.0, "material": "Nylon" },
  { "id": "gid://shopify/Product/1013", "weight_grams": 95, "length_cm": 16.0, "width_cm": 9.0, "height_cm": 4.0, "material": "Stainless Steel" },
  { "id": "gid://shopify/Product/1014", "weight_grams": 720, "length_cm": 42.0, "width_cm": 24.0, "height_cm": 16.0, "material": "Polycarbonate" },
  { "id": "gid://shopify/Product/1015", "weight_grams": 410, "length_cm": 30.0, "width_cm": 16.0, "height_cm": 11.0, "material": "Carbon Fiber" },
  { "id": "gid://shopify/Product/1016", "weight_grams": 2800, "length_cm": 75.0, "width_cm": 48.0, "height_cm": 32.0, "material": "Canvas" },
  { "id": "gid://shopify/Product/1017", "weight_grams": 180, "length_cm": 22.0, "width_cm": 12.0, "height_cm": 6.0, "material": "Titanium" },
  { "id": "gid://shopify/Product/1018", "weight_grams": 1100, "length_cm": 52.0, "width_cm": 30.0, "height_cm": 22.0, "material": "Polyester" },
  { "id": "gid://shopify/Product/1019", "weight_grams": 60, "length_cm": 10.0, "width_cm": 5.0, "height_cm": 2.0, "material": "Rubber" },
  { "id": "gid://shopify/Product/1020", "weight_grams": 2100, "length_cm": 65.0, "width_cm": 38.0, "height_cm": 30.0, "material": "Gore-Tex" },
  { "id": "gid://shopify/Product/1021", "weight_grams": 500, "length_cm": 35.0, "width_cm": 19.0, "height_cm": 13.0, "material": "Aluminum" },
  { "id": "gid://shopify/Product/1022", "weight_grams": 1400, "length_cm": 58.0, "width_cm": 32.0, "height_cm": 26.0, "material": "Nylon" },
  { "id": "gid://shopify/Product/1023", "weight_grams": 90, "length_cm": 14.0, "width_cm": 7.5, "height_cm": 3.5, "material": "Stainless Steel" },
  { "id": "gid://shopify/Product/1024", "weight_grams": 680, "length_cm": 41.0, "width_cm": 23.0, "height_cm": 15.5, "material": "Polycarbonate" },
  { "id": "gid://shopify/Product/1025", "weight_grams": 370, "length_cm": 29.0, "width_cm": 15.0, "height_cm": 10.0, "material": "Carbon Fiber" },
  { "id": "gid://shopify/Product/1026", "weight_grams": 2600, "length_cm": 72.0, "width_cm": 46.0, "height_cm": 31.0, "material": "Canvas" },
  { "id": "gid://shopify/Product/1027", "weight_grams": 160, "length_cm": 21.0, "width_cm": 11.0, "height_cm": 5.5, "material": "Titanium" },
  { "id": "gid://shopify/Product/1028", "weight_grams": 1050, "length_cm": 50.0, "width_cm": 29.0, "height_cm": 21.0, "material": "Polyester" },
  { "id": "gid://shopify/Product/1029", "weight_grams": 70, "length_cm": 11.0, "width_cm": 5.5, "height_cm": 2.2, "material": "Rubber" },
  { "id": "gid://shopify/Product/1030", "weight_grams": 1950, "length_cm": 62.0, "width_cm": 36.0, "height_cm": 29.0, "material": "Gore-Tex" }
]
