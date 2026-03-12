# Exchange Rate Service for International Product Catalog

## Problem/Feature Description

A mid-size e-commerce company has started expanding globally and needs to display product prices in multiple currencies across their Node.js backend. Their current setup fetches a live exchange rate on every single product page request, which is hammering the rate API, causing slow page loads, and approaching monthly API quotas. The team needs to refactor the exchange rate layer to be efficient and cost-effective, while still giving shoppers accurate prices.

Additionally, a product manager noticed that after converting USD prices to other currencies, the displayed amounts look strange — things like €23.847 or AU$14.312. They want the numbers to look natural and appealing to shoppers in each market.

Your task is to implement the exchange rate fetching, caching, and price conversion logic as a self-contained JavaScript module. Since no live Redis or API is available in this environment, implement the logic correctly and use mock/stub implementations (e.g. an in-memory cache object or a stub `redis` object) so the code is realistic and runnable. Write the module as if it will be dropped into a production codebase.

## Output Specification

Produce the following files:

1. `src/exchangeRates.js` — the exchange rate service with caching and a `convertPrice(amountUSD, targetCurrency)` function
2. `src/currencyRounding.js` — a `roundPrice(amount, currency)` function applying market-appropriate rounding
3. `src/demo.js` — a runnable demo that imports both modules and prints conversion + rounding examples for at least 3 currencies (including JPY) and at least 3 different price points, showing before and after rounding. Run it with `node src/demo.js`.

The demo should print clearly labeled output showing original amounts, converted amounts, and final rounded display amounts.
