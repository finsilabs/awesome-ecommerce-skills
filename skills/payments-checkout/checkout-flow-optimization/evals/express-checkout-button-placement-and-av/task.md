# Add Express Payment Options to Checkout

## Problem Description

Luxe Apparel, a mid-sized fashion retailer, is seeing high checkout abandonment on mobile. Their analytics team found that customers who start on the cart page often abandon before reaching the payment step because entering card details on a phone feels tedious. Competitors have recently added one-tap payment options that let returning customers skip the full form entirely.

The engineering team wants to integrate Apple Pay, Google Pay, and PayPal Express into the storefront. The cart page and checkout page both need to offer these options so that users can complete their purchase at whichever point feels natural. The implementation must also handle the fact that Apple Pay is not available on all devices or browsers.

## Output Specification

Implement the express checkout feature as React components. Produce the following files:

- `ExpressCheckout.jsx` — a self-contained express checkout section component
- `CartPage.jsx` — a cart page that includes the express checkout section alongside the regular "Proceed to checkout" button
- `CheckoutPage.jsx` — a checkout page that incorporates the express checkout section in its layout alongside the card payment form
- `checkout.css` — styles for the checkout/express checkout layout

The components do not need to connect to real payment SDKs — stub out the payment button implementations (e.g. `<ApplePayButton />`, `<GooglePayButton />`, `<PayPalExpressButton />`). Focus on structure, placement, and conditional rendering logic.

Leave all output files in the working directory when done.
