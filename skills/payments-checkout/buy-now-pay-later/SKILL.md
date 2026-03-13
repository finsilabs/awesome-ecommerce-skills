---
name: buy-now-pay-later
description: "Offer Klarna, Afterpay, or Affirm installment payments at checkout to reduce purchase hesitation and increase average order value"
category: payments-checkout
risk: critical
source: curated
date_added: "2026-03-12"
tags: [bnpl, klarna, afterpay, affirm, buy-now-pay-later, installments, financing]
triggers: ["buy now pay later", "BNPL", "Klarna integration", "Afterpay integration", "Affirm integration", "pay in installments", "split payment"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Buy Now, Pay Later (BNPL)

## Overview

Buy Now, Pay Later lets shoppers split purchases into 4 interest-free installments or longer financing plans. Offering BNPL at checkout typically increases average order value (AOV) by 15–40% and reduces checkout abandonment for high-ticket items. The three major providers — Klarna, Afterpay (Clearpay in UK), and Affirm — each have native integrations for Shopify, WooCommerce, and BigCommerce that require no custom code to install.

## When to Use This Skill

- When AOV is in the $100–$3,000 range where installments meaningfully help conversion
- When analytics show customers abandoning checkout at the payment step due to price
- When competitors offer BNPL and it is becoming a category expectation (fashion, electronics, furniture)
- When adding BNPL to an existing Stripe integration (Klarna and Afterpay are available as Stripe payment methods)

## Core Instructions

### Step 1: Determine your platform and choose the right BNPL approach

| Platform | Recommended Approach | Notes |
|----------|---------------------|-------|
| **Shopify** | Enable via Shopify Payments (Klarna, Afterpay built in) or install provider's app | Shopify Payments includes Klarna and Afterpay with zero additional integration; just enable them |
| **WooCommerce** | Install the provider's official WooCommerce plugin | Klarna, Afterpay, and Affirm all have official WooCommerce plugins |
| **BigCommerce** | Install from BigCommerce App Marketplace | All three providers have native BigCommerce apps |
| **Custom / Headless** | Enable via Stripe (Klarna, Afterpay) or provider SDK | If using Stripe, enable as payment methods on the Payment Intent; no separate SDK needed |

**Provider comparison:**

| Provider | Markets | Model | Merchant Fee | Order Range |
|----------|---------|-------|--------------|-------------|
| Klarna | US, EU, UK | Pay in 4 / Financing | ~2.49% + $0.30 | $10–$10,000 |
| Afterpay | US, AU, UK, CA | Pay in 4 (6 weeks) | 4–6% | $35–$2,000 |
| Affirm | US, CA | Monthly installments | 5.99%–29.99% APR on consumer | $50–$17,500 |

Recommendation: Start with Klarna or Afterpay — they have the broadest platform support and lowest friction to enable. Add Affirm for high-ticket items ($1,000+) where monthly financing matters more than 4-installment splits.

### Step 2: Enable BNPL on your platform

---

#### Shopify

**Option A: Via Shopify Payments (recommended)**

1. Go to **Settings → Payments → Shopify Payments → Manage**
2. Under **Wallets and payment methods**, find **Klarna** and **Afterpay** and toggle them on
3. Click **Save** — BNPL options will now appear automatically at checkout for eligible orders
4. To add BNPL messaging to product pages, install the **Klarna On-Site Messaging** app or **Afterpay On-Site Messaging** app from the Shopify App Store

**Option B: Install the provider's Shopify app directly**

- Klarna: Install **Klarna Payments** from the Shopify App Store
- Afterpay: Install **Afterpay** from the Shopify App Store
- Affirm: Install **Affirm** from the Shopify App Store

Each app guides you through account creation and automatically adds the payment method to your checkout.

**Adding installment messaging to product pages (Shopify):**

After installing the Klarna or Afterpay app, go to **Online Store → Themes → Customize** and add the BNPL messaging block to your product page template. This displays "4 interest-free payments of $X" beneath the price.

---

#### WooCommerce

**Klarna:**
1. Install the **Klarna Payments for WooCommerce** plugin from WordPress.org or the WooCommerce Marketplace
2. Go to **WooCommerce → Settings → Payments → Klarna Payments** and enter your Klarna API credentials
3. Enable the payment method and configure which Klarna products to offer (Pay Now, Pay Later, Slice It)
4. For product page messaging, install the **Klarna On-Site Messaging for WooCommerce** plugin and add your Client ID

**Afterpay:**
1. Install the **Afterpay Gateway for WooCommerce** plugin
2. Go to **WooCommerce → Settings → Payments → Afterpay** and enter your Merchant ID and Secret Key (from your Afterpay merchant portal)
3. Configure the minimum and maximum order amounts to match Afterpay's eligibility range ($35–$2,000)
4. Enable the on-site messaging widget to show installment amounts on product pages

**Affirm:**
1. Install the **Affirm Gateway for WooCommerce** plugin
2. Go to **WooCommerce → Settings → Payments → Affirm** and enter your Public API Key and Private API Key (from your Affirm merchant portal)
3. Set the minimum order threshold (Affirm recommends showing only for orders $50+)

---

#### BigCommerce

1. Go to **Apps → Marketplace** and search for Klarna, Afterpay, or Affirm
2. Install the provider's app and follow the in-app setup wizard — you will need your merchant account credentials from the provider's portal
3. The app automatically adds the BNPL payment method to your checkout and can add product page messaging
4. Configure eligibility amounts in the app settings to match the provider's supported range

---

#### Custom / Headless

**Via Stripe (recommended — enables Klarna and Afterpay with no separate SDK):**

```javascript
// Server: include BNPL methods on the payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: orderTotalInCents,
  currency: 'usd',
  payment_method_types: ['card', 'klarna', 'afterpay_clearpay'],
  metadata: { order_id: orderId },
});
```

On the client, use Stripe's `PaymentElement` — it automatically shows Klarna and Afterpay tabs for eligible order amounts with no additional configuration:

```jsx
import { PaymentElement } from '@stripe/react-stripe-js';

function CheckoutForm() {
  return (
    <form>
      <PaymentElement options={{ layout: 'tabs' }} />
      {/* Tabs render: Card | Klarna | Afterpay based on eligibility */}
    </form>
  );
}
```

**Adding installment messaging to product pages (headless):**

Klarna provides a web component for price messaging. Load the Klarna script and add the component:

```html
<!-- Load Klarna's on-site messaging library -->
<script async src="https://js.klarna.com/web-sdk/v1/klarna.js"
  data-client-id="YOUR_KLARNA_CLIENT_ID">
</script>

<!-- Display "4 payments of $X" on the product page -->
<klarna-placement
  data-key="credit-promotion-auto-size"
  data-locale="en-US"
  data-purchase-amount="9999">
  <!-- Amount in cents: 9999 = $99.99 -->
</klarna-placement>
```

Afterpay provides a similar web component:

```html
<afterpay-placement
  data-locale="en_US"
  data-currency="USD"
  data-amount="99.99"
  data-size="sm">
</afterpay-placement>
```

### Step 3: Verify eligibility rules are enforced

Each provider has minimum and maximum order amounts. The platform apps and Stripe's PaymentElement handle this automatically — they only show the BNPL option when the order total is within the eligible range. Verify this is working correctly by testing with an order below the minimum (BNPL should not appear) and within range (BNPL should appear).

## Best Practices

- **Enable via Shopify Payments if you are on Shopify** — zero extra integration; just toggle on in payment settings
- **Show installment messaging on product pages and cart** — BNPL messaging before checkout increases AOV even for customers who end up paying in full
- **Only show BNPL within eligible amount ranges** — displaying BNPL for a $10 order misleads customers; the platform apps handle this automatically
- **Monitor fee impact on margin** — Afterpay charges 4–6%, which is 2–3x higher than a standard card fee; ensure your margins support the provider's rate before enabling
- **Display clear terms** — "4 interest-free payments" must be accurate; each provider has compliance requirements for how you can describe their product

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| BNPL option not appearing at checkout | Check that the order amount is within the provider's eligible range; verify the API credentials in the plugin/app settings are for the correct environment (live vs. sandbox) |
| BNPL appearing for ineligible order amounts | Set minimum/maximum amount thresholds in the plugin settings; Stripe's PaymentElement enforces this automatically |
| Product page messaging not updating when variant price changes | Klarna and Afterpay web components read the `data-purchase-amount` attribute; update this attribute in JavaScript when the price changes |
| Customers confused about BNPL terms | Link to the provider's "How it works" page in the messaging widget; each provider has compliant messaging templates you must follow |
| Higher dispute rate with BNPL orders | BNPL disputes go through the provider (Klarna, Afterpay), not your payment processor; ensure your fulfillment process creates clear tracking and delivery confirmation |

## Related Skills

- @stripe-integration
- @checkout-flow-optimization
- @paypal-integration
- @cart-logic
