# Loyalty Points Redemption and Expiration Maintenance

## Problem/Feature Description

A retail platform has a working loyalty points earning system and now needs two more pieces: the ability for customers to apply their points as a discount at checkout, and a nightly maintenance job that cleans up expired points.

The checkout team has reported that customers are occasionally charged twice due to payment gateway retries, so the redemption function must be safe to call multiple times for the same order without double-deducting points. The finance team also wants a safeguard so that customers cannot apply so many points that the company loses its entire margin on an order — there should be a ceiling on how much of an order can be paid with points.

The database ORM is the same as the earning system:
- `db.loyaltyAccounts.findByCustomerId(customerId)` → account or null
- `db.loyaltyTransactions.insert(data)` → void
- `db.loyaltyTransactions.findOne(filter)` → transaction or null
- `db.raw(sql, params)` → query result with `.rows` array
- `getPointsBalance(accountId)` → Promise<number> (already implemented elsewhere)

## Output Specification

Produce a TypeScript file named `loyalty-redeem.ts` containing:
- All constants at the top of the file
- `redeemPoints(customerId, orderId, pointsToRedeem, orderSubtotalCents)` function returning `{ discountCents: number }`
- `expirePoints()` function (the daily maintenance job)

Add a `// Notes:` comment block at the top of the file explaining the key design decisions made (idempotency approach, expiration logic, the redemption cap, and the conversion rate used).
