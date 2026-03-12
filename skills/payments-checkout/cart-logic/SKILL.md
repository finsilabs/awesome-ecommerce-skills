---
name: cart-logic
description: "Shopping cart state management — add/remove/update, persistence, merge strategies"
category: payments-checkout
risk: safe
source: curated
date_added: "2026-03-12"
tags: [cart, state-management, persistence, session, merge, add-to-cart, line-items]
triggers: ["shopping cart", "add to cart", "cart state management", "cart persistence", "merge carts", "cart implementation"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Cart Logic

## Overview

Implement robust shopping cart state management covering the full lifecycle: add/remove/update items, price recalculation, guest cart persistence in localStorage/cookies, server-side cart for authenticated users, and merging the guest cart into the server cart on login. Covers the cart data model, atomic quantity updates, and the cart context pattern for React applications.

## When to Use This Skill

- When building or refactoring a shopping cart from scratch
- When cart state is lost when users navigate between pages (missing persistence)
- When guest cart items disappear after login (missing merge logic)
- When implementing real-time cart price updates (coupons, quantity changes, shipping estimates)

## Core Instructions

1. **Define the cart and line item data model**

   ```javascript
   // Cart schema (server-side, database)
   {
     id: 'cart_abc123',
     user_id: null,           // null for guest carts
     guest_token: 'gt_xyz',   // UUID token stored in cookie for guest carts
     status: 'active'|'abandoned'|'converted',
     currency: 'USD',
     line_items: [
       {
         id: 'li_001',
         cart_id: 'cart_abc123',
         product_id: 'prod_001',
         variant_id: 'var_red_M',
         quantity: 2,
         unit_price: 29.99,          // Price at time of adding to cart
         original_unit_price: 39.99, // Before any discounts
         title: 'Classic Tee — Red / M',
         image_url: '/images/tee-red.jpg',
       },
     ],
     coupon_code: null,
     discount_amount: 0,
     subtotal: 59.98,
     tax_amount: 0,           // Calculated at checkout
     shipping_estimate: 0,    // Updated when address is entered
     total: 59.98,
     created_at: Date,
     updated_at: Date,
   }
   ```

2. **Build cart API endpoints with atomic operations**

   ```javascript
   // api/cart.js

   // POST /api/cart/items — add item to cart
   export async function addToCart(req, res) {
     const { variantId, quantity = 1 } = req.body;
     const cartId = await getOrCreateCart(req, res);

     // Validate variant exists and has sufficient stock
     const variant = await db.productVariants.findUnique({ where: { id: variantId } });
     if (!variant) return res.status(404).json({ error: 'Product variant not found' });

     const available = variant.inventoryQuantity - (variant.reservedQuantity ?? 0);
     if (!variant.backorderAllowed && available < quantity) {
       return res.status(409).json({
         error: 'Insufficient stock',
         available: Math.max(0, available),
       });
     }

     // Upsert line item — if variant already in cart, increment quantity
     const existing = await db.cartItems.findFirst({
       where: { cartId, variantId },
     });

     if (existing) {
       await db.cartItems.update({
         where: { id: existing.id },
         data: { quantity: existing.quantity + quantity },
       });
     } else {
       await db.cartItems.create({
         data: {
           cartId,
           productId: variant.productId,
           variantId,
           quantity,
           unitPrice: variant.price,
           originalUnitPrice: variant.compareAtPrice ?? variant.price,
           title: await buildLineItemTitle(variant),
           imageUrl: variant.imageUrl,
         },
       });
     }

     const cart = await recalculateCart(cartId);
     res.json(cart);
   }

   // PATCH /api/cart/items/:itemId — update quantity
   export async function updateCartItem(req, res) {
     const { quantity } = req.body;
     if (quantity <= 0) return removeCartItem(req, res); // Delegate to remove

     await db.cartItems.update({
       where: { id: req.params.itemId },
       data: { quantity },
     });
     const cart = await recalculateCart(req.params.cartId);
     res.json(cart);
   }

   // DELETE /api/cart/items/:itemId — remove item
   export async function removeCartItem(req, res) {
     await db.cartItems.delete({ where: { id: req.params.itemId } });
     const cart = await recalculateCart(req.params.cartId);
     res.json(cart);
   }
   ```

3. **Implement guest cart persistence with cookies**

   ```javascript
   // lib/cartSession.js
   import { v4 as uuid } from 'uuid';

   export async function getOrCreateCart(req, res) {
     if (req.session?.userId) {
       // Authenticated user — find or create a server cart
       let cart = await db.carts.findFirst({
         where: { userId: req.session.userId, status: 'active' },
       });
       if (!cart) {
         cart = await db.carts.create({
           data: { userId: req.session.userId, currency: 'USD' },
         });
       }
       return cart.id;
     }

     // Guest user — use cookie-based token
     let guestToken = req.cookies.cart_token;
     if (!guestToken) {
       guestToken = uuid();
       res.cookie('cart_token', guestToken, {
         httpOnly: true,
         secure: process.env.NODE_ENV === 'production',
         sameSite: 'lax',
         maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
       });
     }

     let cart = await db.carts.findFirst({
       where: { guestToken, status: 'active' },
     });
     if (!cart) {
       cart = await db.carts.create({ data: { guestToken, currency: 'USD' } });
     }
     return cart.id;
   }
   ```

4. **Merge guest cart into authenticated cart on login**

   ```javascript
   // lib/mergeCart.js
   export async function mergeGuestCartOnLogin(guestToken, userId) {
     const guestCart = await db.carts.findFirst({
       where: { guestToken, status: 'active' },
       include: { items: true },
     });

     if (!guestCart || guestCart.items.length === 0) return;

     const userCart = await db.carts.findFirst({
       where: { userId, status: 'active' },
       include: { items: true },
     });

     if (!userCart) {
       // Simply assign the guest cart to the user
       await db.carts.update({
         where: { id: guestCart.id },
         data: { userId, guestToken: null },
       });
       return;
     }

     // Merge guest items into user cart
     for (const guestItem of guestCart.items) {
       const existingItem = userCart.items.find(i => i.variantId === guestItem.variantId);
       if (existingItem) {
         // Prefer the higher quantity (guest typically has more recent intent)
         const mergedQty = Math.max(existingItem.quantity, guestItem.quantity);
         await db.cartItems.update({
           where: { id: existingItem.id },
           data: { quantity: mergedQty },
         });
       } else {
         // Add guest item to user cart
         await db.cartItems.create({
           data: { ...guestItem, id: undefined, cartId: userCart.id },
         });
       }
     }

     // Mark guest cart as abandoned
     await db.carts.update({
       where: { id: guestCart.id },
       data: { status: 'abandoned' },
     });

     await recalculateCart(userCart.id);
   }
   ```

5. **React cart context with optimistic updates**

   ```jsx
   // context/CartContext.jsx
   import { createContext, useContext, useReducer, useCallback } from 'react';

   const CartContext = createContext(null);

   function cartReducer(state, action) {
     switch (action.type) {
       case 'SET_CART': return { ...state, ...action.cart, loading: false };
       case 'SET_LOADING': return { ...state, loading: action.loading };
       case 'OPTIMISTIC_ADD': {
         const existingIdx = state.items.findIndex(i => i.variantId === action.item.variantId);
         if (existingIdx >= 0) {
           const items = [...state.items];
           items[existingIdx] = { ...items[existingIdx], quantity: items[existingIdx].quantity + action.item.quantity };
           return { ...state, items };
         }
         return { ...state, items: [...state.items, action.item] };
       }
       default: return state;
     }
   }

   export function CartProvider({ children, initialCart }) {
     const [cart, dispatch] = useReducer(cartReducer, { items: [], subtotal: 0, total: 0, loading: false, ...initialCart });

     const addItem = useCallback(async (variant, quantity = 1) => {
       // Optimistic update
       dispatch({ type: 'OPTIMISTIC_ADD', item: { variantId: variant.id, quantity, unitPrice: variant.price, title: variant.name } });

       try {
         const res = await fetch('/api/cart/items', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ variantId: variant.id, quantity }),
         });
         const updatedCart = await res.json();
         dispatch({ type: 'SET_CART', cart: updatedCart });
       } catch {
         // Revert optimistic update by re-fetching
         const res = await fetch('/api/cart');
         const freshCart = await res.json();
         dispatch({ type: 'SET_CART', cart: freshCart });
       }
     }, []);

     return <CartContext.Provider value={{ cart, addItem }}>{children}</CartContext.Provider>;
   }

   export const useCart = () => useContext(CartContext);
   ```

## Examples

### Cart totals recalculation

```javascript
async function recalculateCart(cartId) {
  const cart = await db.carts.findUnique({
    where: { id: cartId },
    include: { items: true, coupon: true },
  });

  const subtotal = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discount = cart.coupon ? applyCoupon(subtotal, cart.coupon) : 0;
  const total = Math.max(0, +(subtotal - discount).toFixed(2));

  return db.carts.update({
    where: { id: cartId },
    data: { subtotal: +subtotal.toFixed(2), discountAmount: +discount.toFixed(2), total },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });
}
```

### Cart abandonment tracking

```javascript
// Mark carts inactive after 30 minutes of no activity
async function markAbandonedCarts() {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  await db.carts.updateMany({
    where: { status: 'active', updatedAt: { lt: cutoff } },
    data: { status: 'abandoned' },
  });
}
```

## Best Practices

- **Store prices at time of add-to-cart** — capture `unit_price` when the item is added; do not re-read prices from the variant on every cart fetch, as prices may change mid-session
- **Validate stock before checkout, not only on add-to-cart** — items may go out of stock while sitting in the cart; re-validate availability at checkout time
- **Use optimistic UI for add-to-cart** — update the UI immediately; revert only if the API call fails
- **Merge guest carts on login** — do not silently lose the guest cart; merge using "take the higher quantity" strategy
- **Persist cart token in an `httpOnly` cookie** — `localStorage` is accessible to JavaScript; an `httpOnly` cookie is safer for the cart session token
- **Recalculate totals server-side** — never trust client-submitted totals; always recalculate subtotal, discount, and total on the server

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Cart disappears when user logs in | Implement the `mergeGuestCartOnLogin` function; call it immediately after authentication succeeds |
| Same item added twice instead of incrementing quantity | Use `upsert` with increment on quantity when the variant already exists in the cart |
| Price changes not reflected in existing carts | Store `unit_price` at add-time (historical price); show a "price changed" warning if the current price differs significantly at checkout |
| Cart API race condition with rapid clicking | The add-to-cart endpoint should use `db.$transaction` and upsert to handle concurrent requests for the same variant |
| Guest cart token shared between browser tabs | Use a single cookie-based token — all tabs in the same browser share it; this is intentional and correct behavior |

## Related Skills

- @checkout-flow-optimization
- @guest-checkout
- @inventory-tracking
- @stripe-integration
