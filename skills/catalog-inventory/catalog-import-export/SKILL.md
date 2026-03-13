---
name: catalog-import-export
description: "Import and export your entire product catalog in bulk using your platform's native tools or dedicated apps, with validation and scheduled sync support"
category: catalog-inventory
risk: safe
source: curated
date_added: "2026-03-12"
tags: [import, export, csv, json, xml, bulk, validation, etl, catalog]
triggers: ["import products CSV", "bulk product import", "export catalog", "product feed", "catalog sync", "bulk upload products"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Catalog Import / Export

## Overview

Bulk importing and exporting products is a core catalog management task — whether you're onboarding a new store from a supplier spreadsheet, doing mass price updates, or feeding products to Google Merchant Center. Every major platform has native import/export tools that handle this without custom code. Use them first; only build a custom pipeline if your volume, format, or validation requirements exceed what the platform offers.

## When to Use This Skill

- When onboarding a new merchant whose catalog lives in a spreadsheet or ERP system
- When syncing product data from a supplier or PIM on a scheduled basis
- When merchants need to do mass price or inventory updates without coding
- When building a product feed export for Google Merchant Center, Amazon, or comparison shopping engines

## Core Instructions

### Step 1: Determine the platform and choose the right import tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Matrixify (Bulk Product Import Export) | Handles complex catalogs with metafields, variants, multiple images, and collections; supports scheduled sync and error reports |
| **Shopify (simple)** | Shopify's built-in CSV import | Free, sufficient for basic catalogs under a few hundred products with standard fields only |
| **WooCommerce** | WP All Import Pro | Most powerful WooCommerce import tool; supports CSV/XML, field mapping, scheduled imports, and conditional logic |
| **WooCommerce (built-in)** | WooCommerce Product CSV Importer | Ships with WooCommerce; handles products, variations, and images for simple use cases |
| **BigCommerce** | Built-in bulk import / Feedonomics | BigCommerce's native import handles most needs; Feedonomics for multi-channel feed management |
| **Custom / Headless** | Build a custom pipeline | Only if your platform has no native tools or your validation/transformation requirements are too complex |

---

### Step 2: Prepare your import file

Regardless of platform, product import files follow a similar structure. Use the platform's sample CSV as your template:

- **Shopify**: Download the sample CSV from **Products → Import → Download sample CSV**
- **WooCommerce**: Download from **Products → Import → Download sample CSV**
- **BigCommerce**: Download from **Products → Import & Export → Download template**

Key fields almost every platform requires:

| Field | Notes |
|-------|-------|
| Handle / Slug | URL-safe unique identifier (e.g., `blue-cotton-tshirt`) |
| Title | Product name |
| Price | Decimal, e.g., `29.99` |
| SKU | Unique per variant |
| Inventory Quantity | Integer |
| Images | Comma-separated URLs or upload separately |
| Variant options | Size, Color, etc. |

**Important formatting rules:**
- Save CSV files as UTF-8 encoding (in Excel: Save As → CSV UTF-8)
- Use the exact column headers from the platform's sample template
- Dates in ISO format: `2026-03-12`
- Boolean values: `true` / `false` (not `yes`/`no` or `1`/`0` unless the platform specifies)

---

### Step 3: Platform-specific setup

---

#### Shopify

**Option A: Built-in CSV import (simple catalogs)**

1. Go to **Admin → Products → Import**
2. Download the sample CSV to use as a template
3. Prepare your file following Shopify's column format exactly
4. Upload the CSV and click **Import products**
5. Shopify shows a summary of what will be created/updated; review before confirming

Limitations: No support for metafields, custom collections, or complex variant logic in the built-in importer.

**Option B: Matrixify (recommended for complex catalogs)**

1. Install **Matrixify** from the Shopify App Store
2. In Matrixify, click **Export** to download your current catalog as a reference spreadsheet
3. Use the exported format to prepare your import file — it includes all supported columns with examples
4. Upload your file and click **Import**
5. Matrixify shows a row-by-row error report — download it and fix errors before re-running
6. For scheduled sync: go to **Matrixify → Schedules → Add schedule**, set frequency (hourly, daily, etc.), and point to a Google Sheets URL or FTP path

**Exporting for Google Merchant Center:**
1. In Matrixify, go to **Export**
2. Choose **Google Shopping** as the export template
3. Download the feed XML and upload to Google Merchant Center, or use Matrixify's direct Google Sheets sync

---

#### WooCommerce

**Option A: Built-in product importer**

1. Go to **WooCommerce → Products → Import**
2. Upload your CSV file
3. On the column mapping screen, match your CSV columns to WooCommerce fields
4. Click **Run the importer** — WooCommerce shows a progress bar and summary

**Option B: WP All Import Pro (recommended for advanced needs)**

1. Install **WP All Import Pro** + the **WooCommerce Add-On**
2. Go to **All Import → New Import**
3. Upload your CSV or XML file, or enter a URL for scheduled imports
4. Use the drag-and-drop field mapper to connect your file's columns to WooCommerce product fields
5. Set up **Scheduling**: All Import → Manage Imports → Edit → Run automatically every X hours
6. Review the import log at **All Import → History** — errors are listed with row numbers

**For Google Merchant Center feed export:**
- Install **Product Feed Pro for WooCommerce** (free)
- Go to **Product Feed Pro → Manage Feeds → Add Feed**
- Select Google Shopping as the template
- Configure and publish the feed URL directly to Google Merchant Center

---

#### BigCommerce

**Built-in bulk import:**

1. Go to **Products → Import & Export → Import Products**
2. Download the CSV template
3. Prepare your file and upload
4. BigCommerce validates the file and shows a preview before committing
5. For images: host images at accessible URLs and include them in the `Product Image URL` column

**Google Shopping feed:**
- Go to **Channel Manager → Google Shopping**
- BigCommerce has native Google Shopping integration — connect your Google Merchant Center account and BigCommerce syncs the catalog automatically

**For advanced multi-channel feeds:** Install **Feedonomics** or **GoDataFeed** from the BigCommerce App Marketplace for Amazon, eBay, and comparison engine feeds.

---

#### Custom / Headless

For headless storefronts, build a pipeline that validates, transforms, and upserts products:

```typescript
// lib/catalogImport.ts
import { z } from 'zod';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';

// Define and validate the import schema
const productRowSchema = z.object({
  handle: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Handle must be lowercase alphanumeric with hyphens'),
  title: z.string().min(1).max(255),
  price: z.coerce.number().positive(),
  sku: z.string().min(1),
  inventory_quantity: z.coerce.number().int().min(0).default(0),
  image_url: z.string().url().optional(),
});

// Stream-parse large CSV files without loading into memory
export async function* parseCatalogCsv(filePath: string) {
  const parser = createReadStream(filePath).pipe(
    parse({ columns: true, skip_empty_lines: true, trim: true })
  );
  let rowIndex = 2;
  for await (const rawRow of parser) {
    const result = productRowSchema.safeParse(rawRow);
    yield result.success
      ? { row: rowIndex, data: result.data, errors: null }
      : { row: rowIndex, data: null, errors: result.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) };
    rowIndex++;
  }
}

// Process as an async job with upsert logic (idempotent, safe to re-run)
export async function runCatalogImport(filePath: string) {
  let processed = 0;
  const errors: { row: number; errors: { field: string; message: string }[] }[] = [];

  for await (const { row, data, errors: rowErrors } of parseCatalogCsv(filePath)) {
    if (rowErrors) { errors.push({ row, errors: rowErrors }); continue; }
    // Upsert by handle — re-running the same file won't create duplicates
    await db.products.upsert({ where: { handle: data!.handle }, create: data!, update: data! });
    processed++;
  }

  return { processed, errorCount: errors.length, errors: errors.slice(0, 50) };
}
```

For Google Merchant Center XML export:

```typescript
import { create } from 'xmlbuilder2';

export async function exportGoogleFeed(products: Product[]) {
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('rss', { version: '2.0', 'xmlns:g': 'http://base.google.com/ns/1.0' })
    .ele('channel');

  for (const product of products) {
    const item = root.ele('item');
    item.ele('g:id').txt(product.sku);
    item.ele('g:title').txt(product.title);
    item.ele('g:price').txt(`${product.price} USD`);
    item.ele('g:availability').txt(product.inStock ? 'in_stock' : 'out_of_stock');
    item.ele('g:link').txt(`https://yourstore.com/products/${product.handle}`);
    item.ele('g:image_link').txt(product.images[0]);
  }

  return root.end({ prettyPrint: true });
}
```

---

### Step 4: Validate before committing

All platforms support a preview/dry-run step — always use it before committing a large import:

- **Shopify built-in**: Review the "X products to create / X to update" summary before clicking Import
- **Matrixify**: The import preview shows which rows have errors with the specific column and issue
- **WP All Import**: Use "Dry Run" mode to preview what will be created/updated
- **BigCommerce**: The upload validation step shows errors before processing

Fix all errors listed in the validation step before proceeding. A partial import — where some rows succeed and others fail — is harder to clean up than re-running a fully corrected file.

---

### Step 5: Monitor and verify

After importing:

1. **Spot-check 5–10 random products** in the admin to verify titles, prices, images, and variants loaded correctly
2. **Check the error log** — Matrixify and WP All Import generate downloadable error reports with row numbers
3. **Verify inventory counts** — if inventory was included in the import, confirm it matches expectations
4. **Test on the storefront** — search for and open 2–3 imported products to verify they display correctly

## Best Practices

- **Always use the platform's sample CSV as your starting template** — hand-crafting a CSV from scratch almost always produces header mismatches
- **Import in batches of 500–1000 products** for large catalogs — easier to debug errors and the platform UI stays responsive
- **Keep a backup of the current catalog** before a large import — export the existing catalog first so you can restore if something goes wrong
- **Don't update inventory via a product import** if you have a separate inventory sync running — two systems updating the same field will conflict
- **Use handles/slugs as the stable unique key**, not titles — product titles change, handles should not
- **Schedule recurring imports at off-peak hours** — large syncs can slow the admin interface during peak business hours

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| CSV import fails with encoding errors | Ensure the file is saved as UTF-8 (in Excel: File → Save As → CSV UTF-8); special characters in product names are the most common cause |
| Images don't appear after import | Images must be hosted at publicly accessible HTTPS URLs at import time; Shopify and WooCommerce download them during import |
| Variants not created correctly | Ensure your CSV has one row per variant (not one row per product); Shopify's CSV format uses repeated handle rows for multiple variants |
| Import creates duplicate products on re-run | Use a tool that supports upsert by handle/SKU (Matrixify, WP All Import); avoid tools that only support insert |
| Inventory reset to 0 after product import | Keep inventory out of the product import CSV if you manage it separately; most platforms let you skip inventory columns |
| Google feed rejected by Merchant Center | Verify required fields: `id`, `title`, `description`, `link`, `image_link`, `availability`, `price`, `brand`, `gtin` or `mpn` |

## Related Skills

- @variant-matrix
- @product-data-modeling
- @multi-warehouse
- @product-content-enrichment
