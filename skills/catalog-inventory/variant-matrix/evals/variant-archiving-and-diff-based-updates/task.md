# Variant Option Management for an E-Commerce Admin Backend

## Problem/Feature Description

An online apparel retailer has been running their store for two years and has thousands of orders in their database. Their product variants (sizes, colors) were set up when products were first listed, and now merchants need the ability to update option values over time — adding a new colorway to an existing product, or retiring a size that's being discontinued. However, their current system simply deletes and re-creates variants whenever options change, which has caused panicked support tickets from their fulfillment team when historical order line items start pointing to missing records.

The engineering team needs a robust variant management service. When a merchant changes the option configuration of a product, the backend must correctly reconcile the existing variant records with the new desired configuration. The service should also be able to surface any gaps in a product's variant setup to the admin UI, so merchants don't accidentally end up with a product grid where some combinations cannot be purchased.

## Output Specification

Write a JavaScript module `lib/variantLifecycle.js` that exports:

- A function that, given an existing list of variant records and a new desired option configuration, determines what changes need to be made to the variant database
- A function that, given a product's option configuration and current variant records, identifies any gaps or issues in the variant set that the merchant should be aware of

Write a `demo.js` script that:
1. Sets up a product with Size (S, M) × Color (Red, Blue) — 4 possible combinations, with one variant not currently visible to customers
2. Simulates a merchant updating the product to add "Green" and remove "Red" as color options
3. Calls your functions and writes a report to `output/lifecycle-report.json` that documents the reconciliation results and any warnings

Run `demo.js` so that `output/lifecycle-report.json` is present on disk.
