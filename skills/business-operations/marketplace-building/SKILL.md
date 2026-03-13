---
name: marketplace-building
description: "Launch a multi-vendor marketplace with seller onboarding, commission rules, automated payouts via Stripe Connect, and vendor dashboards"
category: business-operations
risk: critical
source: curated
date_added: "2026-03-12"
tags: [marketplace, multi-vendor, seller-onboarding, commissions, payouts, Stripe-Connect, platform]
triggers: ["marketplace", "multi-vendor marketplace", "seller onboarding", "marketplace commissions", "seller payouts", "platform marketplace"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Marketplace Building

## Overview

A multi-vendor marketplace lets independent sellers list products on your platform, collects payment from buyers, deducts your commission, and pays out the remainder to sellers. The key components are: seller onboarding with KYC verification, product listing management per seller, commission calculation, and automated payouts. For Shopify and WooCommerce merchants, purpose-built marketplace apps handle most of this — custom development is needed primarily for highly specific commission structures or white-label marketplace platforms.

## When to Use This Skill

- When building a platform where third-party sellers list and sell their own products (not your inventory)
- When you need the platform to collect payment from buyers and distribute funds to sellers minus a commission
- When sellers need their own dashboard to manage listings, view orders, and track earnings
- When complying with KYC (Know Your Customer) requirements for seller identity verification
- When designing the commission structure (percentage, tiered, category-based) and payout schedule

## Core Instructions

### Step 1: Determine your platform and choose the right marketplace tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Multi Vendor Marketplace by Webkul or BOLD Multi-Vendor | Webkul's app adds seller accounts, product management, commission rules, and a seller dashboard to Shopify without replacing the storefront |
| **WooCommerce** | Dokan Multi-Vendor (most popular, 60K+ installs) or WC Vendors | Dokan is purpose-built for WooCommerce marketplaces with seller onboarding, commission management, payout requests, and a seller dashboard |
| **BigCommerce** | Multi Vendor Marketplace by Webkul (BigCommerce version) | Webkul has a BigCommerce version of their marketplace app |
| **Custom / Headless** | Build seller accounts + Stripe Connect for KYC and payouts | Stripe Connect handles KYC, bank account collection, and 1099-K tax forms — use it for any custom marketplace |

### Step 2: Set up seller onboarding and KYC

KYC (Know Your Customer) is required to verify seller identity before you can legally send them payments. Using Stripe Connect for this is strongly recommended — building it yourself is expensive and legally complex.

#### Shopify — Multi Vendor Marketplace by Webkul

1. Install **Multi Vendor Marketplace** by Webkul from the Shopify App Store
2. Sellers register via a seller signup form (customizable URL, e.g., `yourstore.com/seller/register`)
3. You approve seller applications manually in the Webkul admin — review the seller profile before approval
4. Connect Webkul to **Stripe Connect** for payouts: go to Webkul → Settings → Payment → Stripe Connect and enter your Stripe credentials
5. When you approve a seller, Webkul sends them an onboarding email with a link to connect their Stripe account (Stripe Express account — Stripe handles KYC and bank details)
6. Seller is live once their Stripe Express account is verified (Stripe notifies you via webhook)

#### WooCommerce — Dokan Multi-Vendor

1. Install **Dokan Multi-Vendor Plugin** from WordPress.org (free) or Dokan.com (pro)
2. Enable seller registration: go to **Dokan → Settings → General → Allow Registration**
3. Customize the seller registration form with required fields (business name, tax ID, bank info)
4. For KYC: Dokan Pro integrates with **Stripe Connect** — go to Dokan → Settings → Withdrawal → Stripe Connect and enter your Stripe platform credentials
5. Sellers connect their bank accounts via the Stripe Connect onboarding flow built into Dokan
6. In Dokan → Vendors, approve or reject seller applications manually

#### Custom / Headless — Stripe Connect for KYC

```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Create a Stripe Express account for a new seller and return the onboarding URL
async function onboardSeller(sellerId: string, sellerEmail: string): Promise<string> {
  // Create the Stripe Express account
  const account = await stripe.accounts.create({
    type: 'express',
    email: sellerEmail,
    capabilities: {
      transfers: { requested: true },
    },
  });

  // Store the Stripe account ID on the seller record
  await db.sellers.update(sellerId, { stripe_account_id: account.id });

  // Generate the onboarding link (valid for 24 hours)
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.APP_URL}/seller/onboarding/refresh`,
    return_url: `${process.env.APP_URL}/seller/onboarding/complete`,
    type: 'account_onboarding',
  });

  return accountLink.url; // send this URL to the seller
}

