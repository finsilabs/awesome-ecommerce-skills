---
name: variant-matrix
description: "Generate and manage variant combinations (size x color x material) with SKU strategies"
category: catalog-inventory
risk: safe
source: curated
date_added: "2026-03-12"
tags: [variants, sku, matrix, combinations, options, catalog, product-data]
triggers: ["product variants", "size color variants", "variant combinations", "SKU generation", "option matrix", "variant matrix"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Variant Matrix

## Overview

Generate and manage the Cartesian product of variant options (e.g., size × color × material) to produce a complete set of SKUs. Covers the data model for products with options, an algorithm for generating all combinations, SKU naming conventions, and strategies for handling large matrices (100+ combinations) including selective variant publication and bulk price/inventory overrides.

## When to Use This Skill

- When modeling apparel, footwear, or accessories where products have multiple option axes
- When importing products from a supplier CSV with flat variant rows that need to be grouped
- When building an admin interface for merchants to manage variant pricing and inventory
- When implementing a variant selector on the product detail page (size/color pickers)

## Core Instructions

1. **Design the product-options-variants data model**

   ```javascript
   // Database schema (normalized)

   // products table
   { id, name, base_sku, description, ... }

   // product_options table — defines the option axes
   { id, product_id, name: 'Size', position: 0 }
   { id, product_id, name: 'Color', position: 1 }

   // product_option_values table — values for each axis
   { id, option_id, value: 'S', position: 0 }
   { id, option_id, value: 'M', position: 1 }
   { id, option_id, value: 'Red', position: 0 }
   { id, option_id, value: 'Blue', position: 1 }

   // product_variants table — one row per combination
   {
     id,
     product_id,
     sku: 'SHIRT-RED-S',
     price: 29.99,
     compare_at_price: 39.99,
     inventory_quantity: 10,
     option1_value: 'S',   // denormalized for query performance
     option2_value: 'Red',
     option3_value: null,
     weight: 0.3,
     image_id: null,
     published: true,
   }
   ```

2. **Generate all variant combinations (Cartesian product)**

   ```javascript
   // lib/variantMatrix.js

   /**
    * Generate the Cartesian product of multiple option value arrays.
    * Input:  [['S','M','L'], ['Red','Blue']]
    * Output: [['S','Red'], ['S','Blue'], ['M','Red'], ['M','Blue'], ['L','Red'], ['L','Blue']]
    */
   export function cartesianProduct(arrays) {
     return arrays.reduce(
       (acc, values) => acc.flatMap(combo => values.map(v => [...combo, v])),
       [[]]
     );
   }

   /**
    * Generate SKUs from option combinations.
    * baseSku: 'SHIRT'
    * combinations: [['S','Red'], ['S','Blue']]
    * Output: [{ sku: 'SHIRT-S-RED', options: { Size: 'S', Color: 'Red' } }, ...]
    */
   export function generateVariants(baseSku, optionNames, optionValues) {
     const combinations = cartesianProduct(optionValues);
     return combinations.map(combo => ({
       sku: [baseSku, ...combo].join('-').toUpperCase().replace(/\s+/g, '-'),
       options: Object.fromEntries(optionNames.map((name, i) => [name, combo[i]])),
       price: null,       // To be set individually or by bulk rule
       inventory: 0,
       published: true,
     }));
   }

   // Example usage
   const variants = generateVariants('SHIRT', ['Size', 'Color'], [
     ['XS', 'S', 'M', 'L', 'XL'],
     ['Red', 'Blue', 'Black'],
   ]);
   // Produces 15 variants: SHIRT-XS-RED, SHIRT-XS-BLUE, ..., SHIRT-XL-BLACK
   ```

3. **Diff existing variants against a new option set**

   When a merchant adds or removes an option value, compute which variants to create and which to archive rather than deleting (to preserve order history).

   ```javascript
   export function diffVariants(existingVariants, newCombinations, optionNames) {
     const existingKeys = new Set(existingVariants.map(v =>
       optionNames.map(n => v.options[n]).join('|')
     ));
     const newKeys = new Set(newCombinations.map(c => c.join('|')));

     const toCreate = newCombinations.filter(combo => !existingKeys.has(combo.join('|')));
     const toArchive = existingVariants.filter(v =>
       !newKeys.has(optionNames.map(n => v.options[n]).join('|'))
     );
     const unchanged = existingVariants.filter(v =>
       newKeys.has(optionNames.map(n => v.options[n]).join('|'))
     );

     return { toCreate, toArchive, unchanged };
   }
   ```

4. **Bulk price and inventory update**

   ```javascript
   // api/admin/products/[id]/variants/bulk-update.js
   export async function bulkUpdateVariants(req, res) {
     const { productId } = req.params;
     const { rule, filter } = req.body;
     // rule: { type: 'set_price'|'adjust_price_pct'|'set_inventory', value }
     // filter: { option: 'Size', value: 'XL' } — apply only to matching variants

     const variants = await db.productVariants.findMany({
       where: {
         productId,
         ...(filter ? { [`option${getOptionPosition(filter.option)}Value`]: filter.value } : {}),
       },
     });

     const updates = variants.map(v => {
       let newPrice = v.price;
       if (rule.type === 'set_price') newPrice = rule.value;
       if (rule.type === 'adjust_price_pct') newPrice = +(v.price * (1 + rule.value / 100)).toFixed(2);

       return db.productVariants.update({
         where: { id: v.id },
         data: {
           price: newPrice,
           ...(rule.type === 'set_inventory' ? { inventoryQuantity: rule.value } : {}),
         },
       });
     });

     await Promise.all(updates);
     res.json({ updated: variants.length });
   }
   ```

5. **Implement the variant selector UI**

   Build a UI that derives available options dynamically based on current selection, greying out unavailable combinations.

   ```javascript
   // lib/variantSelector.js

   export function getAvailableOptionValues(variants, currentSelections, targetOptionName) {
     // Return which values for targetOption are available given current selections for other options
     return variants
       .filter(v =>
         Object.entries(currentSelections)
           .filter(([optionName]) => optionName !== targetOptionName)
           .every(([optionName, value]) => v.options[optionName] === value)
       )
       .map(v => v.options[targetOptionName])
       .filter(Boolean);
   }

   export function findVariant(variants, selections) {
     return variants.find(v =>
       Object.entries(selections).every(([option, value]) => v.options[option] === value)
     ) ?? null;
   }

   // Usage:
   // User selects Size=M, now show available colors
   const availableColors = getAvailableOptionValues(variants, { Size: 'M' }, 'Color');
   // ['Red', 'Black'] — Blue is out of stock in size M
   ```

## Examples

### SKU naming conventions

Establish a consistent SKU formula that encodes variant attributes for easy warehouse identification:

```
Format: [PRODUCT-CODE]-[OPTION1]-[OPTION2]-[OPTION3]
Rules:
  - Max 20 characters total
  - Use standard abbreviations: S/M/L/XL for sizes, 3-letter ISO color codes
  - No spaces — use hyphens
  - All uppercase

Examples:
  SHIRT-WHT-M          → White T-Shirt, Medium
  SHOE-NVY-10          → Navy Shoe, Size 10
  BAG-BLK-LTR          → Black Bag, Leather material
```

### Handling large matrices (1000+ variants)

For products with many options (e.g., paint colors × finish × size = 500+ SKUs), use lazy generation:

```javascript
// Instead of storing all variants upfront, generate them on demand
export async function ensureVariantExists(productId, options) {
  const key = Object.values(options).join('|');
  const existing = await db.productVariants.findFirst({
    where: { productId, variantKey: key },
  });
  if (existing) return existing;

  // Create on first request
  return db.productVariants.create({
    data: {
      productId,
      sku: generateSku(product.baseSku, options),
      variantKey: key,
      options,
      price: applyPricingRules(product, options),
      inventoryQuantity: 0,
    },
  });
}
```

## Best Practices

- **Archive variants, do not delete them** — variants may have order history; mark as `published: false` when discontinued
- **Denormalize option values on the variant row** — store `option1_value`, `option2_value`, `option3_value` directly on variants for fast queries without joins
- **Generate SKUs algorithmically and validate uniqueness** — check for SKU collisions in the database before saving
- **Limit variant option axes to 3** — beyond 3 axes (e.g., size × color × material), the UX becomes complex and matrices grow exponentially
- **Provide bulk edit tools for price/inventory** — merchants with large catalogs cannot update 200 variants one at a time
- **Validate option value completeness** — warn merchants when not all combinations are published so they do not accidentally have unpurchasable options in the UI

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| SKU duplicates when option values have spaces or special characters | Normalize SKU segments: `.toUpperCase().trim().replace(/[^A-Z0-9]/g, '-')` before joining |
| Variant selector allows selecting unavailable combinations | Use `getAvailableOptionValues` to dynamically disable option values that have no in-stock variant with the current selections |
| Adding a new option value creates duplicate variants | Use the `diffVariants` function to compute new combinations; only insert truly new ones |
| Large matrix (500+ variants) slows page load | Fetch variant data via a separate API call on option change; do not embed all 500 variants in the HTML |
| Deleting a variant breaks historical orders | Set `published: false` and `deleted_at: now`; keep the row, never hard-delete a variant that has order line items |

## Related Skills

- @product-data-modeling
- @inventory-tracking
- @catalog-import-export
- @product-page-design
