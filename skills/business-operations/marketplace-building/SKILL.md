---
name: marketplace-building
description: "Multi-vendor marketplace architecture — seller onboarding, commissions, payouts"
category: business-operations
risk: critical
source: curated
date_added: "2026-03-12"
tags: [marketplace, multi-vendor, seller-onboarding, commissions, payouts, Stripe-Connect, platform]
triggers: ["marketplace", "multi-vendor marketplace", "seller onboarding", "marketplace commissions", "seller payouts", "platform marketplace"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Marketplace Building

## Overview

Build a multi-vendor marketplace where independent sellers list products, the platform collects payment on their behalf, deducts a commission, and pays out the remainder. Covers seller onboarding with KYC via Stripe Connect, order routing to the correct seller, commission calculation, automated payout scheduling, and a seller dashboard with earnings visibility.

## When to Use This Skill

- When building a platform where third-party sellers list and sell their own products (not your inventory)
- When you need the platform to collect payment from buyers and distribute funds to sellers minus a commission
- When sellers need their own dashboard to manage listings, view orders, and track earnings
- When complying with KYC (Know Your Customer) requirements by offloading identity verification to Stripe Connect
- When designing the commission structure (percentage, tiered, category-based) and payout schedule

## Core Instructions

1. **Model sellers and their commission structure**

   ```sql
   CREATE TABLE sellers (
     id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name              VARCHAR(128) NOT NULL,
     user_id           UUID NOT NULL UNIQUE REFERENCES users(id),
     stripe_account_id VARCHAR(64),       -- Stripe Connect account ID
     status            VARCHAR(16) NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'active', 'suspended', 'deactivated')),
     commission_type   VARCHAR(16) NOT NULL DEFAULT 'percentage'
                         CHECK (commission_type IN ('percentage', 'fixed', 'tiered')),
     commission_rate   NUMERIC(5,2) NOT NULL DEFAULT 15.00, -- 15%
     payout_schedule   VARCHAR(16) NOT NULL DEFAULT 'weekly'
                         CHECK (payout_schedule IN ('daily', 'weekly', 'monthly', 'manual')),
     created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE TABLE seller_earnings (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     seller_id       UUID NOT NULL REFERENCES sellers(id),
     order_id        UUID NOT NULL REFERENCES orders(id),
     gross_amount    INTEGER NOT NULL,   -- cents: what buyer paid for seller's items
     commission      INTEGER NOT NULL,   -- cents: platform's cut
     net_amount      INTEGER NOT NULL,   -- cents: gross - commission
     status          VARCHAR(16) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'held', 'available', 'paid_out')),
     available_at    TIMESTAMPTZ NOT NULL, -- when funds become available for payout (e.g. after return window)
     created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE TABLE payouts (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     seller_id       UUID NOT NULL REFERENCES sellers(id),
     amount          INTEGER NOT NULL,   -- cents
     stripe_payout_id VARCHAR(64),
     status          VARCHAR(16) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
     period_start    DATE NOT NULL,
     period_end      DATE NOT NULL,
     created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   ```

2. **Onboard a seller with Stripe Connect**

   ```typescript
   import Stripe from 'stripe';
   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

   async function createSellerOnboardingLink(sellerId: string): Promise<string> {
     const seller = await db.sellers.findById(sellerId);

     // Create a Stripe Express account if not already linked
     let stripeAccountId = seller.stripe_account_id;
     if (!stripeAccountId) {
       const account = await stripe.accounts.create({
         type: 'express',
         capabilities: { transfers: { requested: true } },
         settings: {
           payouts: { schedule: { interval: seller.payout_schedule as any } },
         },
       });
       stripeAccountId = account.id;
       await db.sellers.update(sellerId, { stripe_account_id: stripeAccountId });
     }

     // Generate an onboarding link (valid for 24 hours)
     const link = await stripe.accountLinks.create({
       account: stripeAccountId,
       refresh_url: `${process.env.APP_URL}/seller/onboarding?refresh=true`,
       return_url: `${process.env.APP_URL}/seller/onboarding/complete`,
       type: 'account_onboarding',
     });

     return link.url;
   }

   // Webhook handler for when a seller completes onboarding
   async function handleStripeAccountUpdated(account: Stripe.Account): Promise<void> {
     const seller = await db.sellers.findByStripeAccountId(account.id);
     if (!seller) return;

     const isActive = account.charges_enabled && account.payouts_enabled;
     if (isActive && seller.status !== 'active') {
       await db.sellers.update(seller.id, { status: 'active' });
       await emailService.send({
         to: seller.email,
         template: 'seller-account-approved',
         data: { sellerName: seller.name },
       });
     }
   }
   ```

3. **Calculate and record commission on each order**

   ```typescript
   async function recordSellerEarning(
     orderId: string,
     sellerId: string,
     grossAmountCents: number
   ): Promise<void> {
     const seller = await db.sellers.findById(sellerId);

     const commission = calculateCommission(seller, grossAmountCents);
     const netAmount = grossAmountCents - commission;

     // Funds available after return window (e.g., 30 days)
     const availableAt = new Date();
     availableAt.setDate(availableAt.getDate() + 30);

     await db.sellerEarnings.insert({
       seller_id: sellerId,
       order_id: orderId,
       gross_amount: grossAmountCents,
       commission,
       net_amount: netAmount,
       status: 'held',
       available_at: availableAt,
     });
   }

   function calculateCommission(seller: Seller, grossAmountCents: number): number {
     if (seller.commission_type === 'percentage') {
       return Math.round(grossAmountCents * (seller.commission_rate / 100));
     }
     if (seller.commission_type === 'fixed') {
       return seller.commission_rate * 100; // fixed fee in cents
     }
     if (seller.commission_type === 'tiered') {
       return calculateTieredCommission(grossAmountCents);
     }
     return 0;
   }

   function calculateTieredCommission(grossCents: number): number {
     // Example tiered structure
     const tiers = [
       { upTo: 1000_00, rate: 0.20 },   // 20% on first $1,000
       { upTo: 10000_00, rate: 0.15 },  // 15% on $1,000–$10,000
       { upTo: Infinity, rate: 0.10 },  // 10% above $10,000
     ];
     let commission = 0;
     let remaining = grossCents;
     for (const tier of tiers) {
       if (remaining <= 0) break;
       const inTier = Math.min(remaining, tier.upTo);
       commission += Math.round(inTier * tier.rate);
       remaining -= inTier;
     }
     return commission;
   }
   ```

4. **Process weekly payouts to sellers via Stripe Connect transfers**

   ```typescript
   async function processWeeklyPayouts(): Promise<void> {
     const sellers = await db.sellers.findAll({ status: 'active', payout_schedule: 'weekly' });

     for (const seller of sellers) {
       const periodEnd = new Date();
       const periodStart = new Date(periodEnd);
       periodStart.setDate(periodStart.getDate() - 7);

       // Sum all available (not yet paid out) earnings
       const earnings = await db.sellerEarnings.findAll({
         seller_id: seller.id,
         status: 'available',
         available_at: { lte: periodEnd },
       });

       if (earnings.length === 0) continue;

       const totalAmount = earnings.reduce((s, e) => s + e.net_amount, 0);
       if (totalAmount < 100) continue; // minimum payout $1.00

       const payout = await db.payouts.insert({
         seller_id: seller.id,
         amount: totalAmount,
         status: 'pending',
         period_start: periodStart.toISOString().slice(0, 10),
         period_end: periodEnd.toISOString().slice(0, 10),
       });

       try {
         // Transfer funds from your platform's Stripe balance to the seller's Express account
         const transfer = await stripe.transfers.create({
           amount: totalAmount,
           currency: 'usd',
           destination: seller.stripe_account_id,
           metadata: { payout_id: payout.id, seller_id: seller.id },
         });

         await db.transaction(async tx => {
           await tx.payouts.update(payout.id, { status: 'paid', stripe_payout_id: transfer.id });
           await tx.sellerEarnings.updateMany(earnings.map(e => e.id), { status: 'paid_out' });
         });
       } catch (err) {
         await db.payouts.update(payout.id, { status: 'failed' });
         console.error(`Payout failed for seller ${seller.id}:`, err);
       }
     }
   }
   ```

5. **Seller dashboard — earnings summary**

   ```typescript
   // GET /api/seller/earnings
   app.get('/api/seller/earnings', requireSellerAuth, async (req, res) => {
     const sellerId = req.seller.id;

     const [summary, recentPayouts] = await Promise.all([
       db.raw(`
         SELECT
           SUM(CASE WHEN status = 'available' THEN net_amount ELSE 0 END) AS available_balance,
           SUM(CASE WHEN status = 'held' THEN net_amount ELSE 0 END) AS held_balance,
           SUM(CASE WHEN status = 'paid_out' THEN net_amount ELSE 0 END) AS total_paid_out,
           SUM(commission) AS total_commission_paid,
           SUM(gross_amount) AS total_gmv
         FROM seller_earnings
         WHERE seller_id = ?
       `, [sellerId]).then(r => r.rows[0]),

       db.payouts.findAll({ seller_id: sellerId }).orderBy('created_at', 'desc').limit(10),
     ]);

     res.json({ summary, recentPayouts });
   });
   ```

## Examples

### Multi-seller order — split payment using Stripe Connect

```typescript
// For an order with items from multiple sellers, use Stripe PaymentIntent with transfer_group
const paymentIntent = await stripe.paymentIntents.create({
  amount: totalOrderCents,
  currency: 'usd',
  transfer_group: orderId, // group all transfers for this order
  automatic_payment_methods: { enabled: true },
  metadata: { order_id: orderId },
});

// After payment confirms, create transfers to each seller
for (const [sellerId, amount] of sellerAmounts) {
  const seller = await db.sellers.findById(sellerId);
  const commission = calculateCommission(seller, amount);
  await stripe.transfers.create({
    amount: amount - commission,
    currency: 'usd',
    destination: seller.stripe_account_id,
    transfer_group: orderId,
  });
}
```

### Commission analytics

```sql
SELECT
  s.name AS seller,
  COUNT(DISTINCT se.order_id) AS orders,
  SUM(se.gross_amount) / 100.0 AS gmv,
  SUM(se.commission) / 100.0 AS commission_earned,
  SUM(se.net_amount) / 100.0 AS seller_earnings,
  ROUND(AVG(se.commission::numeric / se.gross_amount * 100), 1) AS avg_commission_pct
FROM seller_earnings se
JOIN sellers s ON s.id = se.seller_id
WHERE se.created_at >= NOW() - INTERVAL '30 days'
GROUP BY s.id, s.name
ORDER BY gmv DESC;
```

## Best Practices

- **Use Stripe Connect Express accounts** — Express handles KYC, bank account collection, and tax form (1099-K) generation; building this yourself is expensive and legally complex
- **Hold funds for the return window** — don't release earnings to sellers until the buyer's return window closes; releasing early means the platform absorbs refund losses if a buyer returns
- **Compute commission in a database transaction with the order** — record the `seller_earnings` row atomically with the order confirmation; never compute it asynchronously from a queue that might fail
- **Implement seller suspension without breaking existing payouts** — setting `status = 'suspended'` should prevent new listings but not block processing of already-queued payouts for completed orders
- **Send payout summaries by email** — sellers should receive a weekly email summarizing orders, commissions deducted, and the payout amount; transparency builds trust
- **Log every commission calculation** — store the inputs (gross amount, commission type, rate) with the result; commission disputes are common and you need the receipt
- **Cap commission on shipping** — many marketplace models only take commission on product price, not shipping costs; structure your `gross_amount` calculation accordingly

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Payout fails but earnings are already marked `paid_out` | Update payout status and earning status in the same transaction; only mark `paid_out` after Stripe confirms the transfer |
| Platform pays out before the buyer's payment clears | Use `payment_intent.succeeded` webhook as the trigger for `recordSellerEarning`, never the checkout session creation |
| Seller disputes commission amount after payout | Store commission rate and calculation method at the time of each earning record; the dispute resolution is: show them the `seller_earnings` row |
| Stripe Connect account not fully onboarded before first sale | Check `charges_enabled && payouts_enabled` before allowing a seller to go live; block listing publication until onboarding is complete |

## Related Skills

- @multi-channel-selling
- @vendor-management
- @stripe-integration
- @b2b-commerce
- @order-management-system
