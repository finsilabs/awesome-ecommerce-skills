---
name: loyalty-points-system
description: "Points earning, redemption rules, tier progression, and expiration policies"
category: pricing-promotions
risk: safe
source: curated
date_added: "2026-03-12"
tags: [loyalty, points, rewards, tiers, redemption, expiration, customer-retention]
triggers: ["loyalty program", "points system", "rewards program", "earn points", "redeem points", "customer loyalty", "tier system"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Loyalty Points System

## Overview

Build a customer loyalty program with points earned on purchases and other actions, a redemption mechanism at checkout, automatic tier progression based on lifetime spend, and configurable expiration policies. The ledger-based design ensures an auditable record of every points transaction without losing history when points are spent.

## When to Use This Skill

- When adding a customer retention mechanism to increase repeat purchase rate
- When launching a tiered VIP program where high-value customers unlock benefits like free shipping or early access
- When replacing an ad-hoc discount system with a structured loyalty program that customers can track
- When integrating points into a mobile app where customers check their balance and redeem at checkout
- When running promotional campaigns that award bonus points for specific actions (reviews, referrals, first purchase)

## Core Instructions

1. **Design the points ledger schema**

   Use an append-only ledger rather than a single balance column — this gives you a full audit trail and makes reversals trivial.

   ```sql
   CREATE TABLE loyalty_accounts (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     customer_id  UUID NOT NULL UNIQUE REFERENCES customers(id),
     tier         VARCHAR(16) NOT NULL DEFAULT 'bronze'
                    CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
     lifetime_spend INTEGER NOT NULL DEFAULT 0,  -- cents, used for tier calculation
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE TABLE loyalty_transactions (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     account_id   UUID NOT NULL REFERENCES loyalty_accounts(id),
     points       INTEGER NOT NULL,              -- positive = earned, negative = redeemed/expired
     type         VARCHAR(32) NOT NULL
                    CHECK (type IN ('purchase', 'bonus', 'redemption', 'expiration', 'adjustment', 'referral')),
     reference_id UUID,                          -- order_id, referral_id, etc.
     description  TEXT NOT NULL,
     expires_at   TIMESTAMPTZ,                   -- NULL = never expires
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE INDEX idx_loyalty_tx_account ON loyalty_transactions(account_id, created_at DESC);
   CREATE INDEX idx_loyalty_tx_expiry ON loyalty_transactions(expires_at) WHERE expires_at IS NOT NULL;
   ```

2. **Award points on purchase**

   ```typescript
   const TIER_MULTIPLIERS = { bronze: 1, silver: 1.25, gold: 1.5, platinum: 2 };
   const POINTS_PER_DOLLAR = 1;         // base: 1 point per $1 spent
   const EXPIRATION_MONTHS = 12;        // points expire 12 months after earning

   async function awardPurchasePoints(
     customerId: string,
     orderId: string,
     orderSubtotalCents: number
   ): Promise<number> {
     const account = await getOrCreateLoyaltyAccount(customerId);
     const multiplier = TIER_MULTIPLIERS[account.tier];
     const basePoints = Math.floor(orderSubtotalCents / 100) * POINTS_PER_DOLLAR;
     const points = Math.round(basePoints * multiplier);
     const expiresAt = new Date();
     expiresAt.setMonth(expiresAt.getMonth() + EXPIRATION_MONTHS);

     await db.transaction(async tx => {
       await tx.loyaltyTransactions.insert({
         account_id: account.id,
         points,
         type: 'purchase',
         reference_id: orderId,
         description: `Points for order ${orderId}`,
         expires_at: expiresAt,
       });
       // Update lifetime spend for tier recalculation
       await tx.loyaltyAccounts.update(account.id, {
         lifetime_spend: account.lifetime_spend + orderSubtotalCents,
       });
     });

     await recalculateTier(account.id);
     return points;
   }

   async function getOrCreateLoyaltyAccount(customerId: string) {
     const existing = await db.loyaltyAccounts.findByCustomerId(customerId);
     if (existing) return existing;
     return db.loyaltyAccounts.insert({ customer_id: customerId, tier: 'bronze' });
   }
   ```

3. **Calculate available balance (excluding expired points)**

   ```typescript
   async function getPointsBalance(accountId: string): Promise<number> {
     const result = await db.raw(`
       SELECT COALESCE(SUM(points), 0) AS balance
       FROM loyalty_transactions
       WHERE account_id = ?
         AND (expires_at IS NULL OR expires_at > NOW())
     `, [accountId]);

     return Math.max(0, parseInt(result.rows[0].balance, 10));
   }
   ```

4. **Redeem points at checkout**

   ```typescript
   const POINTS_TO_DOLLARS_RATE = 0.01; // 100 points = $1

   async function redeemPoints(
     customerId: string,
     orderId: string,
     pointsToRedeem: number
   ): Promise<{ discountCents: number }> {
     const account = await db.loyaltyAccounts.findByCustomerId(customerId);
     if (!account) throw new Error('No loyalty account found');

     const balance = await getPointsBalance(account.id);
     if (pointsToRedeem > balance) throw new Error('Insufficient points balance');
     if (pointsToRedeem <= 0) throw new Error('Points to redeem must be positive');

     const discountCents = Math.floor(pointsToRedeem * POINTS_TO_DOLLARS_RATE * 100);

     await db.loyaltyTransactions.insert({
       account_id: account.id,
       points: -pointsToRedeem,   // negative = debit
       type: 'redemption',
       reference_id: orderId,
       description: `Redeemed ${pointsToRedeem} points for $${(discountCents / 100).toFixed(2)} discount`,
       expires_at: null,
     });

     return { discountCents };
   }
   ```

5. **Tier recalculation and expiration job**

   ```typescript
   const TIER_THRESHOLDS = [
     { tier: 'platinum', minSpend: 200000 }, // $2,000
     { tier: 'gold',     minSpend: 100000 }, // $1,000
     { tier: 'silver',   minSpend: 25000  }, // $250
     { tier: 'bronze',   minSpend: 0      },
   ];

   async function recalculateTier(accountId: string): Promise<void> {
     const account = await db.loyaltyAccounts.findById(accountId);
     const newTier = TIER_THRESHOLDS.find(t => account.lifetime_spend >= t.minSpend)!.tier;
     if (newTier !== account.tier) {
       await db.loyaltyAccounts.update(accountId, { tier: newTier });
       await sendTierUpgradeEmail(account.customer_id, newTier);
     }
   }

   // Daily job: expire points
   async function expirePoints(): Promise<void> {
     const expiredGroups = await db.raw(`
       SELECT account_id, SUM(points) AS total_expiring
       FROM loyalty_transactions
       WHERE expires_at <= NOW()
         AND type != 'expiration'
         AND points > 0
       GROUP BY account_id
       HAVING SUM(points) > 0
     `);

     for (const row of expiredGroups.rows) {
       // Only expire points that haven't already been redeemed
       const balance = await getPointsBalance(row.account_id);
       const toExpire = Math.min(row.total_expiring, balance);
       if (toExpire > 0) {
         await db.loyaltyTransactions.insert({
           account_id: row.account_id,
           points: -toExpire,
           type: 'expiration',
           description: 'Points expired per policy',
           expires_at: null,
         });
       }
     }
   }
   ```

## Examples

### Award bonus points for leaving a product review

```typescript
async function awardReviewBonus(customerId: string, reviewId: string): Promise<void> {
  const REVIEW_BONUS_POINTS = 50;
  const account = await getOrCreateLoyaltyAccount(customerId);

  // Prevent duplicate awards for the same review
  const existing = await db.loyaltyTransactions.findOne({
    account_id: account.id,
    reference_id: reviewId,
    type: 'bonus',
  });
  if (existing) return;

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 12);

  await db.loyaltyTransactions.insert({
    account_id: account.id,
    points: REVIEW_BONUS_POINTS,
    type: 'bonus',
    reference_id: reviewId,
    description: 'Bonus points for product review',
    expires_at: expiresAt,
  });
}
```

### Full transaction history with running balance

```sql
SELECT
  lt.created_at,
  lt.type,
  lt.description,
  lt.points,
  SUM(lt.points) OVER (
    PARTITION BY lt.account_id
    ORDER BY lt.created_at
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_balance
FROM loyalty_transactions lt
WHERE lt.account_id = $1
ORDER BY lt.created_at DESC;
```

## Best Practices

- **Use a ledger, not a balance column** — an append-only transaction table makes reversals, audits, and expiration trivial; a balance column is prone to race conditions and data loss
- **Award points after order fulfillment, not at purchase** — prevent points fraud by only crediting points when the order is delivered and the return window closes
- **Send expiration reminder emails** — email customers 30 days before their points expire; this is a proven re-engagement trigger
- **Make redemption idempotent** — if an order is placed twice due to a network error, the second redemption call should detect the existing redemption row and not deduct points again
- **Display points in dollars on the UI** — "You have $5.00 in rewards" converts better than "You have 500 points"; show the dollar value prominently
- **Reverse points when orders are refunded** — insert a negative `adjustment` transaction tied to the refund event; do not rely on manual corrections
- **Add a maximum redemption cap per order** — e.g., customers can redeem at most 50% of order value in points; this protects margin

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Customer earns points on a returned order | Hook into the refund/return event to insert a negative `adjustment` transaction equal to the points originally earned |
| Points balance goes negative after expiration | In `expirePoints`, cap `toExpire = Math.min(toExpire, currentBalance)` so you never expire more points than are available |
| Tier downgrade confuses customers | Only downgrade tiers at predefined calendar dates (e.g., annually); use a "qualifying period" window, not lifetime cumulative spend |
| Referral fraud — customers refer themselves | Validate referral links by checking that referrer and referee have different email domains and billing addresses |

## Related Skills

- @coupon-management
- @gift-cards
- @ab-testing-pricing
- @customer-segmentation
- @discount-engine
