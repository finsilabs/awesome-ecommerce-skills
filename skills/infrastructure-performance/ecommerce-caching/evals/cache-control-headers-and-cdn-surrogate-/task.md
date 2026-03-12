# E-commerce CDN and Reverse Proxy Caching Configuration

## Problem/Feature Description

Prism Goods is a fast-growing direct-to-consumer brand that recently moved its storefront to a Node.js application behind Varnish and a CDN. Page load times are acceptable in testing but the team is seeing poor cache hit rates in production (around 30%) because cache headers are inconsistent across page types, tracking parameters from ad campaigns are generating thousands of unique cache keys, and the Varnish configuration is not stripping session cookies from cacheable pages.

The team wants a complete, consistent caching configuration that covers their Node.js middleware (for setting HTTP cache headers on every response type) and their Varnish VCL (for full-page caching at the reverse proxy). They need different caching rules for product listing pages, individual product pages, static assets, and cart/checkout flows. The configuration must also integrate with their CDN's targeted purging feature so that individual products can be purged without flushing everything. An important constraint is that their marketing team appends UTM and other tracking parameters to all URLs in ad campaigns, so the caching layer must handle these without fragmenting the cache.

## Output Specification

Produce the following files:

- `middleware/cache-headers.ts` — Express/Node.js middleware that sets appropriate `Cache-Control` (and related) headers for each type of request path
- `varnish.vcl` — A Varnish 4.1 VCL configuration with `vcl_recv`, `vcl_backend_response`, and `vcl_deliver` subroutines covering product pages, collection pages, static assets, cart/checkout, and homepage
- `docs/caching-strategy.md` — A short document (bullet points are fine) summarising the TTL decisions made for each page type and explaining the CDN purging approach

The output should be complete enough that a developer can review the strategy and the operations team can deploy it.
