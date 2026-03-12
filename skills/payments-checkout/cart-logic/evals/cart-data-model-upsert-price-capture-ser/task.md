# Build Cart API for an Online Apparel Store

## Problem/Feature Description

A small apparel startup called ThreadShop is building its e-commerce platform and needs a shopping cart backend. The engineering team has a basic product catalog in place (products with variants for size and color), but has no cart system yet. The product manager has flagged two recurring complaints from their beta testers: (1) adding the same product twice results in two separate line items instead of combining them, and (2) the total shown in the cart doesn't always match what customers are actually charged at checkout because the front-end was sending its own calculated totals.

The team needs a clean implementation of the core cart API in a single JavaScript/Node.js module. The implementation should cover adding items to the cart, updating quantities, removing items, and computing accurate cart totals — all without relying on the client to submit the final price.

## Output Specification

Produce a single file `cart-api.js` that contains:

- A `getOrCreateCart(userId, guestToken)` helper that returns a cart ID (you may use an in-memory store or stub the DB calls)
- `addToCart(cartId, variantId, quantity, variantData)` — adds or updates a line item
- `updateCartItem(cartId, itemId, quantity)` — updates quantity; delegates to remove when quantity ≤ 0
- `removeCartItem(cartId, itemId)` — removes a line item
- `recalculateCart(cartId)` — recomputes subtotal, discount, and total
- A brief `CART_SCHEMA.md` file documenting the data model your implementation assumes (fields on the cart and on each line item)

You may use stubs/mocks for the database layer. Focus on the logic and data structure rather than actual DB connectivity.
