---
name: subscription-billing
description: "Sell recurring subscriptions with automated billing, dunning emails for failed payments, plan upgrade/downgrade prorations, and self-serve cancellation"
category: payments-checkout
risk: critical
source: curated
date_added: "2026-03-12"
tags: [subscriptions, recurring-billing, dunning, prorations, churn, cancellation, stripe-subscriptions]
triggers: ["subscription billing", "recurring payments", "subscription management", "dunning", "plan upgrade", "subscription cancellation", "proration"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Subscription Billing

## Overview

Subscription billing lets customers pay automatically on a recurring schedule — weekly, monthly, or annually. Shopify, WooCommerce, and BigCommerce each have dedicated subscription apps and plugins that handle the full lifecycle: initial checkout, recurring billing, failed payment recovery (dunning), plan changes, pausing, and cancellation. For headless storefronts, Stripe Subscriptions provides the same functionality via API with no need to build billing logic from scratch.

## When to Use This Skill

- When building a subscription box, membership, or "Subscribe & Save" program
- When the current subscription logic is manual and not scaling with customer count
- When dunning (failed payment recovery) is not automated and causing unnecessary churn
- When customers need self-serve plan upgrades, downgrades, pausing, and cancellation

## Core Instructions

### Step 1: Determine your platform and choose the right subscription tool

| Platform | Recommended Tool | Notes |
|----------|-----------------|-------|
| **Shopify** | **Recharge** or **Seal Subscriptions** or **Bold Subscriptions** (Shopify App Store) | Shopify has a native Subscriptions API; Recharge is the most widely used third-party app; Seal is a newer lower-cost option |
| **Shopify (simple)** | **Shopify Subscriptions** (built-in, free) | For basic subscription needs — launched 2024; handles simple recurring orders |
| **WooCommerce** | **WooCommerce Subscriptions** ($199/year, official WooCommerce extension) | The official and most complete WooCommerce subscription solution; handles all billing, dunning, and management |
| **BigCommerce** | **Recurly** (via BigCommerce App Marketplace) or **Rebilly** | BigCommerce does not have native subscriptions; third-party apps handle it |
| **Custom / Headless** | **Stripe Subscriptions** | Stripe Subscriptions handles the complete recurring billing lifecycle with webhooks |

### Step 2: Set up subscriptions on your platform

---

#### Shopify (Shopify Subscriptions — built-in, free)

For basic subscription products:

1. Go to **Settings → Apps and sales channels → Shopify Subscriptions** (may need to install from App Store)
2. Go to **Products** and open any product you want to make subscribable
3. Under **Purchase options**, click **Add subscription plan**
4. Configure:
   - Billing frequency: weekly, monthly, every X months
   - Discount for subscribers (e.g., 10% off vs. one-time purchase)
   - Free trial period (optional)
5. The product page will show both "One-time purchase" and "Subscribe & Save" options

Shopify Subscriptions handles: recurring billing, payment failure emails, and a customer portal for managing subscriptions. For advanced dunning, analytics, and subscriber portals, use Recharge or Seal Subscriptions.

#### Shopify (Recharge — recommended for scale)

1. Install **Recharge** from the Shopify App Store
2. Connect your Shopify store and Stripe account in **Recharge → Settings → Payment Processors**
3. Configure subscription products in **Recharge → Products → Add product**:
   - Select which Shopify products can be purchased as subscriptions
   - Set billing intervals (weekly, monthly, every 2 months, etc.)
   - Configure subscriber discounts
4. Set up the customer portal: go to **Recharge → Customer Portal** to configure what subscribers can manage themselves (pause, skip, change date, cancel, swap product)
5. Configure dunning: go to **Recharge → Settings → Dunning** and set up the retry schedule and email sequence for failed payments

**Recharge dunning defaults:**
- Day 0: First payment failure → email customer
- Day 3: Retry payment → email customer
- Day 7: Retry payment → final warning email
- Day 14: Retry payment → subscription cancelled if still failed

#### WooCommerce (WooCommerce Subscriptions)

1. Purchase and install **WooCommerce Subscriptions** from woocommerce.com/products/woocommerce-subscriptions
2. Create a subscription product: go to **Products → Add New** and set product type to **Simple subscription** or **Variable subscription**
3. Configure under **Subscription data**:
   - Billing period: daily, weekly, monthly, annually
   - Billing interval: every 1, 2, 3... periods
   - Subscription length: ongoing or limited (e.g., 12 months)
   - Sign-up fee (optional)
   - Free trial period (optional)
   - Subscriber discount (set via regular/sale price comparison)
4. Configure payment methods: go to **WooCommerce → Settings → Payments** and ensure your gateway supports recurring payments (Stripe via WooCommerce Stripe plugin, PayPal via WooCommerce PayPal Payments)
5. Configure dunning: go to **WooCommerce → Settings → Subscriptions → Failing payments** and set retry rules and email templates

**Customer portal for WooCommerce:**
Customers manage subscriptions from their **My Account → Subscriptions** page. WooCommerce Subscriptions provides pause, cancel, and payment method update functionality there by default.

#### BigCommerce (Recurly)

1. Sign up at **recurly.com** and create a plan (monthly, annual, etc.) with your pricing
2. Install the Recurly app from the BigCommerce App Marketplace and connect your store
3. Create subscription products that link to your Recurly plans
4. Recurly handles: checkout, recurring billing, dunning, invoicing, and the subscriber portal
5. Configure dunning in **Recurly → Configuration → Dunning Campaigns**: set retry schedule and email content

---

#### Custom / Headless

Use **Stripe Subscriptions** for the full recurring billing lifecycle:

**Create a subscription plan:**
In the **Stripe Dashboard → Products**, create a product with a recurring price (e.g., "Monthly Plan — $29/month"). Copy the Price ID (starts with `price_`).

**Subscribe a customer:**

```javascript
// Create or retrieve the Stripe customer
const customer = await stripe.customers.create({
  email: customerEmail,
  payment_method: paymentMethodId,
  invoice_settings: { default_payment_method: paymentMethodId },
});

// Create the subscription
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: 'price_monthly_pro_29' }], // Price ID from Stripe Dashboard
  payment_behavior: 'default_incomplete', // Create subscription, then confirm payment
  payment_settings: { save_default_payment_method: 'on_subscription' },
  expand: ['latest_invoice.payment_intent'],
  trial_period_days: 14, // Optional trial
  metadata: { customer_id: customerId },
});

// Return client_secret for 3DS confirmation if needed
const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
res.json({ subscriptionId: subscription.id, clientSecret });
```

**Sync subscription status via webhooks:**

```javascript
// Webhook handler for subscription events
async function handleSubscriptionWebhook(event) {
  switch (event.type) {
    case 'customer.subscription.updated':
      await syncSubscriptionStatus(event.data.object);
      break;

    case 'customer.subscription.deleted':
      // Subscription cancelled — revoke access
      await db.subscriptions.update({
        where: { stripeSubscriptionId: event.data.object.id },
        data: { status: 'cancelled', cancelledAt: new Date() },
      });
      break;

    case 'invoice.payment_succeeded':
      await recordSuccessfulBillingCycle(event.data.object);
      break;

    case 'invoice.payment_failed':
      // Send dunning email — Stripe retries automatically per your settings
      await sendDunningEmail(event.data.object);
      break;

    case 'customer.subscription.trial_will_end':
      // Send trial ending email 3 days before trial ends
      await sendTrialEndingEmail(event.data.object);
      break;
  }
}
```

**Configure dunning in Stripe Dashboard:**
Go to **Stripe Dashboard → Billing → Settings → Smart Retries**. Enable Smart Retries — Stripe's ML-based retry timing outperforms fixed schedules. Also configure automatic subscription cancellation after all retries fail under **Stripe Dashboard → Billing → Settings → Automatic collection**.

**Plan changes with prorations:**

```javascript
// Upgrade or downgrade a subscription
const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

await stripe.subscriptions.update(stripeSubscriptionId, {
  items: [{ id: subscription.items.data[0].id, price: newPriceId }],
  proration_behavior: 'create_prorations', // Charge/credit the difference immediately
});
// Stripe creates a prorated invoice automatically
```

**Cancellation with end-of-period access:**

```javascript
// Cancel at period end — customer retains access until the next billing date
await stripe.subscriptions.update(stripeSubscriptionId, {
  cancel_at_period_end: true,
});

// Immediate cancellation
await stripe.subscriptions.cancel(stripeSubscriptionId);
```

## Best Practices

- **Use platform-native subscription tools** — WooCommerce Subscriptions, Recharge on Shopify, and Stripe Subscriptions are all production-hardened and handle edge cases (failed payments, prorations, tax changes) correctly
- **Never store subscription state only in Stripe** — always sync subscription status to your database via webhooks; do not call Stripe on every page load to check status
- **Configure Smart Retries in Stripe** — enable under **Stripe Dashboard → Billing → Settings**; ML-based retry timing recovers significantly more failed payments than fixed schedules
- **Send dunning emails at each retry** — escalate urgency: "payment failed" → "account at risk" → "access will be suspended"; include a direct link to update payment method
- **Let customers self-serve** — build a customer portal (or use Stripe's hosted Customer Portal at **Stripe Dashboard → Billing → Customer portal**) for plan changes, pausing, and cancellation; reduces support load
- **Prorate upgrades immediately; apply downgrades at period end** — upgrades should charge the difference now; downgrades should apply at the next renewal to avoid complex partial refunds

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Subscription shows as active after cancellation | Sync status via webhooks — `customer.subscription.deleted` must trigger a database update; never poll Stripe for status on page load |
| WooCommerce Subscriptions not retrying failed payments | Verify the payment gateway supports tokenized recurring payments; Stripe via the WooCommerce Stripe plugin supports this; basic PayPal Standard does not |
| Trial converts to paid without customer knowing | Send the `trial_will_end` email 3 days before (Stripe fires the webhook automatically; Recharge and WooCommerce Subscriptions do this by default) |
| Duplicate dunning emails on retried webhooks | Check that the invoice attempt count matches the last dunning email you sent before sending another; use the invoice ID + attempt count as the idempotency key |
| Proration charges customer unexpectedly on upgrade | Show the upcoming invoice preview before applying plan changes (Stripe: use `stripe.invoices.retrieveUpcoming()`); show the proration amount to the customer first |

## Related Skills

- @stripe-integration
- @order-processing-pipeline
- @tax-calculation
- @invoice-generation-automation
