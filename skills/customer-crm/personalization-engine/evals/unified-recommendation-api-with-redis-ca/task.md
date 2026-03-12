# Multi-Context Recommendation API

## Problem Description

A fashion e-commerce platform is scaling up its personalization capabilities. The frontend team has built three surfaces that need product recommendations: the product detail page (PDP), the homepage, and the shopping cart sidebar. Currently each surface calls a different internal function directly, which has led to inconsistent behavior and no caching — causing slow page loads under traffic spikes.

The platform engineering team wants a single unified REST endpoint that all three surfaces can call. The endpoint must determine which recommendation strategy to use based on the page context, efficiently serve responses using a cache layer (the platform already has Redis available), and degrade gracefully when the primary strategy produces too few results. The recommendation functions themselves (`getFrequentlyBoughtTogether`, `getRecommendationsFromBrowsingHistory`, `getBestSellers`) can be treated as already implemented — the task is to wire them together into the API layer with the correct routing logic and caching behavior.

## Output Specification

Produce the following files:

1. `recommendations_api.ts` — A TypeScript module exporting a `getRecommendations(req, res)` Express-style handler implementing the unified recommendation endpoint. The handler should read `context`, `productId`, and `userId` from query parameters, apply context-based routing, and cache responses in Redis. Use placeholder implementations for the underlying recommendation functions and the Redis client.

2. `api_design.md` — A short document (one section per context: pdp, homepage, cart, and default) describing the routing logic, cache strategy, and any fallback behavior. Include the cache key format and TTL used.

The code can use placeholder/stub database and Redis clients — correctness of the routing and caching logic is what matters.
