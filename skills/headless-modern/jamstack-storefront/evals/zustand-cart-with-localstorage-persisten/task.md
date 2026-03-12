# Shopping Cart State for a Static Storefront

## Problem/Feature Description

HomeGoods Direct runs a statically generated Next.js product catalog with hundreds of pre-rendered product pages. Because the pages are static HTML served from a CDN, there is no server session available — the cart needs to live entirely on the client side. Users frequently navigate between pages and even close and reopen their browser while shopping; they expect items they've added to the cart to still be there when they return.

The team has decided to implement a global cart store in TypeScript. The store needs to track items added from different product pages, handle cases where a user adds the same product variant twice (it should increment the quantity rather than duplicate the entry), and persist the cart across browser sessions. The store will be consumed by a cart drawer component rendered as a client island in the layout.

## Output Specification

Produce the file `lib/cart-store.ts` containing the complete cart store implementation in TypeScript.

The file should be self-contained and importable. Include all necessary type definitions inline. Do not install packages or run a build — just produce the source file.
