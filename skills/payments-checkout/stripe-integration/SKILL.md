---
name: stripe-integration
description: "Build secure payment flows with Stripe — Payment Intents, subscription billing, webhook handling, and European SCA compliance for card payments"
category: payments-checkout
risk: critical
source: curated
date_added: "2026-03-12"
tags: [stripe, payments, checkout, webhooks, sca, pci, subscriptions]
triggers: ["integrate stripe", "add stripe payments", "stripe checkout", "payment processing"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Stripe Integration

## Overview

Stripe is the most widely supported payment processor across ecommerce platforms. On Shopify, it powers Shopify Payments natively. On WooCommerce and BigCommerce, official plugins provide full Stripe Checkout with minimal configuration. Custom code is only required for headless storefronts — and even then, Stripe's hosted Checkout page and Elements components remove most of the complexity.

## When to Use This Skill

- When adding Stripe as a payment processor to an existing store
- When setting up Stripe on a new WooCommerce or BigCommerce store
- When implementing SCA-compliant checkout for European customers
- When setting up webhook handlers for order fulfillment automation
- When building a custom or headless storefront that needs Stripe payment processing

## Core Instructions

### Step 1: Create and configure your Stripe account

1. Sign up at **stripe.com** — business verification takes 1–3 business days
2. Complete **Stripe Dashboard → Activate account** to start accepting live payments
3. Configure your **Statement descriptor** (how you appear on customers' bank statements) under **Settings → Public details**
4. Set up **Stripe Tax** under **Dashboard → Tax** if you want Stripe to handle tax calculation automatically

### Step 2: Install Stripe on your platform

---

#### Shopify

Shopify Payments is powered by Stripe. It is the simplest possible Stripe integration:

1. Go to **Settings → Payments → Shopify Payments → Complete account setup**
2. Verify your business details and banking information
3. Shopify Payments automatically handles: card processing, Apple Pay, Google Pay, Shop Pay, and (with configuration) Klarna and Afterpay
4. **No additional plugins or API keys are needed** — Shopify Payments handles everything

If you need to use Stripe directly (e.g., for features Shopify Payments does not support):
1. Install the **Stripe** payment provider under **Settings → Payments → Add payment methods → Stripe**
2. Note: third-party payment providers on Shopify incur an additional transaction fee (0.5%–2%); Shopify Payments does not

**Configure Stripe webhooks for Shopify:**
Shopify handles webhook processing internally for Shopify Payments. If using Stripe directly, register your webhook endpoint under **Stripe Dashboard → Developers → Webhooks**.

#### WooCommerce

1. Install the **WooCommerce Stripe Payment Gateway** plugin (free, from WordPress.org — by WooCommerce)
2. Go to **WooCommerce → Settings → Payments → Stripe** and click **Enable**
3. Enter your **Publishable key** and **Secret key** from **Stripe Dashboard → Developers → API Keys**
4. Enable **Payment Request Buttons** (Apple Pay, Google Pay) — these appear automatically on product pages and checkout

**Enable additional payment methods:**
- Go to **WooCommerce → Settings → Payments → Stripe** and enable:
  - **Express Checkout** (Apple Pay, Google Pay, Link)
  - **SEPA Direct Debit** (for European customers)
  - **iDEAL** (Netherlands), **Bancontact** (Belgium), **Sofort** (Germany/Austria)
  - **Klarna** and **Afterpay** (if eligible)

**Set up webhooks:**
1. In the Stripe plugin settings, click **Configure webhooks**
2. The plugin automatically registers the required webhook endpoint with Stripe
3. Verify the webhook is active in **Stripe Dashboard → Developers → Webhooks**

**Enable Stripe Radar (fraud prevention):**
Stripe Radar is enabled by default. Configure rules under **Stripe Dashboard → Radar → Rules** to block or review high-risk transactions.

#### BigCommerce

1. Go to **Settings → Payment Methods → Online Payment Methods**
2. Find **Stripe** and click **Set Up**
3. Enter your Stripe API keys (Publishable and Secret) from the Stripe Dashboard
4. Enable the payment methods you want to offer under the Stripe configuration panel
5. BigCommerce automatically registers the required Stripe webhooks

**Enable Stripe Link (saved cards):**
In the BigCommerce Stripe settings, enable **Stripe Link** to allow returning customers to pay with one click using their saved payment details.

---

#### Custom / Headless

**Install the Stripe SDK:**

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

**Option A: Stripe Checkout (hosted page — simplest)**

For the fastest integration with no payment form to build:

```javascript
// Server: create a Checkout Session
const session = await stripe.checkout.sessions.create({
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: { name: 'Order #' + orderNumber },
      unit_amount: Math.round(orderTotal * 100), // cents
    },
    quantity: 1,
  }],
  mode: 'payment',
  success_url: `${YOUR_DOMAIN}/orders/{CHECKOUT_SESSION_ID}/confirmation`,
  cancel_url: `${YOUR_DOMAIN}/cart`,
  metadata: { order_id: orderId },
});

// Redirect customer to session.url
res.redirect(session.url);
```

**Option B: Payment Intents with Stripe Elements (custom checkout form)**

```javascript
// Server: create a Payment Intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(orderTotal * 100), // cents
  currency: 'usd',
  automatic_payment_methods: { enabled: true }, // Enables all eligible methods
  metadata: { order_id: orderId, customer_email: customerEmail },
});
res.json({ clientSecret: paymentIntent.client_secret });
```

```jsx
// Client: render the payment form using Stripe Elements
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();

  async function handleSubmit(e) {
    e.preventDefault();
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/orders/confirmation` },
    });
    if (error) showError(error.message);
    // On success, Stripe redirects to return_url automatically
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>Pay Now</button>
    </form>
  );
}

