---
name: chargeback-management-prevention
description: "Prevent and manage chargebacks with fraud scoring, compelling evidence automation, Visa CE 3.0 / Mastercom integration, and win-rate optimization"
category: payments-checkout
risk: safe
source: curated
date_added: "2026-03-12"
tags: [chargebacks, disputes, fraud-prevention]
triggers: ["chargeback management", "dispute handling", "prevent chargebacks", "fraud disputes", "visa compelling evidence", "mastercom", "chargeback representment"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Chargeback Management and Prevention

## Overview

A chargeback occurs when a cardholder disputes a transaction with their bank, forcing a reversal of funds and levying a fee ($15–$100 per dispute) on the merchant. A chargeback ratio above 1% (Visa) or 1.5% (Mastercard) triggers the card network's dispute monitoring programs, which can result in monthly fines and ultimately account termination.

Effective chargeback management has two tracks: (1) preventing disputes with fraud scoring and clear communication, and (2) winning more disputes by submitting complete evidence within the response window. Most platforms now integrate directly with Stripe or PayPal for dispute management, making automated evidence submission accessible to all merchants.

## When to Use This Skill

- When chargeback ratio is approaching 0.65% (the early-warning level Visa monitors before the 1% threshold)
- When your team is manually compiling evidence packages and missing response deadlines
- When processing international transactions with higher dispute rates
- When your dispute win rate is below 40% and you need to understand why
- When friendly fraud (customers who received goods but dispute anyway) is a significant problem

## Core Instructions

### Step 1: Determine your platform and dispute management approach

| Platform | How Disputes Are Handled | Recommended Tool |
|----------|------------------------|-----------------|
| **Shopify Payments** | Disputes managed in Shopify Admin → Payments → Disputes | Shopify's built-in dispute response + Chargebacks911 or Kount for high volume |
| **Shopify + Stripe** | Disputes appear in Stripe Dashboard + Shopify Admin | Stripe Radar for prevention; Stripe's dispute workflow for response |
| **WooCommerce + Stripe** | Disputes in Stripe Dashboard; no WooCommerce-native interface | Stripe Radar for fraud scoring; Stripe Dashboard for dispute response |
| **WooCommerce + PayPal** | Disputes in PayPal Resolution Center | PayPal Seller Protection + manual evidence submission in Resolution Center |
| **BigCommerce** | Depends on payment gateway; Stripe and PayPal most common | Same as WooCommerce equivalent above |
| **Custom / Headless** | Stripe Radar + Stripe dispute webhooks for automation | Build automated evidence collection triggered by `charge.dispute.created` webhook |

### Step 2: Set up fraud prevention (before chargebacks happen)

The most cost-effective chargeback strategy is prevention.

#### Shopify

1. **Enable Shopify Fraud Analysis**: Go to **Settings → Payments → Fraud prevention**. Shopify automatically analyzes orders and flags high-risk ones with indicators (billing/shipping address mismatch, CVV failure, AVS mismatch).

2. **Act on fraud indicators**: For orders with multiple red flags, go to **Orders → [Order] → Fraud analysis** and review the risk factors before fulfilling. Cancel and refund orders with a "High" risk level before they ship.

3. **Enable Shopify Protect** (if on Shopify Payments): This is Shopify's built-in chargeback protection for fraudulent orders. Eligible orders are automatically covered — Shopify pays the chargeback amount and fee. Go to **Settings → Payments** to verify Protect is active on your account.

4. **Install Signifyd or NoFraud**: For higher-volume stores, install **Signifyd** or **NoFraud** from the Shopify App Store. These provide chargeback guarantees — if a fraud dispute occurs on an order they approved, they pay the chargeback.

#### WooCommerce

1. **Enable Stripe Radar**: In the Stripe Dashboard, go to **Radar → Rules** and configure fraud rules. Stripe Radar evaluates every transaction and blocks high-risk ones.

2. **Add Stripe Radar rules** for your risk profile:
   - Block payments where the billing zip code does not match
   - Require 3D Secure for transactions above $500
   - Block prepaid cards for digital goods (high fraud category)

3. **Enable AVS and CVV checks**: In **Stripe Dashboard → Settings → Radar** enable AVS and CVC checks. Go to **WooCommerce → Settings → Payments → Stripe** and enable the "Require a valid postal code from the customer" option.

#### BigCommerce

1. Go to **Store Setup → Payment Methods** and enable your gateway's fraud filters
2. For Stripe: configure Radar rules in the Stripe Dashboard (same as WooCommerce above)
3. For PayPal: enable **PayPal Seller Protection** requirements — require signature confirmation for orders over $250

### Step 3: Respond to disputes effectively

#### Shopify Payments

1. Go to **Settings → Payments → Disputes** — all open disputes appear here with response deadlines
2. Click on a dispute to see the reason code and deadline (typically 7–21 days from the dispute date)
3. Click **Submit evidence** and fill in:
   - Tracking number and carrier confirmation of delivery
   - Customer's IP address and billing address at time of purchase
   - Email communications with the customer about the order
   - Your refund policy (link to the policy page)
   - For digital goods: proof of delivery and usage logs
4. Submit before the deadline — Shopify notifies you via email when a new dispute is created

**Shopify makes this straightforward**: it pre-fills much of the evidence from the order data (shipping address, IP, order details).

#### Stripe Dashboard (WooCommerce, BigCommerce, Custom)

1. Go to **Stripe Dashboard → Disputes** — all open disputes with deadlines are listed
2. Click on a dispute to open the evidence submission form
3. Stripe's form has specific fields for each evidence type:
   - **Shipping documentation**: paste the tracking number and carrier
   - **Customer communication**: paste email correspondence
   - **Refund policy**: paste your policy text or URL
   - **Service documentation**: describe what was delivered and when
4. Under **Uncategorized text**, add a narrative summary: "Customer placed order on [date], order shipped [date] via [carrier], tracking [number], delivered [date]"
5. Click **Submit evidence** — Stripe sends the package to the card network

**Key rule**: respond to every dispute, even low-value ones. Accepting a $10 chargeback still counts against your dispute ratio.

#### PayPal Resolution Center (WooCommerce, BigCommerce)

1. Log in to your PayPal Business account and go to **Resolution Center → Cases**
2. Click on the open case and select **Respond**
3. For "Item Not Received" disputes: provide the tracking number and delivery confirmation
4. For "Unauthorized Transaction" disputes: provide proof of shipment, IP address, and any communication with the customer
5. Submit by the deadline shown on the case

### Step 4: Use Visa CE 3.0 for friendly fraud

Visa Compelling Evidence 3.0 (CE 3.0) is a powerful tool for disputing friendly fraud (customer received goods but claims they did not authorize the purchase). If the customer has 2 prior non-disputed transactions on the same card in the past 120 days, you can submit these as evidence to shift liability to the issuer.

In **Stripe Dashboard**: when submitting evidence for a Visa fraud dispute, scroll to the **Prior undisputed transactions** section and add the charge IDs of 2 prior non-disputed purchases by the same customer. Stripe will format and submit this as CE 3.0 evidence.

### Step 5: Monitor your dispute ratio

Set a calendar reminder to check your dispute ratio monthly. Both Stripe and Shopify Payments provide this data:

- **Stripe**: Go to **Dashboard → Radar → Disputes** and filter by month. Count disputes / total transactions = dispute ratio
- **Shopify Payments**: Go to **Settings → Payments → Disputes** and review the monthly summary

**Alert thresholds:**
- 0.65%: Warning level — review your fraud prevention rules
- 0.90%: Critical level — Visa's early intervention program; contact your payment processor
- 1.00%: Visa monitoring program enrollment — monthly fines begin

## Best Practices

- **Respond to every dispute** — even $5–$20 disputes count against your ratio; only accept (concede) a dispute if the win probability is near zero
- **Collect evidence at order creation**, not when the dispute arrives — delivery confirmations, IP addresses, and device data are harder to obtain 60 days later
- **Use Shopify Protect or Signifyd** if on Shopify — chargeback guarantees remove the financial risk entirely for covered orders
- **Set response deadline reminders at T-5 days** — the response window is non-negotiable; build calendar reminders for all open disputes
- **Block repeat disputers** — customers with 2+ chargebacks in 12 months should be flagged; Stripe Radar allows you to create a block rule for email addresses with prior disputes

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Missing the response deadline | Stripe and Shopify both send email alerts when a dispute is created; ensure alerts go to a monitored inbox, not a noreply@ address |
| Evidence submitted but dispute still lost | Evidence must be factual and specific — vague statements lose; tracking numbers, delivery scans, and customer emails win |
| High friendly fraud rate | Implement Visa CE 3.0 using prior transaction evidence; add an explicit refund policy acceptance checkbox at checkout |
| Dispute ratio counted differently by processor and card network | Visa counts chargebacks-to-transactions in the same calendar month; use the same calculation window for your monitoring |
| PayPal disputes not visible until escalated | Check PayPal Resolution Center daily, not just your email; disputes start as "Inquiries" before becoming "Disputes" |
| Shopify Protect not covering all orders | Protect has eligibility requirements (card-present equivalent signals); review the Protect coverage report to see which order types qualify |

## Related Skills

- @stripe-integration
- @payment-reconciliation-automation
- @fraud-detection
- @order-processing-pipeline
