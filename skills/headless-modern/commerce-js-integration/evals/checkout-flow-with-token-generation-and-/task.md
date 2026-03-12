# Checkout Flow Implementation

## Problem/Feature Description

"Shelf & Spine" is an independent bookshop that built its storefront with Commerce.js and has a working product catalog and cart. The final piece they need is a complete checkout flow. Customers fill out a shipping form, see available shipping methods retrieved from the platform, and pay via Stripe. The team has already integrated Stripe.js on the frontend and can provide a `paymentMethodId` from it — they just need the Commerce.js checkout logic wired up.

The engineering team had a bad experience with an earlier checkout implementation that left stale cart state after purchases, causing customers to see old cart contents after placing an order. They also want proper error handling so that if an order fails to capture, users see a meaningful message rather than a generic crash. A Next.js API route will handle the server-side parts that need elevated API access, while the client-side form handles the user interactions.

## Output Specification

Write the following files:

1. `lib/checkout.ts` (or `.js`) — A module with functions:
   - `generateCheckoutToken(cartId: string)` — creates a checkout token from a cart
   - `getShippingOptions(checkoutTokenId: string)` — retrieves available shipping options for the checkout
   - `captureOrder(checkoutTokenId: string, orderData: object)` — captures the order; must include error handling

2. `pages/api/orders.ts` (or `.js`) — A Next.js API route that:
   - Lists orders for an authenticated customer (requires customer login first)
   - Uses the appropriate key type for server-side operations

3. `components/CheckoutForm.tsx` (or `.jsx`) — A React component that:
   - Accepts `cartId` and `stripePaymentMethodId` as props
   - Walks through the checkout steps: generate token → get live data → capture order
   - Clears the cart state after a successful order
   - Shows an error message if the order capture fails

Write a `checkout-flow.md` document explaining the checkout steps and what happens to the cart after a successful order.

You do not need a working Chec account or Stripe account — structure the code correctly and use appropriate environment variables. Do not make live API calls.
