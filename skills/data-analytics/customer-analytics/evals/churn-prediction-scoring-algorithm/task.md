# Customer Churn Risk Scoring Service

## Problem Description

Pulse Commerce, a subscription-to-repurchase health supplements brand, has been losing high-value customers without warning. The customer success team only finds out a customer has churned after they've already gone 3 months without a purchase, at which point win-back campaigns have a very low success rate. The VP of Customer Success wants a proactive system that flags customers before they churn so the CS team can intervene with targeted offers.

The engineering team uses TypeScript and has a database abstraction layer (`db`) already set up. Order records have a `createdAt` timestamp and a `status` field (orders can be 'cancelled', 'refunded', or valid). The team's data scientists have noted that churn behavior is fundamentally different for first-time buyers (who may simply never return) versus repeat customers (whose churn can be detected by looking at whether they've gone unusually long past their normal repurchase interval).

The CS team also maintains a `customerChurnScores` table in the database where scores can be persisted for lookup, and they want to surface the top at-risk high-value customers to the CS team daily. The business has a mix of customers who only buy seasonally (e.g., gift buyers) and regular repeat purchasers, and the system should account for this to avoid false alarms.

## Output Specification

Produce a TypeScript file `churn-scoring.ts` that implements:
1. A function `scoreCustomerChurnRisk(customerId: string)` that computes a churn risk score and category for a single customer
2. A function `getHighValueAtRiskCustomers(limit?: number)` that retrieves the top at-risk customers ordered by lifetime value

Also produce `churn-design.md` that explains:
- The scoring formula used for first-time buyers vs repeat buyers
- How the system avoids false positives for seasonal purchasers
- The recommended validation process to ensure the model stays accurate over time
- What action the system recommends based on lifetime value tier
