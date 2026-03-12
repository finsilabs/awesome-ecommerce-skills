# Product Caching Service

## Problem/Feature Description

Meridian Commerce is a mid-size online retailer whose Node.js backend makes heavy database calls on every product page request — fetching product data, variants, and images on each hit. During a recent flash sale, response times spiked to over 3 seconds and the site nearly went down under load. The engineering team wants to introduce an application-level caching layer that sits between the application and the database, so that frequently accessed product data is served from memory rather than hitting the database on every request.

The team uses TypeScript throughout their stack and already has a Redis instance available. They need a reusable `ProductCache` class that handles get, set, invalidation, and bulk cache warming — complete with sensible resilience settings for production. Performance is critical: cache writes must never block response delivery, and warming hundreds of products at once must be done as efficiently as possible. A separate `scripts/warm-cache.ts` script should also be provided that demonstrates warming the cache for a given collection.

## Output Specification

Produce the following files:

- `src/product-cache.ts` — A TypeScript `ProductCache` class with methods for:
  - Getting a product by ID
  - Getting a product ID by slug
  - Setting / caching a product (with TTL)
  - Fetching with cache-aside logic (cache miss triggers fetch, result is cached)
  - Invalidating a product (removing all keys related to it)
  - Bulk warming the cache for a collection of products
- `src/redis-client.ts` — A module that creates and exports a configured Redis client instance
- `scripts/warm-cache.ts` — A standalone script that demonstrates warming the cache for a collection of products (can use mock/stub data)
- `package.json` — With the required dependencies listed

## Input Files

The following type definitions are provided as inputs. Extract them before beginning.

=============== FILE: src/types.ts ===============
export interface ProductVariant {
  id: string;
  title: string;
  price: number;
  inventoryQuantity: number;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  status: 'active' | 'draft' | 'archived';
  collectionIds: string[];
  variants: ProductVariant[];
  updatedAt: string;
}
