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
platforms: [platform-agnostic]
difficulty: advanced
---

# Payment Reconciliation Automation

## Overview

Payment reconciliation is the process of matching payment processor records (Stripe, PayPal, Adyen, etc.) against your internal order database and bank account statements to ensure every dollar is accounted for. Manual reconciliation is error-prone, time-consuming, and does not scale beyond a few hundred transactions per day. This skill covers building an automated reconciliation pipeline that ingests transaction feeds from multiple sources, applies deterministic matching rules, flags exceptions for human review, and generates audit-ready reports.

A complete reconciliation system handles four primary match types: exact matches (amount + reference ID align perfectly), fuzzy matches (amounts match but reference differs), partial matches (a single bank deposit covers multiple processor payouts), and exceptions (records that appear on only one side). Each category requires a different resolution strategy and alerting threshold.

Beyond simple matching, production systems must handle processor fees, currency conversion, refunds, chargebacks, and rolling reserve releases — all of which change the net settlement amount and timing relative to the gross transaction amount visible in your order database.

## When to Use This Skill

- When your finance team spends more than two hours per day on manual payment reconciliation
- When you process transactions across two or more payment processors (e.g., Stripe + PayPal)
- When month-end close is blocked by unresolved payment discrepancies
- When your business is approaching or has crossed $1M ARR and audit requirements are increasing
- When chargebacks or refunds are not being reliably reflected in your accounting system
- When you need SOC 2 or PCI-DSS audit documentation for payment flows
- When treasury operations require daily cash position accuracy across multiple bank accounts

## Prerequisites & Platform Notes

**Shopify**: Shopify handles checkout natively. Use Shopify Payments (powered by Stripe), checkout extensions, and Shopify Functions for custom discount/payment logic. You cannot modify the core checkout without Checkout Extensions.
**WooCommerce**: WooCommerce supports payment gateways via plugins (WooCommerce Stripe, WooCommerce PayPal). Extend checkout with woocommerce_checkout_process and woocommerce_payment_complete hooks.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store, Stripe or PayPal account, relevant payment plugin/app

## Core Instructions

### 1. Design the reconciliation data model

The foundation is a canonical transaction table that stores normalized records from every source.

```sql
-- Core reconciliation tables
CREATE TABLE reconciliation_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source                VARCHAR(50) NOT NULL,    -- 'stripe', 'paypal', 'bank', 'internal'
  source_transaction_id VARCHAR(255) NOT NULL,
  source_reference      VARCHAR(255),            -- order_id, invoice_id, etc.
  transaction_type      VARCHAR(50) NOT NULL,    -- 'charge', 'refund', 'payout', 'fee', 'chargeback', 'reserve_release'
  gross_amount          NUMERIC(15, 4) NOT NULL,
  fee_amount            NUMERIC(15, 4) DEFAULT 0,
  net_amount            NUMERIC(15, 4) NOT NULL,
  currency              CHAR(3) NOT NULL,
  transaction_date      TIMESTAMPTZ NOT NULL,
  settlement_date       TIMESTAMPTZ,
  status                VARCHAR(50) NOT NULL,    -- 'pending', 'settled', 'failed', 'disputed'
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source, source_transaction_id)
);

CREATE TABLE reconciliation_matches (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_type            VARCHAR(50) NOT NULL,    -- 'exact', 'fuzzy', 'partial', 'manual'
  match_status          VARCHAR(50) NOT NULL,    -- 'matched', 'exception', 'under_review', 'resolved'
  confidence_score      NUMERIC(4, 3),           -- 0.000 to 1.000
  internal_transaction_id UUID REFERENCES reconciliation_transactions(id),
  external_transaction_id UUID REFERENCES reconciliation_transactions(id),
  amount_delta          NUMERIC(15, 4) DEFAULT 0,
  notes                 TEXT,
  resolved_by           VARCHAR(255),
  resolved_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reconciliation_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date      DATE NOT NULL,
  source        VARCHAR(50) NOT NULL,
  total_records INTEGER DEFAULT 0,
  matched       INTEGER DEFAULT 0,
  exceptions    INTEGER DEFAULT 0,
  net_delta     NUMERIC(15, 4) DEFAULT 0,
  status        VARCHAR(50) DEFAULT 'running',
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recon_txn_source ON reconciliation_transactions (source, transaction_date);
CREATE INDEX idx_recon_txn_reference ON reconciliation_transactions (source_reference);
CREATE INDEX idx_recon_match_status ON reconciliation_matches (match_status);
```

