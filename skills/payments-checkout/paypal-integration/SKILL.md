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
platforms: [platform-agnostic]
difficulty: intermediate
---

# PayPal Integration

## Overview

Integrate PayPal Checkout using the PayPal JavaScript SDK, which surfaces PayPal, Venmo, Pay Later, and card payment buttons from a single script tag. Covers the Orders API v2 flow (create order server-side, capture client-side), webhook-based fulfillment, and PayPal Commerce Platform (PCP) setup for multi-seller marketplaces.

## When to Use This Skill

- When adding PayPal as a payment option alongside a card processor like Stripe
- When implementing PayPal Express Checkout on the product page or cart (reducing steps to purchase)
- When targeting markets where PayPal is the dominant payment method (Germany, Netherlands, Brazil)
- When building a marketplace that needs to split payments between sellers (PayPal Commerce Platform)

## Prerequisites & Platform Notes

**Shopify**: Shopify handles checkout natively. Use Shopify Payments (powered by Stripe), checkout extensions, and Shopify Functions for custom discount/payment logic. You cannot modify the core checkout without Checkout Extensions.
**WooCommerce**: WooCommerce supports payment gateways via plugins (WooCommerce Stripe, WooCommerce PayPal). Extend checkout with woocommerce_checkout_process and woocommerce_payment_complete hooks.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store, Stripe or PayPal account, relevant payment plugin/app

## Core Instructions

