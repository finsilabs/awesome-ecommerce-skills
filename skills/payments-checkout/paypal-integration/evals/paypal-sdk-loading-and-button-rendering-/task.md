# Add PayPal Checkout to a React Storefront

## Problem/Feature Description

A small independent bookshop has built a React storefront using Next.js. They currently accept payments via Stripe, but their analytics show that a significant share of their repeat customers prefer PayPal — several have abandoned checkout after not seeing the option. The team wants to add PayPal as a second payment method on the checkout page without disrupting the existing Stripe flow.

The checkout page is a standard React component. The team is concerned about page load performance: the checkout page is visited by returning customers who often already have their cart ready, so they don't want any payment SDK loaded on pages that don't need it. They also want to make sure the integration is production-ready and won't cause strange bugs if a user navigates away and back to the checkout page multiple times in the same session.

## Output Specification

Produce a self-contained implementation of the PayPal checkout integration for this React/Next.js storefront. Your output should include:

1. **`lib/loadPaypalSDK.js`** — a utility that loads the PayPal JavaScript SDK on demand
2. **`components/PayPalButtons.jsx`** — a React component that renders the PayPal payment buttons and handles the checkout flow. Assume the component receives these props:
   - `cartId` (string): the ID of the current cart
   - `onSuccess(result)`: callback called after a successful payment, receiving `{ orderId }`
   - `onError(message)`: callback called on payment error
   - The component should POST to `/api/paypal/create-order` (with `{ cartId }`) to create an order, and POST to `/api/paypal/capture-order` (with `{ orderId, cartId }`) to capture it
3. **`implementation-notes.md`** — a short document explaining any key decisions in your implementation, including how the SDK is loaded and why

Assume `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is available as an environment variable.
