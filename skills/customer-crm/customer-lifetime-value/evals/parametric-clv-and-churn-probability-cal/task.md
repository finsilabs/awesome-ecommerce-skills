# Customer Value Prediction Engine

## Problem/Feature Description

Petal & Co., a growing direct-to-consumer flower subscription service, wants to prioritize customer support and marketing spend more intelligently. Their current approach treats all customers equally, but the team suspects a small segment of loyal customers generates the majority of revenue. Before investing in a full data science platform, they want a lightweight TypeScript utility that predicts how much each customer is worth going forward and how likely they are to stop buying.

The engineering team has access to each customer's order history (order IDs, timestamps, amounts) and wants two things: a function that computes a forward-looking predicted lifetime value per customer, and a function that produces a churn probability score between 0 and 1. Both functions will be called from a nightly background job that processes the entire active customer base.

## Output Specification

Produce a single TypeScript file `clv.ts` that exports:

1. `calculatePredictedCLV(inputs)` — a pure function that takes aggregate statistics and returns a numeric CLV prediction
2. `predictCustomerCLV(customerId, projectionYears?)` — an async function that queries order history from a `db` object and returns a predicted CLV value
3. `calculateChurnProbability(customerId)` — an async function that queries order history from a `db` object and returns a churn probability score

The `db` object is assumed to be available in scope (you can declare it as a module-level import or constant). Write the logic so another developer can read it and understand the calculation approach.

Also produce a `README.md` that:
- Describes the formulas and thresholds used in each function
- Lists the key assumptions (e.g., gross margin rate used, how recency affects projections)

## Input Files

No additional input files are provided. Implement the functions based on your knowledge of CLV modeling best practices.
