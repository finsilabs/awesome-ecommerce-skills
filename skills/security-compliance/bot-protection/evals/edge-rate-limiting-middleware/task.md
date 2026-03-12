# Rate Limiting for Commerce API Protection

## Problem/Feature Description

A fashion retailer's engineering team has noticed that competitors are hitting their product catalog API hundreds of times per minute, harvesting real-time pricing and inventory data. The scraping is causing elevated infrastructure costs and latency spikes that affect real shoppers. Additionally, during recent limited-edition drops, bots are saturating the checkout API, making it near-impossible for human customers to complete purchases.

The team is building a Next.js storefront and wants to add request rate limiting before traffic even reaches their application logic. The goal is to limit abuse at the edge, apply stricter throttling to the most sensitive endpoints, and return responses that well-behaved clients can use to back off gracefully.

## Output Specification

Implement rate limiting middleware for the Next.js application. Produce the following files:

- `middleware.ts` — the edge middleware implementing rate limiting
- `package.json` — listing the required dependencies (no need to run npm install)
- `IMPLEMENTATION_NOTES.md` — a brief description of the rate limiting strategy, including how different route types are treated and how the solution handles legitimate customers during flash sales

The implementation should cover at minimum the product catalog, checkout, and search route groups, and should handle the case where legitimate high-volume customers (e.g., authenticated users with purchase history) should not be unnecessarily blocked during peak events.
