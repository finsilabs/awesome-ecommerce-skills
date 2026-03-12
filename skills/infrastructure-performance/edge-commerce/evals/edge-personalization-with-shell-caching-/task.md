# Loyalty Tier Personalization at the Edge for a Home Goods Platform

## Problem/Feature Description

Hearth & Home is a direct-to-consumer home goods brand with a growing loyalty program. Members are assigned one of three tiers (Silver, Gold, Platinum) and should see a tier badge on product pages along with tier-specific messaging. Currently, the origin server renders a unique page per customer, which means the CDN cache is essentially useless — every logged-in customer bypasses the cache entirely, driving up origin load and worsening page load times globally.

The infrastructure team believes they can dramatically improve cache efficiency by having the origin serve a single cached HTML "shell" for each product page, and then injecting the customer-specific tier badge at the edge using a Cloudflare Worker. Customer tier preferences are already stored in an edge-accessible data store keyed by a customer ID that is passed in a request header by the storefront. The Worker also needs to be safe to deploy in an environment where Cloudflare may retry requests due to transient failures — so any side effects the Worker performs must handle being executed more than once gracefully.

## Output Specification

Produce the following files:

- `worker.ts` — the Cloudflare Worker that implements shell caching for product pages and injects personalization for identified loyalty members
- `design-notes.md` — a document explaining the cache architecture: how the shell is stored and retrieved, how personalized vs. anonymous responses differ in their cache headers, and why this approach avoids serving one customer's page to another

The implementation should handle both the authenticated (loyalty member) and anonymous (guest) request paths.
