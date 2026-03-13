---
name: product-data-modeling
description: "Structure your product catalog using your platform's native data model for variants, attributes, metafields, and product relationships"
category: catalog-inventory
risk: safe
source: curated
date_added: "2026-03-12"
tags: [product, catalog, schema, variants, attributes, database, modeling]
triggers: ["design product schema", "model product variants", "product database design", "catalog data model"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Product Data Modeling

## Overview

Every platform has its own product data model — Shopify uses products with variants and metafields, WooCommerce uses products with attributes and custom fields, and BigCommerce uses products with options and custom fields. Understanding your platform's model and fitting your catalog into it correctly prevents data quality problems and import failures. Only build a custom data model if you're building a headless storefront from scratch.

## When to Use This Skill

- When designing a product catalog structure for a new store on an existing platform
- When adding variant support (size, color, material) to existing products
- When implementing custom attributes for faceted filtering
- When modeling product relationships (bundles, cross-sells, accessories)
- When importing products from a PIM or ERP into the platform's model

## Core Instructions

### Step 1: Understand your platform's core data model

| Platform | Product | Variants | Custom Attributes | Relationships |
|----------|---------|----------|-------------------|---------------|
| **Shopify** | Product + up to 3 Options, up to 100 Variants | Per-variant: price, SKU, inventory, weight, image | Metafields (standard or custom namespaces) | Collections, cross-sell via apps |
| **WooCommerce** | Product (Simple, Variable, Grouped, External) | Per-variation: price, SKU, stock, attributes | Custom product attributes + WooCommerce custom fields | Upsells, cross-sells (built-in), grouped products |
| **BigCommerce** | Product with Options and Option Sets | Per-variant (modifier/option combination): price, SKU, stock | Custom fields per product | Related products, bundled products |
| **Custom / Headless** | Design from scratch with PostgreSQL/MongoDB | Full control over schema | EAV or JSONB for flexible attributes | Junction tables for relationships |

---

### Step 2: Platform-specific modeling

---

#### Shopify

**Core structure:**
- **Product**: title, description, vendor, product_type, tags, images
- **Options**: up to 3 (e.g., Size, Color, Material) — defines the axes of variation
- **Variants**: one per combination of option values — each has its own price, SKU, inventory, weight
- **Metafields**: custom data per product or variant (e.g., care instructions, sizing guide URL, technical specs)

**Modeling decisions:**

1. **Product vs. Variant**: Put a product into a single product record if customers compare the options side-by-side on one page. Create separate product records for fundamentally different products that happen to share a name.

2. **Option naming**: Shopify limits you to 3 options per product. If you need more (e.g., Size + Color + Material + Length), consider combining two options (e.g., "Size/Width") or using metafields for the 4th dimension.

3. **Metafields for custom attributes**: Go to **Settings → Custom data → Products** to create metafield definitions. Use metafields for attributes that:
   - Don't affect price or inventory (those belong on variants)
   - Are product-specific custom data (care instructions, certifications, dimensions)
   - Need to be displayable in your theme or filterable via a search app

4. **Product types and tags**: Use `product_type` for the primary merchandise category (e.g., "Dress", "Running Shoe") and `tags` for cross-cutting attributes (e.g., `color-navy`, `occasion-formal`, `material-cotton`).

**Example product structure for a shirt:**
- Product: "Organic Cotton T-Shirt"
- Options: Size (XS, S, M, L, XL), Color (White, Black, Navy)
- Variants: 15 combinations (5 sizes × 3 colors), each with SKU and inventory
- Metafields: `care_instructions`, `material_weight_gsm`, `sustainability_cert`

**Bulk field updates via Matrixify:**
- Export products to see all supported columns
- Edit in spreadsheet, re-import to update any field in bulk including metafields

---

#### WooCommerce

**Product types:**
- **Simple**: one SKU, one price — use for products with no variants
- **Variable**: multiple variations based on attributes — use for products with size, color, etc.
- **Grouped**: a collection of simple products shown together — use for product families
- **External/Affiliate**: linked to an external URL — for affiliate products
- **Virtual**: no shipping — for services, subscriptions
- **Downloadable**: digital products

**Attributes and variations:**

1. Go to **Products → Attributes** to define global attributes (shared across all products):
   - Add attribute: **Color** with values: Red, Blue, Black, White
   - Add attribute: **Size** with values: XS, S, M, L, XL
   - Check **Enable archives** to make the attribute browseable

2. On a Variable product, go to **Attributes tab**:
   - Select your global attributes and check which values apply to this product
   - Go to **Variations tab** → Generate variations from all combinations

3. Per-variation settings: set a unique price, SKU, stock, image, and weight for each variation

**Custom fields (product metadata):**

For attributes that aren't variants (e.g., technical specs, certifications):
- Use WooCommerce's built-in **Custom Attributes** on the Attributes tab (non-variation attributes)
- Install **Advanced Custom Fields (ACF)** for more structured custom field management
- Install **Product Add-Ons** for customer-input fields (engraving, personalization)

**Product relationships (built-in):**
- **Upsells**: Go to **Linked Products tab** → Upsells — shown on the product page
- **Cross-sells**: listed in the cart — add under **Linked Products tab** → Cross-sells
- **Grouped products**: use the Grouped product type to link related simple products

---

#### BigCommerce

**Core structure:**
- **Product**: title, description, brand, categories, weight, images
- **Options**: define the axes of variation (Size, Color, Material)
- **Option Sets**: reusable groups of options assigned to multiple products
- **Variants (SKUs)**: combinations of options — each has a unique SKU, price adjustment, weight, and stock
- **Custom fields**: free-form name/value pairs for additional product data

**Modeling decisions:**

1. Go to **Products → Option Sets** to create reusable option sets (e.g., "Clothing Sizes" with XS–3XL) — assign the same set to multiple products instead of recreating options per product.

2. For products with large variant counts: BigCommerce supports up to 600 SKUs per product. Use **Bulk Pricing** to set price rules that apply to variant groups rather than pricing each variant individually.

3. **Custom fields**: Go to **Products → [Product] → Custom Fields tab** to add structured attributes like `Material`, `Care Instructions`, `Warranty Period`. These display in the product detail page and can be used for search.

4. **Modifier options** (customer-configurable at purchase): Use for personalization (engraving text, color choice that doesn't affect stock). Different from variants — modifiers don't generate separate SKUs.

---

#### Custom / Headless

For headless storefronts, design the core schema around the product-options-variants pattern:

```sql
-- Core product tables (PostgreSQL)
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(255) UNIQUE NOT NULL,   -- URL-safe handle
  title         VARCHAR(500) NOT NULL,
  description   TEXT,
  vendor        VARCHAR(255),
  product_type  VARCHAR(255),
  status        VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
  tags          TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Variants — one per purchasable combination
CREATE TABLE product_variants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku           VARCHAR(255) UNIQUE,
  title         VARCHAR(500) NOT NULL,  -- e.g., "Red / Large"
  price         NUMERIC(10,2) NOT NULL,  -- Use NUMERIC, not FLOAT, to avoid rounding errors
  compare_at_price NUMERIC(10,2),
  cost_price    NUMERIC(10,2),
  weight        NUMERIC(8,2),
  inventory_quantity INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT true,
  option1_value VARCHAR(255),  -- Denormalized for query performance
  option2_value VARCHAR(255),
  option3_value VARCHAR(255),
  position      INTEGER DEFAULT 0
);

-- Options and values — define the variation axes
CREATE TABLE product_options (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,  -- "Color", "Size"
  position    INTEGER DEFAULT 0,
  UNIQUE(product_id, name)
);

-- Flexible attributes via JSONB (alternative to EAV for custom attributes)
ALTER TABLE products ADD COLUMN attributes JSONB DEFAULT '{}';
-- Query example: SELECT * FROM products WHERE attributes->>'material' = 'cotton';
-- Index for common attribute lookups:
CREATE INDEX idx_products_attributes ON products USING GIN(attributes);

-- Product relationships
CREATE TABLE product_relationships (
  source_product UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  target_product UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  relationship   VARCHAR(50) NOT NULL CHECK (relationship IN ('cross_sell', 'upsell', 'related', 'accessory')),
  position       INTEGER DEFAULT 0,
  UNIQUE(source_product, target_product, relationship)
);
```

**TypeScript types matching this schema:**

```typescript
interface Product {
  id: string;
  slug: string;          // URL handle — stable identifier
  title: string;
  description: string;
  vendor: string;
  productType: string;
  status: 'active' | 'draft' | 'archived';
  tags: string[];
  attributes: Record<string, string | number | boolean>;  // Flexible custom attributes
  variants: ProductVariant[];
  images: ProductImage[];
}

interface ProductVariant {
  id: string;
  sku: string;
  title: string;         // Auto-generated: "Red / Large"
  price: number;         // In cents to avoid floating-point errors
  compareAtPrice?: number;
  costPrice?: number;
  inventoryQuantity: number;
  trackInventory: boolean;
  option1Value?: string;
  option2Value?: string;
  option3Value?: string;
}
```

---

### Step 3: Plan for product relationships

Every platform supports product relationships for cross-selling and upselling. Configure them to increase AOV:

**Upsells**: Higher-value alternatives to the product the customer is viewing — shown on the PDP
- "You're looking at the standard version — upgrade to Pro for $20 more"

**Cross-sells**: Complementary products — shown in the cart
- "Customers also bought these accessories with this product"

**Related products**: Similar products at similar price points — shown at the bottom of the PDP
- "You might also like these"

For Shopify: configure under **Products → [Product] → More details** section; or use a cross-sell app for automated suggestions.

For WooCommerce: configure under the **Linked Products** tab on each product.

## Best Practices

- **Store prices as integers (cents)** in custom builds — `$29.99` stored as `2999` eliminates floating-point rounding errors
- **Always separate products from variants** — even single-variant products should have one variant row for consistent cart and order logic
- **Use slugs for URLs, IDs for internal references** — slugs are human-readable for SEO; UUIDs prevent enumeration attacks
- **Use product type and tags for filtering, not separate products** — "Blue Dress" and "Red Dress" should be variants, not separate products
- **Metafields/custom fields for non-variant data** — attributes that don't affect price or stock belong in metafields, not as variants
- **Test variant combinations before going live** — verify that all purchasable combinations appear correctly in the storefront variant selector

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Variant explosion (5 colors × 8 sizes × 3 materials = 120 variants) | Shopify caps at 100 variants per product; consider using metafields for the third option axis if most combinations aren't stocked separately |
| Custom attributes not appearing in product search | In Shopify: make metafields searchable in your theme or search app settings; in WooCommerce: enable "Used for variations" on attributes you want indexed |
| Product type and tags inconsistent across the catalog | Establish a controlled vocabulary for product types and tags before importing; use Matrixify or WP All Import to standardize in bulk |
| Variant images not switching when size/color is selected | Assign variant-specific images in the platform admin; variants need their own image, not just the product-level image, to trigger the swap |

## Related Skills

- @variant-matrix
- @catalog-import-export
- @product-categorization
- @product-content-enrichment
