# Product Page SEO Module

## Problem Description

A fashion retailer is launching a new direct-to-consumer storefront. Their marketing team has been told by their SEO agency that product pages need to be "structured data ready" to qualify for Google Shopping rich results and achieve strong organic rankings before their Q3 launch. The engineering team has been asked to build a reusable TypeScript module that generates all SEO-relevant markup for a product page.

The module needs to support two product shapes: simple products (single option, one price) and configurable products (multiple variants with different prices). Reviews are stored separately and may or may not exist for every product. The agency flagged that a previous implementation had validation errors in Google Search Console because availability was set incorrectly and ratings appeared on products with no reviews.

## Output Specification

Write the module as a single TypeScript file `product-seo.ts`. It should export the functions needed to produce the full SEO markup for a product page, including:
- Open Graph and standard HTML meta tags
- Machine-readable structured data markup for Google rich results, embeddable in an HTML page `<head>`

Also create a short `demo.ts` (or equivalent runnable script) that exercises the module with representative test data covering:
- A single-variant product with reviews
- A multi-variant product without reviews
- An out-of-stock product

The demo should print or log the generated outputs so the results can be inspected. No build toolchain is required — plain `.ts` files with type annotations are fine if the logic is clear.
