---
name: shopify-storefront-api
description: "Build a headless Shopify frontend using the GraphQL Storefront API for product queries, cart management, and checkout with the Buy SDK"
category: platform-shopify
risk: safe
source: curated
date_added: "2026-03-12"
tags: [shopify, storefront-api, headless, graphql, buy-sdk, next-js, hydrogen, cart]
triggers: ["shopify headless", "shopify storefront api", "shopify graphql storefront", "headless shopify", "shopify buy sdk", "shopify hydrogen"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify]
difficulty: intermediate
---

# Shopify Storefront API

## Overview

The Shopify Storefront API is a public-facing GraphQL API that provides read and write access to a store's products, collections, cart, and checkout from any frontend. It uses a Storefront Access Token (distinct from Admin API tokens) and is safe to expose in client-side JavaScript. Use it to build headless storefronts with Next.js, Remix/Hydrogen, or any JS framework.

## When to Use This Skill

- When building a headless Shopify storefront with a custom frontend framework
- When creating a React Native or Flutter mobile app that needs product and cart data
- When embedding a Shopify buy button or product widget in a non-Shopify site
- When using Shopify Hydrogen (Remix-based) for a fully custom storefront experience
- When needing real-time product availability or pricing without the Admin API overhead
- When implementing cart persistence across sessions with Shopify's hosted cart

## Core Instructions

1. **Create a Storefront Access Token**

   In Shopify Admin → Apps → Develop apps → Your App → API credentials → Storefront API access token. Or via the Admin API:

   ```javascript
   // Via Admin API (one-time setup)
   const token = await admin.graphql(`
     mutation {
       storefrontAccessTokenCreate(input: { title: "Headless Frontend" }) {
         storefrontAccessToken {
           accessToken
           title
         }
         userErrors { field message }
       }
     }
   `);
   ```

   Storefront Access Tokens do not use the `shpat_` prefix (that prefix is for Admin API tokens). Storefront tokens are opaque strings safe to use in browser code — they only allow storefront-scoped operations.

2. **Set up the Storefront API client**

   Using the official `@shopify/storefront-api-client`:

   ```bash
   npm install @shopify/storefront-api-client
   ```

   ```typescript
   // lib/shopify.ts
   import { createStorefrontApiClient } from "@shopify/storefront-api-client";

   export const storefront = createStorefrontApiClient({
     storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!, // e.g. "mystore.myshopify.com"
     apiVersion: "2025-01",
     publicAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!,
   });
   ```

   For server-side calls with a private access token (higher rate limits):

   ```typescript
   export const storefrontServer = createStorefrontApiClient({
     storeDomain: process.env.SHOPIFY_STORE_DOMAIN!,
     apiVersion: "2025-01",
     privateAccessToken: process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN!,
   });
   ```

3. **Query products and collections**

   ```typescript
   // lib/products.ts
   export async function getProducts(first = 20, after?: string) {
     const { data, errors } = await storefront.request(`
       query GetProducts($first: Int!, $after: String) {
         products(first: $first, after: $after, sortKey: BEST_SELLING) {
           pageInfo {
             hasNextPage
             endCursor
           }
           edges {
             node {
               id
               title
               handle
               availableForSale
               priceRange {
                 minVariantPrice { amount currencyCode }
                 maxVariantPrice { amount currencyCode }
               }
               images(first: 1) {
                 edges {
                   node { url altText width height }
                 }
               }
               variants(first: 10) {
                 edges {
                   node {
                     id
                     title
                     availableForSale
                     selectedOptions { name value }
                     price { amount currencyCode }
                   }
                 }
               }
             }
           }
         }
       }
     `, { variables: { first, after } });

     if (errors) throw new Error(errors.message);
     return data.products;
   }
   ```

4. **Create and manage a cart**

   ```typescript
   // lib/cart.ts

   // Create a new cart
   export async function cartCreate(lines: { merchandiseId: string; quantity: number }[]) {
     const { data } = await storefront.request(`
       mutation CartCreate($lines: [CartLineInput!]) {
         cartCreate(input: { lines: $lines }) {
           cart {
             id
             checkoutUrl
             lines(first: 50) {
               edges {
                 node {
                   id
                   quantity
                   merchandise {
                     ... on ProductVariant {
                       id
                       title
                       price { amount currencyCode }
                       product { title handle }
                     }
                   }
                 }
               }
             }
             cost {
               subtotalAmount { amount currencyCode }
               totalAmount { amount currencyCode }
             }
           }
           userErrors { field message }
         }
       }
     `, { variables: { lines } });
     return data.cartCreate;
   }

   // Add lines to existing cart
   export async function cartLinesAdd(cartId: string, lines: { merchandiseId: string; quantity: number }[]) {
     const { data } = await storefront.request(`
       mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
         cartLinesAdd(cartId: $cartId, lines: $lines) {
           cart { id checkoutUrl }
           userErrors { field message }
         }
       }
     `, { variables: { cartId, lines } });
     return data.cartLinesAdd;
   }
   ```

