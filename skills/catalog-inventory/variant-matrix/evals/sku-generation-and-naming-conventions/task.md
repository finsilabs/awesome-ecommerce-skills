# Product Variant Library for Fashion Catalog

## Problem/Feature Description

A fashion startup is building a Node.js backend for their e-commerce catalog. They sell apparel and footwear across multiple option dimensions — sizes, colors, and sometimes materials — and need a reusable JavaScript library that generates the complete set of product variants from a product's option configuration. Currently, their team generates variant records by hand in spreadsheets, which leads to inconsistent SKU codes and missed combinations.

The library will be used by their import pipeline and admin API. The team has warehouse staff who scan and print barcode labels, so the generated SKUs must be machine-readable and work reliably with their label printer system. Option values like "Navy Blue" or "Light Grey" come directly from the buyer's color naming system and need to be encoded into SKUs in a way that remains consistent and collision-free.

## Output Specification

Write a JavaScript module at `lib/variantMatrix.js` that exports the following:

- A function that generates all combinations of option values (the Cartesian product)
- A function that takes a base product code, option axis names, and option value arrays and returns an array of variant objects — each with a `sku` string and an `options` object mapping axis names to values

Also write a short `demo.js` script that calls the library with a sample product (at least 2 option axes, at least one option value containing a space or special character) and writes the resulting variants to `output/variants.json`.

Run `demo.js` so that `output/variants.json` is present on disk with actual variant data.