### 2. Build the Stripe transaction ingester

```javascript
// services/reconciliation/ingesters/stripe.js
import Stripe from 'stripe';
import { db } from '../../../lib/db.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function ingestStripeTransactions({ startDate, endDate }) {
  const runId = await createReconciliationRun('stripe', startDate);
  let totalIngested = 0;

  // Use balance transactions — the authoritative record for every funds movement
  for await (const txn of stripe.balanceTransactions.list({
    created: {
      gte: Math.floor(new Date(startDate).getTime() / 1000),
      lte: Math.floor(new Date(endDate).getTime() / 1000),
    },
    limit: 100,
    expand: ['data.source'],
  })) {
    const normalized = normalizeStripeTransaction(txn);

    await db.reconciliationTransactions.upsert({
      where: { source_source_transaction_id: { source: 'stripe', source_transaction_id: txn.id } },
      create: normalized,
      update: { status: normalized.status, settlement_date: normalized.settlement_date },
    });

    totalIngested++;
  }

  await finalizeReconciliationRun(runId, totalIngested);
  return { runId, totalIngested };
}

function normalizeStripeTransaction(txn) {
  const source = txn.source;
  const reference =
    source?.metadata?.order_id ||
    source?.description ||
    source?.invoice ||
    null;

  return {
    source: 'stripe',
    source_transaction_id: txn.id,
    source_reference: reference,
    transaction_type: mapStripeType(txn.type),
    gross_amount: txn.amount / 100,
    fee_amount: txn.fee / 100,
    net_amount: txn.net / 100,
    currency: txn.currency.toUpperCase(),
    transaction_date: new Date(txn.created * 1000),
    settlement_date: txn.available_on
      ? new Date(txn.available_on * 1000)
      : null,
    status: txn.status,
    metadata: {
      stripe_type: txn.type,
      description: txn.description,
      payout_id: source?.payout ?? null,
    },
  };
}

function mapStripeType(stripeType) {
  const typeMap = {
    charge: 'charge',
    refund: 'refund',
    payout: 'payout',
    stripe_fee: 'fee',
    payment: 'charge',
    dispute: 'chargeback',
    adjustment: 'adjustment',
    reserved_funds: 'reserve',
    reserve_transaction: 'reserve_release',
  };
  return typeMap[stripeType] ?? 'other';
}
```

### 3. Build the PayPal transaction ingester

```javascript
// services/reconciliation/ingesters/paypal.js
import axios from 'axios';
import { db } from '../../../lib/db.js';

async function getPayPalAccessToken() {
  const { data } = await axios.post(
    `${process.env.PAYPAL_API_BASE}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_CLIENT_SECRET,
      },
    }
  );
  return data.access_token;
}

export async function ingestPayPalTransactions({ startDate, endDate }) {
  const token = await getPayPalAccessToken();
  let page = 1;
  let hasMore = true;
  let totalIngested = 0;

  while (hasMore) {
    const { data } = await axios.get(
      `${process.env.PAYPAL_API_BASE}/v1/reporting/transactions`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          transaction_status: 'S',      // Only settled transactions
          fields: 'all',
          page_size: 500,
          page,
        },
      }
    );

    for (const txn of data.transaction_details ?? []) {
      const normalized = normalizePayPalTransaction(txn);
      await db.reconciliationTransactions.upsert({
        where: {
          source_source_transaction_id: {
            source: 'paypal',
            source_transaction_id: normalized.source_transaction_id,
          },
        },
        create: normalized,
        update: { status: normalized.status },
      });
      totalIngested++;
    }

    hasMore = page < data.total_pages;
    page++;
  }

  return { totalIngested };
}

