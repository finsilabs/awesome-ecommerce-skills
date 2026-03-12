# Shopping Cart System for a Clothing Boutique

## Problem/Feature Description

"Thread & Co" is a small clothing boutique that sells items with multiple variant options — each piece of clothing comes in different sizes and colors. They've chosen Commerce.js as their headless commerce backend and now need a complete cart implementation for their React storefront. The app is a single-page application and the cart state needs to be shared across the entire component tree, from the navigation header (which shows a cart item count) down to individual product detail pages.

The tech lead has emphasized that the cart logic should be centralized and reusable. There have been past issues in the app where multiple instances of the SDK client caused inconsistent state, so the client initialization must be handled carefully. Products on the site all have size and color options, and users need to be able to select their preferred variant before adding to cart.

## Output Specification

Write the following files:

1. `context/CartContext.tsx` (or `.jsx`) — A React context that:
   - Retrieves the cart on mount
   - Provides functions: `addToCart(productId, quantity, variantSelections)`, `updateItem(lineItemId, quantity)`, `removeItem(lineItemId)`, `clearCart()`
   - Exports both the provider component and a `useCart` hook

2. `components/AddToCartButton.tsx` (or `.jsx`) — A component that:
   - Accepts `productId`, `variants` (an array of variant groups each with options), and optional `quantity` prop
   - Renders size and color selectors based on the provided variants
   - Calls `addToCart` with the appropriate selections on submit

3. `components/CartIcon.tsx` (or `.jsx`) — A navigation component that shows the number of items in the cart using an appropriate cart property.

You do not need a working Chec account — the code should be structured correctly and reference appropriate environment variables. Do not make live API calls.

## Input Files

The following sample product data is provided to help understand the variant structure. Extract it before beginning.

=============== FILE: inputs/sample-product.json ===============
{
  "id": "prod_NqKE50BR4wdgBL",
  "name": "Classic Wool Coat",
  "price": {
    "raw": 189.00,
    "formatted": "189.00",
    "formatted_with_symbol": "$189.00"
  },
  "variants": [
    {
      "id": "vgrp_bO6J5aB4aMNNwl",
      "name": "Size",
      "options": [
        { "id": "optn_bPj2XLmEd6ANQB", "name": "S", "price": { "raw": 0, "formatted_with_symbol": "$0.00" } },
        { "id": "optn_Kvg9l6oHEOrQO3", "name": "M", "price": { "raw": 0, "formatted_with_symbol": "$0.00" } },
        { "id": "optn_mOd3mb8q5b3xKO", "name": "L", "price": { "raw": 10, "formatted_with_symbol": "+$10.00" } }
      ]
    },
    {
      "id": "vgrp_4WJvlKpg7pwbYV",
      "name": "Color",
      "options": [
        { "id": "optn_7eNo0Wr9kpn8Q6", "name": "Camel", "price": { "raw": 0, "formatted_with_symbol": "$0.00" } },
        { "id": "optn_ZrJ2Kl0X1kw9P3", "name": "Charcoal", "price": { "raw": 0, "formatted_with_symbol": "$0.00" } }
      ]
    }
  ]
}
