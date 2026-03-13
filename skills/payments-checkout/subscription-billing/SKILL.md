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
platforms: [platform-agnostic]
difficulty: advanced
---

# Subscription Billing

## Overview

Implement recurring subscription billing using Stripe Subscriptions — covering the complete subscription lifecycle: sign-up with trial, plan upgrades and downgrades with prorations, dunning (smart retry on failed payments), pause and resume, and cancellation with optional winback offers. Uses Stripe webhooks to keep subscription state synchronized with your database.

## When to Use This Skill

- When building a subscription box, SaaS, or membership commerce product
- When implementing a "Subscribe & Save" feature on a standard product store
- When the current subscription logic is manual and not scaling with customer count
- When dunning (failed payment recovery) is not automated and churning customers unnecessarily

## Prerequisites & Platform Notes

**Shopify**: Shopify handles checkout natively. Use Shopify Payments (powered by Stripe), checkout extensions, and Shopify Functions for custom discount/payment logic. You cannot modify the core checkout without Checkout Extensions.
**WooCommerce**: WooCommerce supports payment gateways via plugins (WooCommerce Stripe, WooCommerce PayPal). Extend checkout with woocommerce_checkout_process and woocommerce_payment_complete hooks.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store, Stripe or PayPal account, relevant payment plugin/app

## Core Instructions

1. **Create a Stripe subscription at signup**

   ```javascript
   // api/subscriptions/create.js
   export async function createSubscription(req, res) {
     const { planId, paymentMethodId, email, trialDays = 0 } = req.body;

     // 1. Get or create Stripe customer
     let customer = await db.customers.findUnique({ where: { email } });
     let stripeCustomerId = customer?.stripeCustomerId;

     if (!stripeCustomerId) {
       const stripeCustomer = await stripe.customers.create({
         email,
         payment_method: paymentMethodId,
         invoice_settings: { default_payment_method: paymentMethodId },
       });
       stripeCustomerId = stripeCustomer.id;
       if (customer) {
         await db.customers.update({
           where: { email },
           data: { stripeCustomerId },
         });
       }
     } else {
       // Attach the payment method to the existing customer
       await stripe.paymentMethods.attach(paymentMethodId, { customer: stripeCustomerId });
       await stripe.customers.update(stripeCustomerId, {
         invoice_settings: { default_payment_method: paymentMethodId },
       });
     }

     // 2. Create the subscription
     const subscriptionParams = {
       customer: stripeCustomerId,
       items: [{ price: planId }],
       payment_behavior: 'default_incomplete', // Create subscription, then confirm payment
       payment_settings: { save_default_payment_method: 'on_subscription' },
       expand: ['latest_invoice.payment_intent'],
       metadata: { customer_id: customer?.id ?? email },
     };

     if (trialDays > 0) {
       subscriptionParams.trial_period_days = trialDays;
     }

     const subscription = await stripe.subscriptions.create(subscriptionParams);

     // 3. Store subscription record
     await db.subscriptions.upsert({
       where: { stripeSubscriptionId: subscription.id },
       create: {
         customerId: customer?.id,
         stripeSubscriptionId: subscription.id,
         stripeCustomerId,
         planId,
         status: subscription.status,
         currentPeriodStart: new Date(subscription.current_period_start * 1000),
         currentPeriodEnd: new Date(subscription.current_period_end * 1000),
         trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
       },
       update: {},
     });

     // 4. Return client secret for payment confirmation if needed
     const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
     res.json({ subscriptionId: subscription.id, clientSecret, status: subscription.status });
   }
   ```

