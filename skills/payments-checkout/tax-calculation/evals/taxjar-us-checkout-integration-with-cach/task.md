# Implement Tax Calculation for US E-Commerce Checkout

## Problem/Feature Description

ShopBridge is a mid-sized US online retailer selling home goods and electronics across all 50 states. Until now, their checkout has displayed a static placeholder ("Tax: TBD") and collected taxes only at a flat 5% — a practice that has already drawn two state audit notices. The CTO wants to replace this with a proper, real-time tax engine that accurately computes sales tax the moment a customer enters their shipping address, before they click "Place Order."

The engineering team has decided to use TaxJar as their tax calculation provider. They want a reusable tax calculation module that can be called from the checkout service, plus a lightweight caching layer to keep checkout latency acceptable. The solution must also be resilient: if TaxJar is down during peak traffic, checkout should not break entirely.

## Output Specification

Produce a self-contained JavaScript module at `lib/taxCalculation.js` that:

- Exports a function to calculate US sales tax for an order given from/to addresses, line items (each with a sku, title, unit price, quantity, optional tax code, and optional discount), and a shipping cost.
- Exports a function to retrieve a cached tax estimate or calculate and cache it if not present.
- Includes error handling so that a TaxJar API failure does not crash the checkout — document clearly in a comment what fallback strategy is used.

Also produce a short `README.md` explaining how to configure and call the module, including which environment variables are required.

Assume Redis is available at `process.env.REDIS_URL`. Do not actually connect to Redis or TaxJar in the code — the functions should be written as if those services exist but no real credentials are needed to read the code.
