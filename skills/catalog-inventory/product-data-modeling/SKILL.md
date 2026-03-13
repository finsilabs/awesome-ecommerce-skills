---
name: product-data-modeling
description: "Design a flexible product database schema that supports variants, custom attributes, product relationships, and category hierarchies"
category: catalog-inventory
risk: safe
source: curated
date_added: "2026-03-12"
tags: [product, catalog, schema, variants, attributes, database, modeling]
triggers: ["design product schema", "model product variants", "product database design", "catalog data model"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Product Data Modeling

## Overview

Design robust database schemas for e-commerce product catalogs that handle variants (size, color), configurable options, custom attributes, product relationships (bundles, cross-sells), and multi-channel publishing. This skill covers relational (PostgreSQL) and document (MongoDB) approaches, the EAV pattern for dynamic attributes, and practical indexing strategies for catalog search and filtering.

## When to Use This Skill

- When designing a product catalog schema for a new e-commerce application
- When adding variant support (size, color, material) to an existing product table
- When implementing faceted search and need to model filterable attributes
- When building a multi-tenant catalog that supports different product types with different attributes
- When modeling product bundles, kits, or configurable products

## Core Instructions

1. **Design the core product and variant tables (PostgreSQL)**

   The fundamental pattern separates the product (what the customer sees) from variants (what gets added to cart and tracked in inventory):

   ```sql
   CREATE TABLE products (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     slug          VARCHAR(255) UNIQUE NOT NULL,
     title         VARCHAR(500) NOT NULL,
     description   TEXT,
     body_html     TEXT,
     vendor        VARCHAR(255),
     product_type  VARCHAR(255),
     status        VARCHAR(20) DEFAULT 'draft'
                   CHECK (status IN ('active', 'draft', 'archived')),
     tags          TEXT[] DEFAULT '{}',
     created_at    TIMESTAMPTZ DEFAULT now(),
     updated_at    TIMESTAMPTZ DEFAULT now()
   );

   CREATE TABLE product_variants (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
     sku           VARCHAR(255) UNIQUE,
     barcode       VARCHAR(255),
     title         VARCHAR(500) NOT NULL,  -- e.g., "Red / Large"
     price         NUMERIC(10,2) NOT NULL,
     compare_at_price NUMERIC(10,2),
     cost_price    NUMERIC(10,2),
     weight        NUMERIC(8,2),
     weight_unit   VARCHAR(10) DEFAULT 'kg',
     inventory_quantity INTEGER DEFAULT 0,
     track_inventory BOOLEAN DEFAULT true,
     position      INTEGER DEFAULT 0,
     created_at    TIMESTAMPTZ DEFAULT now(),
     updated_at    TIMESTAMPTZ DEFAULT now()
   );

   CREATE INDEX idx_variants_product ON product_variants(product_id);
   CREATE INDEX idx_variants_sku ON product_variants(sku);
   CREATE INDEX idx_products_status ON products(status) WHERE status = 'active';
   ```

2. **Model product options and option values**

   Options define the axes of variation (Color, Size), while variants are specific combinations:

   ```sql
   CREATE TABLE product_options (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
     name        VARCHAR(255) NOT NULL,  -- "Color", "Size"
     position    INTEGER DEFAULT 0,
     UNIQUE(product_id, name)
   );

   CREATE TABLE product_option_values (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     option_id   UUID NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
     value       VARCHAR(255) NOT NULL,  -- "Red", "Large"
     position    INTEGER DEFAULT 0,
     UNIQUE(option_id, value)
   );

   -- Junction table: which option values make up each variant
   CREATE TABLE variant_option_values (
     variant_id      UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
     option_value_id UUID NOT NULL REFERENCES product_option_values(id) ON DELETE CASCADE,
     PRIMARY KEY (variant_id, option_value_id)
   );
   ```

3. **Implement the EAV pattern for dynamic attributes**

   For attributes that vary by product type (e.g., "Screen Size" for electronics, "Thread Count" for bedding):

   ```sql
   CREATE TABLE attribute_definitions (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name        VARCHAR(255) NOT NULL,
     slug        VARCHAR(255) UNIQUE NOT NULL,
     data_type   VARCHAR(20) NOT NULL
                 CHECK (data_type IN ('string', 'number', 'boolean', 'date', 'enum')),
     unit        VARCHAR(50),               -- "inches", "ml", etc.
     filterable  BOOLEAN DEFAULT false,
     searchable  BOOLEAN DEFAULT false,
     created_at  TIMESTAMPTZ DEFAULT now()
   );

   CREATE TABLE product_attributes (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
     attribute_id    UUID NOT NULL REFERENCES attribute_definitions(id) ON DELETE CASCADE,
     value_string    VARCHAR(1000),
     value_number    NUMERIC(15,4),
     value_boolean   BOOLEAN,
     value_date      DATE,
     UNIQUE(product_id, attribute_id)
   );

   -- Index for faceted filtering
   CREATE INDEX idx_attr_filterable ON product_attributes(attribute_id, value_string)
     WHERE value_string IS NOT NULL;
   CREATE INDEX idx_attr_numeric ON product_attributes(attribute_id, value_number)
     WHERE value_number IS NOT NULL;
   ```

4. **Model product relationships (cross-sells, bundles, collections)**

   ```sql
   CREATE TABLE product_relationships (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     source_product  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
     target_product  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
     relationship    VARCHAR(50) NOT NULL
                     CHECK (relationship IN ('cross_sell', 'upsell', 'related', 'bundle_item', 'accessory')),
     position        INTEGER DEFAULT 0,
     UNIQUE(source_product, target_product, relationship)
   );

   CREATE TABLE collections (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     title       VARCHAR(500) NOT NULL,
     slug        VARCHAR(255) UNIQUE NOT NULL,
     description TEXT,
     sort_order  VARCHAR(50) DEFAULT 'manual'
                 CHECK (sort_order IN ('manual', 'best_selling', 'price_asc', 'price_desc', 'newest', 'title_asc')),
     is_auto     BOOLEAN DEFAULT false,   -- automated rules vs. manual curation
     rules       JSONB,                    -- for automated collections
     published   BOOLEAN DEFAULT false,
     created_at  TIMESTAMPTZ DEFAULT now()
   );

   CREATE TABLE collection_products (
     collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
     product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
     position      INTEGER DEFAULT 0,
     PRIMARY KEY (collection_id, product_id)
   );
   ```

5. **Handle product images with ordering and variant association**

   ```sql
   CREATE TABLE product_images (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
     variant_id  UUID REFERENCES product_variants(id) ON DELETE SET NULL,
     src          VARCHAR(2048) NOT NULL,
     alt_text     VARCHAR(500),
     width        INTEGER,
     height       INTEGER,
     position     INTEGER DEFAULT 0,
     created_at   TIMESTAMPTZ DEFAULT now()
   );

   CREATE INDEX idx_images_product ON product_images(product_id, position);
   ```

6. **Build queries for catalog pages with filtering**

   ```sql
   -- Fetch products with price range and inventory from variants
   SELECT
     p.id, p.title, p.slug, p.product_type,
     MIN(v.price) AS min_price,
     MAX(v.price) AS max_price,
     SUM(v.inventory_quantity) AS total_inventory,
     (SELECT pi.src FROM product_images pi
      WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS featured_image
   FROM products p
   JOIN product_variants v ON v.product_id = p.id
   WHERE p.status = 'active'
   GROUP BY p.id;

   -- Faceted filter query: find products with Color = 'Red' AND Size = 'Large'
   SELECT DISTINCT p.id, p.title
   FROM products p
   JOIN product_variants v ON v.product_id = p.id
   JOIN variant_option_values vov ON vov.variant_id = v.id
   JOIN product_option_values pov ON pov.id = vov.option_value_id
   JOIN product_options po ON po.id = pov.option_id
   WHERE p.status = 'active'
     AND v.inventory_quantity > 0
     AND (po.name = 'Color' AND pov.value = 'Red')
     OR  (po.name = 'Size'  AND pov.value = 'Large')
   GROUP BY p.id, p.title
   HAVING COUNT(DISTINCT po.name) = 2;  -- Must match ALL filters
   ```

## Examples

### MongoDB document model (alternative approach)

For catalogs with highly variable attributes, a document model can be more natural:

```javascript
// Product document in MongoDB
const productSchema = {
  _id: ObjectId,
  slug: 'organic-cotton-tshirt',
  title: 'Organic Cotton T-Shirt',
  description: 'Sustainably made from 100% organic cotton.',
  vendor: 'EcoWear',
  status: 'active',
  tags: ['organic', 'cotton', 'sustainable'],
  productType: 'Apparel',

  options: [
    { name: 'Color', values: ['White', 'Black', 'Navy'] },
    { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
  ],

  variants: [
    {
      sku: 'OCT-WHT-S',
      title: 'White / S',
      options: { Color: 'White', Size: 'S' },
      price: 3500,            // Store as cents to avoid floating-point issues
      compareAtPrice: 4500,
      inventory: 23,
      weight: { value: 200, unit: 'g' },
    },
    // ... more variants
  ],

  attributes: {
    material: 'Organic Cotton',
    careInstructions: 'Machine wash cold',
    fit: 'Regular',
    sustainabilityCert: 'GOTS Certified',
  },

  images: [
    { src: '/images/oct-white-front.webp', alt: 'White T-Shirt front view', position: 0 },
    { src: '/images/oct-white-back.webp', alt: 'White T-Shirt back view', position: 1 },
  ],

  seo: {
    title: 'Organic Cotton T-Shirt | EcoWear',
    description: 'Sustainably made organic cotton tee.',
    canonicalUrl: '/products/organic-cotton-tshirt',
  },

  relationships: {
    crossSells: [ObjectId('...'), ObjectId('...')],
    collections: [ObjectId('...')],
  },

  createdAt: ISODate(),
  updatedAt: ISODate(),
};

// MongoDB indexes for catalog
db.products.createIndex({ slug: 1 }, { unique: true });
db.products.createIndex({ status: 1, 'variants.price': 1 });
db.products.createIndex({ tags: 1 });
db.products.createIndex({ 'attributes.material': 1 });
db.products.createIndex(
  { title: 'text', description: 'text', tags: 'text' },
  { weights: { title: 10, tags: 5, description: 1 } }
);
```

### TypeScript types for the product model

```typescript
interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  bodyHtml?: string;
  vendor: string;
  productType: string;
  status: 'active' | 'draft' | 'archived';
  tags: string[];
  options: ProductOption[];
  variants: ProductVariant[];
  images: ProductImage[];
  attributes: Record<string, string | number | boolean>;
  seo: SeoMetadata;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductOption {
  id: string;
  name: string;
  values: string[];
  position: number;
}

interface ProductVariant {
  id: string;
  sku: string;
  barcode?: string;
  title: string;
  options: Record<string, string>;
  price: number;        // In cents
  compareAtPrice?: number;
  costPrice?: number;
  weight?: { value: number; unit: 'g' | 'kg' | 'lb' | 'oz' };
  inventoryQuantity: number;
  trackInventory: boolean;
  image?: ProductImage;
}

interface ProductImage {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  position: number;
}

interface SeoMetadata {
  title: string;
  description: string;
  canonicalUrl?: string;
}
```

## Best Practices

- **Store prices as integers (cents/pence)** — avoid floating-point math errors by storing `$29.99` as `2999`
- **Always separate products from variants** — even single-variant products should have one variant row for consistent cart/order logic
- **Use slugs for URLs, UUIDs for internal IDs** — slugs are human-readable for SEO; UUIDs avoid enumeration attacks
- **Index based on actual query patterns** — index `status = 'active'` as a partial index since archived products are rarely queried
- **Generate variant titles automatically** — concatenate option values (e.g., "Red / Large") rather than requiring manual entry
- **Version your schema for audit trails** — use an `updated_at` trigger or a separate `product_versions` table for price change history
- **Avoid over-normalizing** — the EAV pattern is flexible but slow for reads; denormalize commonly filtered attributes into JSONB columns
- **Set up cascading deletes carefully** — deleting a product should cascade to variants, images, and attributes but NOT to order line items (use soft delete)

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Variant explosion (e.g., 5 colors x 8 sizes x 3 materials = 120 variants) | Cap variant count per product (Shopify limits to 100); consider configurable products for high-cardinality options |
| Price stored as FLOAT causes rounding errors | Use `NUMERIC(10,2)` in PostgreSQL or store as integer cents in application code |
| Orphaned variants after option value deletion | Use foreign keys with `ON DELETE CASCADE` and validate variant-option consistency in application logic |
| Slow collection page queries with many filters | Pre-compute filter counts with materialized views or a search index (Elasticsearch, Meilisearch) |
| SKU uniqueness conflicts in multi-tenant systems | Scope SKU uniqueness to the tenant: `UNIQUE(tenant_id, sku)` instead of global uniqueness |
| No history of price changes | Add a `price_history` table or use PostgreSQL temporal tables to track when prices changed |

## Related Skills

- @product-page-design
- @ecommerce-data-warehouse
- @discount-engine
- @inventory-management
- @ecommerce-seo
