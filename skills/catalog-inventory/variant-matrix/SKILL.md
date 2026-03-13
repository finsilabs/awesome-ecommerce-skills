---
name: variant-matrix
description: "Generate and manage all size/color/material combinations for a product using your platform's variant tools with bulk price and inventory management"
category: catalog-inventory
risk: safe
source: curated
date_added: "2026-03-12"
tags: [variants, sku, matrix, combinations, options, catalog, product-data]
triggers: ["product variants", "size color variants", "variant combinations", "SKU generation", "option matrix", "variant matrix"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Variant Matrix

## Overview

Product variants let one product listing cover all size/color/material combinations — each with its own price, SKU, and inventory. Platforms generate the full matrix of combinations from your option values and handle the variant selector UI automatically. The main tasks are: entering options correctly, generating all SKUs, setting per-variant pricing and inventory, and managing large matrices efficiently.

## When to Use This Skill

- When modeling apparel, footwear, or accessories where products have multiple option axes
- When importing products from a supplier CSV with flat variant rows that need to be grouped
- When building an admin interface for merchants to manage variant pricing and inventory
- When a variant selector on the product page needs to disable unavailable combinations

## Core Instructions

### Step 1: Determine platform and understand the variant model

| Platform | Options | Max Variants | Variant Fields |
|----------|---------|-------------|----------------|
| **Shopify** | Up to 3 options (e.g., Size, Color, Style) | 100 per product | Price, SKU, barcode, inventory, weight, image |
| **WooCommerce** | Unlimited attributes used as variations | Practically unlimited (performance degrades at ~50+) | Price, sale price, SKU, stock, weight, dimensions, image |
| **BigCommerce** | Unlimited options per product | 600 SKUs per product | Price adjustment, SKU, stock, weight, image |
| **Custom / Headless** | Design your own | Unlimited | Design your own variant fields |

---

### Step 2: Platform-specific variant setup

---

#### Shopify

**Creating variants from options:**

1. Go to **Admin → Products → [Product]**
2. Scroll to the **Options** section
3. Click **Add option** to add the first axis (e.g., Size)
4. Enter the option values: XS, S, M, L, XL
5. Add a second option (e.g., Color): Red, Blue, Black
6. Shopify generates all combinations automatically (5 × 3 = 15 variants)
7. Scroll to the **Variants** section to see the generated matrix

**Setting per-variant details:**
- Click any variant row to edit its price, SKU, inventory, weight, and image
- Or use **Edit variants** bulk view to update multiple variants at once

**Bulk variant management:**
- Select multiple variants using checkboxes → **Edit** to update price or inventory for a group
- For large catalogs: use **Matrixify** (App Store) to import a CSV with one row per variant — the most efficient way to set up a large matrix

**Disabling unavailable combinations:**
- Variants that have no inventory automatically show "Sold Out" on the product page
- Shopify's variant selector does not auto-disable unavailable combinations by default — most themes require adding logic or using a theme app to grey out sold-out options

**Adding/removing option values after launch:**
- Add a new size (e.g., "XXL"): go to the Options section, add the value
- Shopify adds new variants for the new value; existing variants are unchanged
- Archive discontinued variants instead of deleting — deletion removes order history links

---

#### WooCommerce

**Creating variations from attributes:**

1. Create global attributes: **Products → Attributes → Add Attribute** (e.g., Size with values XS, S, M, L, XL)
2. On your product, go to the **Attributes tab**
3. Select your attribute (Size), check **Used for variations**, click **Add**
4. Add all values this product uses
5. Go to the **Variations tab**
6. Click **Generate variations** → WooCommerce creates one variation per combination
7. Expand each variation to set price, SKU, stock, and image

**Bulk variation updates:**
- WooCommerce's variation editor can be slow for products with 20+ variations
- Use **WP All Import Pro** for importing large variation matrices via CSV
- Or use the **Variable Product Bulk Edit** plugin for batch price/inventory updates

**SKU generation:**
WooCommerce doesn't auto-generate SKUs. Enter them manually or use a pattern:
- Convention: `[PRODUCT-CODE]-[SIZE]-[COLOR]` → e.g., `SHIRT-M-RED`
- Use WP All Import to set SKUs in bulk from a spreadsheet

---

#### BigCommerce

**Creating options and variants:**

1. Go to **Products → [Product] → Variations tab**
2. Click **Create options** and add your option set (Size, Color, etc.)
3. BigCommerce generates the matrix of SKUs automatically
4. Click any SKU row to set:
   - Price adjustment (e.g., +$5 for XL)
   - SKU code
   - Stock quantity
   - Image

**Option Sets:**
- Go to **Products → Option Sets** to create reusable option groups
- Create a "Clothing Sizes" option set with XS–3XL once, then assign it to all apparel products
- Saves significant time when managing large catalogs

**Bulk SKU management:**
- Go to **Products → Import & Export** to export the catalog with all variant SKUs
- Edit in Excel and re-import for bulk price/inventory/SKU updates

---

#### Custom / Headless

Build variant generation from Cartesian product of options, with diff logic to safely update existing catalogs:

```typescript
// lib/variantMatrix.ts

// Generate all variant combinations from option value arrays
// Input:  [['S','M','L'], ['Red','Blue']]
// Output: [['S','Red'], ['S','Blue'], ['M','Red'], ['M','Blue'], ['L','Red'], ['L','Blue']]
export function cartesianProduct(arrays: string[][]): string[][] {
  return arrays.reduce(
    (acc, values) => acc.flatMap(combo => values.map(v => [...combo, v])),
    [[]] as string[][]
  );
}

// Generate variant records with auto-generated SKUs
export function generateVariants(baseSku: string, optionNames: string[], optionValues: string[][]) {
  const combinations = cartesianProduct(optionValues);
  return combinations.map(combo => ({
    sku: [baseSku, ...combo].join('-').toUpperCase().replace(/\s+/g, '-'),
    options: Object.fromEntries(optionNames.map((name, i) => [name, combo[i]])),
    price: null,       // Set individually or via bulk rule
    inventoryQuantity: 0,
    published: true,
  }));
}

// Compute what to create vs. archive when option values change
export function diffVariants(
  existingVariants: { options: Record<string, string> }[],
  newCombinations: string[][],
  optionNames: string[]
) {
  const existingKeys = new Set(existingVariants.map(v => optionNames.map(n => v.options[n]).join('|')));
  const newKeys = new Set(newCombinations.map(c => c.join('|')));

  const toCreate = newCombinations.filter(combo => !existingKeys.has(combo.join('|')));
  const toArchive = existingVariants.filter(v => !newKeys.has(optionNames.map(n => v.options[n]).join('|')));

  return { toCreate, toArchive };
}

// Variant selector logic — which values are available given current selections?
export function getAvailableOptionValues(
  variants: { options: Record<string, string>; inventoryQuantity: number }[],
  currentSelections: Record<string, string>,
  targetOptionName: string
): string[] {
  return variants
    .filter(v =>
      Object.entries(currentSelections)
        .filter(([name]) => name !== targetOptionName)
        .every(([name, value]) => v.options[name] === value)
      && v.inventoryQuantity > 0
    )
    .map(v => v.options[targetOptionName])
    .filter(Boolean);
}
```

---

### Step 3: Define a SKU naming convention

Consistent SKUs are critical for warehouse operations, reporting, and supplier communication. Establish a naming pattern before importing products.

**Recommended format:**
```
[PRODUCT-CODE]-[OPTION1]-[OPTION2]

Rules:
- Max 20 characters total
- All uppercase
- Hyphens between segments, no spaces
- Use standard size abbreviations: XS, S, M, L, XL, 2XL
- Use 3-letter color codes: RED, BLU, BLK, WHT, NVY, GRN
- Example: SHIRT-M-BLU → Blue shirt, Medium
           SHOE-10-NVY → Navy shoe, Size 10
```

Use Matrixify (Shopify) or WP All Import (WooCommerce) to bulk-assign SKUs following this pattern for an existing catalog.

---

### Step 4: Manage large variant matrices

For products with many combinations (50+ variants):

**Shopify:** The 100-variant limit may be an issue for products with 3+ options. Strategies:
- Combine two options into one (e.g., "Size/Width" instead of separate Size and Width options)
- Create separate product records for each color and use metafields to link them
- Use Shopify's native Bundles for configurable products that require more flexibility

**WooCommerce:** Performance degrades with 50+ variations on one product. Use **WooCommerce Performance Optimizations** or **YITH WooCommerce Variations Table** to improve the admin and storefront experience.

**Lazy variant creation:** For extremely large matrices (e.g., custom paint colors × finish × size = 500+ SKUs), generate variants on demand when first ordered rather than pre-creating all combinations:

```typescript
// For very large matrices: create variants on first request rather than upfront
export async function ensureVariantExists(productId: string, options: Record<string, string>) {
  const key = Object.values(options).join('|');
  const existing = await db.productVariants.findFirst({ where: { productId, variantKey: key } });
  if (existing) return existing;

  const product = await db.products.findUnique({ where: { id: productId } });
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

- **Archive variants, never delete them** — deleted variants break historical orders that reference them; mark as `published: false` when discontinued
- **Use the platform's bulk edit tools for price and inventory updates** — editing 100 variants one at a time is impractical; all platforms support bulk edits
- **Limit options to 2–3 axes** — beyond 3 options (e.g., size × color × material), the variant selector becomes confusing and the matrix grows exponentially
- **Test the variant selector before launch** — verify that selecting an unavailable combination shows the correct "sold out" state and that the price/image updates correctly
- **Validate SKU uniqueness** before bulk importing — a SKU collision during import silently skips the conflicting row or throws an error depending on the platform

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Shopify 100-variant limit reached | Combine options or create separate products per color; use metafields to group related products in the storefront |
| Variant image not switching on option select | Assign variant-specific images explicitly per variant; the platform can only switch images if the variant has its own image set |
| Adding a new option value creates duplicate variants | Use diff logic to detect which combinations are genuinely new; Shopify handles this correctly in the admin, but custom imports need deduplication |
| Large matrix slows product page load | For 100+ variants, fetch variant availability via API on option change rather than embedding all variants in the initial page HTML |
| SKU collisions during bulk import | Normalize SKU segments before generating: `toUpperCase().replace(/[^A-Z0-9]/g, '-')`; check for duplicates before saving |

## Related Skills

- @product-data-modeling
- @inventory-tracking
- @catalog-import-export
