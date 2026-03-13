---
name: payout-split-management
description: "Manage complex payout splits for marketplaces and platforms with seller disbursements, commission calculation, tax withholding, and 1099 reporting"
category: payments-checkout
risk: safe
source: curated
date_added: "2026-03-12"
tags: [payouts, marketplace, disbursements, commissions]
triggers: ["payout splits", "seller payouts", "marketplace disbursements", "commission calculation", "1099 reporting", "tax withholding", "stripe connect payouts", "seller earnings"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: advanced
---

# Payout Split Management

## Overview

A marketplace or multi-seller platform must split every payment between the platform (commission) and one or more sellers (net payout), withhold taxes where required, manage rolling reserves for refund protection, and disburse funds on a schedule that balances seller satisfaction with business risk. This is fundamentally different from single-merchant payment processing — every transaction generates a financial obligation to a third party.

This skill covers the full payout management lifecycle: calculating commission and seller earnings per order, integrating with Stripe Connect for automated fund routing, managing rolling reserves, implementing tax withholding (backup withholding for uncollected W-9s), generating 1099-K/1099-NEC forms for US sellers, and providing sellers with a real-time earnings dashboard.

The design must be highly accurate (penny-perfect accounting), auditable (every calculation traceable to source transactions), and compliant with US 1099 reporting thresholds that changed in 2024 (reduced to $600 for 1099-K).

## When to Use This Skill

- When building a marketplace with independent sellers who need earnings disbursements
- When your platform charges a percentage or flat commission on transactions
- When you need to comply with IRS 1099-K reporting requirements for sellers
- When implementing tax withholding (backup withholding at 24% for sellers without W-9)
- When sellers are requesting faster payouts (daily/weekly vs. monthly)
- When managing rolling reserves for high-risk or new sellers
- When you need a split payout system for affiliate commissions or referral rewards

## Core Instructions

### 1. Design the payout split data model

```sql
-- Seller accounts with Stripe Connect metadata
CREATE TABLE seller_accounts (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID REFERENCES users(id),
  business_name            VARCHAR(255),
  stripe_account_id        VARCHAR(100) UNIQUE,   -- Stripe Connect account ID
  stripe_account_status    VARCHAR(50) DEFAULT 'pending',
  -- 'pending', 'restricted', 'restricted_soon', 'enabled', 'rejected'
  payout_schedule          VARCHAR(30) DEFAULT 'weekly',  -- 'daily', 'weekly', 'monthly', 'manual'
  payout_day_of_week       INT,         -- 0=Sun, 1=Mon, etc. for weekly
  payout_day_of_month      INT,         -- 1-28 for monthly
  commission_rate          NUMERIC(5, 4) NOT NULL DEFAULT 0.15,  -- 15% platform commission
  commission_type          VARCHAR(20) DEFAULT 'percentage',     -- 'percentage', 'flat', 'tiered'
  rolling_reserve_pct      NUMERIC(4, 3) DEFAULT 0.05,          -- 5% reserve
  rolling_reserve_days     INT DEFAULT 90,                      -- Release after 90 days
  tax_id_collected         BOOLEAN DEFAULT FALSE,
  w9_collected             BOOLEAN DEFAULT FALSE,
  w9_collected_at          TIMESTAMPTZ,
  backup_withholding       BOOLEAN DEFAULT FALSE,               -- Apply 24% backup withholding
  ytd_earnings             NUMERIC(15, 2) DEFAULT 0,            -- For 1099 threshold tracking
  ytd_transactions         INT DEFAULT 0,
  status                   VARCHAR(30) DEFAULT 'active',
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- Per-order earnings calculation
CREATE TABLE order_earnings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID NOT NULL REFERENCES orders(id),
  seller_id            UUID NOT NULL REFERENCES seller_accounts(id),
  gross_order_amount   NUMERIC(12, 2) NOT NULL,
  platform_commission  NUMERIC(12, 2) NOT NULL,
  payment_processing_fee NUMERIC(12, 2) DEFAULT 0,
  tax_withheld         NUMERIC(12, 2) DEFAULT 0,
  rolling_reserve      NUMERIC(12, 2) DEFAULT 0,
  net_seller_earnings  NUMERIC(12, 2) NOT NULL,
  commission_rate      NUMERIC(5, 4) NOT NULL,   -- Rate at time of sale
  currency             CHAR(3) DEFAULT 'USD',
  status               VARCHAR(30) DEFAULT 'pending',
  -- 'pending', 'available', 'disbursed', 'reversed', 'on_hold'
  available_date       DATE,    -- When funds become available for payout
  reserve_release_date DATE,    -- When rolling reserve is released
  disbursement_id      UUID,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Disbursement batches
CREATE TABLE disbursements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id           UUID NOT NULL REFERENCES seller_accounts(id),
  batch_date          DATE NOT NULL,
  gross_amount        NUMERIC(12, 2) NOT NULL,
  tax_withheld        NUMERIC(12, 2) DEFAULT 0,
  net_amount          NUMERIC(12, 2) NOT NULL,
  currency            CHAR(3) DEFAULT 'USD',
  stripe_transfer_id  VARCHAR(100),
  status              VARCHAR(30) DEFAULT 'pending',
  -- 'pending', 'processing', 'paid', 'failed', 'reversed'
  processed_at        TIMESTAMPTZ,
  failure_reason      TEXT,
  earnings_count      INT DEFAULT 0,
  period_start        DATE,
  period_end          DATE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Rolling reserve ledger
CREATE TABLE rolling_reserve_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES seller_accounts(id),
  order_earning_id UUID REFERENCES order_earnings(id),
  amount          NUMERIC(12, 2) NOT NULL,
  entry_type      VARCHAR(30) NOT NULL,  -- 'reserve', 'release', 'forfeiture'
  release_date    DATE NOT NULL,
  status          VARCHAR(30) DEFAULT 'held',
  released_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 1099 records
CREATE TABLE tax_forms_1099 (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id        UUID NOT NULL REFERENCES seller_accounts(id),
  tax_year         INT NOT NULL,
  form_type        VARCHAR(20) NOT NULL,  -- '1099-K', '1099-NEC'
  gross_amount     NUMERIC(12, 2) NOT NULL,
  federal_withheld NUMERIC(12, 2) DEFAULT 0,
  transaction_count INT,
  recipient_name   VARCHAR(255),
  recipient_tin    VARCHAR(20),           -- Last 4 digits only in app; full TIN in secure vault
  recipient_address JSONB,
  status           VARCHAR(30) DEFAULT 'draft',  -- 'draft', 'filed', 'corrected', 'void'
  filed_at         DATE,
  form_url         VARCHAR(1000),
  irs_submission_id VARCHAR(100),
  UNIQUE (seller_id, tax_year, form_type)
);

CREATE INDEX idx_earnings_seller ON order_earnings (seller_id, status, available_date);
CREATE INDEX idx_earnings_order ON order_earnings (order_id);
CREATE INDEX idx_disbursements_seller ON disbursements (seller_id, status);
CREATE INDEX idx_reserve_release ON rolling_reserve_ledger (status, release_date);
```

### 2. Calculate earnings per order

```javascript
// services/payouts/earnings-calculator.js
export async function calculateOrderEarnings(order) {
  const seller = await db.sellerAccounts.findUnique({
    where: { id: order.seller_id },
  });

  if (!seller) throw new Error(`Seller not found for order ${order.id}`);

  // Step 1: Commission calculation
  let commission;
  if (seller.commission_type === 'percentage') {
    commission = order.subtotal * seller.commission_rate;
  } else if (seller.commission_type === 'flat') {
    commission = seller.flat_commission_amount;
  } else if (seller.commission_type === 'tiered') {
    commission = await computeTieredCommission(seller, order);
  }

  // Step 2: Payment processing fee pass-through (Stripe fee: 2.9% + $0.30)
  const processingFee = order.total_amount * 0.029 + 0.30;

  // Step 3: Rolling reserve
  const reserve = order.subtotal * seller.rolling_reserve_pct;
  const reserveReleaseDate = new Date();
  reserveReleaseDate.setDate(reserveReleaseDate.getDate() + seller.rolling_reserve_days);

  // Step 4: Tax withholding
  let taxWithheld = 0;
  if (seller.backup_withholding) {
    // IRS backup withholding rate is 24%
    taxWithheld = (order.subtotal - commission) * 0.24;
  }

  // Step 5: Net seller earnings
  const netEarnings = order.subtotal - commission - processingFee - reserve - taxWithheld;

  // Funds available after T+2 (standard ACH settlement)
  const availableDate = new Date();
  availableDate.setDate(availableDate.getDate() + 2);

  const earning = await db.orderEarnings.create({
    data: {
      order_id: order.id,
      seller_id: seller.id,
      gross_order_amount: order.subtotal,
      platform_commission: commission,
      payment_processing_fee: processingFee,
      tax_withheld: taxWithheld,
      rolling_reserve: reserve,
      net_seller_earnings: Math.max(0, netEarnings),
      commission_rate: seller.commission_rate,
      currency: order.currency,
      status: 'pending',
      available_date: availableDate,
      reserve_release_date: reserveReleaseDate,
    },
  });

  // Record reserve in ledger
  if (reserve > 0) {
    await db.rollingReserveLedger.create({
      data: {
        seller_id: seller.id,
        order_earning_id: earning.id,
        amount: reserve,
        entry_type: 'reserve',
        release_date: reserveReleaseDate,
        status: 'held',
      },
    });
  }

  // Update seller YTD totals for 1099 tracking
  await db.sellerAccounts.update({
    where: { id: seller.id },
    data: {
      ytd_earnings: { increment: order.subtotal },
      ytd_transactions: { increment: 1 },
    },
  });

  return earning;
}
```

### 3. Stripe Connect payout disbursement

```javascript
// services/payouts/disbursement-processor.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function processDisbursementBatch(sellerId, periodStart, periodEnd) {
  const seller = await db.sellerAccounts.findById(sellerId);

  if (!seller.stripe_account_id) {
    throw new Error(`Seller ${sellerId} does not have a connected Stripe account`);
  }

  if (seller.stripe_account_status !== 'enabled') {
    throw new Error(`Seller ${sellerId} Stripe account is not enabled for payouts`);
  }

  // Find all available, undisbursed earnings in the period
  const earnings = await db.orderEarnings.findMany({
    where: {
      seller_id: sellerId,
      status: 'available',
      disbursement_id: null,
      available_date: { gte: new Date(periodStart), lte: new Date(periodEnd) },
    },
  });

  if (earnings.length === 0) return { disbursed: 0, amount: 0 };

  const grossAmount = earnings.reduce((sum, e) => sum + parseFloat(e.net_seller_earnings), 0);
  const taxWithheld = earnings.reduce((sum, e) => sum + parseFloat(e.tax_withheld), 0);
  const netAmount = grossAmount - taxWithheld;

  if (netAmount <= 0) {
    console.log(`Skipping disbursement for seller ${sellerId}: net amount is ${netAmount}`);
    return { disbursed: 0, amount: 0 };
  }

  // Create the disbursement record first (for idempotency)
  const disbursement = await db.disbursements.create({
    data: {
      seller_id: sellerId,
      batch_date: new Date(),
      gross_amount: grossAmount,
      tax_withheld: taxWithheld,
      net_amount: netAmount,
      currency: 'usd',
      status: 'processing',
      earnings_count: earnings.length,
      period_start: new Date(periodStart),
      period_end: new Date(periodEnd),
    },
  });

  try {
    // Transfer funds to seller's connected account
    const transfer = await stripe.transfers.create({
      amount: Math.round(netAmount * 100),  // Stripe uses cents
      currency: 'usd',
      destination: seller.stripe_account_id,
      description: `Marketplace payout ${periodStart} to ${periodEnd}`,
      metadata: {
        disbursement_id: disbursement.id,
        seller_id: sellerId,
        earnings_count: String(earnings.length),
      },
      transfer_group: `payout_${disbursement.id}`,
    });

    // Mark earnings as disbursed
    await db.$transaction([
      db.orderEarnings.updateMany({
        where: { id: { in: earnings.map((e) => e.id) } },
        data: { status: 'disbursed', disbursement_id: disbursement.id },
      }),
      db.disbursements.update({
        where: { id: disbursement.id },
        data: {
          stripe_transfer_id: transfer.id,
          status: 'paid',
          processed_at: new Date(),
        },
      }),
    ]);

    return { disbursed: earnings.length, amount: netAmount, transfer_id: transfer.id };
  } catch (err) {
    await db.disbursements.update({
      where: { id: disbursement.id },
      data: { status: 'failed', failure_reason: err.message },
    });
    throw err;
  }
}
```

### 4. Rolling reserve release job

```javascript
// jobs/reserve-release.js — runs daily
export async function releaseMaturedReserves() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maturedReserves = await db.rollingReserveLedger.findMany({
    where: {
      status: 'held',
      release_date: { lte: today },
      entry_type: 'reserve',
    },
    include: { seller: true },
  });

  let totalReleased = 0;

  for (const reserve of maturedReserves) {
    await db.$transaction([
      db.rollingReserveLedger.update({
        where: { id: reserve.id },
        data: { status: 'released', released_at: new Date() },
      }),
      db.rollingReserveLedger.create({
        data: {
          seller_id: reserve.seller_id,
          amount: reserve.amount,
          entry_type: 'release',
          release_date: today,
          status: 'released',
          released_at: new Date(),
        },
      }),
      // Make the reserve amount available for the next disbursement
      db.orderEarnings.update({
        where: { id: reserve.order_earning_id },
        data: { rolling_reserve: 0 },
      }),
    ]);

    totalReleased += parseFloat(reserve.amount);
  }

  console.log(`Released ${maturedReserves.length} reserves totaling $${totalReleased.toFixed(2)}`);
  return { released: maturedReserves.length, amount: totalReleased };
}
```

### 5. 1099-K generation and tracking

```javascript
// services/payouts/tax-reporting.js
const FORM_1099K_THRESHOLD_2024 = 600;  // IRS lowered threshold to $600 for 2024+

export async function generate1099KForms(taxYear) {
  const eligibleSellers = await db.sellerAccounts.findMany({
    where: {
      ytd_earnings: { gte: FORM_1099K_THRESHOLD_2024 },
      status: 'active',
    },
  });

  const forms = [];

  for (const seller of eligibleSellers) {
    const yearEarnings = await db.orderEarnings.aggregate({
      where: {
        seller_id: seller.id,
        status: { in: ['disbursed', 'available'] },
        created_at: {
          gte: new Date(`${taxYear}-01-01`),
          lte: new Date(`${taxYear}-12-31`),
        },
      },
      _sum: { gross_order_amount: true, tax_withheld: true },
      _count: { id: true },
    });

    const grossAmount = yearEarnings._sum.gross_order_amount ?? 0;
    if (grossAmount < FORM_1099K_THRESHOLD_2024) continue;

    const form = await db.taxForms1099.upsert({
      where: { seller_id_tax_year_form_type: { seller_id: seller.id, tax_year: taxYear, form_type: '1099-K' } },
      create: {
        seller_id: seller.id,
        tax_year: taxYear,
        form_type: '1099-K',
        gross_amount: grossAmount,
        federal_withheld: yearEarnings._sum.tax_withheld ?? 0,
        transaction_count: yearEarnings._count.id,
        recipient_name: seller.business_name,
        status: 'draft',
      },
      update: {
        gross_amount: grossAmount,
        federal_withheld: yearEarnings._sum.tax_withheld ?? 0,
        transaction_count: yearEarnings._count.id,
      },
    });

    forms.push(form);
  }

  return { generated: forms.length, forms };
}
```

## Examples

### Seller earnings dashboard query

```sql
SELECT
  oe.seller_id,
  sa.business_name,
  DATE_TRUNC('month', oe.created_at) AS month,
  COUNT(*) AS order_count,
  SUM(oe.gross_order_amount) AS gross_sales,
  SUM(oe.platform_commission) AS commission_paid,
  SUM(oe.payment_processing_fee) AS processing_fees,
  SUM(oe.rolling_reserve) AS amount_in_reserve,
  SUM(oe.tax_withheld) AS tax_withheld,
  SUM(oe.net_seller_earnings) AS net_earnings,
  SUM(oe.net_seller_earnings) FILTER (WHERE oe.status = 'disbursed') AS disbursed
FROM order_earnings oe
JOIN seller_accounts sa ON sa.id = oe.seller_id
WHERE oe.created_at >= NOW() - INTERVAL '12 months'
GROUP BY 1, 2, 3
ORDER BY 3 DESC, gross_sales DESC;
```

### 1099 threshold monitoring

```sql
SELECT
  sa.id AS seller_id,
  sa.business_name,
  sa.w9_collected,
  sa.backup_withholding,
  sa.ytd_earnings,
  CASE WHEN sa.ytd_earnings >= 600 AND NOT sa.w9_collected THEN 'REQUIRES_W9'
       WHEN sa.ytd_earnings >= 600 AND sa.w9_collected THEN '1099_REQUIRED'
       ELSE 'BELOW_THRESHOLD' END AS status_1099
FROM seller_accounts sa
WHERE sa.status = 'active'
ORDER BY sa.ytd_earnings DESC;
```

## Best Practices

- **Use Stripe Connect Express or Custom accounts** — never hold seller funds in a pooled bank account manually; use Stripe Connect to ensure funds are legally owned by the platform until transferred to sellers.
- **Calculate earnings at order capture, not payout time** — earnings should be immutable records linked to specific orders. The payout is a separate aggregation step.
- **Implement rolling reserves for new sellers** — withhold 5–10% for 90 days to protect against refunds and chargebacks. Release reserves automatically on schedule.
- **Collect W-9 before first payout** — without a W-9, you must apply 24% IRS backup withholding. Make W-9 collection part of the seller onboarding flow.
- **Track 1099 thresholds in real time** — monitor ytd_earnings and send W-9 collection requests when a seller crosses $400 so you have the form by the time they hit $600.
- **Store commission rates as snapshots on each earnings record** — commission rates change over time; never recompute historical earnings with the current rate.
- **Reconcile Stripe Connect ledger weekly** — your internal earnings records must match the Stripe Connect account balance; reconcile against Stripe's balance transaction API.

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Stripe Connect payout fails silently | Always handle the `transfer.failed` webhook; notify sellers and your ops team immediately |
| Rolling reserve not released after maturity | Build a daily job that checks `release_date <= today`; test with a short reserve period in staging |
| 1099 gross amount does not match seller's records | 1099-K must report gross payment volume before platform fees; make sure you are using `gross_order_amount`, not `net_seller_earnings` |
| Backup withholding not applied to sellers without W-9 | Set `backup_withholding = true` during onboarding if W-9 is not collected; check this flag in the earnings calculator |
| Negative payout when refunds exceed sales | Implement a minimum payout balance check; carry negative balances forward to the next payout period rather than requesting clawbacks |
| Commission rate disagreement with seller | Log `commission_rate` on every `order_earnings` record at creation time; never rely on the current rate for historical disputes |

## Related Skills

- @stripe-integration
- @payment-reconciliation-automation
- @accounts-receivable-automation
- @tax-compliance-automation
- @invoice-generation-automation