1. **Load the PayPal JavaScript SDK**

   Always load the SDK via the CDN script tag — never install it as an npm package. Configure it with your client ID and the payment methods you want to enable.

   ```html
   <!-- In your checkout page head — load once -->
   <script
     src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD&intent=capture&components=buttons,funding-eligibility"
     data-sdk-integration-source="button-factory"
   >
   </script>
   ```

   Or dynamically for SPAs:

   ```javascript
   // lib/loadPaypalSDK.js
   let sdkPromise = null;

   export function loadPaypalSDK(clientId, currency = 'USD') {
     if (sdkPromise) return sdkPromise;
     sdkPromise = new Promise((resolve, reject) => {
       if (window.paypal) return resolve(window.paypal);
       const script = document.createElement('script');
       script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture`;
       script.onload = () => resolve(window.paypal);
       script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
       document.head.appendChild(script);
     });
     return sdkPromise;
   }
   ```

2. **Create an order server-side (PayPal Orders API v2)**

   ```javascript
   // api/paypal/create-order.js
   import fetch from 'node-fetch';

   async function getPayPalAccessToken() {
     const credentials = Buffer.from(
       `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
     ).toString('base64');

     const res = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
       method: 'POST',
       headers: {
         Authorization: `Basic ${credentials}`,
         'Content-Type': 'application/x-www-form-urlencoded',
       },
       body: 'grant_type=client_credentials',
     });
     const data = await res.json();
     return data.access_token;
   }

   export async function createPayPalOrder(req, res) {
     const { cartId } = req.body;
     const cart = await db.carts.findUnique({
       where: { id: cartId }, include: { items: { include: { variant: true } } },
     });

     const accessToken = await getPayPalAccessToken();

     const orderPayload = {
       intent: 'CAPTURE',
       purchase_units: [
         {
           reference_id: cart.id,
           amount: {
             currency_code: 'USD',
             value: cart.total.toFixed(2),
             breakdown: {
               item_total: { currency_code: 'USD', value: cart.subtotal.toFixed(2) },
               shipping: { currency_code: 'USD', value: cart.shippingCost.toFixed(2) },
               tax_total: { currency_code: 'USD', value: cart.taxAmount.toFixed(2) },
             },
           },
           items: cart.items.map(item => ({
             name: item.variant.name,
             unit_amount: { currency_code: 'USD', value: item.unitPrice.toFixed(2) },
             quantity: String(item.quantity),
             sku: item.variant.sku,
           })),
         },
       ],
     };

     const orderRes = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
       method: 'POST',
       headers: {
         Authorization: `Bearer ${accessToken}`,
         'Content-Type': 'application/json',
         'PayPal-Request-Id': cart.id,  // Idempotency key
       },
       body: JSON.stringify(orderPayload),
     });

     const order = await orderRes.json();
     if (!orderRes.ok) {
       return res.status(400).json({ error: order.message, details: order.details });
     }

     // Store PayPal order ID on the cart for reconciliation
     await db.carts.update({ where: { id: cart.id }, data: { paypalOrderId: order.id } });
     res.json({ id: order.id });
   }
   ```

3. **Render PayPal buttons and capture the order client-side**

   ```jsx
   // PayPalButtons.jsx
   import { useEffect, useRef } from 'react';
   import { loadPaypalSDK } from '../lib/loadPaypalSDK';

   export function PayPalButtons({ cartId, onSuccess, onError }) {
     const containerRef = useRef(null);

     useEffect(() => {
       let buttons;
       loadPaypalSDK(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID).then(paypal => {
         buttons = paypal.Buttons({
           style: {
             layout: 'vertical',
             color: 'gold',
             shape: 'rect',
             label: 'paypal',
           },

           createOrder: async () => {
             const res = await fetch('/api/paypal/create-order', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ cartId }),
             });
             const data = await res.json();
             if (!res.ok) throw new Error(data.error);
             return data.id; // PayPal Order ID
           },

           onApprove: async (data) => {
             // Capture the payment server-side
             const res = await fetch('/api/paypal/capture-order', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ orderId: data.orderID, cartId }),
             });
             const capture = await res.json();
             if (!res.ok) {
               onError(capture.error);
               return;
             }
             onSuccess({ orderId: capture.shopOrderId });
           },

           onError: (err) => {
             console.error('PayPal error:', err);
             onError('PayPal encountered an error. Please try again.');
           },

           onCancel: () => {
             // User closed the PayPal window — do nothing; leave the cart intact
             console.log('PayPal checkout cancelled');
           },
         });

         if (containerRef.current) buttons.render(containerRef.current);
       });

       return () => buttons?.close();
     }, [cartId, onSuccess, onError]);

     return <div ref={containerRef} className="paypal-button-container" />;
   }
   ```

4. **Capture the order and create the shop order server-side**

   ```javascript
   // api/paypal/capture-order.js
   export async function capturePayPalOrder(req, res) {
     const { orderId, cartId } = req.body;
     const accessToken = await getPayPalAccessToken();

     const captureRes = await fetch(
       `https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`,
       {
         method: 'POST',
         headers: {
           Authorization: `Bearer ${accessToken}`,
           'Content-Type': 'application/json',
           'PayPal-Request-Id': `capture-${orderId}`,
         },
       }
     );

     const capture = await captureRes.json();
     if (!captureRes.ok || capture.status !== 'COMPLETED') {
       return res.status(400).json({ error: 'Payment capture failed', details: capture });
     }

     const captureId = capture.purchase_units[0].payments.captures[0].id;

     // Create the shop order
     const order = await createOrderFromCart(cartId, {
       paymentMethod: 'paypal',
       paypalOrderId: orderId,
       paypalCaptureId: captureId,
       paymentStatus: 'paid',
     });

     res.json({ shopOrderId: order.id, captureId });
   }
   ```

5. **Handle PayPal webhooks for payment events**

   ```javascript
   // api/webhooks/paypal.js
   export async function handlePayPalWebhook(req, res) {
     // Verify webhook signature
     const isValid = await verifyPayPalWebhookSignature(req);
     if (!isValid) return res.status(401).send('Invalid signature');

     const { event_type, resource } = req.body;

     switch (event_type) {
       case 'PAYMENT.CAPTURE.COMPLETED':
         await handleCaptureCompleted(resource);
         break;
       case 'PAYMENT.CAPTURE.REFUNDED':
         await handleRefund(resource);
         break;
       case 'PAYMENT.CAPTURE.REVERSED':
         await handleChargeback(resource);
         break;
     }

     res.status(200).json({ received: true });
   }

   async function verifyPayPalWebhookSignature(req) {
     const accessToken = await getPayPalAccessToken();
     const verifyRes = await fetch(
       'https://api-m.paypal.com/v1/notifications/verify-webhook-signature',
       {
         method: 'POST',
         headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({
           webhook_id: process.env.PAYPAL_WEBHOOK_ID,
           transmission_id: req.headers['paypal-transmission-id'],
           transmission_time: req.headers['paypal-transmission-time'],
           cert_url: req.headers['paypal-cert-url'],
           auth_algo: req.headers['paypal-auth-algo'],
           transmission_sig: req.headers['paypal-transmission-sig'],
           webhook_event: req.body,
         }),
       }
     );
     const result = await verifyRes.json();
     return result.verification_status === 'SUCCESS';
   }
   ```

## Examples

### Pay Later button with eligibility check

```javascript
// Only render Pay Later button if the order amount qualifies (typically $30-$10,000)
paypal.Buttons({
  fundingSource: paypal.FUNDING.PAYLATER,
  createOrder: async () => { /* same as above */ },
  onApprove: async (data) => { /* same as above */ },
}).render('#paypal-paylater-container');

// Check eligibility before rendering
if (paypal.isFundingEligible(paypal.FUNDING.PAYLATER)) {
  // Amount is within Pay Later range — render the button
}
```

### Sandbox testing credentials

```bash
# Set environment variables for sandbox testing
PAYPAL_CLIENT_ID=AYx...sandbox-client-id...
PAYPAL_CLIENT_SECRET=EH...sandbox-secret...
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com

# Use the PayPal developer sandbox accounts at developer.paypal.com
# Buyer sandbox account to test purchases
# Seller sandbox account to receive payments
```

## Best Practices

- **Always capture server-side** — do not trust the `onApprove` callback alone; capture using the Orders API from your server where you can verify the amount
- **Use `PayPal-Request-Id` header** — this idempotency key ensures that retrying a failed create or capture request does not result in double charges
- **Support both `sandbox` and `production` environments** — use `api-m.sandbox.paypal.com` for testing; toggle via environment variable
- **Verify webhook signatures** — PayPal can call your webhook endpoint with forged payloads; always verify the `paypal-transmission-sig`
- **Handle the `onCancel` callback gracefully** — when users close the PayPal popup, do not show an error; just let them try again
- **Show the PayPal button only when applicable** — in international markets, PayPal may not be a dominant payment method; use analytics to decide which markets to surface it in

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| "This seller doesn't accept payments" error | Ensure your PayPal account has completed seller onboarding; check for email verification and sandbox vs. production mismatch |
| Order amount mismatch between create and capture | Always recalculate the total server-side at capture time and compare to the approved amount; reject if they differ by more than a rounding tolerance |
| PayPal popup blocked on some browsers | The `createOrder` function must return synchronously or be triggered by a direct user action; async delays can trigger popup blockers |
| Webhook fires before capture completes | Use the `PAYMENT.CAPTURE.COMPLETED` event, not `CHECKOUT.ORDER.APPROVED`; the latter fires before funds are captured |
| Duplicate order created on webhook retry | Implement idempotency using the PayPal `capture_id` — check if an order with that capture ID already exists before creating a new one |

## Related Skills

- @stripe-integration
- @checkout-flow-optimization
- @order-processing-pipeline
- @buy-now-pay-later
