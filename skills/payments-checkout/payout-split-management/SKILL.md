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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Payout Split Management

## Overview

A marketplace or multi-seller platform must split every payment between the platform (commission) and one or more sellers (net payout), withhold taxes where required, manage rolling reserves for refund protection, and disburse funds on a schedule. Stripe Connect is the industry standard for handling this — it legally routes funds to connected seller accounts, handles tax withholding and 1099 reporting, and eliminates the compliance risk of holding seller funds in a pooled bank account.

For Shopify, WooCommerce, and BigCommerce stores that operate as multi-vendor marketplaces, dedicated marketplace apps (like Dokan for WooCommerce) handle the payout split logic on top of Stripe Connect.

## When to Use This Skill

- When building a marketplace with independent sellers who need earnings disbursements
- When your platform charges a percentage or flat commission on transactions
- When you need to comply with IRS 1099-K reporting requirements for sellers
- When managing rolling reserves for high-risk or new sellers
- When sellers are requesting faster payouts (daily/weekly vs. monthly)

## Core Instructions

### Step 1: Choose the right marketplace and payout architecture

| Platform | Recommended Approach | Notes |
|----------|---------------------|-------|
| **Shopify** | **Shopify Marketplace Kit** + Stripe Connect, or **Multi-Vendor Marketplace** app | Shopify does not natively support multi-seller payouts; marketplace apps handle seller accounts and split payouts |
| **WooCommerce** | **Dokan Multivendor Marketplace** or **WCFM Marketplace** + Stripe Connect | Dokan is the most widely used WooCommerce marketplace plugin; has native Stripe Connect integration for split payouts |
| **BigCommerce** | **Multi-Seller Marketplace** app + Stripe Connect | Third-party marketplace apps on BigCommerce App Marketplace |
| **Custom / Headless** | **Stripe Connect** (Express or Custom accounts) | Build the full split logic; Stripe handles compliance, tax forms, and fund routing |

### Step 2: Set up Stripe Connect for seller payouts

Stripe Connect is required for any architecture where you want to route funds to sellers automatically (rather than collecting everything in your account and manually wiring sellers).

**Choose the right Connect account type:**
- **Express accounts**: Sellers onboard via a Stripe-hosted form; Stripe handles identity verification (KYC); best for most marketplaces
- **Custom accounts**: You control the onboarding UX entirely; more complex; for platforms with specific UX requirements
- **Standard accounts**: Sellers connect an existing Stripe account; they see your platform in their Stripe dashboard

For most marketplaces, **Express accounts** are the right choice.

**Set up Stripe Connect in the Stripe Dashboard:**
1. Go to **Stripe Dashboard → Connect → Overview** and configure your platform
2. Enable Express accounts under **Connect → Settings → Account types**
3. Configure your platform's branding (name, logo, colors) for the hosted onboarding flow
4. Set the commission structure in your platform settings (not Stripe — Stripe routes funds based on the amounts you specify per transaction)

---

#### WooCommerce (Dokan)

1. Install **Dokan Multivendor Marketplace** (free base + paid extensions from dokan.wedevs.com)
2. Go to **Dokan → Settings → Selling Options** and configure:
   - Commission type: percentage (e.g., 15% of each sale goes to the platform), flat fee, or combined
   - Commission rate: the percentage or flat amount you keep as the marketplace
3. Go to **Dokan → Settings → Withdrawal** and configure payout schedules (weekly, bi-weekly, monthly) and minimum withdrawal amount
4. Enable Stripe Connect: go to **Dokan → Settings → Payment → Stripe Connect** and enter your Stripe Connect platform keys
5. Sellers connect their Stripe accounts by going to their vendor dashboard and clicking **Payment Settings → Connect with Stripe**
6. When an order is placed, Dokan automatically splits the payment: the seller's share is transferred to their connected Stripe account, the commission stays in your platform's Stripe balance

**1099 reporting with Dokan:**
Dokan tracks cumulative payouts per seller. Export vendor earnings reports from **Dokan → Reports → Vendor Wise Sales** for 1099 preparation. For automatic 1099 generation, use **TaxBandits** or **Track1099** — import the Dokan export and generate IRS-compliant 1099-K forms.

#### Shopify (Multi-Vendor Marketplace app)

1. Install **Multi-Vendor Marketplace** or **Marketplace Kit** from the Shopify App Store (various providers)
2. Configure vendor commission rates in the app's vendor settings
3. Connect Stripe Connect for payouts in the app's payment settings
4. Vendors are onboarded via a hosted form and can view their earnings and request payouts from a vendor portal

#### BigCommerce

1. Install a multi-seller marketplace app from the BigCommerce App Marketplace
2. Configure commission rates and payout schedules in the app settings
3. Connect Stripe Connect for automatic fund routing

---

#### Custom / Headless

For custom marketplace builds, implement the full split payout architecture using Stripe Connect:

**Seller onboarding (Express accounts):**