2. **Handle subscription webhooks to keep state synchronized**

   ```javascript
   // api/webhooks/stripe.js (subscription-relevant events)
   export async function handleSubscriptionWebhooks(event) {
     switch (event.type) {
       case 'customer.subscription.created':
       case 'customer.subscription.updated':
         await syncSubscription(event.data.object);
         break;

       case 'customer.subscription.deleted':
         await db.subscriptions.update({
           where: { stripeSubscriptionId: event.data.object.id },
           data: { status: 'canceled', canceledAt: new Date() },
         });
         await revokeSubscriptionAccess(event.data.object);
         break;

       case 'invoice.payment_succeeded':
         await handleSuccessfulPayment(event.data.object);
         break;

       case 'invoice.payment_failed':
         await handleFailedPayment(event.data.object);
         break;

       case 'customer.subscription.trial_will_end':
         await sendTrialEndingEmail(event.data.object); // 3 days before trial end
         break;
     }
   }

   async function syncSubscription(stripeSubscription) {
     await db.subscriptions.upsert({
       where: { stripeSubscriptionId: stripeSubscription.id },
       create: {
         stripeSubscriptionId: stripeSubscription.id,
         stripeCustomerId: stripeSubscription.customer,
         planId: stripeSubscription.items.data[0]?.price.id,
         status: stripeSubscription.status,
         currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
         currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
       },
       update: {
         status: stripeSubscription.status,
         planId: stripeSubscription.items.data[0]?.price.id,
         currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
         currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
         cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
       },
     });
   }
   ```

3. **Implement plan changes with prorations**

   Stripe handles prorations automatically — upgrading mid-cycle charges the difference for the remainder of the billing period.

   ```javascript
   // api/subscriptions/change-plan.js
   export async function changePlan(req, res) {
     const { subscriptionId, newPlanId, prorationBehavior = 'create_prorations' } = req.body;

     const sub = await db.subscriptions.findUnique({ where: { id: subscriptionId } });
     if (!sub) return res.status(404).json({ error: 'Subscription not found' });

     // Preview the proration before applying (optional — show cost to customer)
     if (req.query.preview === 'true') {
       const upcoming = await stripe.invoices.retrieveUpcoming({
         customer: sub.stripeCustomerId,
         subscription: sub.stripeSubscriptionId,
         subscription_items: [
           { id: sub.stripeItemId, price: newPlanId },
         ],
         subscription_proration_behavior: prorationBehavior,
         subscription_proration_date: Math.floor(Date.now() / 1000),
       });
       return res.json({
         prorationAmount: upcoming.amount_due / 100,
         nextInvoiceAmount: upcoming.lines.data
           .filter(l => !l.proration)
           .reduce((sum, l) => sum + l.amount, 0) / 100,
       });
     }

     // Apply the plan change
     const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
     await stripe.subscriptions.update(sub.stripeSubscriptionId, {
       items: [
         { id: stripeSubscription.items.data[0].id, price: newPlanId },
       ],
       proration_behavior: prorationBehavior,
     });

     res.json({ success: true });
   }
   ```

4. **Implement dunning — smart payment retry logic**

   Configure Stripe's built-in retry schedule and handle the `invoice.payment_failed` webhook for custom logic.

   ```javascript
   // Stripe Dashboard: Configure Smart Retries under Billing > Settings
   // Stripe Smart Retries uses ML to choose retry timing
   // Manual retry schedule: Day 1, Day 3, Day 7, Day 14

   async function handleFailedPayment(invoice) {
     const subscription = await db.subscriptions.findFirst({
       where: { stripeSubscriptionId: invoice.subscription },
       include: { customer: true },
     });

     if (!subscription) return;

     const attemptCount = invoice.attempt_count;

     // Send dunning emails with escalating urgency
     const emailTemplates = {
       1: 'dunning-first-attempt',
       2: 'dunning-second-attempt',
       3: 'dunning-final-warning',
     };

     const template = emailTemplates[attemptCount] ?? 'dunning-final-warning';

     await emailService.send({
       to: subscription.customer.email,
       template,
       data: {
         customerName: subscription.customer.name,
         planName: subscription.planName,
         amount: (invoice.amount_due / 100).toFixed(2),
         updatePaymentUrl: `${process.env.STORE_URL}/account/billing?update=1`,
         invoiceUrl: invoice.hosted_invoice_url,
       },
     });

     // After all retries exhausted, Stripe cancels the subscription
     // → triggers customer.subscription.deleted webhook
   }
   ```

