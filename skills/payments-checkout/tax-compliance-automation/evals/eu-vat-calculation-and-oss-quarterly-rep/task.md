# EU VAT Calculation and Quarterly OSS Report Generator

## Problem/Feature Description

Papyrus & Co. is a small UK-based online retailer that sells books, stationery, baby accessories, food hampers, and general merchandise to customers across the European Union. Since Brexit, they ship into EU countries as a non-EU seller. Their checkout currently charges a flat 20% rate on everything — meaning they are under-charging VAT on some items, over-charging on others, and filing incorrect OSS returns each quarter.

The finance team has been burned by incorrect filings and needs to get things right for Q1. They need a proper VAT calculation module that applies the correct per-country standard and reduced rates depending on what type of product is in the cart, and a quarterly OSS return data generator that aggregates VAT collected by destination country. The team is particularly concerned about two things: that their book and food product lines get the reduced rates they're legally entitled to, and that their quarterly return numbers can be reconciled against the transaction database.

## Output Specification

Produce the following files:

- `eu-vat.js` — A JavaScript module with at minimum:
  - A `calculateEUVAT({ order, customer, items })` function that returns VAT amounts per line item and total VAT for a given order
  - A `generateOSSQuarterlyData(year, quarter, transactions)` function that accepts an array of tax transactions and aggregates them by destination country for OSS filing purposes
- `eu-vat.test.js` — Tests that verify:
  - Correct VAT rates are applied for at least Germany, France, Italy, Spain, and the Netherlands
  - Reduced rates are applied to qualifying product categories
  - OSS quarterly aggregation groups data correctly by country
- `vat-rates-reference.md` — A reference document listing the standard and reduced VAT rates for each supported EU country, and which product categories qualify for reduced rates

The implementation should work with a JavaScript object representing the VAT rate table rather than making API calls (no external API keys are needed).