function normalizePayPalTransaction(txn) {
  const info = txn.transaction_info;
  const gross = parseFloat(info.transaction_amount?.value ?? '0');
  const fee = parseFloat(info.fee_amount?.value ?? '0');

  return {
    source: 'paypal',
    source_transaction_id: info.transaction_id,
    source_reference: info.invoice_id ?? info.custom_field ?? null,
    transaction_type: mapPayPalEventCode(info.transaction_event_code),
    gross_amount: Math.abs(gross),
    fee_amount: Math.abs(fee),
    net_amount: Math.abs(gross) - Math.abs(fee),
    currency: info.transaction_amount?.currency_code ?? 'USD',
    transaction_date: new Date(info.transaction_initiation_date),
    settlement_date: new Date(info.transaction_updated_date),
    status: 'settled',
    metadata: {
      paypal_event_code: info.transaction_event_code,
      paypal_status: info.transaction_status,
    },
  };
}

function mapPayPalEventCode(code) {
  if (!code) return 'other';
  if (code.startsWith('T00')) return 'charge';
  if (code.startsWith('T11')) return 'refund';
  if (code.startsWith('T12')) return 'chargeback';
  if (code.startsWith('T20')) return 'payout';
  return 'other';
}
```

### 4. Implement the matching engine

```javascript
// services/reconciliation/matcher.js
import { db } from '../../lib/db.js';

const EXACT_MATCH_TOLERANCE = 0.005;   // $0.005 tolerance for floating-point rounding
const FUZZY_MATCH_TOLERANCE = 1.00;    // $1.00 tolerance for known rounding differences

export async function runMatchingPass({ runDate }) {
  const internalTxns = await db.reconciliationTransactions.findMany({
    where: {
      source: 'internal',
      transaction_date: { gte: new Date(runDate), lt: addDays(new Date(runDate), 1) },
    },
  });

  const results = { exact: 0, fuzzy: 0, exceptions: 0 };

  for (const internal of internalTxns) {
    const match = await findBestMatch(internal);

    if (match) {
      const delta = Math.abs(internal.net_amount - match.net_amount);
      const matchType = delta <= EXACT_MATCH_TOLERANCE ? 'exact' : 'fuzzy';

      await db.reconciliationMatches.create({
        data: {
          match_type: matchType,
          match_status: 'matched',
          confidence_score: calculateConfidence(internal, match),
          internal_transaction_id: internal.id,
          external_transaction_id: match.id,
          amount_delta: delta,
        },
      });

      results[matchType]++;
    } else {
      await db.reconciliationMatches.create({
        data: {
          match_type: 'exception',
          match_status: 'exception',
          confidence_score: 0,
          internal_transaction_id: internal.id,
          external_transaction_id: null,
          amount_delta: internal.net_amount,
        },
      });

      await raiseDiscrepancyAlert(internal);
      results.exceptions++;
    }
  }

  return results;
}

async function findBestMatch(internalTxn) {
  // Strategy 1: Match on reference ID (order_id) — highest confidence
  if (internalTxn.source_reference) {
    const refMatch = await db.reconciliationTransactions.findFirst({
      where: {
        source: { not: 'internal' },
        source_reference: internalTxn.source_reference,
        transaction_type: internalTxn.transaction_type,
        currency: internalTxn.currency,
        reconciliation_matches_external: { none: {} },
      },
    });
    if (refMatch) return refMatch;
  }

  // Strategy 2: Match on amount + date window (±2 days) — medium confidence
  const amountMatches = await db.reconciliationTransactions.findMany({
    where: {
      source: { not: 'internal' },
      transaction_type: internalTxn.transaction_type,
      currency: internalTxn.currency,
      gross_amount: {
        gte: internalTxn.gross_amount - FUZZY_MATCH_TOLERANCE,
        lte: internalTxn.gross_amount + FUZZY_MATCH_TOLERANCE,
      },
      transaction_date: {
        gte: addDays(internalTxn.transaction_date, -2),
        lte: addDays(internalTxn.transaction_date, 2),
      },
      reconciliation_matches_external: { none: {} },
    },
  });

  if (amountMatches.length === 1) return amountMatches[0];
  return null;
}

