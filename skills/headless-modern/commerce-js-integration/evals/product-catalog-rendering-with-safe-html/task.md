# Headless Store Product Catalog Page

## Problem/Feature Description

A boutique lifestyle brand called "Nomad Goods" is launching a new website built with Next.js. They already have their product catalog set up in the Chec platform and now need a developer to wire up the frontend to display their products. The marketing team writes rich product descriptions in the Chec dashboard CMS, including formatting like bold text, bullet lists, and links — so the storefront needs to render this content properly.

The engineering lead wants the product page code to follow best practices: the Commerce.js client should be initialized cleanly and reused across the app, prices should be displayed appropriately, and product images should be handled gracefully even when a product has no image assigned.

## Output Specification

Write a self-contained Next.js-style module at `store/products.ts` (or `.js`) that:
- Exports a pre-initialized Commerce.js client as a named export `commerce`
- Exports an async function `fetchProducts()` that returns a list of products
- Exports an async function `fetchProduct(permalink: string)` that returns a single product by permalink

Also write a React component at `components/ProductCard.tsx` (or `.jsx`) that:
- Accepts a single `product` prop
- Displays the product name, price (with currency symbol), image (if present), and description
- Renders the description content safely

Write a `README.md` explaining how the public API key should be configured and what environment variable names are expected.

You do not need to have a working Chec account — the code should be structured correctly and reference appropriate environment variables. Do not attempt to make live API calls.
