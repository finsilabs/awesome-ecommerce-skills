---
name: buy-now-pay-later
description: "Integrate BNPL providers (Klarna, Afterpay, Affirm) with eligibility checks"
category: payments-checkout
risk: critical
source: curated
date_added: "2026-03-12"
tags: [bnpl, klarna, afterpay, affirm, buy-now-pay-later, installments, financing]
triggers: ["buy now pay later", "BNPL", "Klarna integration", "Afterpay integration", "Affirm integration", "pay in installments", "split payment"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Buy Now, Pay Later (BNPL)

## Overview

Integrate one or more Buy Now, Pay Later providers to offer installment payment options at checkout. Covers the three main integrations (Klarna, Afterpay, Affirm), eligibility amount checks so BNPL is only shown for qualifying order totals, messaging widgets that display installment breakdowns on product pages and in the cart, and the redirect-based vs. SDK-based integration patterns.

## When to Use This Skill

- When average order value (AOV) is high enough that installments would meaningfully help conversion ($100-$3,000 range is typical)
- When analytics show customers abandoning checkout at the payment step due to price
- When competitors offer BNPL and it is becoming a category expectation (fashion, electronics, furniture)
- When adding BNPL via Stripe (Klarna, Afterpay are available as payment methods on Stripe)

## Core Instructions

1. **Understand the BNPL provider landscape**

   ```
   Provider  | Markets        | Model              | Merchant Fee | Order Range
   ----------|----------------|--------------------|--------------|------------------
   Klarna    | US, EU, UK     | Pay in 4 / Financing | 2.49% + $0.30 | $10 - $10,000
   Afterpay  | US, AU, UK, CA | Pay in 4 (6 weeks)  | 4-6%          | $35 - $2,000
   Affirm    | US, CA         | Monthly installments | 5.99% - 29.99%| $50 - $17,500
   Zip       | US, AU, UK     | Pay in 4            | 4-6%          | $35 - $1,500

   Recommendation:
   - For Stripe-based stores: enable Klarna + Afterpay via Stripe payment methods (simplest)
   - For non-Stripe stores: integrate Afterpay JS SDK directly
   ```

2. **Enable Klarna and Afterpay via Stripe**

   If already using Stripe, enabling BNPL is a configuration change — no separate SDK required.

   ```javascript
   // Server: include bnpl methods in the payment intent
   const paymentIntent = await stripe.paymentIntents.create({
     amount: orderTotal,
     currency: 'usd',
     payment_method_types: [
       'card',
       'klarna',
       'afterpay_clearpay',
       'affirm',
     ],
     metadata: { order_id: orderId },
   });
   ```

   ```jsx
   // Client: Stripe Elements shows BNPL options automatically based on amount and country
   import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

   // PaymentElement with automatic_payment_methods shows all eligible methods
   // including BNPL without any extra code
   function CheckoutPaymentForm() {
     return (
       <form>
         <PaymentElement
           options={{
             layout: 'tabs', // Shows payment methods as tabs: Card | Klarna | Afterpay
           }}
         />
         <SubmitButton />
       </form>
     );
   }
   ```

3. **Integrate Afterpay directly with the Afterpay.js SDK**

   For non-Stripe implementations, use Afterpay's own JavaScript SDK.

   ```javascript
   // Load Afterpay SDK
   // In <head>:
   // <script src="https://js.afterpay.com/afterpay-1.x.js" async></script>

   // Step 1: Create an Afterpay checkout token server-side
   // POST /api/afterpay/create-checkout
   export async function createAfterpayCheckout(req, res) {
     const { cartId } = req.body;
     const cart = await getCart(cartId);

     const response = await fetch('https://global-api.afterpay.com/v2/checkouts', {
       method: 'POST',
       headers: {
         Authorization: `Basic ${Buffer.from(`${process.env.AFTERPAY_MERCHANT_ID}:${process.env.AFTERPAY_SECRET_KEY}`).toString('base64')}`,
         'Content-Type': 'application/json',
         'User-Agent': `YourStore/1.0 (Merchant/${process.env.AFTERPAY_MERCHANT_ID})`,
       },
       body: JSON.stringify({
         amount: { amount: cart.total.toFixed(2), currency: 'USD' },
         consumer: { email: cart.email, givenNames: cart.firstName, surname: cart.lastName },
         merchant: {
           redirectConfirmUrl: `${process.env.STORE_URL}/checkout/afterpay/confirm`,
           redirectCancelUrl: `${process.env.STORE_URL}/checkout`,
         },
         items: cart.items.map(item => ({
           name: item.title,
           sku: item.sku,
           quantity: item.quantity,
           price: { amount: item.unitPrice.toFixed(2), currency: 'USD' },
         })),
       }),
     });

     const checkout = await response.json();
     if (!response.ok) {
       return res.status(400).json({ error: checkout.message });
     }

     res.json({ token: checkout.token, redirectUrl: checkout.redirectCheckoutUrl });
   }
   ```

   ```javascript
   // Step 2: Launch the Afterpay popup
   AfterPay.initialize({ countryCode: 'US' });

   AfterPay.redirect({
     token: checkoutToken,
     onComplete: async ({ status, orderToken }) => {
       if (status === 'SUCCESS') {
         await captureAfterpayOrder(orderToken);
       }
     },
   });

   // Step 3: Capture the payment server-side
   // POST /api/afterpay/capture/:orderToken
   async function captureAfterpayOrder(orderToken) {
     const res = await fetch(`https://global-api.afterpay.com/v2/payments/capture`, {
       method: 'POST',
       headers: {
         Authorization: `Basic ${Buffer.from(`${process.env.AFTERPAY_MERCHANT_ID}:${process.env.AFTERPAY_SECRET_KEY}`).toString('base64')}`,
         'Content-Type': 'application/json',
         'Idempotency-Key': orderToken,
       },
       body: JSON.stringify({ token: orderToken, merchantReference: orderId }),
     });
     const capture = await res.json();
     return capture;
   }
   ```

4. **Add BNPL messaging widgets to product pages and cart**

   BNPL providers supply JavaScript widgets that show "Pay 4x $X" messaging inline.

   ```jsx
   // AfterpayMessage.jsx — displays "4 interest-free payments of $X" on the PDP
   import { useEffect, useRef } from 'react';

   export function AfterpayMessage({ price }) {
     const MIN_AMOUNT = 35;   // Afterpay US minimum
     const MAX_AMOUNT = 2000; // Afterpay US maximum

     if (price < MIN_AMOUNT || price > MAX_AMOUNT) return null;

     return (
       <afterpay-placement
         data-locale="en_US"
         data-currency="USD"
         data-amount={price.toFixed(2)}
         data-size="sm"
         data-logo-type="badge"
       />
     );
   }

   // Klarna on-site messaging widget
   export function KlarnaMessage({ price }) {
     useEffect(() => {
       window.Klarna?.OnsiteMessaging?.refresh();
     }, [price]);

     return (
       <klarna-placement
         data-key="credit-promotion-auto-size"
         data-locale="en-US"
         data-purchase-amount={String(Math.round(price * 100))} /* Amount in cents */
       />
     );
   }
   ```

5. **Implement eligibility guard to conditionally show BNPL**

   Do not show BNPL options if the order total is outside the provider's eligible range.

   ```javascript
   // lib/bnplEligibility.js

   const BNPL_RANGES = {
     afterpay: { min: 35,  max: 2000,  countries: ['US', 'CA', 'AU', 'NZ', 'GB'] },
     klarna:   { min: 10,  max: 10000, countries: ['US', 'DE', 'GB', 'SE', 'NL', 'FI', 'NO', 'DK', 'AT', 'CH', 'BE', 'ES', 'IT', 'FR', 'AU'] },
     affirm:   { min: 50,  max: 17500, countries: ['US', 'CA'] },
   };

   export function getEligibleBNPLProviders(orderTotal, countryCode) {
     return Object.entries(BNPL_RANGES)
       .filter(([, range]) =>
         orderTotal >= range.min &&
         orderTotal <= range.max &&
         range.countries.includes(countryCode)
       )
       .map(([provider]) => provider);
   }
   ```

## Examples

### Full Stripe-based BNPL with Klarna

When using Stripe's `PaymentElement`, Klarna appears automatically for eligible US orders. Add these Stripe configurations to control which methods display:

```javascript
// Configure Stripe to only show specific methods
const paymentElementOptions = {
  layout: 'accordion',
  paymentMethodOrder: ['card', 'klarna', 'afterpay_clearpay'],
  defaultValues: {
    billingDetails: {
      name: customer.name,
      email: customer.email,
    },
  },
};
```

### Installment breakdown display

Show a clear breakdown so customers understand what they are committing to:

```jsx
function InstallmentBreakdown({ total, provider }) {
  const installmentAmount = (total / 4).toFixed(2);
  return (
    <p className="installment-note">
      or 4 interest-free payments of <strong>${installmentAmount}</strong>
      {' '}with <strong>{provider}</strong>. No impact on credit score.
    </p>
  );
}
```

## Best Practices

- **Use Stripe payment methods if already on Stripe** — enabling Klarna/Afterpay through Stripe requires zero additional SDK integration; it is just a configuration change
- **Show installment messaging on PDPs and cart** — research shows BNPL messaging on product pages increases AOV by 15-25% before the customer even reaches checkout
- **Only show BNPL within eligible amount ranges** — each provider has minimum and maximum amounts; displaying BNPL for a $10 order misleads customers
- **Capture payments server-side** — never trust client-side callbacks alone; always capture/confirm the BNPL payment from your server
- **Handle webhook events for BNPL** — Afterpay and Klarna send webhook events for payment updates, refunds, and chargebacks; register and handle them
- **Display clear terms** — "4 interest-free payments" must be accurate; check the provider's compliance requirements for messaging in each market

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Afterpay popup blocked | The `AfterPay.redirect()` call must be triggered directly by a user click event; do not call it from inside an async/await chain |
| BNPL shown for ineligible amounts | Implement server-side eligibility check; also enforce client-side with the `getEligibleBNPLProviders` function |
| Duplicate order on Afterpay redirect confirmation | Use the `orderToken` as an idempotency key when capturing; check for an existing order with that token before creating a new one |
| Klarna messaging widget not updating on variant change | Call `Klarna.OnsiteMessaging.refresh()` whenever the price changes; the widget reads the updated `data-purchase-amount` attribute |
| Afterpay returns success but payment not actually captured | `onComplete` status `SUCCESS` means the customer approved — you still must call the capture API server-side to move the money |

## Related Skills

- @stripe-integration
- @checkout-flow-optimization
- @paypal-integration
- @cart-logic
