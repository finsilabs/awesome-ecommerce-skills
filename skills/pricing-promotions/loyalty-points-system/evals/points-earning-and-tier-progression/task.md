# Loyalty Points Earning Engine

## Problem/Feature Description

A fashion e-commerce brand wants to reward their best customers with accelerated points earning as they reach higher spending milestones. The loyalty program should automatically move customers through membership tiers — Bronze, Silver, Gold, and Platinum — as their total lifetime purchases grow, and each tier should give them a higher earn rate on future purchases. When a customer crosses a tier threshold, they should receive a congratulatory email.

The database schema is already in place with `loyalty_accounts` and `loyalty_transactions` tables. The engineering team needs TypeScript functions to handle the earn flow: calculating the correct points for a completed order, updating the customer's lifetime spend, recalculating their tier, and recording the transaction. Points should expire after a set period.

The existing database ORM exposes:
- `db.loyaltyAccounts.findByCustomerId(customerId)` → account or null
- `db.loyaltyAccounts.findById(id)` → account
- `db.loyaltyAccounts.insert(data)` → account
- `db.loyaltyAccounts.update(id, data)` → void
- `db.loyaltyTransactions.insert(data)` → void
- `db.transaction(callback)` → runs callback in a DB transaction
- `sendTierUpgradeEmail(customerId, newTier)` → Promise<void>

## Output Specification

Produce a TypeScript file named `loyalty-earn.ts` containing:
- All constants at the top of the file
- `getOrCreateLoyaltyAccount(customerId: string)` function
- `awardPurchasePoints(customerId, orderId, orderSubtotalCents)` function that returns the number of points awarded
- `recalculateTier(accountId: string)` function
- `getPointsBalance(accountId: string)` function (uses `db.raw` with a SQL query)

Include a brief `// Usage example` comment at the bottom showing how to call `awardPurchasePoints`.
