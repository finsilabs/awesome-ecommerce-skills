# Shopping Cart and Login Integration for Headless Magento

## Problem Description

A home furnishings brand has a Next.js headless storefront connected to Magento 2. Shoppers frequently browse while logged out, add items to their cart, and then log in at checkout — only to find their cart is empty. The current implementation creates a new cart session on login instead of carrying over the guest cart, causing significant cart abandonment.

Additionally, the team has reports that customers adding configurable products (sofas with selectable fabric/size) to the cart sometimes see the wrong variant or receive errors because the cart integration doesn't properly distinguish between the parent product and the chosen variant.

Your task is to build the cart and authentication module that resolves these issues.

## Output Specification

Produce a TypeScript file `lib/cart.ts` containing functions for:
- Creating a new guest cart
- Adding a simple product to the cart
- Adding a configurable product (with a selected variant) to the cart
- Logging in a customer and handling the transition from guest cart to authenticated cart
- Fetching the current cart for display (both guest and authenticated scenarios)
- Fetching customer order history (most recent orders first)

Assume a `magentoQuery` helper is available (import from `./magento-client` or stub it). Do not make live network calls — the code only needs to be structurally correct.

Also produce `NOTES.md` (max 25 lines) covering:
- How the guest-to-authenticated cart transition works and why it is necessary
- How configurable products are added differently from simple products
