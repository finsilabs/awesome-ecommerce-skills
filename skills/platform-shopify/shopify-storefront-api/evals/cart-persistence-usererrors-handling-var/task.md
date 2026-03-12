# Shopping Cart for Headless Shopify Storefront

## Problem/Feature Description

Maple Street Outfitters is a Canadian apparel brand running their headless Shopify storefront built with Next.js and React. Their product catalog features items with multiple option axes — for example, a jacket that comes in three sizes (S, M, L) and two colours (Navy, Forest Green), giving six distinct variants. Customers have complained that the cart sometimes loses their items after navigating to another page and coming back, and that the checkout redirect occasionally breaks on iPhone Safari. The team also wants the cart to fail gracefully rather than silently swallowing errors.

You have been brought in to implement a robust cart module. The Shopify client is already available and products with variants are already fetched — your task is to build the cart logic and a React hook that components can call.

## Output Specification

Produce the following files:

- `lib/cart.ts` — Exports the following async functions (using the Shopify Storefront API GraphQL mutations):
  - `cartCreate(lines: { merchandiseId: string; quantity: number }[])` — creates a new cart
  - `cartLinesAdd(cartId: string, lines: { merchandiseId: string; quantity: number }[])` — adds lines to an existing cart

- `hooks/useCart.ts` — A React hook that:
  - Persists and restores the cart across page reloads
  - Exposes `addToCart(variantId: string, quantity?: number)` that correctly reuses an existing cart if one is saved, or creates a new one
  - Exposes `goToCheckout()` that redirects to the Shopify checkout URL

- `lib/variants.ts` — Exports a function `findVariant(variants: ProductVariant[], selectedOptions: Record<string, string>)` that returns the matching variant given the user's currently selected option values (e.g. `{ Size: "M", Color: "Navy" }`)

You can assume `lib/shopify.ts` already exports a `storefront` client. Do not make live API calls — the implementation only needs to be structurally correct and follow good practices for the Shopify platform.

## Input Files

The following types are provided. Extract them before beginning.

=============== FILE: types/shopify.ts ===============
export interface SelectedOption {
  name: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  selectedOptions: SelectedOption[];
  price: { amount: string; currencyCode: string };
}