5. **Implement pause, resume, and cancellation**

   ```javascript
   // api/subscriptions/pause.js
   export async function pauseSubscription(req, res) {
     const { subscriptionId, resumeDate } = req.body;
     const sub = await db.subscriptions.findUnique({ where: { id: subscriptionId } });

     await stripe.subscriptions.update(sub.stripeSubscriptionId, {
       pause_collection: {
         behavior: 'void',         // Void invoices while paused
         resumes_at: resumeDate
           ? Math.floor(new Date(resumeDate).getTime() / 1000)
           : undefined,
       },
     });

     await db.subscriptions.update({
       where: { id: subscriptionId },
       data: { status: 'paused', pausedAt: new Date(), scheduledResumeAt: resumeDate ? new Date(resumeDate) : null },
     });

     res.json({ status: 'paused' });
   }

   // api/subscriptions/cancel.js
   export async function cancelSubscription(req, res) {
     const { subscriptionId, immediately = false, reason } = req.body;
     const sub = await db.subscriptions.findUnique({ where: { id: subscriptionId } });

     if (immediately) {
       await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
     } else {
       // Cancel at end of current billing period (customer retains access until then)
       await stripe.subscriptions.update(sub.stripeSubscriptionId, {
         cancel_at_period_end: true,
       });
     }

     await db.subscriptions.update({
       where: { id: subscriptionId },
       data: {
         cancelAtPeriodEnd: !immediately,
         canceledAt: immediately ? new Date() : null,
         cancellationReason: reason,
       },
     });

     // Offer a winback incentive before final cancellation
     if (!immediately) {
       await sendCancellationOfferEmail(sub, reason);
     }

     res.json({ status: immediately ? 'canceled' : 'canceling_at_period_end' });
   }
   ```

## Examples

### Subscription status dashboard query

```sql
SELECT
  s.status,
  COUNT(*) AS count,
  SUM(p.amount / 100.0) AS mrr
FROM subscriptions s
JOIN prices p ON p.stripe_price_id = s.plan_id
WHERE s.status = 'active'
GROUP BY s.status;
```

### Reactivate a canceled subscription

```javascript
// If subscription is canceled_at_period_end but still active, undo cancellation
await stripe.subscriptions.update(stripeSubscriptionId, {
  cancel_at_period_end: false,
});

await db.subscriptions.update({
  where: { stripeSubscriptionId },
  data: { cancelAtPeriodEnd: false, canceledAt: null },
});
```

## Best Practices

- **Never store subscription state only in Stripe** — sync all subscription status changes to your own database via webhooks; do not call Stripe on every page load to check subscription status
- **Use `payment_behavior: 'default_incomplete'`** — this creates the subscription and then confirms the payment separately, giving you a client secret for 3DS authentication
- **Configure Stripe Smart Retries** — Stripe's ML-based retry timing outperforms fixed schedules; enable it in the Billing Dashboard
- **Send dunning emails at each retry** — escalate urgency: "payment failed" → "account at risk" → "access will be suspended"; include a direct link to update payment method
- **Prorate upgrades, not downgrades** — upgrades should be prorated immediately; downgrades typically apply at the end of the current period to avoid complex partial refunds
- **Test the full webhook lifecycle** — use `stripe listen` locally and trigger events with `stripe trigger customer.subscription.updated`

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Subscription shows as active in your DB after it is canceled in Stripe | Sync via webhooks — do not rely on periodic polling; `customer.subscription.deleted` must trigger a database update |
| Proration charges customer unexpectedly on upgrade | Always preview the upcoming invoice before applying plan changes; show the proration amount to the customer first |
| Trial converts to paid without user knowing | Send `trial_will_end` email 3 days before (Stripe fires the webhook); remind users what they will be charged |
| Duplicate dunning emails from retried webhooks | Check `invoice.status !== 'paid'` and `email_sent_for_attempt != invoice.attempt_count` before sending; use the invoice ID as idempotency key |
| Canceled subscription still grants access | Check subscription status in your database (synced via webhook) before granting feature access; do not trust client-submitted subscription status |

## Related Skills

- @stripe-integration
- @order-processing-pipeline
- @digital-products
- @tax-calculation
