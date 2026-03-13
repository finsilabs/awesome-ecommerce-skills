# Build a Social Proof Data API for a Product Page

## Problem/Feature Description

Your team is building the backend for a product page that needs to surface real-time trust signals to shoppers. The marketing team has identified that conversion rates on the product detail pages are low, and they believe showing live activity — such as who recently bought, how many people are viewing right now, and current stock levels — will reduce purchase hesitancy.

You have access to a PostgreSQL database (via a `db` ORM object) and a Redis instance (via a `redis` client). The database has `orderLineItems` (with `order.shippingAddress` containing `firstName`, `city`, `stateCode`, `countryCode`), `productReviews`, and `productVariants` tables. Redis holds session presence data. Your task is to implement the backend endpoint and the Redis-based visitor tracking utilities.

## Output Specification

Produce a TypeScript file `social-proof-api.ts` that contains:
- An async Express-style route handler for a product social proof endpoint
- A function that records a product page view for a given session
- A function that retrieves the current active visitor count for a product

The code does not need to be runnable (no build step required), but it should be well-structured and production-quality TypeScript.

Also produce a short `design-notes.md` explaining:
- How the visitor count is computed and what time window is used
- How the API response avoids leaking customer personal data
- What the `isLow` flag in the stock level response represents and when it is set
- Any adjustments made to the raw visitor count before returning it in the response, and why
