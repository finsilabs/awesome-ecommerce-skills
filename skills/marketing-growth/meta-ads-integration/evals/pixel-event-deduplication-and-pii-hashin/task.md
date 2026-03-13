# Ecommerce Checkout Tracking and Customer Audience Sync

## Problem Description

A growing online apparel brand has been running Meta ads for two years but is struggling with attribution gaps. Their marketing analyst notices that the number of purchases reported in Meta Ads Manager is consistently lower than what their order database shows — the gap has been widening since a recent iOS update. The dev team suspects their tracking is incomplete: they may be missing events on some pages, and they haven't set up server-side redundancy yet.

Beyond the immediate tracking gaps, the growth team also wants to start building high-value retargeting audiences by syncing their existing customer list to Meta so they can create lookalike audiences from their top spenders. The customer data is stored internally and must be handled carefully before being sent anywhere outside the company.

The engineering lead has asked you to:
1. Implement complete browser-side funnel tracking across the product detail page, cart, and checkout confirmation
2. Add a server-side customer audience sync function that sends hashed customer data to Meta's Marketing API
3. Document the Content Security Policy domains that must be allowed for the Pixel to function

Produce working TypeScript/JavaScript code and an HTML snippet. The solution will be reviewed by the security team, so PII handling must be correct.

## Output Specification

Produce the following files:

- `pixel-events.js` — Browser-side JavaScript implementing Pixel tracking for all key funnel stages (product view, add to cart, checkout start, purchase confirmation). Include a noscript fallback snippet in a comment.
- `audience-sync.ts` — TypeScript function that hashes customer PII and syncs a customer list to a Meta custom audience via the Meta Marketing API
- `csp-config.md` — A short document listing the domains that must be whitelisted in the Content Security Policy for Meta Pixel to load and fire correctly
- `dedup-flow.md` — A brief explanation of how the deduplication ID is generated client-side and passed to the server

## Input Files

The following files describe the data models available. Extract them before beginning.

=============== FILE: storefront-types.ts ===============
export interface Product {
  sku: string;
  name: string;
  price: number;
}

export interface CartItem {
  sku: string;
  quantity: number;
  price: number;
}

export interface Cart {
  items: CartItem[];
  totalValue: number;
}

export interface Order {
  id: string;
  subtotal: number;          // pre-tax, pre-shipping
  totalWithTax: number;      // full amount customer paid
  currencyCode: string;
  lineItems: CartItem[];
}

export interface Customer {
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
}