function calculateConfidence(internal, external) {
  let score = 0.5;
  if (internal.source_reference && internal.source_reference === external.source_reference) score += 0.4;
  const amountDiff = Math.abs(internal.gross_amount - external.gross_amount);
  if (amountDiff < 0.01) score += 0.1;
  else if (amountDiff < 1.0) score += 0.05;
  return Math.min(score, 1.0);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
```

### 5. Implement discrepancy alerting

```javascript
// services/reconciliation/alerting.js
import { sendSlackAlert, sendEmail } from '../../lib/notifications.js';

const ALERT_THRESHOLDS = {
  single_exception_amount: 100,    // Alert immediately for any exception > $100
  daily_exception_rate: 0.02,      // Alert if >2% of daily transactions are exceptions
  daily_net_delta: 500,            // Alert if total unmatched amount exceeds $500/day
};

export async function raiseDiscrepancyAlert(transaction) {
  if (Math.abs(transaction.gross_amount) >= ALERT_THRESHOLDS.single_exception_amount) {
    await sendSlackAlert({
      channel: '#finance-alerts',
      title: 'Payment Reconciliation Exception',
      message: `Unmatched ${transaction.transaction_type} of ${transaction.currency} ${transaction.gross_amount.toFixed(2)} from ${transaction.source}`,
      fields: {
        'Transaction ID': transaction.source_transaction_id,
        'Reference': transaction.source_reference ?? 'None',
        'Date': transaction.transaction_date.toISOString(),
        'Amount': `${transaction.currency} ${transaction.gross_amount.toFixed(2)}`,
      },
      severity: 'warning',
    });
  }
}

export async function sendDailySummary({ runDate, metrics }) {
  const exceptionRate = metrics.exceptions / (metrics.total || 1);
  const severity =
    exceptionRate > ALERT_THRESHOLDS.daily_exception_rate ||
    metrics.netDelta > ALERT_THRESHOLDS.daily_net_delta
      ? 'critical'
      : 'info';

  await sendEmail({
    to: process.env.FINANCE_TEAM_EMAIL,
    subject: `[Reconciliation] Daily Summary ${runDate} — ${metrics.exceptions} exceptions`,
    template: 'reconciliation-daily-summary',
    data: {
      runDate,
      matched: metrics.matched,
      exceptions: metrics.exceptions,
      exceptionRate: (exceptionRate * 100).toFixed(2),
      netDelta: metrics.netDelta.toFixed(2),
      severity,
      reviewUrl: `${process.env.ADMIN_URL}/reconciliation/${runDate}`,
    },
  });
}
```

### 6. Schedule the daily reconciliation job

```javascript
// jobs/reconciliation.js — runs at 06:00 UTC daily via cron
import { ingestStripeTransactions } from '../services/reconciliation/ingesters/stripe.js';
import { ingestPayPalTransactions } from '../services/reconciliation/ingesters/paypal.js';
import { runMatchingPass } from '../services/reconciliation/matcher.js';
import { sendDailySummary } from '../services/reconciliation/alerting.js';

export async function runDailyReconciliation() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const runDate = yesterday.toISOString().split('T')[0];

  // 1. Ingest from all sources in parallel
  const [stripeResult, paypalResult] = await Promise.all([
    ingestStripeTransactions({ startDate: runDate, endDate: runDate }),
    ingestPayPalTransactions({ startDate: runDate, endDate: runDate }),
  ]);

  // 2. Run matching
  const matchResults = await runMatchingPass({ runDate });

  // 3. Send summary
  await sendDailySummary({
    runDate,
    metrics: {
      total: stripeResult.totalIngested + paypalResult.totalIngested,
      matched: matchResults.exact + matchResults.fuzzy,
      exceptions: matchResults.exceptions,
      netDelta: await computeNetDelta(runDate),
    },
  });

  console.log(`Reconciliation complete for ${runDate}:`, matchResults);
}
```

## Examples

### Query: unmatched exceptions requiring review

```sql
SELECT
  rt.source,
  rt.source_transaction_id,
  rt.source_reference,
  rt.transaction_type,
  rt.gross_amount,
  rt.currency,
  rt.transaction_date,
  rm.amount_delta,
  rm.created_at AS flagged_at
