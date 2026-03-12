# Currency Display Utility for International Storefront

## Problem/Feature Description

A growing online retailer is launching in seven international markets simultaneously: the US, UK, EU, Canada, Australia, Japan, and Brazil. Their engineering team needs a reusable JavaScript module that correctly represents each currency's metadata and formats prices for display. Currently prices are being built as plain strings by concatenating symbols and numbers, which produces wrong output for currencies like EUR (symbol should follow the amount in some locales) and JPY (which has no decimal places). The QA team has flagged embarrassing bugs like "€29.99" being displayed in German storefronts instead of "29,99 €", and yen prices showing cents.

The team wants a clean, well-structured utility module they can import across the codebase. It needs to expose a currency configuration registry and a formatting function that handles locale-specific display correctly for all supported markets.

## Output Specification

Produce a single JavaScript file at `src/currency.js` that exports:

1. A `SUPPORTED_CURRENCIES` object — a registry of all supported currencies with their metadata
2. A `BASE_CURRENCY` string constant indicating the store's base currency
3. A `formatPrice(amount, currency, locale)` function that returns a correctly formatted display string

Also produce a `src/currency.test.js` file that demonstrates the formatting function with at least 4 test cases covering different currencies and locales, printing results to stdout (use `console.log` or a simple assertion pattern — no test framework required). The test file should be runnable with `node src/currency.test.js`.
