# Implement PayPal Payment Server Endpoints

## Problem/Feature Description

A mid-size outdoor gear retailer is adding PayPal as a payment option to their existing Node.js/Express e-commerce backend. Their frontend team has already wired up the PayPal JavaScript SDK to call two server-side endpoints: one to create a PayPal order when a customer clicks "Pay with PayPal", and one to capture the funds once the customer approves the payment in the PayPal popup.

The engineering lead is particularly worried about two failure modes they've seen with other integrations: (1) duplicate charges when a network timeout causes the client to retry a request, and (2) situations where a payment shows as "approved" on the frontend but the funds were never actually settled. She wants the implementation to be resilient to both.

The company also runs a staging environment against PayPal's sandbox and a production environment against the live API — the same codebase must work in both without code changes, controlled only by environment variables.

## Output Specification

Produce the two server-side endpoint handlers as standalone JavaScript files:

1. **`api/paypal/create-order.js`** — handles `POST /api/paypal/create-order`. Expects `{ cartId }` in the request body. Should return `{ id: "<paypalOrderId>" }` on success, or an appropriate error response. Use the following mock cart object in your implementation (you don't need a real database):

```javascript
// Mock cart — use this directly in your implementation
const mockCart = {
  id: "cart_abc123",
  total: 89.97,
  subtotal: 79.99,
  shippingCost: 5.99,
  taxAmount: 3.99,
  items: [
    {
      unitPrice: 39.99,
      quantity: 1,
      variant: { name: "Trail Running Shoes - Size 10", sku: "TRS-10" }
    },
    {
      unitPrice: 39.99,
      quantity: 1,
      variant: { name: "Merino Wool Socks - M", sku: "MWS-M" }
    }
  ]
};
```

2. **`api/paypal/capture-order.js`** — handles `POST /api/paypal/capture-order`. Expects `{ orderId, cartId }` in the request body. Should confirm the payment is fully settled, record the relevant payment identifiers, and return `{ shopOrderId, captureId }`.

3. **`implementation-notes.md`** — a short document explaining the key design decisions, including how you handle retries and environment switching.

Both files should read PayPal credentials from environment variables. You do not need to implement a real database layer — use console.log or a mock to represent persistence calls.
