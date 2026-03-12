# Implement Afterpay Checkout on a Custom E-Commerce Platform

## Problem/Feature Description

An outdoor gear retailer runs a custom-built Node.js + React storefront (not Stripe-based) and wants to add Afterpay as a checkout option. Their average order value sits around $180–$400 and they have noticed strong uptake of installment options among their 25–40 demographic in the US, Australia, and Canada. After signing an Afterpay merchant agreement, they have received their AFTERPAY_MERCHANT_ID and AFTERPAY_SECRET_KEY credentials and want the engineering team to wire up the full checkout flow.

The flow should allow a customer to click "Pay with Afterpay", be redirected to complete Afterpay's approval, then return to the store with the payment captured. The checkout page already has access to the cart contents including item names, SKUs, quantities, unit prices, and the customer's email and name. Credentials are available as environment variables AFTERPAY_MERCHANT_ID, AFTERPAY_SECRET_KEY, and STORE_URL.

## Output Specification

Produce the following files:

- `server/afterpay.js` — Two Express route handlers:
  1. `POST /api/afterpay/create-checkout` — accepts `{ cartId }` in the body, looks up the cart from the provided cart data below, and calls the Afterpay API to create a checkout session. Returns `{ token, redirectUrl }`.
  2. `POST /api/afterpay/capture/:orderToken` — captures the approved Afterpay payment for the given orderToken. Returns the capture result.
- `client/AfterpaButton.jsx` — A React component with an "Pay with Afterpay" button. On click, it: (1) calls the create-checkout endpoint to get a token, then (2) launches the Afterpay flow. After customer approval, it calls the capture endpoint.
- `workflow-log.md` — A brief description of the integration steps your implementation follows, including any notable implementation decisions.

## Input Files

The following cart data is provided for testing. Extract before beginning.

=============== FILE: inputs/sample-cart.json ===============
{
  "cartId": "cart_8821",
  "email": "alex.morgan@example.com",
  "firstName": "Alex",
  "lastName": "Morgan",
  "total": 247.98,
  "items": [
    {
      "title": "Trail Running Shoes",
      "sku": "TRS-2024-M10",
      "quantity": 1,
      "unitPrice": 189.99
    },
    {
      "title": "Merino Wool Hiking Socks (3-pack)",
      "sku": "MWS-3PK-L",
      "quantity": 2,
      "unitPrice": 28.995
    }
  ]
}
