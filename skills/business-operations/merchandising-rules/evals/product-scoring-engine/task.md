# Build a Product Scoring Engine for an E-commerce Platform

## Problem/Feature Description

Your team is building the core ranking infrastructure for a mid-sized fashion e-commerce platform that sells across 15 product categories. The merchandising team currently ranks products manually, which is time-consuming and doesn't scale. They want an automated system that scores each product based on its business performance, so the most valuable products naturally surface to the top of collection pages.

The scoring system needs to combine several product performance signals: how fast a product has been selling recently, how much revenue it generates, its conversion rate, its profit margin, how new it is, and how much stock is available. The merchandising lead has emphasized that the system should handle edge cases gracefully, particularly around out-of-stock products and brand-new products that haven't built up a sales history yet.

## Output Specification

Implement a `ProductScoringEngine` class in TypeScript (or equivalent in another language) that:
1. Accepts a list of product metrics and optional weight configuration
2. Returns a map of product ID to computed score

Save your implementation to `scoring_engine.ts` (or `.py`, `.js` etc. if you prefer a different language).

Also create a `scoring_demo.ts` (or equivalent) that:
- Creates sample data for at least 5 products with varied metrics (including at least one out-of-stock product and one brand-new product with no sales)
- Runs the scoring engine on the sample data
- Prints each product's final score to stdout

Run the demo and save the output to `scoring_output.txt`.

## Input Files

No external files are required — implement the engine from scratch using the product metrics described above.
