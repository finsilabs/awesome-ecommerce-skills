# Add Installment Payment Options to Stripe Checkout

## Problem/Feature Description

A mid-size furniture e-commerce brand is seeing 35% cart abandonment at checkout, and customer surveys indicate sticker shock on orders averaging $650. Marketing has data showing that customers in the $300–$1,800 range are especially price-sensitive. The engineering team wants to offer installment payment options alongside their existing credit card payments to help customers spread the cost over time. The store already processes all payments through Stripe and the team wants to avoid adding complexity from external SDKs.

Your task is to update the checkout backend and frontend to present installment payment options (Klarna, Afterpay, Affirm) to customers. The code should work within the existing Stripe setup — the backend creates a payment intent and the frontend renders a payment form using Stripe's React library. Keep the solution as straightforward as possible given the existing Stripe infrastructure.

## Output Specification

Produce the following files:

- `server/create-payment-intent.js` — The Express route handler (or equivalent) that creates the Stripe PaymentIntent for a checkout session. Include the order amount and relevant payment options.
- `client/CheckoutForm.jsx` — A React component that renders the payment form using Stripe's React SDK. Import from `@stripe/react-stripe-js`.
- `README.md` — Brief setup notes: what Stripe dashboard settings need to be enabled and any environment variables needed.
