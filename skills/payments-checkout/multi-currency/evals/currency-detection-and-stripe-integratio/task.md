# Multi-Currency Checkout Middleware and Payment Integration

## Problem/Feature Description

A fashion e-commerce platform serving customers in North America, Europe, and the UK wants to improve their international shopping experience. Currently every customer sees prices in USD regardless of their location, and all Stripe charges are processed in USD. The engineering team has been asked to implement two things: automatic currency detection for incoming requests, and a Stripe payment integration that charges customers in their local currency.

The backend is an Express.js application. The team wants to detect each visitor's preferred currency automatically from available signals (browser language, CDN headers), let users override it manually, remember that preference so it persists across visits, and ensure the Stripe charge is created correctly for each currency. The team is particularly worried about getting the Stripe amount calculation right — a previous incident caused overcharges for Japanese customers.

Your task is to implement the currency detection middleware, a currency preference API endpoint, and a Stripe payment intent creation helper. Since no live Stripe credentials or server are available, implement the logic as a self-contained module with stubs where needed. Document the key decisions in a `IMPLEMENTATION_NOTES.md` file.

## Output Specification

Produce the following files:

1. `src/middleware/currencyDetection.js` — Express middleware that detects and attaches the appropriate currency to the request, plus a `setCurrencyPreference` handler
2. `src/payments/stripeCharge.js` — a function `createPaymentIntent(displayPrice, customerCurrency, orderId, basePriceUSD)` that constructs (but doesn't necessarily execute) a correctly configured Stripe paymentIntents.create call, returning the parameters object
3. `IMPLEMENTATION_NOTES.md` — brief notes (bullet points) explaining the currency detection priority order implemented and the database storage approach for prices

The `createPaymentIntent` function should be importable and testable — export it and include a short `src/payments/demo.js` that calls it with sample data for at least 3 currencies (include JPY) and prints the resulting parameter objects.