5. **Persist cart ID and redirect to checkout**

   ```typescript
   // hooks/useCart.ts
   import { useState, useEffect } from "react";
   import { cartCreate, cartLinesAdd } from "../lib/cart";

   const CART_ID_KEY = "shopify_cart_id";

   export function useCart() {
     const [cartId, setCartId] = useState<string | null>(null);
     const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

     useEffect(() => {
       setCartId(localStorage.getItem(CART_ID_KEY));
     }, []);

     const addToCart = async (variantId: string, quantity = 1) => {
       const lines = [{ merchandiseId: variantId, quantity }];
       if (cartId) {
         const result = await cartLinesAdd(cartId, lines);
         setCheckoutUrl(result.cart.checkoutUrl);
       } else {
         const result = await cartCreate(lines);
         const newCartId = result.cart.id;
         localStorage.setItem(CART_ID_KEY, newCartId);
         setCartId(newCartId);
         setCheckoutUrl(result.cart.checkoutUrl);
       }
     };

     const goToCheckout = () => {
       if (checkoutUrl) window.location.href = checkoutUrl;
     };

     return { addToCart, goToCheckout, cartId };
   }
   ```

## Examples

### Product Detail Page with variant selection (Next.js)

```typescript
// app/products/[handle]/page.tsx
import { storefront } from "@/lib/shopify";

async function getProduct(handle: string) {
  const { data } = await storefront.request(`
    query GetProduct($handle: String!) {
      product(handle: $handle) {
        id
        title
        descriptionHtml
        seo { title description }
        images(first: 10) {
          edges { node { url altText } }
        }
        options {
          id name values
        }
        variants(first: 100) {
          edges {
            node {
              id
              availableForSale
              selectedOptions { name value }
              price { amount currencyCode }
              compareAtPrice { amount currencyCode }
            }
          }
        }
      }
    }
  `, { variables: { handle } });
  return data.product;
}

export default async function ProductPage({ params }: { params: { handle: string } }) {
  const product = await getProduct(params.handle);
  // Render product with client-side variant picker
  return <ProductDetail product={product} />;
}

// Generate static params for all products
export async function generateStaticParams() {
  const { data } = await storefront.request(`
    query { products(first: 200) { edges { node { handle } } } }
  `);
  return data.products.edges.map(({ node }: { node: { handle: string } }) => ({
    handle: node.handle,
  }));
}
```

### Predictive search

```typescript
export async function predictiveSearch(query: string) {
  const { data } = await storefront.request(`
    query PredictiveSearch($query: String!) {
      predictiveSearch(query: $query, limit: 5, types: [PRODUCT, COLLECTION, ARTICLE]) {
        products {
          id title handle
          featuredImage { url altText }
          priceRange { minVariantPrice { amount currencyCode } }
        }
        collections {
          id title handle
          image { url altText }
        }
      }
    }
  `, { variables: { query } });
  return data.predictiveSearch;
}
```

## Best Practices

- **Use private tokens server-side** — private Storefront Access Tokens have higher rate limits (1000 req/s vs 100 req/s) and should never be exposed to browsers
- **Fetch product data at build time** when possible (ISR or SSG) — the Storefront API rate limits apply per store, not per customer
- **Always check `availableForSale`** on both product and variant before showing Add-to-Cart — a product can be available while individual variants are sold out
- **Paginate with `after` cursors**, not offsets — the Storefront API uses cursor-based pagination; store `endCursor` for next-page queries
- **Cache collection and product queries** with Next.js `fetch` cache tags or React cache — product data rarely changes in real time
- **Use `@inContext` directive** for international pricing — `@inContext(country: CA, language: EN)` returns prices in the buyer's currency
- **Fragment reuse** — define GraphQL fragments (e.g., `ProductFragment`) to avoid duplicating field selections across queries
- **Handle `userErrors`** on all mutations — cart mutations return `userErrors` array; check it before updating local state

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Rate limit errors (429) | Use private access token server-side and implement request batching; avoid N+1 product queries |
| Cart ID lost after page reload | Persist `cartId` in `localStorage` or a cookie; create a new cart only if none exists |
| Product prices show in wrong currency | Add `@inContext(country: $country)` directive and pass buyer's country via geolocation |
| `product(handle:)` returns null | Handle slugified handles correctly — Shopify handles are lowercase with hyphens; check exact slug |
| Checkout redirect fails on mobile Safari | Use `window.location.href = checkoutUrl` inside a user gesture handler, not async callback |
| Variant not found when selecting options | Use client-side filtering of `variants.edges` by matching all `selectedOptions`, not just one |

## Related Skills

- @shopify-admin-api
- @shopify-app-development
- @shopify-checkout-extensions
- @headless-commerce-architecture
- @graphql-api-design
