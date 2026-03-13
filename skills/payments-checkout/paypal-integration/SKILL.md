---
name: paypal-integration
description: "Add PayPal, Venmo, and Pay Later buttons to your store using the PayPal Commerce Platform SDK with Express Checkout for one-tap buying"
category: payments-checkout
risk: critical
source: curated
date_added: "2026-03-12"
tags: [paypal, checkout, express, payments, pcp, venmo, pay-later, sdk]
triggers: ["integrate paypal", "add paypal checkout", "paypal express", "paypal buttons", "paypal commerce", "venmo checkout"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# PayPal Integration

## Overview

PayPal Checkout lets shoppers pay using their PayPal balance, Venmo, Pay Later (installments), or a card processed by PayPal. It is particularly valuable in Germany, Netherlands, and Brazil where PayPal is the dominant payment method, and in any market where customers prefer not to enter card details. All major platforms have official PayPal integrations that require only credentials — no custom code needed for standard checkout.

## When to Use This Skill

- When adding PayPal as a payment option alongside a card processor
- When implementing PayPal Express Checkout on the product page or cart (reduces steps to purchase)
- When targeting markets where PayPal is the dominant payment method (Germany, Netherlands, Brazil)
- When adding Venmo or Pay Later (installments) to appeal to younger shoppers

## Core Instructions

### Step 1: Create and configure your PayPal Business account

1. Sign up for a **PayPal Business account** at paypal.com/business if you do not already have one
2. Verify your business identity (required before you can receive payments)
3. For development and testing: sign up at **developer.paypal.com** and create sandbox buyer/seller accounts
4. Create an app at **developer.paypal.com → My Apps → Create App** to get your Client ID and Secret

### Step 2: Install PayPal on your platform

---

#### Shopify

PayPal Express Checkout is built into Shopify and is enabled by default on most stores.

**To verify or reconfigure:**
1. Go to **Settings → Payments**
2. Under **Payment providers**, click **PayPal** or **Activate PayPal**
3. If not already connected, click **Activate** and log in with your PayPal Business account to link it
4. Choose between:
   - **PayPal Express Checkout**: the classic checkout flow (recommended)
   - **PayPal Complete Payments**: a newer integration that also supports Venmo and Pay Later

**Enable Venmo and Pay Later:**
1. In your PayPal Business dashboard, go to **Account Settings → Payment Preferences**
2. Enable **Venmo** and **Pay Later** — these appear automatically in the Shopify checkout once activated on your PayPal account
3. To show a Pay Later banner on product pages: install the **PayPal Pay Later Messaging** app from the Shopify App Store

#### WooCommerce

1. Install the **WooCommerce PayPal Payments** plugin (the official plugin maintained by WooCommerce/PayPal — available free from WordPress.org)
2. Go to **WooCommerce → Settings → Payments → PayPal Payments → Set Up**
3. Click **Connect to PayPal** and log in with your PayPal Business account (OAuth setup — no need to copy/paste API keys)
4. The plugin automatically enables: PayPal Standard, Venmo, Pay Later, card fields, and the PayPal Credit option
5. Configure button placement under **WooCommerce → Settings → Payments → PayPal Payments → Smart Payment Buttons**:
   - Enable buttons on: product pages, cart page, checkout page
   - Configure button color (gold, blue, silver, white, black)
6. To show Pay Later messaging on product pages: go to **Pay Later Messaging** section in the plugin settings and enable it

**PayPal Checkout (alternative, older integration):**
The older **WooCommerce PayPal Checkout** plugin still works but the newer **WooCommerce PayPal Payments** plugin is recommended for all new setups.

#### BigCommerce

1. Go to **Settings → Payment Methods → Online Payment Methods**
2. Find **PayPal Powered by Braintree** and click **Set Up**
3. Click **Connect with PayPal** and authorize with your PayPal Business account
4. Enable the payment methods you want: PayPal, Venmo, Pay Later
5. Configure which pages show the PayPal buttons in the configuration panel

Alternatively, BigCommerce supports **PayPal Commerce Platform** — go to **Settings → Payment Methods** and choose **PayPal Commerce Platform** for access to the full suite of PayPal payment options.

---

#### Custom / Headless

For headless storefronts, use the PayPal JavaScript SDK with the Orders API v2:

**Load the PayPal JavaScript SDK:**

```html
<!-- Always load from the CDN — never install as an npm package -->
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD&intent=capture&components=buttons"></script>
```

**Create a PayPal order server-side:**

```javascript
// POST /api/paypal/create-order
async function createPayPalOrder(req, res) {
  const { cartId } = req.body;
  const cart = await db.carts.findUnique({ where: { id: cartId } });
  const accessToken = await getPayPalAccessToken();

  const orderRes = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': cartId, // Idempotency key
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: cartId,
        amount: {
          currency_code: 'USD',
          value: cart.total.toFixed(2),
        },
      }],
    }),
  });

  const order = await orderRes.json();
  res.json({ id: order.id });
}
```

**Render PayPal buttons and capture payment:**

```jsx
useEffect(() => {
  if (!window.paypal) return;

  window.paypal.Buttons({
    style: { layout: 'vertical', color: 'gold', shape: 'rect' },

    createOrder: async () => {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId }),
      });
      const data = await res.json();
      return data.id; // PayPal Order ID
    },

    onApprove: async (data) => {
      // Always capture server-side — never trust client-side only
      const res = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderID, cartId }),
      });
      const result = await res.json();
      if (result.success) router.push(`/orders/${result.shopOrderId}/confirmation`);
    },

    onCancel: () => {
      // User closed PayPal popup — leave cart intact, show no error
    },

    onError: (err) => {
      console.error('PayPal error:', err);
      setError('PayPal encountered an error. Please try again or use a card.');
    },
  }).render('#paypal-button-container');
}, [cartId]);
```

**Capture the payment server-side:**

```javascript
// POST /api/paypal/capture-order
async function capturePayPalOrder(req, res) {
  const { orderId, cartId } = req.body;
  const accessToken = await getPayPalAccessToken();

  const captureRes = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `capture-${orderId}`, // Idempotency key
    },
  });

  const capture = await captureRes.json();
  if (capture.status !== 'COMPLETED') {
    return res.status(400).json({ error: 'Payment capture failed' });
  }

  // Create your internal order record
  const order = await createOrderFromCart(cartId, {
    paymentMethod: 'paypal',
    paypalOrderId: orderId,
    paypalCaptureId: capture.purchase_units[0].payments.captures[0].id,
  });

  res.json({ success: true, shopOrderId: order.id });
}
```

**Handle PayPal webhooks:**

Register webhooks in your PayPal developer dashboard for: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.REFUNDED`, `PAYMENT.CAPTURE.REVERSED`. Verify webhook signatures using PayPal's signature verification API before processing.

### Step 3: Test with PayPal sandbox

1. Go to **developer.paypal.com → Sandbox → Accounts** and use the pre-created sandbox buyer and seller accounts
2. Set environment variables to use sandbox:
   ```
   PAYPAL_CLIENT_ID=<sandbox-client-id>
   PAYPAL_CLIENT_SECRET=<sandbox-client-secret>
   PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
   ```
3. Test a full purchase flow using the sandbox buyer account credentials
4. Verify the webhook fires and your handler processes it correctly

## Best Practices

- **Always capture server-side** — do not trust the `onApprove` client callback alone; always capture using the Orders API from your server
- **Use `PayPal-Request-Id` header** — this idempotency key prevents double charges if a request is retried
- **Enable Pay Later messaging on product pages** — showing "4 interest-free payments of $X" before checkout increases AOV; the WooCommerce plugin has this built in
- **Handle `onCancel` gracefully** — when users close the PayPal popup, do not show an error; just let them try again or choose another payment method
- **Verify webhook signatures** — PayPal can call your webhook endpoint with forged payloads; always verify the `paypal-transmission-sig` header

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| "This seller doesn't accept payments" error | Ensure your PayPal account has completed seller onboarding (email verification, bank account linked); also verify sandbox vs. production credentials match |
| PayPal popup blocked on some browsers | The `createOrder` callback must return a value immediately from a user click event; any async delay can trigger popup blockers — move server calls before the button renders or use PayPal's built-in API |
| Order confirmed by webhook before capture completes | Use the `PAYMENT.CAPTURE.COMPLETED` webhook (not `CHECKOUT.ORDER.APPROVED`); the latter fires before funds are captured |
| Duplicate order on webhook retry | Check for an existing order with the PayPal capture ID before creating a new one |
| WooCommerce PayPal plugin not showing Venmo/Pay Later | Venmo and Pay Later must be enabled in your PayPal Business account settings (not just the plugin) — check **Account Settings → Payment Preferences** in PayPal |
| Shopify PayPal not processing after reconnection | Disconnect and reconnect your PayPal account in **Shopify → Settings → Payments**; old OAuth tokens sometimes expire |

## Related Skills

- @stripe-integration
- @checkout-flow-optimization
- @order-processing-pipeline
- @buy-now-pay-later
