---
name: payment-reconciliation-automation
description: "Automate payment reconciliation across Stripe, PayPal, and bank accounts with exception handling, automated matching rules, and discrepancy alerting"
category: payments-checkout
risk: safe
source: curated
date_added: "2026-03-12"
tags: [reconciliation, payments, accounting]
triggers: ["payment reconciliation", "reconcile stripe", "reconcile paypal", "bank reconciliation", "payment matching", "discrepancy detection", "automate reconciliation"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Payment Reconciliation Automation

## Overview

Payment reconciliation matches what your payment processors (Stripe, PayPal, Shopify Payments) say they collected against what your accounting system recorded and what your bank actually received. Discrepancies arise from processor fees, refunds, chargebacks, rolling reserves, and currency conversion — none of which are automatically journaled in most ecommerce setups. Manual reconciliation does not scale beyond a few hundred transactions per day.

For most merchants, automated reconciliation is solved by connecting your ecommerce platform to your accounting system (QuickBooks, Xero) via a dedicated sync tool rather than building custom matching logic.

## When to Use This Skill

- When your finance team spends more than two hours per day on manual payment reconciliation
- When processing transactions across two or more payment processors (e.g., Stripe + PayPal)
- When month-end close is blocked by unresolved payment discrepancies
- When chargebacks or refunds are not being reliably reflected in your accounting system
- When you need SOC 2 or PCI-DSS audit documentation for payment flows

## Core Instructions

### Step 1: Determine your platform and choose the reconciliation approach

| Platform | Recommended Reconciliation Tool | Notes |
|----------|--------------------------------|-------|
| **Shopify Payments** | **A2X** or **Bench Accounting** | A2X maps Shopify payouts to QuickBooks/Xero journal entries automatically, handling fees, refunds, and adjustments |
| **Shopify + Stripe** | **A2X for Stripe** + **A2X for Shopify** | Connect both sources to QuickBooks/Xero; A2X reconciles each payout separately |
| **WooCommerce + Stripe** | **Synder** or **WooCommerce QuickBooks Online** plugin | Synder syncs every Stripe transaction to QuickBooks with fees separated |
| **WooCommerce + PayPal** | **Synder** or **PayPal for WooCommerce + QuickBooks** | Synder handles both Stripe and PayPal in one connection |
| **BigCommerce** | **A2X** (has BigCommerce connector) or **Synder** | Same approach as Shopify |
| **Custom / Headless** | Build reconciliation pipeline using Stripe Balance Transactions API | See Custom / Headless section below |

**Rule of thumb**: if you are on Shopify, WooCommerce, or BigCommerce, use A2X or Synder before building anything custom. These tools cost $25–$100/month and eliminate weeks of development work.

### Step 2: Set up automated reconciliation with a sync tool

---

#### Shopify (A2X — recommended)

1. Sign up at **a2xaccounting.com** and install the Shopify app
2. Connect your Shopify store: go to **A2X → Connect a store → Shopify** and authorize
3. Connect your accounting system: go to **A2X → Settings → Accounting** and connect QuickBooks Online or Xero
4. Configure account mapping:
   - In A2X, map Shopify's sales, refunds, fees, and adjustments to your chart of accounts
   - Map Shopify Payments fees to "Merchant Fees" expense account
   - Map gift card sales to a liability account (not revenue)
5. A2X automatically processes each Shopify payout when it arrives and creates a summarized journal entry in QuickBooks/Xero that matches the bank deposit exactly

**What A2X handles automatically:**
- Shopify processing fees netted from payouts
- Refunds issued in a different period than the original sale
- Chargebacks and chargeback reversals
- Gift card redemptions vs. purchases
- Multi-currency conversions

#### WooCommerce (Synder — recommended)

1. Sign up at **synderapp.com** and connect your WooCommerce store via the plugin (install from WordPress.org)
2. Connect your payment processors: go to **Synder → Settings → Platforms** and connect Stripe and/or PayPal with API keys
3. Connect QuickBooks Online or Xero under **Synder → Settings → Accounting**
4. Configure transaction categorization: map product categories to income accounts, fees to expense accounts
5. Synder syncs every transaction in near-real-time, recording both the gross amount and the processor fee separately

**Synder vs. A2X for WooCommerce**: Synder works at the transaction level (one QuickBooks entry per transaction); A2X works at the payout level (one summary per deposit). Synder is better for detailed reporting; A2X is better for high-volume stores.

#### BigCommerce

1. Install **A2X** from the BigCommerce App Marketplace
2. Follow the same setup process as Shopify above — A2X's BigCommerce connector works identically to the Shopify one
3. Connect your payment gateway (Stripe or PayPal) separately to A2X for full reconciliation including processor fees

---

#### Custom / Headless

For custom storefronts, build a reconciliation pipeline that uses Stripe's balance transactions (the authoritative record for every funds movement) as the source of truth:

```javascript
// Ingest Stripe balance transactions — the only feed that includes fees, refunds, and payouts
async function ingestStripeTransactions(startDate, endDate) {
  const transactions = [];

  for await (const txn of stripe.balanceTransactions.list({
    created: {
      gte: Math.floor(new Date(startDate).getTime() / 1000),
      lte: Math.floor(new Date(endDate).getTime() / 1000),
    },
    limit: 100,
    expand: ['data.source'],
  })) {
    const orderId = txn.source?.metadata?.order_id;

    transactions.push({
      stripe_id: txn.id,
      type: txn.type,            // 'charge', 'refund', 'payout', 'stripe_fee'
      gross: txn.amount / 100,   // in dollars
      fee: txn.fee / 100,
      net: txn.net / 100,
      currency: txn.currency.toUpperCase(),
      date: new Date(txn.created * 1000),
      order_id: orderId ?? null,
      description: txn.description,
    });
  }

  return transactions;
}

// Match Stripe transactions to internal order records
async function reconcileDay(date) {
  const stripeTxns = await ingestStripeTransactions(date, date);
  const internalOrders = await db.orders.findMany({
    where: { createdAt: { gte: startOfDay(date), lte: endOfDay(date) }, status: 'confirmed' },
  });

  const matched = [];
  const exceptions = [];

  for (const stripeTxn of stripeTxns.filter(t => t.type === 'charge')) {
    const order = internalOrders.find(o => o.id === stripeTxn.order_id || o.stripeChargeId === stripeTxn.stripe_id);

    if (order && Math.abs(order.total - stripeTxn.gross) < 0.01) {
      matched.push({ stripeTxn, order, delta: 0 });
    } else {
      exceptions.push({ stripeTxn, order: order ?? null, delta: order ? order.total - stripeTxn.gross : stripeTxn.gross });
    }
  }

  // Alert on exceptions
  if (exceptions.length > 0) {
    await sendSlackAlert(`Reconciliation: ${exceptions.length} unmatched transactions on ${date}`);
  }

  return { matched: matched.length, exceptions: exceptions.length };
}
```

**PayPal reconciliation:**
Use the PayPal Reporting API (`/v1/reporting/transactions`) to fetch settled transactions. Filter to `transaction_status: 'S'` (settled only) to avoid matching in-flight authorizations.

### Step 3: Handle the most common reconciliation edge cases

**Stripe payouts do not equal sum of charges:**
This is expected — payouts are net of fees, refunds, and rolling reserve. In A2X and Synder, the payout amount is reconciled against the bank deposit; individual charges are recorded separately at their gross amount with fees as expenses.

**Refunds issued in a different month:**
A2X and Synder handle this automatically — refunds are recorded in the period they were issued, not the period of the original sale. Configure your accounting system to use accrual accounting so refunds reduce the relevant revenue period.

**Chargebacks:**
Both Stripe and Shopify Payments automatically create a balance transaction for the chargeback amount plus the chargeback fee. A2X and Synder record these as negative transactions. Verify your chart of accounts has a "Chargebacks" expense account for the fees.

**Multi-currency transactions:**
If you process in EUR and your books are in USD, configure A2X or Synder to use the exchange rate at transaction time for recording (not the rate at payout time). This matches the accrual accounting principle.

### Step 4: Set up daily reconciliation monitoring

Configure a daily report in QuickBooks or Xero that shows:
1. **Deposits in bank** vs. **Payments received in accounting**: these should match within $0.01
2. **Unmatched transactions**: any transaction in your accounting system not matched to a bank entry
3. **Exception rate**: aim for less than 1% unmatched transactions per day

In QuickBooks: use **Reports → Banking → Reconciliation Reports**
In Xero: use **Accounting → Bank Accounts → Reconciliation Reports**

## Best Practices

- **Use A2X or Synder before building custom** — for Shopify, WooCommerce, and BigCommerce stores these tools solve reconciliation in a day; custom code adds months of maintenance
- **Use Stripe balance transactions as the source of truth** — not charges or payment intents; balance transactions are the only feed that includes fees, refunds, and payouts in a single consistent record
- **Reconcile T-1 (yesterday), not same day** — most processors finalize settlement 24 hours after the transaction; same-day reconciliation produces false exceptions for in-flight authorizations
- **Never auto-resolve exceptions** — all exception resolutions must have a human approval step and leave an audit trail; configure A2X and Synder to flag rather than auto-post exceptions
- **Reconcile fees separately** — processor fees are often charged in aggregate on a payout; verify your fee rate against your merchant agreement quarterly

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Shopify payout doesn't match bank deposit | A2X automatically maps payout net amount to the bank deposit; verify A2X is connected and payout processing is enabled |
| Stripe refunds creating duplicate accounting entries | Synder and A2X handle refunds as debit entries against the original sale; disable any manual refund entries you may have created |
| PayPal transactions not reconciling | PayPal settlements can take 2–5 business days; filter PayPal ingestion to `transaction_status: S` (settled) only |
| Currency mismatch causing false exceptions | Configure your sync tool to record transactions in their original currency; use your accounting system's built-in currency conversion at the transaction date rate |
| Month-end delta growing over time | Run a monthly roll-up in your accounting system to identify all unmatched items older than 30 days and resolve them before close |

## Related Skills

- @stripe-integration
- @paypal-integration
- @tax-compliance-automation
- @accounts-receivable-automation
- @payout-split-management