FROM reconciliation_matches rm
JOIN reconciliation_transactions rt ON rt.id = rm.internal_transaction_id
WHERE rm.match_status = 'exception'
  AND rm.resolved_at IS NULL
ORDER BY rt.gross_amount DESC;
```

### Query: daily reconciliation health dashboard

```sql
SELECT
  DATE(rt.transaction_date) AS recon_date,
  COUNT(*) FILTER (WHERE rm.match_type = 'exact') AS exact_matches,
  COUNT(*) FILTER (WHERE rm.match_type = 'fuzzy') AS fuzzy_matches,
  COUNT(*) FILTER (WHERE rm.match_status = 'exception') AS exceptions,
  ROUND(
    COUNT(*) FILTER (WHERE rm.match_status = 'exception')::NUMERIC /
    NULLIF(COUNT(*), 0) * 100, 2
  ) AS exception_rate_pct,
  SUM(rm.amount_delta) AS total_delta
FROM reconciliation_matches rm
JOIN reconciliation_transactions rt ON rt.id = rm.internal_transaction_id
WHERE rt.transaction_date >= NOW() - INTERVAL '30 days'
GROUP BY DATE(rt.transaction_date)
ORDER BY recon_date DESC;
```

## Best Practices

- **Use balance transactions as the source of truth** for Stripe — not charge or payment intent records. Balance transactions are the only API that reflects fees, refunds, and payouts in the same feed.
- **Always ingest T-1** — most processors finalize settlement 24 hours after transaction date. Running reconciliation against same-day data produces false exceptions for in-flight authorizations.
- **Store raw source data** in a separate staging table before normalizing. If your normalization logic has a bug you need the raw payload to reprocess without re-fetching from the API.
- **Idempotent ingestion** — use `upsert` with `(source, source_transaction_id)` as the unique key so re-runs are safe.
- **Match on reference IDs first** — amount-based matching is O(n²) and produces false positives. Invest in passing `order_id` as metadata on every payment processor transaction.
- **Set amount tolerance carefully** — a $0.005 tolerance handles floating-point rounding; a $1.00 tolerance handles known processor rounding differences. Do not use a percentage tolerance because it scales poorly with large transactions.
- **Never auto-resolve exceptions** — all exception resolutions should require a human approval step and leave an audit trail with `resolved_by` and `resolved_at`.
- **Reconcile fees separately** — processor fees are often charged in aggregate on a payout rather than per transaction. Build a separate fee reconciliation step that verifies your fee agreements are being honored.

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Stripe payouts don't match sum of charges | Payouts are net of fees, refunds, and rolling reserve; reconcile at the payout level using the Stripe Payout ID, not individual charges |
| Duplicate transactions after re-ingestion | Always upsert on `(source, source_transaction_id)`; never insert-only |
| Currency mismatch exceptions | Normalize all amounts to the transaction's own currency; never auto-convert during ingestion |
| PayPal pending transactions causing false exceptions | Filter PayPal ingestion to status `S` (settled) only; pending transactions will appear in a future day's run |
| Refunds matched to wrong original charge | Track refund-to-charge linkage using `charge_id` in Stripe and `parent_transaction_id` in PayPal; do not match refunds by amount alone |
| Month-end delta grows over time | Run a monthly roll-up job that checks cumulative unresolved exception totals; old unresolved exceptions are a sign of a systematic matching rule gap |
| Exception rate spikes during promotions | Discount codes and adjustments create amount differences; add promotion metadata to transaction records and build a separate promo-adjustment matching rule |

## Related Skills

- @stripe-integration
- @paypal-integration
- @tax-compliance-automation
- @accounts-receivable-automation
- @payout-split-management
