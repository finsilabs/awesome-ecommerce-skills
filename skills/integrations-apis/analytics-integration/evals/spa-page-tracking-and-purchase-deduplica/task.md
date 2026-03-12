# Fixing Broken Analytics in a Next.js Storefront

## Problem/Feature Description

Verdant Shop, a plant retailer, runs a Next.js single-page application storefront. Since migrating to the SPA architecture six months ago, two analytics problems have emerged that are distorting their reporting:

**Problem 1 — Duplicate purchases:** GA4 reports are showing each purchase two to three times. The engineering team traced this to customers sharing their order confirmation URL with family members, and customers themselves refreshing the confirmation page. Every time the page loads, a `purchase` event fires, causing inflated revenue figures in GA4.

**Problem 2 — Missing page views:** GA4 shows almost no page view events after the initial session landing page. Because the app navigates client-side using Next.js router, subsequent page loads never trigger a full browser navigation, so GTM's default All Pages trigger only fires once per session.

The analytics team is also planning to add a server-side GA4 fallback for purchases (in case the browser event fails). They need the Node.js backend to identify the correct GA4 client ID for the user so that server-side events are attributed correctly.

## Output Specification

Produce the following files:

1. `purchase-tracking.js` — client-side JavaScript with a `trackPurchase(order)` function that fires the GA4 purchase event but handles the duplicate-event scenario. The `order` object contains: `id`, `total`, `tax`, `shippingCost`, `currency`, `couponCode`, `lineItems` (array of `{ sku, name, unitPrice, qty }`).

2. `spa-pageview.js` — client-side JavaScript that tracks page views correctly in a Next.js / SPA environment. Include a comment explaining what GTM configuration is required to work alongside this code.

3. `ga4-server.js` — a Node.js module exporting an async function `sendGA4Purchase(order, cookies)` where `cookies` is the parsed cookie object from the HTTP request. The function should send a purchase event to GA4 via the Measurement Protocol, extracting the correct client identifier from the cookies. Use environment variables for GA4 credentials.

Also produce a `FIXES.md` summarising what caused each problem and how each fix addresses it.
