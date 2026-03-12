# Product Rating Engine for E-Commerce Platform

## Problem/Feature Description

A mid-sized online retailer is launching a first-party review system. The engineering team has collected product reviews in their database but now needs to build the calculation and display layer. The product manager has flagged a specific problem: several new products with just 1–2 glowing reviews are appearing at the top of category pages, outranking established products with hundreds of balanced reviews. The team wants a fair scoring system that doesn't reward products with very few reviews.

Additionally, the SEO team has noticed competitors showing star ratings in Google Search results (the yellow stars in the snippet), and wants the same for this store. They need structured data markup on every product page that passes Google's Rich Results Test.

## Output Specification

Implement the solution as TypeScript (`.ts`) files. Produce:

1. **`rating-calculator.ts`** — A module that calculates aggregate product ratings. It should export a function that takes a list of review ratings (numbers) and a global mean rating, and returns a summary object. Demonstrate the calculation with a sample dataset of at least 3 products with different review counts (include a product with 0 reviews).

2. **`schema-builder.ts`** — A module that generates JSON-LD structured data for a product page. It should export a function that accepts a product object and a rating summary, and returns the JSON-LD object. Include a demonstration showing output for a product with reviews and a product without reviews.

3. **`demo.ts`** — A runnable script that imports and exercises both modules, printing the results to stdout. It should be executable with `npx ts-node demo.ts` (or compiled and run with `tsc && node dist/demo.js`).

Write `package.json` with any required dependencies. Do NOT include large binary assets or model files.
