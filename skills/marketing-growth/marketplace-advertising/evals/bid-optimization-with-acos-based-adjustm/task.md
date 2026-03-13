# Automated Keyword Bid Optimizer

## Problem/Feature Description

An Amazon seller managing dozens of Sponsored Products ad groups is spending hours each week manually reviewing keyword performance and adjusting bids in the advertising console. Their ACOS is inconsistent across the catalog — some keywords are underperforming and draining budget, while others are highly efficient but stuck at low bids that limit their visibility. The seller wants to automate this weekly bid review process.

The optimization logic needs to be data-driven: keywords without enough performance history shouldn't be touched, and bid changes should only be applied when there's a meaningful difference to avoid unnecessary API churn. The system must also handle the reality that Amazon's API has rate limits and that making the same change twice before it propagates causes confusing state. The target ACOS should be configurable per product line.

## Output Specification

Write a TypeScript file named `bid-optimizer.ts` that:
- Implements a function to optimize bids for all enabled keywords in a given ad group based on historical performance
- Applies directional bid adjustments based on ACOS relative to the target
- Respects minimum data requirements before making changes
- Enforces bid floor and ceiling bounds
- Only submits API updates when the bid change is meaningful
- Handles Amazon API reliability concerns appropriately

The implementation should use `fetch` for HTTP calls and follow the Amazon Ads API authentication pattern. Include inline comments explaining the logic for each decision threshold.
