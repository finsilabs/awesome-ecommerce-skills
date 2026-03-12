# Instagram Shopping Catalog Feed Endpoint

## Problem/Feature Description

Threads & Texture is a mid-size fashion brand that has been selling through their own website for years. Their head of growth wants to unlock Instagram Shopping so the brand's posts and stories can feature tappable product tags that take customers directly to the product page. To do this, Meta requires a publicly accessible product catalog feed in a specific XML format, hosted at a stable URL.

The engineering team needs to build a TypeScript/Express endpoint that dynamically renders the full catalog as an XML document. The catalog has multiple products, each with several variants (different colors and sizes). The generated XML will be registered with Meta Commerce Manager so Meta can crawl it to populate the Instagram Shopping catalog. The team wants it done in a way that handles variants correctly so that Meta groups size/color options together under one product in the shopping interface.

## Output Specification

Write a TypeScript file `src/catalog/meta-feed.ts` that exports a function `generateMetaCatalogFeed(req, res)` which:
- Queries a mock/stub database for active products with their variants, images, and categories
- Generates a well-formed XML product catalog response
- Sets appropriate HTTP response headers

Also write a short `IMPLEMENTATION_NOTES.md` explaining the key design decisions made (which library was used and why, how variants are handled, what HTTP headers are set and why, and how item IDs are assigned).

The implementation should use inline stubs/mocks for the database — no real database connection is needed. Define at least 2 sample products with at least 2 variants each.

## Input Files

No input files provided — write the implementation from scratch.
