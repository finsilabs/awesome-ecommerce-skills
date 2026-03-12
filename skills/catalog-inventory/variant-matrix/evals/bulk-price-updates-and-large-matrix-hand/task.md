# Variant Management for a Large Paint Product Catalog

## Problem/Feature Description

A paint manufacturer sells their products across three option dimensions: color (80+ named colors), finish (Matte, Satin, Gloss, Semi-Gloss), and container size (1L, 2.5L, 5L, 10L). Their previous e-commerce solution stored every possible combination in the database at product setup time and embedded all that data in the product page HTML, which made their store pages load painfully slowly and caused import jobs to time out.

The new system needs two capabilities. First, a pricing management tool that their admin team can use to update prices and stock levels across large groups of variants in one operation — for instance, targeting only a specific finish or a specific container size. Second, a smarter approach to variant storage that doesn't require pre-generating thousands of records up front. The product team has flagged that they may eventually want to add more product dimensions, but three has already proven to be the practical ceiling for what their merchants can manage through the UI.

## Output Specification

Write two JavaScript modules:

1. `lib/bulkVariantUpdate.js` — exports a function that accepts an array of variant objects, an update rule, and an optional filter targeting a subset of variants, then returns the updated array

2. `lib/lazyVariants.js` — exports a function that resolves a specific variant by its option combination from a store, generating and persisting a new record if one does not yet exist

Write a `demo.js` script that:
- Creates an in-memory store with a handful of pre-existing paint variants (at least 4, across different finishes and sizes)
- Applies at least two separate bulk operations with different rule types and different filters
- Requests a variant combination that is not in the initial store, demonstrating on-demand creation
- Writes results to `output/bulk-update-report.json` and `output/lazy-variants-store.json`

Run `demo.js` so both output files are present on disk.