```javascript
// Create an Express Connect account for a new seller
const account = await stripe.accounts.create({
  type: 'express',
  country: 'US',
  email: sellerEmail,
  capabilities: { transfers: { requested: true } },
  metadata: { seller_id: sellerId },
});

// Generate onboarding link — redirect seller to complete Stripe's KYC form
const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: `${process.env.PLATFORM_URL}/sellers/onboarding/retry`,
  return_url: `${process.env.PLATFORM_URL}/sellers/onboarding/complete`,
  type: 'account_onboarding',
});

// Save account.id to your database and redirect seller to accountLink.url
await db.sellers.update({ where: { id: sellerId }, data: { stripeAccountId: account.id } });
```

**Splitting payment at checkout (Destination charge pattern):**

```javascript
// Create a payment intent that automatically routes commission to your platform
// and the seller's share to their connected account
const paymentIntent = await stripe.paymentIntents.create({
  amount: orderTotalCents,
  currency: 'usd',
  payment_method_types: ['card'],
  application_fee_amount: Math.round(orderTotalCents * commissionRate), // Platform commission
  transfer_data: {
    destination: seller.stripeAccountId, // Seller's Connect account
  },
  metadata: { order_id: orderId, seller_id: sellerId },
});
```

**Rolling reserve (withhold a % for refund protection):**

```javascript
// Instead of immediate transfer, create a manual transfer on a delay
const transfer = await stripe.transfers.create({
  amount: Math.round(sellerNetEarningsCents * (1 - ROLLING_RESERVE_RATE)), // 95% transferred now
  currency: 'usd',
  destination: seller.stripeAccountId,
  transfer_group: `order_${orderId}`,
  metadata: { order_id: orderId, reserve_amount: Math.round(sellerNetEarningsCents * ROLLING_RESERVE_RATE) },
});

// Schedule the reserve release 90 days later via a cron job or job queue
await reserveQueue.add('release-reserve', {
  sellerId: seller.id,
  orderId,
  reserveAmount: Math.round(sellerNetEarningsCents * ROLLING_RESERVE_RATE),
}, { delay: 90 * 24 * 60 * 60 * 1000 });
```

**1099-K tracking:**

Track each seller's gross transaction volume in real-time. For 2024+, the IRS 1099-K threshold is $600.

```javascript
// Update seller YTD earnings after each order
await db.sellers.update({
  where: { id: sellerId },
  data: { ytdGrossVolume: { increment: orderSubtotal }, ytdTransactions: { increment: 1 } },
});

// Alert when approaching $600 threshold — request W-9 before first payout
const seller = await db.sellers.findUnique({ where: { id: sellerId } });
if (seller.ytdGrossVolume >= 400 && !seller.w9Collected) {
  await sendW9RequestEmail(seller);
}
```

For 1099 form generation, use **TaxBandits API** or **Track1099 API** rather than building IRS form generation from scratch.

### Step 3: Configure payout schedules and seller portal

**Stripe Connect payout schedule:**
In the Stripe Dashboard under **Connect → Settings → Payouts**, configure the default payout schedule for connected accounts (daily, weekly, or monthly). Individual seller accounts can request changes to their schedule within your platform's settings.

**Seller earnings dashboard:**
Sellers need visibility into their earnings, pending payouts, and reserves. Build or use a pre-built portal:
- **Dokan/WCFM**: includes a vendor dashboard with earnings, payout requests, and payment history
- **Custom**: use the Stripe Connect [Account Balance API](https://stripe.com/docs/api/balance) to show sellers their available balance in real-time

## Best Practices

- **Use Stripe Connect Express or Custom accounts** — never hold seller funds in a pooled bank account; use Stripe Connect to ensure funds are legally owned by the platform until transferred
- **Collect W-9 before first payout** — without a W-9, you must apply 24% IRS backup withholding; make W-9 collection part of seller onboarding
- **Calculate earnings at order capture, not payout time** — earnings records should be immutable and linked to specific orders; the payout is a separate aggregation step
- **Implement rolling reserves for new sellers** — withhold 5–10% for 90 days to protect against refunds and chargebacks; release automatically on schedule
- **Store commission rates as snapshots** — commission rates change over time; never recompute historical earnings with the current rate; record the rate at the time of each sale

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Stripe Connect transfer fails silently | Listen for the `transfer.failed` webhook and notify sellers and your ops team immediately |
| Rolling reserve not released after maturity | Build a daily cron job that checks release dates; test with a short reserve period in staging |
| 1099-K gross amount does not match seller records | 1099-K must report gross payment volume before platform fees; use gross order amount, not net seller earnings |
| Backup withholding not applied to sellers without W-9 | Set a flag in your database when onboarding if W-9 is not collected; apply 24% withholding to all payouts for that seller until it is received |
| Negative payout when refunds exceed sales in a period | Carry negative balances forward to the next payout period; never request clawbacks from seller bank accounts |
| Dokan commission not splitting correctly | Verify the commission rate is set at the vendor level (not just global default); check Dokan's logs under **Dokan → Logs** for transfer errors |

## Related Skills

- @stripe-integration
- @payment-reconciliation-automation
- @accounts-receivable-automation
- @tax-compliance-automation
- @invoice-generation-automation
