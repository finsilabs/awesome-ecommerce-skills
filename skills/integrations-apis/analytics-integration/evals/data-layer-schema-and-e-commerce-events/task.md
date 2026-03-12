# E-commerce Analytics Tracking Implementation

## Problem/Feature Description

ShopBright, a mid-size online retailer, recently completed a full redesign of their storefront but stripped out all legacy analytics code in the process. The head of growth has asked the engineering team to implement proper e-commerce tracking before the relaunch. They need visibility into how customers browse products and move through the funnel — from seeing items on a listing page all the way to confirming a purchase.

The engineering team uses Google Tag Manager to manage analytics tags and wants all tracking data routed through a single `dataLayer` that GTM can consume. The codebase is plain JavaScript (no bundler required), but the implementation should be structured so that another developer can easily add tracking for new events later. The business also cares deeply about data accuracy: there have been reports of duplicate purchase events at other companies, and the team wants to make sure this won't be a problem at ShopBright.

## Output Specification

Produce a single JavaScript file named `tracking.js` that implements the following:

- A `trackViewItemList(products)` function for the product listing page
- A `trackViewItem(product)` function for the product detail page
- A `trackAddToCart(product, quantity)` function
- A `trackPurchase(order)` function for the order confirmation page

The `order` object passed to `trackPurchase` will contain the following fields:
- `id` — the server-generated order ID
- `total`, `tax`, `shippingCost`, `currency`, `couponCode`
- `lineItems` — array of `{ sku, name, unitPrice, qty }`

The `product` object contains: `sku`, `name`, `brand`, `category`, `price`.

Also produce a short `README.md` explaining the idempotency strategy used for the purchase event, and any important assumptions.
