---
name: stripe-integration
description: "Stripe payment intents, subscriptions, webhooks, and SCA compliance"
category: payments-checkout
risk: critical
source: curated
date_added: "2026-03-12"
tags: [stripe, payments, checkout, webhooks, sca, pci, subscriptions]
triggers: ["integrate stripe", "add stripe payments", "stripe checkout", "payment processing"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Stripe Integration

## Overview

Implement Stripe payment processing with Payment Intents API for one-time payments, Stripe Checkout for hosted flows, and webhooks for reliable server-side event handling. Covers SCA (Strong Customer Authentication) compliance for European transactions and PCI-DSS scope reduction through client-side tokenization.

## When to Use This Skill

- When adding payment processing to a new e-commerce application
- When migrating from legacy Stripe Charges API to Payment Intents
- When implementing SCA-compliant checkout for European customers
- When setting up webhook handlers for order fulfillment automation
- When adding subscription billing to an existing store

## Core Instructions

1. **Install Stripe SDK and configure keys**

   Server-side (Node.js):
   ```bash
   npm install stripe
   ```

   ```javascript
   import Stripe from 'stripe';
   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
   ```

   Client-side — use Stripe.js (always load from Stripe's CDN, never bundle):
   ```html
   <script src="https://js.stripe.com/v3/"></script>
   ```

   ```javascript
   const stripe = Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
   ```

2. **Create a Payment Intent on the server**

   ```javascript
   // POST /api/create-payment-intent
   export async function createPaymentIntent(req, res) {
     const { amount, currency, metadata } = req.body;

     const paymentIntent = await stripe.paymentIntents.create({
       amount,              // Amount in smallest currency unit (cents)
       currency,            // 'usd', 'eur', 'gbp', etc.
       automatic_payment_methods: { enabled: true },
       metadata: {
         order_id: metadata.orderId,
         customer_email: metadata.email,
       },
     });

     res.json({ clientSecret: paymentIntent.client_secret });
   }
   ```

3. **Confirm payment on the client**

   ```javascript
   const { error } = await stripe.confirmPayment({
     elements,
     confirmParams: {
       return_url: `${window.location.origin}/order/confirmation`,
     },
   });

   if (error) {
     // Show error to customer (e.g., insufficient funds, card declined)
     showError(error.message);
   }
   // If no error, customer is redirected to return_url
   ```

4. **Handle webhooks for fulfillment**

   ```javascript
   // POST /api/webhooks/stripe
   export async function handleStripeWebhook(req, res) {
     const sig = req.headers['stripe-signature'];
     let event;

     try {
       event = stripe.webhooks.constructEvent(
         req.body,    // Raw body — do NOT parse as JSON
         sig,
         process.env.STRIPE_WEBHOOK_SECRET
       );
     } catch (err) {
       return res.status(400).send(`Webhook Error: ${err.message}`);
     }

     switch (event.type) {
       case 'payment_intent.succeeded':
         await fulfillOrder(event.data.object);
         break;
       case 'payment_intent.payment_failed':
         await notifyPaymentFailed(event.data.object);
         break;
       case 'charge.refunded':
         await processRefund(event.data.object);
         break;
     }

     res.json({ received: true });
   }
   ```

5. **Make webhook handlers idempotent**

   ```javascript
   async function fulfillOrder(paymentIntent) {
     const orderId = paymentIntent.metadata.order_id;

     // Check if already fulfilled — webhooks can be delivered multiple times
     const order = await db.orders.findById(orderId);
     if (order.status === 'fulfilled') return;

     await db.orders.update(orderId, { status: 'fulfilled', paidAt: new Date() });
     await sendOrderConfirmationEmail(order);
   }
   ```

6. **Set up Stripe CLI for local webhook testing**

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   # Copy the webhook signing secret from the output
   ```

## Examples

### Stripe Checkout (hosted payment page)

For the simplest integration — Stripe hosts the entire checkout UI:

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [
    {
      price_data: {
        currency: 'usd',
        product_data: { name: 'T-Shirt', description: 'Comfortable cotton tee' },
        unit_amount: 2000,
      },
      quantity: 1,
    },
  ],
  mode: 'payment',
  success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${YOUR_DOMAIN}/canceled`,
  metadata: { order_id: orderId },
});

// Redirect customer to session.url
```

### Subscription with trial

```javascript
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: 'price_monthly_pro' }],
  trial_period_days: 14,
  payment_behavior: 'default_incomplete',
  expand: ['latest_invoice.payment_intent'],
});
```

## Best Practices

- **Always use Payment Intents** — the Charges API is legacy and doesn't support SCA
- **Never log or store raw card numbers** — use Stripe Elements or Checkout to stay out of PCI scope
- **Use webhook events for fulfillment** — don't rely on the client-side redirect alone (customers can close the browser)
- **Make all webhook handlers idempotent** — Stripe may deliver the same event multiple times
- **Use metadata** — attach your `order_id` to every Payment Intent for easy reconciliation
- **Test with Stripe's test cards** — use `4242424242424242` for success, `4000000000003220` for 3DS challenge
- **Set up Stripe Tax** if selling to multiple jurisdictions — avoid building tax logic yourself

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Webhook signature verification fails | Ensure you pass the **raw request body** (not parsed JSON) to `constructEvent` |
| Double-charging customers | Always check for existing Payment Intents before creating new ones for the same order |
| 3DS challenges not working | Use `automatic_payment_methods` instead of manually specifying payment method types |
| Webhooks not received locally | Use `stripe listen --forward-to` for local development |
| Currency amount wrong | Stripe uses smallest currency unit — $20.00 = `2000` cents |
| Refund fails with "charge already refunded" | Make refund handlers idempotent — check refund status before attempting |

## Related Skills

- @checkout-flow-optimization
- @subscription-billing
- @pci-dss-compliance
- @webhook-architecture
- @order-processing-pipeline
