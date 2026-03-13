---
name: catalog-import-export
description: "Import and export your entire product catalog in CSV, JSON, or XML with validation, error reporting, and scheduled sync support"
category: catalog-inventory
risk: safe
source: curated
date_added: "2026-03-12"
tags: [import, export, csv, json, xml, bulk, validation, etl, catalog]
triggers: ["import products CSV", "bulk product import", "export catalog", "product feed", "catalog sync", "bulk upload products"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Catalog Import / Export

## Overview

Build a robust pipeline for bulk importing and exporting products via CSV, JSON, and XML. Covers schema validation with detailed error reporting, streaming large files to avoid memory exhaustion, idempotent upserts to allow re-running imports safely, and async job processing with status polling so merchants are not blocked waiting for large imports to complete.

## When to Use This Skill

- When onboarding a new merchant whose catalog lives in a spreadsheet or ERP system
- When syncing product data from a supplier or PIM on a scheduled basis
- When merchants need to do mass price or inventory updates without coding
- When building a product feed export for Google Merchant Center, Amazon, or comparison shopping engines

## Prerequisites & Platform Notes

**Shopify**: Shopify has built-in inventory management, product variants, and metafields. Use the Shopify Admin API for bulk operations. For advanced needs, apps like Stocky or custom Shopify Functions.
**WooCommerce**: WooCommerce has built-in stock management. Extend with plugins (ATUM, WP All Import for bulk catalog). Use WooCommerce REST API for integrations.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A store with product catalog access, API credentials

## Core Instructions

1. **Define and validate the CSV import schema**

   Establish a canonical column schema and validate each row before processing. Return structured errors so merchants can fix their files.

   ```javascript
   // lib/catalogSchema.js
   import { z } from 'zod';

   export const productRowSchema = z.object({
     handle: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Handle must be lowercase alphanumeric with hyphens'),
     title: z.string().min(1).max(255),
     description: z.string().optional(),
     vendor: z.string().optional(),
     product_type: z.string().optional(),
     tags: z.string().optional(),                          // comma-separated
     price: z.coerce.number().positive(),
     compare_at_price: z.coerce.number().positive().optional(),
     sku: z.string().min(1).max(100),
     inventory_quantity: z.coerce.number().int().min(0).default(0),
     weight_kg: z.coerce.number().min(0).optional(),
     option1_name: z.string().optional(),
     option1_value: z.string().optional(),
     option2_name: z.string().optional(),
     option2_value: z.string().optional(),
     image_url: z.string().url().optional(),
     published: z.enum(['true', 'false', '1', '0']).transform(v => ['true','1'].includes(v)).default('true'),
   });
   ```

2. **Stream-parse large CSV files without loading the entire file into memory**

   ```javascript
   // lib/csvParser.js
   import { createReadStream } from 'fs';
   import { parse } from 'csv-parse';
   import { productRowSchema } from './catalogSchema';

   export async function* parseCatalogCsv(filePath) {
     const parser = createReadStream(filePath).pipe(
       parse({
         columns: true,        // Use first row as headers
         skip_empty_lines: true,
         trim: true,
       })
     );

     let rowIndex = 2; // Row 1 is the header
     for await (const rawRow of parser) {
       const result = productRowSchema.safeParse(rawRow);
       if (result.success) {
         yield { row: rowIndex, data: result.data, errors: null };
       } else {
         yield {
           row: rowIndex,
           data: null,
           errors: result.error.issues.map(i => ({
             field: i.path.join('.'),
             message: i.message,
           })),
         };
       }
       rowIndex++;
     }
   }
   ```

3. **Process the import as an async job with upsert logic**

   ```javascript
   // jobs/catalogImport.js
   import { parseCatalogCsv } from '../lib/csvParser';

   export async function runCatalogImport(jobId, filePath, merchantId) {
     const errors = [];
     let processed = 0;
     let skipped = 0;

     await db.importJobs.update({
       where: { id: jobId },
       data: { status: 'processing', startedAt: new Date() },
     });

     try {
       for await (const { row, data, errors: rowErrors } of parseCatalogCsv(filePath)) {
         if (rowErrors) {
           errors.push({ row, errors: rowErrors });
           skipped++;
           continue;
         }

         // Upsert by handle — idempotent, safe to re-run
         const product = await db.products.upsert({
           where: { handle_merchantId: { handle: data.handle, merchantId } },
           create: {
             handle: data.handle,
             merchantId,
             title: data.title,
             description: data.description,
             vendor: data.vendor,
             productType: data.product_type,
             tags: data.tags?.split(',').map(t => t.trim()) ?? [],
             published: data.published,
           },
           update: {
             title: data.title,
             description: data.description,
             vendor: data.vendor,
             productType: data.product_type,
             tags: data.tags?.split(',').map(t => t.trim()) ?? [],
             published: data.published,
           },
         });

         // Upsert variant by SKU
         await db.productVariants.upsert({
           where: { sku_merchantId: { sku: data.sku, merchantId } },
           create: {
             productId: product.id,
             sku: data.sku,
             price: data.price,
             compareAtPrice: data.compare_at_price,
             inventoryQuantity: data.inventory_quantity,
             option1Value: data.option1_value,
             option2Value: data.option2_value,
           },
           update: {
             price: data.price,
             compareAtPrice: data.compare_at_price,
             inventoryQuantity: data.inventory_quantity,
           },
         });

         processed++;

         // Update progress every 100 rows
         if (processed % 100 === 0) {
           await db.importJobs.update({
             where: { id: jobId },
             data: { processedRows: processed },
           });
         }
       }

       await db.importJobs.update({
         where: { id: jobId },
         data: {
           status: errors.length > 0 ? 'completed_with_errors' : 'completed',
           processedRows: processed,
           skippedRows: skipped,
           errorLog: errors,
           completedAt: new Date(),
         },
       });
     } catch (err) {
       await db.importJobs.update({
         where: { id: jobId },
         data: { status: 'failed', errorLog: [{ message: err.message }] },
       });
       throw err;
     }
   }
   ```

4. **Upload endpoint and job status polling**

   ```javascript
   // api/catalog/import.js
   import multer from 'multer';
   import { v4 as uuid } from 'uuid';
   import { runCatalogImport } from '../../jobs/catalogImport';

   const upload = multer({ dest: '/tmp/catalog-uploads/' });

   // POST /api/catalog/import
   export const importCatalog = [
     upload.single('file'),
     async (req, res) => {
       if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

       const allowedMimeTypes = ['text/csv', 'application/json'];
       if (!allowedMimeTypes.includes(req.file.mimetype)) {
         return res.status(400).json({ error: 'Only CSV and JSON files are accepted' });
       }

       const jobId = uuid();
       await db.importJobs.create({
         data: { id: jobId, merchantId: req.merchantId, status: 'queued', filePath: req.file.path },
       });

       // Queue async — do not await
       runCatalogImport(jobId, req.file.path, req.merchantId).catch(console.error);

       res.status(202).json({ jobId, status: 'queued' });
     },
   ];

   // GET /api/catalog/import/:jobId
   export async function getImportStatus(req, res) {
     const job = await db.importJobs.findUnique({ where: { id: req.params.jobId } });
     if (!job) return res.status(404).json({ error: 'Job not found' });
     res.json({
       jobId: job.id,
       status: job.status,
       processedRows: job.processedRows,
       skippedRows: job.skippedRows,
       errors: job.errorLog?.slice(0, 50) ?? [], // Return first 50 errors
       completedAt: job.completedAt,
     });
   }
   ```

5. **Export catalog to CSV**

   ```javascript
   // api/catalog/export.js
   import { stringify } from 'csv-stringify';
   import { pipeline } from 'stream/promises';

   export async function exportCatalog(req, res) {
     const merchantId = req.merchantId;

     res.setHeader('Content-Type', 'text/csv');
     res.setHeader('Content-Disposition', `attachment; filename="catalog-${Date.now()}.csv"`);

     const stringifier = stringify({
       header: true,
       columns: [
         'handle','title','vendor','product_type','tags',
         'price','compare_at_price','sku','inventory_quantity',
         'option1_name','option1_value','option2_name','option2_value',
         'image_url','published',
       ],
     });

     // Stream products in batches of 500 to avoid loading entire catalog
     const BATCH_SIZE = 500;
     let cursor = undefined;
     stringifier.pipe(res);

     while (true) {
       const products = await db.products.findMany({
         where: { merchantId },
         take: BATCH_SIZE,
         skip: cursor ? 1 : 0,
         cursor: cursor ? { id: cursor } : undefined,
         orderBy: { id: 'asc' },
         include: { variants: { take: 1 } },
       });

       if (products.length === 0) break;

       for (const product of products) {
         const variant = product.variants[0];
         stringifier.write({
           handle: product.handle,
           title: product.title,
           vendor: product.vendor,
           product_type: product.productType,
           tags: product.tags?.join(','),
           price: variant?.price,
           sku: variant?.sku,
           inventory_quantity: variant?.inventoryQuantity,
           published: product.published,
         });
       }

       cursor = products[products.length - 1].id;
       if (products.length < BATCH_SIZE) break;
     }

     stringifier.end();
   }
   ```

## Examples

### Validate import file before processing (dry-run mode)

```javascript
export async function dryRunImport(filePath) {
  const errors = [];
  let validRows = 0;
  for await (const { row, data, errors: rowErrors } of parseCatalogCsv(filePath)) {
    if (rowErrors) {
      errors.push({ row, errors: rowErrors });
    } else {
      validRows++;
    }
  }
  return { validRows, errorRows: errors.length, errors: errors.slice(0, 100) };
}
```

### Google Merchant Center feed export (XML)

```javascript
import { create } from 'xmlbuilder2';

export async function exportGoogleFeed(products) {
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('rss', { version: '2.0', 'xmlns:g': 'http://base.google.com/ns/1.0' })
    .ele('channel');

  for (const product of products) {
    const item = root.ele('item');
    item.ele('g:id').txt(product.id);
    item.ele('g:title').txt(product.title);
    item.ele('g:price').txt(`${product.price} USD`);
    item.ele('g:availability').txt(product.inStock ? 'in_stock' : 'out_of_stock');
    item.ele('g:link').txt(`https://yourstore.com/products/${product.handle}`);
    item.ele('g:image_link').txt(product.images[0]);
  }

  return root.end({ prettyPrint: true });
}
```

## Best Practices

- **Stream large files** — do not load a 50 MB CSV into memory at once; use streaming parsers and write results in batches
- **Use upserts, not insert-or-fail** — imports should be idempotent; re-running the same file must not create duplicates
- **Return row-level error details** — generic "row 547 failed" is not useful; report the field name and what was expected
- **Implement dry-run mode** — let merchants preview errors before committing; prevents partial imports that leave the catalog in a bad state
- **Process as an async job** — a 10,000-row import can take several minutes; accept the file, return a job ID, and let the merchant poll for status
- **Validate file type and size server-side** — check the actual file content (magic bytes), not just the extension; limit file size (e.g., 50 MB maximum)
- **Archive raw import files** — store uploaded files in object storage (S3) for 90 days; merchants often need to debug post-import discrepancies

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Memory exhaustion on large CSV | Use streaming parsers (`csv-parse` with async iteration); never call `fs.readFileSync` on uploaded files |
| Import creates duplicate products on re-run | Use `upsert` with a stable unique key (handle + merchantId or SKU); never use plain `insert` for idempotent imports |
| Special characters corrupt CSV parsing | Specify `encoding: 'utf8'` in the parser; document that files must be saved as UTF-8 in Excel before upload |
| Import job has no progress feedback | Update `processedRows` in the database every N rows; expose it via the status endpoint |
| Inventory zeroed out on every import | Make inventory an optional column; only update it when the column is present and non-empty in the import row |

## Related Skills

- @variant-matrix
- @product-data-modeling
- @multi-warehouse
- @product-content-enrichment
