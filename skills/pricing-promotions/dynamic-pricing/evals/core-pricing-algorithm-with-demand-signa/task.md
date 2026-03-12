# Build a Dynamic Pricing Engine Module

## Problem/Feature Description

ShopVelocity is a mid-size e-commerce retailer selling electronics and home goods. Their current pricing strategy is entirely manual: a merchandising analyst updates prices once a week based on gut feel, and the company is losing revenue to nimble competitors who adjust prices hourly. The VP of Product has commissioned a new automated pricing engine that can respond to live signals — how fast a product is selling, how much inventory remains, and what competitors are charging — to adjust prices automatically.

The engineering team needs a self-contained TypeScript module that accepts a snapshot of the current product state and pricing context, runs the decision logic, and produces a recommended price together with the reason for the change. The module must respect two levels of business constraints: hard per-product floor and ceiling prices set by the merchandising team, and an absolute cost-based margin floor that must never be violated regardless of any other rule.

## Output Specification

Produce a single TypeScript file `pricing-engine.ts` that exports:

1. The data types/interfaces for the pricing context, competitor price input, and pricing decision output.
2. A `computeRecommendedPrice` function that accepts a pricing context and returns a pricing decision.

Also produce a `pricing-engine.test.ts` file that demonstrates the module working correctly across at least four distinct test cases covering different market conditions (e.g. high demand, near-stockout inventory, competitor price undercutting, slow-moving product). The tests should print their pass/fail result to stdout (use plain `console.log` assertions or a lightweight test runner — no test framework installation is required beyond what Node.js provides natively).

## Input Files

No additional input files are provided. Implement the module from scratch based on the requirements above.
