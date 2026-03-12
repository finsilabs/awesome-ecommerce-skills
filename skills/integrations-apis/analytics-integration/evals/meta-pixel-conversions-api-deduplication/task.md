# Meta Ad Conversion Tracking with Server-Side Reliability

## Problem/Feature Description

LunaGear, a direct-to-consumer outdoor equipment brand, runs large acquisition campaigns on Meta (Facebook and Instagram). Their marketing team has noticed significant under-reporting of purchase conversions in Meta Ads Manager — ad blockers and iOS privacy restrictions are preventing the browser-based Meta Pixel from firing reliably. The attribution gap is causing the bidding algorithm to underperform because it sees fewer conversions than actually occurred.

The engineering team has been asked to add a server-side complement to the existing browser pixel that will catch conversions even when the browser event fails to send. A critical requirement is that the same purchase conversion must NOT be counted twice in Meta — once from the browser and once from the server. The engineering team uses Node.js on the backend. They also handle customer data including email addresses, and the legal team has flagged that personally identifiable information must not be transmitted in raw form to any third-party analytics service via the browser.

## Output Specification

Produce two files:

1. `browser-tracking.js` — client-side JavaScript that fires the Meta Pixel purchase event when an order is confirmed. The `order` object available in scope contains: `id`, `total`, `currency`, `lineItems` (array of `{ sku }`).

2. `server-handler.js` — a Node.js module that exports an async function `sendPurchaseConversion(order, requestContext)`. The `requestContext` object contains `ipAddress` and `userAgent`. The `order` object contains: `id`, `total`, `currency`, `lineItems` (array of `{ sku }`), and `customerEmail`. The function should send the purchase event to Meta using the server-side API.

Also produce a short `ARCHITECTURE.md` explaining how the two files work together to achieve reliable conversion tracking and avoid double-counting.