// Webhook handler: activate seller when Stripe confirms KYC is complete
async function handleStripeAccountUpdated(account: Stripe.Account): Promise<void> {
  const seller = await db.sellers.findByStripeAccountId(account.id);
  if (!seller) return;

  if (account.charges_enabled && account.payouts_enabled && seller.status !== 'active') {
    await db.sellers.update(seller.id, { status: 'active' });
    // Send welcome email to seller
  }
}
```

### Step 3: Set up product listings per seller

#### Shopify (Webkul)

1. Approved sellers log in to their Seller Dashboard at `yourstore.com/seller/dashboard`
2. Sellers add products from their dashboard — products are submitted to you for approval before going live (configurable in Webkul settings)
3. You control whether sellers can set their own prices or if all prices need your approval
4. Product images, descriptions, and inventory are all managed by the seller from their dashboard

#### WooCommerce (Dokan)

1. Sellers access their store dashboard at `yourstore.com/dashboard`
2. Sellers add products from Dokan → Products → Add New
3. Enable "Product Review" in Dokan settings to require your approval before new products go live
4. Sellers manage their own inventory counts, product variations, and prices
5. In Dokan Pro, you can set commission rates at the product level, category level, or globally

### Step 4: Configure commission rules and payouts

#### Shopify (Webkul)

1. Go to **Webkul → Commission** to set commission rates:
   - Global commission: e.g., 15% on all sales
   - Seller-specific: override for specific sellers (e.g., 10% for VIP sellers)
   - Category-specific: different rates by product category
2. Commissions are deducted automatically from each order when paid
3. Seller earnings are tracked in Webkul → Payments → Seller Transactions
4. To pay out sellers: go to Webkul → Payments → Process Payout. Select sellers and click Process via Stripe Connect — funds transfer from your Stripe balance to the seller's connected account

#### WooCommerce (Dokan)

1. Go to **Dokan → Settings → Selling → Commission** to set the global commission rate
2. Override per-seller in Dokan → Vendors → [Seller] → Commission
3. Sellers request withdrawals from their dashboard (Dokan → Withdraw Requests)
4. You approve withdrawal requests in Dokan → Withdraw Requests → Pending
5. For automated payouts via Stripe: Dokan Pro's Stripe Connect module automatically processes approved withdrawal requests

#### Custom / Headless — commission and payout logic

```typescript
// Calculate commission and record seller earnings when an order is paid
async function recordSellerEarning(params: {
  orderId: string;
  sellerId: string;
  grossAmountCents: number;  // what buyer paid for this seller's items
  commissionRate: number;    // e.g., 0.15 for 15%
}): Promise<void> {
  const commissionCents = Math.round(params.grossAmountCents * params.commissionRate);
  const netAmountCents = params.grossAmountCents - commissionCents;

  // Funds held until return window closes (e.g., 30 days)
  const availableAt = new Date();
  availableAt.setDate(availableAt.getDate() + 30);

  await db.sellerEarnings.insert({
    seller_id: params.sellerId,
    order_id: params.orderId,
    gross_amount_cents: params.grossAmountCents,
    commission_cents: commissionCents,
    net_amount_cents: netAmountCents,
    status: 'held',             // becomes 'available' after return window
    available_at: availableAt,
  });
}

// Transfer available earnings to seller's Stripe account
async function payoutSeller(sellerId: string): Promise<void> {
  const seller = await db.sellers.findById(sellerId);
  const availableEarnings = await db.sellerEarnings.findAll({
    seller_id: sellerId,
    status: 'available',
    available_at: { lte: new Date() },
  });

  const totalCents = availableEarnings.reduce((s, e) => s + e.net_amount_cents, 0);
  if (totalCents < 100) return; // minimum payout $1.00

  // Transfer from your Stripe balance to seller's connected account
  const transfer = await stripe.transfers.create({
    amount: totalCents,
    currency: 'usd',
    destination: seller.stripe_account_id,
    metadata: { seller_id: sellerId },
  });

  // Mark earnings as paid out
  await db.sellerEarnings.updateMany(
    availableEarnings.map(e => e.id),
    { status: 'paid_out' }
  );
}
```

### Step 5: Set up seller dashboards

#### Shopify (Webkul)

- Sellers access a Webkul-provided dashboard at `yourstore.com/seller/dashboard` showing: orders, products, earnings summary, and payout history
- Customize the dashboard appearance (colors, logo) in Webkul → Settings → Dashboard

#### WooCommerce (Dokan)

- Dokan provides a full frontend dashboard at `yourstore.com/dashboard` with: sales analytics, product management, withdrawal requests, and order management
- The dashboard is highly customizable via Dokan's template overrides

## Best Practices

- **Use Stripe Connect Express for all seller payouts** — Express handles KYC, bank account verification, and IRS 1099-K reporting; building this yourself is expensive and legally risky
- **Hold funds for the return window** — don't release earnings to sellers until the buyer's return window closes; releasing early means the platform absorbs refund losses
- **Record commission in the same transaction as order confirmation** — never compute commission asynchronously from a queue that might fail; the earning record must be atomic with the order
- **Send payout summaries to sellers by email** — weekly earnings summaries with order-level detail build seller trust and reduce support contacts
- **Block seller publishing until Stripe onboarding is complete** — check `charges_enabled && payouts_enabled` on the Stripe account before allowing a seller to publish listings

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Payout fails but earnings marked as paid | In Stripe Connect, use the `transfer.created` webhook to confirm success before marking earnings as `paid_out`; never mark paid-out in the same call that initiates the transfer |
| Platform pays out before buyer payment clears | Only trigger payout eligibility from the `payment_intent.succeeded` webhook, not from checkout session creation |
| Seller lists products before KYC is verified | Check Stripe account status (`charges_enabled && payouts_enabled`) before allowing product publication; Webkul and Dokan do this automatically |
| Seller disputes commission deduction | Store the commission rate and gross amount on every `seller_earning` record; show sellers their commission calculation history in the seller dashboard |

## Related Skills

- @multi-channel-selling
- @vendor-management
- @b2b-commerce
- @order-management-system
