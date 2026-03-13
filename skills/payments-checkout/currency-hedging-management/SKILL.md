---
name: currency-hedging-management
description: "Manage foreign exchange risk for multi-currency ecommerce with FX rate tracking, hedging strategies, and realized/unrealized gain-loss accounting"
category: payments-checkout
risk: safe
source: curated
date_added: "2026-03-12"
tags: [currency, forex, hedging, multi-currency]
triggers: ["currency hedging", "FX risk management", "foreign exchange", "multi-currency accounting", "exchange rate risk", "forex exposure", "currency gain loss"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: advanced
---

# Currency Hedging Management

## Overview

When an ecommerce business sells internationally, it is exposed to foreign exchange (FX) risk: the value of a transaction recorded in a foreign currency fluctuates between the time of sale and the time the funds are converted to the company's functional (home) currency. A EUR 1,000 sale might be worth $1,080 when the order is placed and only $1,020 when the invoice is paid 30 days later — a $60 loss with no change in business performance.

This skill covers building a currency risk management system for ecommerce: real-time and historical FX rate ingestion, transaction-level currency exposure tracking, realized vs. unrealized gain/loss accounting, and automated hedging workflows using forward contracts or natural hedging. It also covers the reporting infrastructure finance teams need to understand currency impact on revenue.

The level of hedging complexity appropriate depends on volume and margin. Under $1M/year in foreign currency revenue, natural hedging (holding foreign currency balances and spending them in the same currency) is typically sufficient. Above $5M/year, formal treasury hedging programs with forward contracts or options become cost-justified.

## When to Use This Skill

- When your ecommerce store generates more than 15% of revenue in non-functional currencies
- When FX rate swings are creating unexplained variance in your margin reports
- When you need to separate operational performance from currency effects in financial reporting
- When building a marketplace or platform where sellers and buyers use different currencies
- When preparing for international expansion and modeling currency risk scenarios
- When your accounting team cannot reconcile the AR balance in foreign currencies to the bank statements
- When month-end close is delayed by manual FX rate lookups and revaluation calculations

## Prerequisites & Platform Notes

**Shopify**: Shopify handles checkout natively. Use Shopify Payments (powered by Stripe), checkout extensions, and Shopify Functions for custom discount/payment logic. You cannot modify the core checkout without Checkout Extensions.
**WooCommerce**: WooCommerce supports payment gateways via plugins (WooCommerce Stripe, WooCommerce PayPal). Extend checkout with woocommerce_checkout_process and woocommerce_payment_complete hooks.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store, Stripe or PayPal account, relevant payment plugin/app

## Core Instructions

### 1. Design the FX rate and exposure data model

```sql
-- Historical FX rates (fetched daily from open exchange rates or ECB)
CREATE TABLE fx_rates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency  CHAR(3) NOT NULL,     -- 'USD', 'EUR', 'GBP'
  quote_currency CHAR(3) NOT NULL,     -- 'EUR', 'GBP', 'JPY'
  rate           NUMERIC(18, 8) NOT NULL,  -- How many quote units per 1 base unit
  rate_date      DATE NOT NULL,
  source         VARCHAR(50) DEFAULT 'ecb',  -- 'ecb', 'openexchangerates', 'wise'
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (base_currency, quote_currency, rate_date, source)
);

-- Currency exposure per order/invoice
CREATE TABLE currency_exposures (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id       UUID NOT NULL,         -- order_id or invoice_id
  transaction_type     VARCHAR(50) NOT NULL,  -- 'order', 'invoice', 'refund'
  functional_currency  CHAR(3) NOT NULL,      -- Company's home currency
  transaction_currency CHAR(3) NOT NULL,      -- Currency of the sale
  original_amount      NUMERIC(15, 4) NOT NULL,    -- In transaction_currency
  booked_rate          NUMERIC(18, 8) NOT NULL,    -- FX rate at time of booking
  booked_amount        NUMERIC(15, 4) NOT NULL,    -- In functional_currency at booking
  settlement_rate      NUMERIC(18, 8),             -- FX rate at settlement
  settlement_amount    NUMERIC(15, 4),             -- In functional_currency at settlement
  realized_gain_loss   NUMERIC(15, 4),             -- settlement_amount - booked_amount (positive = gain)
  status               VARCHAR(30) DEFAULT 'open', -- 'open', 'settled', 'hedged', 'written_off'
  exposure_date        DATE NOT NULL,
  settlement_date      DATE,
  hedge_id             UUID,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Unrealized gain/loss revaluations (run at month-end)
CREATE TABLE fx_revaluations (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revaluation_date         DATE NOT NULL,
  currency                 CHAR(3) NOT NULL,
  functional_currency      CHAR(3) NOT NULL,
  open_balance_foreign     NUMERIC(15, 4) NOT NULL,  -- Total open AR in foreign currency
  booked_balance_functional NUMERIC(15, 4) NOT NULL,  -- Book value at original rates
  current_balance_functional NUMERIC(15, 4) NOT NULL, -- Current value at today's rate
  unrealized_gain_loss      NUMERIC(15, 4) NOT NULL,  -- current - booked
  revaluation_rate          NUMERIC(18, 8) NOT NULL,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (revaluation_date, currency, functional_currency)
);

-- Forward contracts and hedges
CREATE TABLE fx_hedges (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hedge_type       VARCHAR(30) NOT NULL,  -- 'forward', 'option', 'natural'
  buy_currency     CHAR(3) NOT NULL,
  sell_currency    CHAR(3) NOT NULL,
  notional_amount  NUMERIC(15, 4) NOT NULL,   -- Amount of buy_currency
  contracted_rate  NUMERIC(18, 8) NOT NULL,   -- Locked exchange rate
  spot_rate_at_entry NUMERIC(18, 8),
  value_date       DATE NOT NULL,            -- Settlement date of the forward
  status           VARCHAR(30) DEFAULT 'open',
  provider         VARCHAR(100),             -- Bank or broker name
  contract_ref     VARCHAR(100),
  premium_paid     NUMERIC(12, 4) DEFAULT 0,
  mark_to_market   NUMERIC(15, 4) DEFAULT 0,
  settled_rate     NUMERIC(18, 8),
  gain_loss        NUMERIC(15, 4),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fx_rates_lookup ON fx_rates (base_currency, quote_currency, rate_date DESC);
CREATE INDEX idx_exposures_status ON currency_exposures (status, transaction_currency);
CREATE INDEX idx_exposures_date ON currency_exposures (exposure_date);
```

### 2. FX rate ingestion service

```javascript
// services/fx/rate-fetcher.js
import axios from 'axios';
import { db } from '../../lib/db.js';

const TRACKED_CURRENCIES = ['EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK', 'NZD'];
const FUNCTIONAL_CURRENCY = process.env.FUNCTIONAL_CURRENCY ?? 'USD';

export async function fetchAndStoreDailyRates(date = new Date()) {
  const rateDate = date.toISOString().split('T')[0];

  // Use Open Exchange Rates (free tier available)
  const { data } = await axios.get('https://openexchangerates.org/api/historical/' + rateDate + '.json', {
    params: { app_id: process.env.OPEN_EXCHANGE_RATES_APP_ID, base: FUNCTIONAL_CURRENCY, symbols: TRACKED_CURRENCIES.join(',') },
  });

  const rows = Object.entries(data.rates).map(([quoteCurrency, rate]) => ({
    base_currency: FUNCTIONAL_CURRENCY,
    quote_currency: quoteCurrency,
    rate,
    rate_date: rateDate,
    source: 'openexchangerates',
  }));

  // Also store inverse rates for convenience
  const inverseRows = rows.map((r) => ({
    base_currency: r.quote_currency,
    quote_currency: r.base_currency,
    rate: 1 / r.rate,
    rate_date: rateDate,
    source: 'openexchangerates',
  }));

  await db.fxRates.createMany({
    data: [...rows, ...inverseRows],
    skipDuplicates: true,
  });

  return { rateDate, ratesStored: rows.length };
}

export async function getRate(fromCurrency, toCurrency, date = new Date()) {
  if (fromCurrency === toCurrency) return 1;

  const rateDate = date.toISOString().split('T')[0];

  // Try direct lookup first
  let fxRecord = await db.fxRates.findFirst({
    where: { base_currency: fromCurrency, quote_currency: toCurrency, rate_date: rateDate },
    orderBy: { created_at: 'desc' },
  });

  // Fall back to the most recent rate within 7 days
  if (!fxRecord) {
    const cutoff = new Date(date);
    cutoff.setDate(cutoff.getDate() - 7);
    fxRecord = await db.fxRates.findFirst({
      where: {
        base_currency: fromCurrency,
        quote_currency: toCurrency,
        rate_date: { gte: cutoff.toISOString().split('T')[0], lte: rateDate },
      },
      orderBy: { rate_date: 'desc' },
    });
  }

  if (!fxRecord) {
    throw new Error(`No FX rate found for ${fromCurrency}/${toCurrency} near ${rateDate}`);
  }

  return parseFloat(fxRecord.rate);
}
```

### 3. Record currency exposure at order creation

```javascript
// services/fx/exposure-tracker.js
export async function recordOrderExposure(order) {
  if (order.currency === FUNCTIONAL_CURRENCY) return null;  // No FX risk for domestic orders

  const bookedRate = await getRate(order.currency, FUNCTIONAL_CURRENCY, new Date(order.created_at));
  const bookedAmount = order.total_amount * bookedRate;

  return db.currencyExposures.create({
    data: {
      transaction_id: order.id,
      transaction_type: 'order',
      functional_currency: FUNCTIONAL_CURRENCY,
      transaction_currency: order.currency,
      original_amount: order.total_amount,
      booked_rate: bookedRate,
      booked_amount: bookedAmount,
      status: 'open',
      exposure_date: new Date(order.created_at),
    },
  });
}

export async function settleExposure(transactionId, settlementDate, actualFunctionalAmount) {
  const exposure = await db.currencyExposures.findFirst({
    where: { transaction_id: transactionId, status: 'open' },
  });

  if (!exposure) return null;

  const settlementRate = actualFunctionalAmount / parseFloat(exposure.original_amount);
  const realizedGainLoss = actualFunctionalAmount - parseFloat(exposure.booked_amount);

  return db.currencyExposures.update({
    where: { id: exposure.id },
    data: {
      settlement_rate: settlementRate,
      settlement_amount: actualFunctionalAmount,
      realized_gain_loss: realizedGainLoss,
      status: 'settled',
      settlement_date: new Date(settlementDate),
    },
  });
}
```

### 4. Month-end FX revaluation

```javascript
// services/fx/revaluation.js — run at month-end close
export async function runMonthEndRevaluation(revaluationDate = new Date()) {
  const dateStr = revaluationDate.toISOString().split('T')[0];
  const results = [];

  for (const currency of TRACKED_CURRENCIES) {
    // Sum all open exposures in this currency
    const exposures = await db.currencyExposures.findMany({
      where: {
        transaction_currency: currency,
        status: 'open',
        exposure_date: { lte: revaluationDate },
      },
    });

    if (exposures.length === 0) continue;

    const openBalanceForeign = exposures.reduce((s, e) => s + parseFloat(e.original_amount), 0);
    const bookedBalanceFunctional = exposures.reduce((s, e) => s + parseFloat(e.booked_amount), 0);

    const currentRate = await getRate(currency, FUNCTIONAL_CURRENCY, revaluationDate);
    const currentBalanceFunctional = openBalanceForeign * currentRate;
    const unrealizedGainLoss = currentBalanceFunctional - bookedBalanceFunctional;

    const revaluation = await db.fxRevaluations.upsert({
      where: { revaluation_date_currency_functional_currency: { revaluation_date: dateStr, currency, functional_currency: FUNCTIONAL_CURRENCY } },
      create: {
        revaluation_date: dateStr,
        currency,
        functional_currency: FUNCTIONAL_CURRENCY,
        open_balance_foreign: openBalanceForeign,
        booked_balance_functional: bookedBalanceFunctional,
        current_balance_functional: currentBalanceFunctional,
        unrealized_gain_loss: unrealizedGainLoss,
        revaluation_rate: currentRate,
      },
      update: {
        open_balance_foreign: openBalanceForeign,
        booked_balance_functional: bookedBalanceFunctional,
        current_balance_functional: currentBalanceFunctional,
        unrealized_gain_loss: unrealizedGainLoss,
        revaluation_rate: currentRate,
      },
    });

    results.push(revaluation);
  }

  return results;
}
```

### 5. Currency P&L report

```sql
-- Monthly realized and unrealized FX gain/loss by currency
SELECT
  DATE_TRUNC('month', ce.exposure_date) AS month,
  ce.transaction_currency AS currency,
  COUNT(*) AS transactions,
  SUM(ce.original_amount) AS volume_foreign,
  SUM(ce.booked_amount) AS volume_functional_booked,
  SUM(ce.settlement_amount) FILTER (WHERE ce.status = 'settled') AS volume_settled,
  SUM(ce.realized_gain_loss) FILTER (WHERE ce.status = 'settled') AS realized_gain_loss,
  (SELECT fxr.unrealized_gain_loss FROM fx_revaluations fxr
   WHERE fxr.currency = ce.transaction_currency
     AND fxr.revaluation_date = DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day'
   LIMIT 1) AS unrealized_gain_loss
FROM currency_exposures ce
WHERE ce.transaction_currency != 'USD'
GROUP BY 1, 2
ORDER BY 1 DESC, ABS(realized_gain_loss) DESC;
```

## Best Practices

- **Separate FX gain/loss from operating revenue** — report currency effects as a separate line item in your P&L so operations teams can see true business performance without FX noise.
- **Use mid-market rates for booking** — avoid using payment processor rates (which include a spread) for your accounting books; use ECB or a neutral rate source.
- **Hedge predictable, material exposures** — if you know you will have EUR 500,000 in receivables over the next quarter, a forward contract locks in your rate. Do not hedge every individual transaction.
- **Natural hedging first** — if you have both EUR revenue and EUR expenses (e.g., European suppliers), they offset each other without any financial instruments.
- **Document your hedging policy** — for audit purposes, have a written treasury policy that specifies which exposures you hedge, what instruments you use, and how you account for them.
- **Revalue open positions monthly** — unrealized gain/loss on open FX positions must be recognized for GAAP/IFRS financial reporting.
- **Track the effective rate per transaction** — the spread between your contracted rate and the actual settlement rate is a cost of doing international business; track it per currency corridor.

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| FX gain/loss mixed with revenue in reports | Add a separate `fx_gain_loss` account code in your chart of accounts; never adjust revenue for currency effects |
| Over-hedging speculative revenue | Only hedge firm commitments (confirmed orders, signed contracts); hedging forecast revenue creates accounting complications |
| Missing the hedge accounting designation | Under ASC 815/IAS 39, hedges must be designated and documented at inception to qualify for hedge accounting treatment |
| Rate provider outage causing stale rates | Cache the most recent rate; fall back to T-1 rates if today's rates are unavailable; alert finance if using stale rates |
| Rounding differences between processor rate and book rate | Document the rate source policy; small differences (< 0.1%) are normal and should be posted to a foreign exchange adjustment account |
| Not tracking hedge settlements | Forward contract settlements create realized gain/loss that must be offset against the booked exposure they were hedging |

## Related Skills

- @multi-currency
- @payment-reconciliation-automation
- @tax-compliance-automation
- @accounts-receivable-automation
