# Headless Storefront Product Detail Module

## Problem/Feature Description

TrekGear is migrating their Shopify store to a headless architecture using a custom TypeScript frontend. Their product pages need to display several types of enriched content that they have stored as custom data on products: a single sustainability certification (a reference to a custom object), a list of compatible accessory products (a list of product references), and a plain-text technical spec field. They also need the Storefront API queries to work alongside a Liquid fallback for their legacy theme.

The data is already stored in Shopify using the `custom` namespace. The developer team knows that the raw Storefront API returns custom data differently depending on whether it's a plain value, a single reference, or a list of references — and that getting this wrong means the fields silently return null. They need both a working TypeScript query module and a Liquid snippet that reads the same data correctly.

Produce a TypeScript module and a Liquid snippet that correctly query and render these three fields for a product. You do not need a live Shopify store — the TypeScript file should contain the complete query strings and show how the response would be destructured, but actual API calls are not required.

## Output Specification

Produce the following files:

- `storefront-query.ts` — A TypeScript module that exports a GraphQL query string (or query function) for fetching a product by handle with all three metafield types. Include code showing how the response data would be accessed for each field type (plain value, single reference, list of references).

- `product-metafields.liquid` — A Liquid snippet that reads and renders the same three fields from a `product` object:
  - The sustainability certification reference
  - The list of compatible accessories (as links)
  - The technical spec text

- `notes.md` — A brief explanation of the different access patterns used for each field type in both the Storefront API and Liquid contexts, and why these patterns differ.

The metafields to support are:
- `custom.sustainability_cert` — points to a single certification entry (a custom object) with fields `name` and `body`
- `custom.compatible_accessories` — a collection of up to 8 related products stored as references
- `custom.tech_spec` — a short plain-text technical specification string
