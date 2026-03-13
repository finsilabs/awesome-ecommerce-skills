# Customer Churn Scoring System

## Problem/Feature Description

Bloom & Co is a mid-sized online florist with a growing repeat customer base. Their marketing team has noticed that many customers who bought once or twice simply disappear, and the company has no way of knowing who is truly "gone" versus who is just between purchase cycles. The data team has access to the full order history per customer but currently has no scoring system to classify who is at risk of churning.

Your task is to design and implement a TypeScript churn scoring module that the team can run daily as part of their data pipeline. The module should assign risk levels to customers based on how overdue they are relative to their own individual purchase patterns. Customers with only a single order should receive a sensible fallback estimate. The team also has a mix of subscription-box customers and one-off purchasers in the same database, and they want to make sure the scoring logic applies correctly only to the right population.

## Output Specification

Produce a single TypeScript file named `churn-scoring.ts` that implements the scoring logic as described. The file should export:

- A `RetentionScore` type or interface
- A `calculateRetentionScores` function (can use stub/mock data access for database calls)
- A `getAtRiskSegments` function that groups scored customers into named segments

Also produce a short `DESIGN_NOTES.md` explaining:
1. How risk thresholds are determined
2. How single-purchase customers are handled
3. Which customers are excluded and why
4. What segments are produced and their definitions

The functions should be complete enough that a reviewer can understand the full scoring and segmentation approach by reading the code and notes.
