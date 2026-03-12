# Brick-and-Mortar Expansion: Square POS Catalog Setup

## Problem/Feature Description

A fashion retailer called Varda Apparel has been running a successful online store for three years. They are now opening two physical boutique locations and have chosen Square as their point-of-sale system. Their existing product database contains hundreds of SKUs with names, descriptions, variants (size/color combinations), and prices. Before they can start selling in-store, every product needs to be available in Square so that cashiers can ring up sales, and so that in-store inventory movements are trackable per location.

The engineering team needs a TypeScript module that reads from the Varda product database and pushes the catalog into Square. The integration must be production-safe: it should work against Square's sandbox during development and switch to the live environment automatically when deployed. Catalog syncs will be triggered both on product updates and on a nightly batch job, so the implementation must be safe to run repeatedly without creating duplicate catalog entries or payments.

## Output Specification

Produce a TypeScript file named `catalog-sync.ts` that exports:

- A `syncProductToSquare(product: Product)` function that syncs a single product and its variants to Square
- A `Square client` setup (may be in a separate `square-client.ts` file if you prefer)

Also produce a brief `DESIGN.md` file (max 300 words) explaining:
1. How new vs. existing catalog objects are identified
2. How Square-assigned IDs are stored back into the product database after the first sync

The following type definitions are provided as the starting data model. Extract them before beginning.

=============== FILE: inputs/types.ts ===============
export interface Product {
  sku: string;
  name: string;
  description?: string;
  variants: Variant[];
}

export interface Variant {
  sku: string;
  name: string;
  price: number; // in dollars, e.g. 29.99
  squareCatalogVariationId?: string; // populated after first sync
}
