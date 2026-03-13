---
name: loyalty-points-system
description: "Reward repeat customers with points they earn on every purchase, redeem for discounts, and accumulate to unlock higher-tier benefits"
category: pricing-promotions
risk: safe
source: curated
date_added: "2026-03-12"
tags: [loyalty, points, rewards, tiers, redemption, expiration, customer-retention]
triggers: ["loyalty program", "points system", "rewards program", "earn points", "redeem points", "customer loyalty", "tier system"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Loyalty Points System

## Overview

A loyalty points program rewards repeat customers with points earned on purchases and other actions (reviews, referrals, social shares), which they can redeem for discounts at checkout. Well-designed programs include tier progression (Bronze → Silver → Gold → Platinum) that unlocks perks like free shipping or higher point multipliers as customers spend more. Most merchants should start with a dedicated loyalty app — the major platforms have excellent options — rather than building from scratch.

## When to Use This Skill

- When adding a customer retention mechanism to increase repeat purchase rate
- When launching a tiered VIP program where high-value customers unlock benefits like free shipping or early access
- When replacing an ad-hoc discount system with a structured loyalty program that customers can track
- When integrating points into a mobile app where customers check their balance and redeem at checkout
- When running promotional campaigns that award bonus points for specific actions (reviews, referrals, first purchase)

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Smile.io (formerly Sweet Tooth) or LoyaltyLion | Both integrate natively with Shopify, handle points earning/redemption at checkout, and include tier management and referral programs |
| **Shopify** (budget) | Rivo Loyalty & Rewards or Bon Loyalty | Lower-cost alternatives with core points and tier features |
| **WooCommerce** | WooCommerce Points and Rewards (official, ~$79/year) or YITH WooCommerce Points & Rewards | WooCommerce-native integration; the official plugin is well-maintained |
| **BigCommerce** | Smile.io or LoyaltyLion | Both have BigCommerce integrations |
| **Multi-platform / Headless** | Loyaltylion API, Smile.io API, or Yotpo Loyalty | All expose APIs for integration with custom storefronts |
| **Custom / Headless** | Build with ledger-based points tracking | Only when app capabilities are insufficient for your specific requirements |

### Step 2: Configure the loyalty program

---

#### Shopify

**Using Smile.io (most popular Shopify loyalty app):**

1. Install **Smile: Loyalty & Rewards** from the Shopify App Store (free tier available; paid plans from ~$49/month)
2. In the Smile dashboard, configure **Ways to earn**:
   - Points for purchase (e.g., 1 point per $1 spent)
   - Bonus points for account creation, birthday, product reviews
   - Referral points for referring a friend
3. Configure **Ways to redeem**:
   - Points for a discount code (e.g., 100 points = $1 off)
   - Set minimum points required for redemption
   - Set maximum redemption per order (e.g., max 50% of order value in points)
4. Configure **Tiers** (VIP program, available on paid plans):
   - Define tier thresholds (e.g., Bronze: 0–$500 spend, Silver: $500–$1,000, Gold: $1,000+)
   - Set tier benefits: point multipliers, exclusive products, free shipping
5. Configure the **Customer-facing widget**: the floating points widget appears on your storefront automatically; customize colors and placement

**Testing the integration:**
- Create a test customer account, place a test order, and verify points are awarded after the order status changes to "fulfilled"
- Attempt a redemption at checkout to verify the discount applies correctly

---

#### WooCommerce

**Using WooCommerce Points and Rewards:**

1. Install **WooCommerce Points and Rewards** from WooCommerce.com
2. Go to **WooCommerce → Points and Rewards → Settings**:
   - **Earn points**: set the earning ratio (e.g., 1 point per $1 spent)
   - **Earn points for**: purchases, reviews, account registration
   - **Redeem points**: set the redemption ratio (e.g., 100 points = $1 discount)
   - **Maximum discount**: cap the amount that can be redeemed per order
   - **Points expire**: optionally set an expiration period
3. Manage individual customer balances under **WooCommerce → Points and Rewards → Manage Points**
4. Points are displayed in the customer's account page automatically

**For tiers with WooCommerce:**
The official plugin does not include tier management. Options:
- **YITH WooCommerce Points & Rewards**: includes tier/VIP functionality
- **Gamification for WooCommerce**: adds tier levels and achievement badges
- Manually assign WooCommerce customer groups (roles) based on lifetime spend and give group-specific prices or shipping rates

---

#### BigCommerce

**Using Smile.io on BigCommerce:**

1. Install **Smile.io** from the BigCommerce App Marketplace
2. Follow the same Smile.io setup as the Shopify section above — the interface is nearly identical
3. Smile.io integrates with BigCommerce's checkout to apply loyalty discounts as coupon codes

**Using LoyaltyLion:**

1. Install **LoyaltyLion** from the BigCommerce App Marketplace
2. Configure earning rules and redemption options in the LoyaltyLion dashboard
3. The app adds a customer loyalty panel to account pages and integrates with BigCommerce checkout

---

#### Custom / Headless

For headless storefronts or when app capabilities are insufficient, build a ledger-based points system. The ledger pattern (append-only transactions, no balance column) ensures accuracy, enables full audit trails, and makes point reversals trivial.

```sql
CREATE TABLE loyalty_accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL UNIQUE,
  tier         VARCHAR(16) NOT NULL DEFAULT 'bronze',
  lifetime_spend_cents INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE loyalty_ledger (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID NOT NULL REFERENCES loyalty_accounts(id),
  points       INTEGER NOT NULL,  -- positive = earned, negative = redeemed/expired
  type         VARCHAR(32) NOT NULL CHECK (type IN ('purchase', 'bonus', 'referral', 'redemption', 'expiration', 'adjustment')),
  reference_id UUID,              -- order_id, review_id, etc.
  description  TEXT NOT NULL,
  expires_at   TIMESTAMPTZ,       -- NULL = never expires
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Points balance (excluding expired transactions):**

```typescript
async function getPointsBalance(accountId: string): Promise<number> {
  const result = await db.raw(`
    SELECT COALESCE(SUM(points), 0) AS balance
    FROM loyalty_ledger
    WHERE account_id = ?
      AND (expires_at IS NULL OR expires_at > NOW())
  `, [accountId]);
  return Math.max(0, parseInt(result.rows[0].balance, 10));
}
```

**Award points after order fulfillment** (not at purchase — prevents points fraud from returns):

```typescript
const TIER_MULTIPLIERS = { bronze: 1, silver: 1.25, gold: 1.5, platinum: 2 };
const POINTS_PER_DOLLAR = 1;
const EXPIRY_MONTHS = 12;

async function awardPurchasePoints(customerId: string, orderId: string, subtotalCents: number) {
  const account = await getOrCreateAccount(customerId);
  const multiplier = TIER_MULTIPLIERS[account.tier];
  const points = Math.round((subtotalCents / 100) * POINTS_PER_DOLLAR * multiplier);
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + EXPIRY_MONTHS);

  await db.loyaltyLedger.insert({
    account_id: account.id, points, type: 'purchase',
    reference_id: orderId, description: `Points for order ${orderId}`, expires_at: expiresAt,
  });

  // Update lifetime spend and recalculate tier
  await db.loyaltyAccounts.update(account.id, {
    lifetime_spend_cents: account.lifetime_spend_cents + subtotalCents,
  });
  await recalculateTier(account.id);
}
```

**Redeem points at checkout:**

```typescript
const REDEMPTION_RATE = 0.01; // 100 points = $1