export function PaymentPage({ clientSecret }) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm />
    </Elements>
  );
}
```

**Handle webhooks for order fulfillment:**

```javascript
// POST /api/webhooks/stripe
// IMPORTANT: use raw body parser — do not parse as JSON
export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,   // raw buffer — not JSON.parse'd
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
      await handlePaymentFailed(event.data.object);
      break;
    case 'charge.refunded':
      await handleRefund(event.data.object);
      break;
    case 'charge.dispute.created':
      await handleDispute(event.data.object);
      break;
  }

  res.json({ received: true });
}

// Always check if already fulfilled — webhooks can arrive multiple times
async function fulfillOrder(paymentIntent) {
  const orderId = paymentIntent.metadata.order_id;
  const order = await db.orders.findUnique({ where: { id: orderId } });
  if (order.status !== 'pending') return; // Idempotency check

  await db.orders.update({ where: { id: orderId }, data: { status: 'confirmed', paidAt: new Date() } });
  await sendOrderConfirmationEmail(orderId);
}
```

**Local webhook testing:**

```bash
# Install Stripe CLI and forward events to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook signing secret printed by the CLI into your .env
```

### Step 3: PCI compliance and SCA

**PCI DSS scope:**
Using Stripe Elements or Stripe Checkout significantly reduces your PCI DSS compliance burden:
- **SAQ A** (22 requirements): applicable when using Stripe Checkout (hosted page) — card data never touches your servers or your page
- **SAQ A-EP** (191 requirements): applicable when your checkout page is served from your own domain and Stripe.js tokenizes cards in the browser

The WooCommerce Stripe plugin and BigCommerce's Stripe integration both use Stripe.js for tokenization, qualifying most merchants for SAQ A-EP.

**SCA (Strong Customer Authentication) for European customers:**
Using `automatic_payment_methods: { enabled: true }` on Payment Intents automatically handles 3D Secure challenges when required by the customer's bank. No additional configuration needed.

## Best Practices

- **Always use Payment Intents** — the legacy Charges API does not support SCA and is not recommended for new integrations
- **Never log or store raw card numbers** — use Stripe Elements or Checkout to stay out of PCI scope
- **Use webhook events for fulfillment** — do not rely on the client-side redirect alone; customers can close the browser window
- **Make all webhook handlers idempotent** — Stripe may deliver the same event multiple times; always check the current order status before processing
- **Attach `order_id` to every Payment Intent metadata** — this enables reconciliation and dispute management
- **Use Stripe Tax** if selling to multiple jurisdictions — configure under Stripe Dashboard → Tax rather than building tax calculation yourself

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Webhook signature verification fails | Pass the **raw request body** (not JSON-parsed) to `constructEvent`; configure your framework to skip JSON parsing for the webhook route |
| 3DS challenges not triggering | Use `automatic_payment_methods: { enabled: true }` instead of manually listing payment method types |
| WooCommerce Stripe plugin shows blank payment form | Check for JavaScript console errors; often caused by a CSP (Content Security Policy) blocking Stripe.js; add `js.stripe.com` to your CSP allowlist |
| Stripe payment shows as succeeded but order not confirmed | Webhooks are the authoritative signal — if the webhook handler has an error, the order will not be confirmed; check your webhook logs in Stripe Dashboard → Developers → Webhooks → [Event] |
| Test mode charges appearing in live data | Verify you are using live API keys in production; Stripe's Dashboard has a separate live/test toggle — confirm you are in the correct mode |
| Currency amount wrong | Stripe uses the smallest currency unit — $20.00 = `2000` cents; JPY ¥3,000 = `3000` (no multiplication needed) |

## Related Skills

- @checkout-flow-optimization
- @subscription-billing
- @paypal-integration
- @order-processing-pipeline
- @buy-now-pay-later
