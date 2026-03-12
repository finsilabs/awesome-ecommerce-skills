# Edge Inventory and Pricing Layer for a Global Electronics Retailer

## Problem/Feature Description

Volta Electronics sells consumer electronics globally through a single Cloudflare-fronted domain. Their product pages currently display inventory counts and pricing that are fetched synchronously from a US-based origin API on every request. For shoppers in Europe and Asia-Pacific this adds 400–600ms of latency, and during product launches the origin becomes a bottleneck when thousands of users simultaneously check the same product.

The platform team wants to move to a Cloudflare Worker that intercepts inventory requests and serves them from an edge KV store (refreshed automatically every minute), and that enriches product API requests with region-specific pricing data (currency, local tax rate, import duty rate) before forwarding them to the origin. They also need end-to-end visibility into how the edge layer is performing — specifically, which requests are cache hits vs. misses, how long each request takes, and what HTTP status codes are being returned — so they can feed this data into their observability platform via Cloudflare's native telemetry.

## Output Specification

Produce the following files:

- `src/index.ts` — the Cloudflare Worker implementation handling inventory cache reads/writes and regional pricing header injection
- `wrangler.toml` — the Cloudflare Worker project configuration, including all necessary KV namespace bindings, the compatibility date, and a scheduled trigger for inventory refresh
- `implementation-notes.md` — a short document explaining the caching strategy, how regional pricing data flows from the edge to the origin, and any important caveats about inventory accuracy at checkout time

The implementation should handle both the cache hit and miss paths for inventory requests and include telemetry instrumentation for request performance.
