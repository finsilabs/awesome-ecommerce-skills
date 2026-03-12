# Product Feed Export System

## Problem Description

Trendsetter Marketplace wants to distribute their product catalog to external channels — specifically Google Shopping and a partner retailer that needs a regular CSV export. The catalog contains over 50,000 products and past attempts to export the whole catalog in a single query brought the server to its knees. The team tried using a simple JSON stringify approach first, but generated files were tens of megabytes and caused browser timeouts before the download started.

For the Google Shopping integration, the feed must follow Google's RSS-based product feed specification so it can be directly submitted to Google Merchant Center without conversion. For the partner retailer, a standard CSV export is needed with a specific set of columns they have agreed upon. Both exports need to work efficiently regardless of catalog size.

Your task is to implement the export functionality as a standalone Node.js module (no database required — use the provided in-memory product data). The implementation should demonstrate how it would work in a real HTTP server context.

## Output Specification

Build a Node.js module `src/exportCatalog.js` that exports:

1. `exportCatalogCsv(products, res)` — streams a CSV export to an HTTP response object
2. `exportGoogleFeed(products)` — returns a Google Merchant Center XML string

Also produce:
- `demo.js` — demonstrates both export functions using the provided product data. For the CSV export, pipe output to a file `outputs/catalog-export.csv`. For the Google feed, write the XML to `outputs/google-feed.xml`.

Run `demo.js` to produce the output files.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/products.json ===============
[
  {
    "id": "prod_001",
    "handle": "womens-running-shoe-v2",
    "title": "Women's CloudStep Running Shoe V2",
    "vendor": "Trendsetter",
    "productType": "Footwear",
    "tags": ["running", "women", "lightweight"],
    "published": true,
    "inStock": true,
    "images": ["https://cdn.trendsetter.io/shoes/cloudstep-v2-main.jpg"],
    "variants": [
      {
        "sku": "TRD-SHO-001-6",
        "price": 129.99,
        "compareAtPrice": 159.99,
        "inventoryQuantity": 45,
        "option1Name": "Size",
        "option1Value": "6",
        "option2Name": null,
        "option2Value": null
      }
    ]
  },
  {
    "id": "prod_002",
    "handle": "mens-casual-chino",
    "title": "Men's Slim Fit Casual Chino",
    "vendor": "Trendsetter",
    "productType": "Bottoms",
    "tags": ["casual", "chino", "men"],
    "published": true,
    "inStock": true,
    "images": ["https://cdn.trendsetter.io/bottoms/chino-slim-main.jpg"],
    "variants": [
      {
        "sku": "TRD-CHN-002-32",
        "price": 79.99,
        "compareAtPrice": null,
        "inventoryQuantity": 120,
        "option1Name": "Size",
        "option1Value": "32",
        "option2Name": null,
        "option2Value": null
      }
    ]
  },
  {
    "id": "prod_003",
    "handle": "oversized-knit-sweater",
    "title": "Oversized Cable Knit Sweater",
    "vendor": "Trendsetter",
    "productType": "Knitwear",
    "tags": ["knitwear", "oversized", "winter"],
    "published": true,
    "inStock": false,
    "images": ["https://cdn.trendsetter.io/knitwear/cable-knit-main.jpg"],
    "variants": [
      {
        "sku": "TRD-KNT-003-M",
        "price": 119.00,
        "compareAtPrice": 149.00,
        "inventoryQuantity": 0,
        "option1Name": "Size",
        "option1Value": "M",
        "option2Name": null,
        "option2Value": null
      }
    ]
  },
  {
    "id": "prod_004",
    "handle": "leather-crossbody-bag",
    "title": "Genuine Leather Crossbody Bag",
    "vendor": "Trendsetter",
    "productType": "Accessories",
    "tags": ["leather", "crossbody", "bag"],
    "published": true,
    "inStock": true,
    "images": ["https://cdn.trendsetter.io/bags/leather-crossbody-main.jpg"],
    "variants": [
      {
        "sku": "TRD-BAG-004-TAN",
        "price": 189.00,
        "compareAtPrice": 220.00,
        "inventoryQuantity": 30,
        "option1Name": "Color",
        "option1Value": "Tan",
        "option2Name": null,
        "option2Value": null
      }
    ]
  },
  {
    "id": "prod_005",
    "handle": "performance-yoga-mat",
    "title": "Non-Slip Performance Yoga Mat",
    "vendor": "Trendsetter Active",
    "productType": "Fitness",
    "tags": ["yoga", "fitness", "non-slip"],
    "published": false,
    "inStock": true,
    "images": ["https://cdn.trendsetter.io/fitness/yoga-mat-main.jpg"],
    "variants": [
      {
        "sku": "TRD-YGA-005-STD",
        "price": 64.99,
        "compareAtPrice": null,
        "inventoryQuantity": 75,
        "option1Name": null,
        "option1Value": null,
        "option2Name": null,
        "option2Value": null
      }
    ]
  }
]
