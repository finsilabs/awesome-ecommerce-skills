# Retail Storefront: Volume Pricing Display and Cart Engine

## Problem/Feature Description

An online office supplies retailer wants to increase average order value by showing customers exactly how much they can save by buying in bulk. Their marketing team has found that customers who see a "Buy 10 for $2.39 each — save 20%" nudge frequently upgrade their order. The engineering team needs to build two features: a product page pricing table that shows the available quantity break tiers, and a cart calculation engine that applies volume discounts and clearly surfaces the savings to the shopper.

The retailer currently shows only a single price on the product page and doesn't recalculate prices as the cart changes. They've had complaints from customers who changed their cart quantity but saw the wrong unit price. The new system must recalculate all line prices whenever quantities change, and the cart summary must show total savings so customers feel rewarded for buying more.

## Output Specification

Produce a TypeScript file `store-pricing.ts` that exports:

1. A `getPricingTable` function that returns a list of rows for display on a product page, given a product's pricing tiers
2. A `calculateCart` function that takes a list of cart lines and returns each line's unit price, line total, and savings, plus the overall subtotal and total savings

Also produce `store-pricing.demo.ts` — a runnable demo script (executable with `npx ts-node store-pricing.demo.ts`) that:
- Defines a sample product with tiers (e.g., 10% off for 5+, 20% off for 10+, 30% off for 25+)
- Calls getPricingTable and prints the resulting rows to stdout
- Defines a sample 3-line cart and calls calculateCart, printing each line's details and the cart summary to stdout

The demo output should be readable — print prices in dollars (e.g. "$2.99") not raw cents.
