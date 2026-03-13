---
name: cash-flow-forecasting
description: "Forecast cash flow using historical sales patterns, payment terms, seasonal trends, and receivables modeling with scenario planning and runway tracking"
category: data-analytics
risk: safe
source: curated
date_added: "2026-03-12"
tags: [cash-flow, forecasting, financial-planning]
triggers: ["forecast cash flow", "cash runway", "cash flow model", "payment terms modeling", "seasonal cash planning", "receivables forecast", "working capital forecast"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Cash Flow Forecasting

## Overview

Cash flow forecasting predicts when money actually enters and leaves your bank account — not when revenue is recognized. For ecommerce businesses, cash and revenue timing diverge significantly: payment processors hold funds for days or weeks, inventory must be purchased and paid for weeks before it sells, and marketplace disbursements are bi-weekly or delayed by account reviews.

This skill guides you through building a 13-week rolling cash flow forecast using your platform's data, covering the key cash timing differences by sales channel, and setting up a simple model in a spreadsheet or BI tool that you update weekly.

## When to Use This Skill

- When managing cash position and needing to know your runway
- When planning inventory buys and needing to confirm you have the cash to fund them
- When preparing for a fundraise and needing to show investors a 12–18 month cash model
- When stress-testing the business against a revenue shortfall scenario
- When selling on Amazon and managing bi-weekly disbursement timing
- When planning for seasonal cash flow gaps (Q1 trough after Q4 peak)

## Core Instructions

### Step 1: Pull your historical revenue and expense data from your platform

Before building a forecast, gather 12 months of actuals. Here is where to find the data by platform:

---

#### Shopify

1. **Revenue data:** Go to **Analytics → Reports → Sales over time** — export to CSV; this gives you daily/weekly/monthly gross sales, discounts, returns, and net sales
2. **Order-level data:** Go to **Analytics → Reports → Orders over time** — shows order count and AOV trends useful for projecting future orders
3. **Finance summary:** Go to **Analytics → Finances summary** — shows gross sales, discounts, returns, shipping charged, and net sales for any date range
4. **Payouts:** Go to **Finances → Payouts** — shows exactly when Shopify Payments transferred funds to your bank and the amount; this is your actual cash inflow history, not just revenue recognition
5. **Export orders:** Go to **Orders → Export** — download all orders with financial data; use this to build a detailed spreadsheet model

**Shopify Payments cash timing:**
- Standard payout: 2–3 business days after the transaction
- After confirming your payout schedule in **Finances → Payout schedule**, build this lag into your inflow model

---

#### WooCommerce

1. **Revenue data:** Go to **WooCommerce → Analytics → Revenue** — shows gross revenue, refunds, coupons, net revenue, and taxes by day/week/month; export to CSV
2. **Orders export:** Go to **WooCommerce → Orders → Export** — download order history with payment method, dates, and amounts
3. **Payment gateway timing:** Check your gateway dashboard (Stripe, PayPal, Square) for payout history and typical lag:
   - Stripe: typically 2 business days
   - PayPal: 1–3 business days (can vary for new accounts)
4. **Expenses:** WooCommerce does not track expenses natively; pull these from your accounting system (QuickBooks, Xero) or bank statements

---

#### BigCommerce

1. Go to **Analytics → Store Overview** — shows revenue, orders, and conversion trends; export to CSV
2. Go to **Analytics → Purchase Funnel** and **Analytics → Marketing** for additional revenue breakdowns
3. Use **BigCommerce's data export API** or connect via **Stitch** or **Fivetran** to pull order data into a spreadsheet or warehouse for multi-month analysis

---

### Step 2: Map cash timing by channel

The most important step is understanding the lag between when revenue is earned and when cash arrives. Build a channel-by-channel timing table:

| Channel | Typical Cash Lag | Notes |
|---------|-----------------|-------|
| Shopify Payments (credit card) | 2–3 business days | Set in Shopify under Finances → Payout schedule |
| Stripe (direct) | 2 business days | Configurable; can be daily |
| PayPal | 1–3 business days | New accounts may have longer holds |
| Amazon FBA | 14 days | Bi-weekly disbursements; check Seller Central → Payments |
| Amazon FBM | 14 days | Same bi-weekly schedule |
| eBay Managed Payments | 2 business days | Check eBay Payments dashboard |
| Walmart Marketplace | 14 days | Monthly disbursement cycle |
| Wholesale / Net-30 | 30 days | Invoice date to expected payment |
| Wholesale / Net-60 | 60 days | Factor in 2–5% bad debt rate |
| Buy Now Pay Later (Afterpay, Klarna) | 2–3 business days | BNPL providers pay merchant immediately; no customer lag |

**Build this timing into your cash inflow schedule:** For each week's projected revenue, create a separate row showing when that cash actually arrives. Revenue earned this week from Amazon arrives in the week two weeks from now.

### Step 3: Build a 13-week rolling cash flow model

Use a spreadsheet (Google Sheets or Excel) with this structure. Update it every Monday morning.

**Model structure (one column per week, 13 weeks forward):**

```
                          WK1    WK2    WK3    WK4    ...  WK13
OPENING CASH BALANCE

OPERATING INFLOWS
  + Shopify Payments (2-day lag from prior week sales)
  + Amazon disbursement (bi-weekly; map exact dates)
  + PayPal settlements
  + B2B/wholesale payments (net-30 invoices due this week)

OPERATING OUTFLOWS
  - Inventory purchases (PO payments due this week)
  - Inbound freight & duties
  - 3PL / fulfillment fees (typically billed weekly)
  - Outbound shipping not passed to customer
  - Marketing & ad spend (credit card charge date, not spend date)
  - Payroll (exact pay dates)
  - Platform/software subscriptions
  - Rent & facilities
  - Customer refunds (process in same week issued)
  - Sales tax remittances (quarterly — schedule known dates)

NET WEEKLY CASH FLOW
CLOSING CASH BALANCE
```

**Getting outflow data:**
- **Inventory payments:** Pull open purchase orders from your supplier portal or inventory system; note the due date for each PO
- **Marketing spend:** Check your credit card statement for when ad platform charges clear (usually monthly billing cycle); Meta and Google bill in arrears or when threshold is reached
- **Payroll:** Use exact pay dates from your payroll system (Gusto, ADP, Rippling)

### Step 4: Build base / bear / bull scenarios

Run three scenarios:

| Scenario | Revenue Assumption | Purpose |
|----------|-------------------|---------|
| **Base case** | Current trajectory (prior 4-week average) | Day-to-day planning |
| **Bear case** | 70–75% of base case revenue | Stress test; answers "how long can we survive?" |
| **Bull case** | 120–125% of base case revenue | Upside planning; "can we fund the growth?" |

**Critical rule:** In the bear case, reduce inflows by the revenue shortfall percentage but do NOT reduce fixed outflows (payroll, rent, software). Only variable costs (COGS, marketing, variable fulfillment) should scale with revenue. This is the most common forecasting mistake — in a revenue downturn, fixed costs remain, which dramatically worsens cash position.

**Runway calculation:** Find the first week in the bear case where the Closing Cash Balance reaches your minimum viable cash threshold (typically 4–6 weeks of fixed operating costs). The number of weeks until that point is your runway under the bear case.

### Step 5: Connect to live data for automatic updates

---

#### Shopify

Use **Shopify's built-in Finances export** (scheduled weekly) or connect via:
- **Shopify + Google Sheets:** Install the **Sheets for Shopify** app to sync orders and payouts automatically into your cash flow spreadsheet
- **Shopify + Xero/QuickBooks:** Use the **Xero** or **QuickBooks** Shopify integration to sync payout data into your accounting system, then build your forecast in your accounting tool

#### WooCommerce

- Connect **WooCommerce → QuickBooks** (via the official WooCommerce QuickBooks plugin) or **WooCommerce → Xero** (via the WooCommerce Xero extension)
- Use **Metorik** to export weekly revenue data into a CSV that feeds your spreadsheet model

#### Dedicated cash flow tools (all platforms)

These tools connect to your bank, payment processors, and ecommerce platforms to build automated cash flow forecasts:
- **Float** (floatapp.com): Connects to Xero/QuickBooks; great for 13-week cash forecasting
- **Pulse** (pulseapp.com): Simple cash flow tool with manual and bank-feed inputs
- **Dryrun**: More advanced; supports scenario modeling and connects to accounting systems
- **Runway** (runway.com): More comprehensive financial planning tool; connects to QuickBooks/Xero

## Best Practices

- **Update the 13-week forecast every Monday morning** — use prior-week actuals to replace the oldest week's projection and roll the forecast forward one week
- **Reconcile the forecast to your actual bank balance weekly** — if there is a gap between forecast and actual closing balance, find it before it compounds
- **Model Amazon payment timing explicitly** — Amazon bi-weekly disbursements are the single largest source of cash timing surprises for marketplace sellers; map the exact disbursement dates for the next 13 weeks
- **Build a minimum viable cash threshold** — define the minimum cash balance needed to operate; alert yourself when the forecast shows cash approaching this floor
- **Track the ad spend cash outflow date, not the spend date** — Meta and Google bill monthly or when a threshold is reached; the credit card payment date is when cash leaves, not when impressions run
- **Schedule tax remittances as known outflows** — sales tax remittances, quarterly estimated income taxes, and VAT payments are predictable; put them on the calendar in the model

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Confusing revenue with cash | A $50K wholesale invoice recognized in March will not generate cash until May under Net-60 terms; always model the timing layer separately |
| Ignoring seasonal inventory build-up | Heavy inventory spend in July–September (buying Q4 stock) causes a cash trough months before holiday revenue arrives; forecast the inventory payment schedule explicitly |
| Not modeling returns as cash outflows | Refunds are cash outflows that happen before you recover inventory; high-return categories need a return cash reserve modeled into weekly outflows |
| Ad spend lag not accounted for | Monthly credit card billings for ad platforms clear days after the billing period; model the card payment date as the cash outflow, not the daily spend date |
| Single-point estimate only | Always run base and bear scenarios; a model showing only the base case gives false confidence |
| Missing one-time outflows | Tax payments, insurance renewals, software annual contracts, and trade show expenses are predictable; add them to a forward calendar and populate the model |

## Related Skills

- @ecommerce-budgeting-forecasting
- @financial-reporting-dashboard
- @profit-margin-analysis
- @unit-economics-tracking
- @marketplace-fee-reconciliation