async function redeemPoints(customerId: string, orderId: string, pointsToRedeem: number): Promise<{ discountCents: number }> {
  const account = await db.loyaltyAccounts.findByCustomerId(customerId);
  const balance = await getPointsBalance(account.id);
  if (pointsToRedeem > balance) throw new Error('Insufficient points');

  const discountCents = Math.floor(pointsToRedeem * REDEMPTION_RATE * 100);
  await db.loyaltyLedger.insert({
    account_id: account.id, points: -pointsToRedeem, type: 'redemption',
    reference_id: orderId, description: `Redeemed for order ${orderId}`,
  });
  return { discountCents };
}
```

## Best Practices

- **Award points after fulfillment, not at purchase** — prevents customers from earning points on orders they plan to return; most loyalty apps have a configurable "pending period" for this
- **Display points in dollar value on the UI** — "You have $5.00 in rewards" converts better than "You have 500 points"; show the dollar value prominently
- **Send expiration reminder emails** — email customers 30 days before their points expire; this is a proven re-engagement trigger that also drives purchases
- **Cap maximum redemption per order** — allow redeeming at most 50% of order value in points to protect margin
- **Reverse points when orders are refunded** — insert a negative adjustment transaction tied to the refund event; do not rely on manual corrections
- **Display upcoming tier thresholds** — "Spend $47 more to reach Gold" drives incremental spend more than just showing the current tier
- **Start simple** — launch with a flat earn rate before adding tiers; tiers add complexity and customer service burden; prove the program works first

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Customer earns points on a returned order | Award points only after the return window closes, or reverse points when a return is processed |
| Tier downgrade confuses customers | Only evaluate tier downgrades at pre-defined calendar dates (e.g., annually), not after each order; communicate the policy clearly |
| Referral fraud — customers referring themselves | Validate referrals by checking that referrer and referee have different email addresses and/or billing addresses |
| App stops awarding points after a platform update | Set up monitoring alerts on your loyalty app; test point awards weekly with an automated test order |
| Points balance shown as zero on checkout due to sync lag | For custom builds, calculate balance in real-time from the ledger; for app-based programs, ensure the app is fully integrated with your checkout |

## Related Skills

- @coupon-management
- @gift-cards
- @ab-testing-pricing
- @customer-segmentation
- @discount-engine
