# Loyalty Tier System and Points Redemption

## Problem/Feature Description

StyleVault, a mid-market fashion retailer, is upgrading their basic points program into a full tiered loyalty system with checkout redemption. Their customers have been accumulating points for over a year, and now the brand wants to introduce meaningful status tiers with differentiated perks, so that high-spending customers feel recognized and rewarded.

At checkout, customers should be able to apply their points balance as a discount. The redemption system needs to be airtight — preventing customers from redeeming more than they have, and ensuring the resulting discount code can only be used once and doesn't stay valid indefinitely.

The team also needs the tier qualification logic to correctly evaluate customers when their points balance changes. They want to reward customers who achieve a new tier with a surprise bonus, and send them an email celebrating their new status. Separately, the returns team has flagged that when orders are refunded, the points that were earned from those orders need to be clawed back.

## Output Specification

Implement the following in a file called `loyalty-system.ts`:

1. A `LOYALTY_TIERS` constant defining the full tier structure with names, qualification thresholds, earn multipliers, and available benefit types.
2. A `redeemPoints` function that validates the redemption request, generates a discount code, logs the transaction, and updates the customer balance.
3. An `evaluateTierStatus` function that determines whether a customer should change tiers and handles the upgrade flow.
4. A `reverseOrderPoints` function that debits points when an order is refunded.

You may stub `db`, `createUniqueDiscount`, `sendTierUpgradeEmail`, `earnPoints`, `subDays`, and `addDays`.

Also produce a `loyalty-system-design.md` file (max 300 words) explaining the key design decisions in your implementation — specifically how tier qualification works and how redemption codes are protected.
