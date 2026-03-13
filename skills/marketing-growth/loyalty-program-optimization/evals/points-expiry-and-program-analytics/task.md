# Loyalty Program Lifecycle Management and Analytics

## Problem/Feature Description

NaturalBloom, a health and wellness DTC brand, has been running a loyalty program for 18 months. The marketing team is concerned that the program feels stale — members are accumulating points but not redeeming them, and the team has no visibility into whether the program is actually driving incremental revenue. The engineering team has been asked to implement the operational infrastructure that keeps the program healthy over time.

There are three main gaps to close: (1) the brand has never expired old points, and the liability on the balance sheet is growing; (2) there's no regular process to demote members who no longer meet their tier threshold after a period of inactivity; (3) the marketing team has no dashboard metrics to work from. Additionally, the CRM team wants to redesign post-purchase emails to make the loyalty value more tangible for members, and the promotions team is planning a product launch campaign and wants to know the best promotional mechanic to drive purchases.

## Output Specification

Produce the following in a file called `loyalty-lifecycle.ts`:

1. An `expireStalePoints` function implementing the monthly points expiry process, including advance notification logic.
2. A `runAnnualTierReview` function that re-evaluates all customers' tier status and handles downgrades.
3. A `getLoyaltyMetrics` function returning key program health indicators.

Also produce a `loyalty-recommendations.md` file (max 400 words) covering:
- The recommended format/content for post-purchase loyalty emails
- The recommended promotional mechanic for the upcoming product launch (choose between point multiplier events vs. discount codes, and justify your choice)
- A decision framework for when the brand should consider adjusting the redemption threshold (include a specific metric threshold that should trigger a review)
