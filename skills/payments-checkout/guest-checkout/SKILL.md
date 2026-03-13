---
name: guest-checkout
description: "Allow shoppers to buy without creating an account, then invite them to save their details post-purchase to reduce checkout friction and increase conversion"
category: payments-checkout
risk: safe
source: curated
date_added: "2026-03-12"
tags: [guest-checkout, account-creation, conversion, frictionless, email-capture, post-purchase]
triggers: ["guest checkout", "checkout without account", "guest purchase", "post-purchase account creation", "frictionless checkout"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: beginner
---

# Guest Checkout

## Overview

Implement a frictionless guest checkout that requires only an email address to start, defers account creation to after the purchase is complete, and includes a post-purchase account creation prompt with a single-click password setup. Removing mandatory account creation can increase checkout completion by 20-35%.

## When to Use This Skill

- When checkout funnel analysis shows a significant drop-off at the account creation or login step
- When implementing a new checkout flow and need to decide on account requirements
- When adding a "Buy as Guest" option to an existing checkout that currently requires login
- When optimizing first-time buyer conversion rates

## Prerequisites & Platform Notes

**Shopify**: Shopify handles checkout natively. Use Shopify Payments (powered by Stripe), checkout extensions, and Shopify Functions for custom discount/payment logic. You cannot modify the core checkout without Checkout Extensions.
**WooCommerce**: WooCommerce supports payment gateways via plugins (WooCommerce Stripe, WooCommerce PayPal). Extend checkout with woocommerce_checkout_process and woocommerce_payment_complete hooks.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store, Stripe or PayPal account, relevant payment plugin/app

## Core Instructions

1. **Structure the guest order flow**

   A guest order requires only email. The full address and payment details are collected as part of checkout — no account needed.

   ```
   Guest checkout flow:
   1. Cart → Click "Checkout"
   2. Checkout page:
      a. Enter email (only field shown initially)
      b. Check if email has existing account → prompt to log in or continue as guest
      c. Enter shipping address
      d. Select shipping method
      e. Enter payment
      f. Place order
   3. Order confirmation page:
      - Order number and summary shown
      - "Create an account to track orders" prompt (one click, just set a password)
   ```

2. **Email-first checkout entry**

   ```jsx
   // EmailStep.jsx
   import { useState } from 'react';

   export function EmailStep({ onContinueAsGuest, onLogin }) {
     const [email, setEmail] = useState('');
     const [checking, setChecking] = useState(false);
     const [accountExists, setAccountExists] = useState(null);

     async function handleEmailContinue() {
       if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
       setChecking(true);

       const res = await fetch('/api/auth/check-email', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email }),
       });
       const { exists } = await res.json();
       setChecking(false);
       setAccountExists(exists);

       if (!exists) {
         // No account — proceed directly to guest checkout
         onContinueAsGuest(email);
       }
       // If exists, show the login prompt / continue as guest option
     }

     return (
       <div className="email-step">
         <label htmlFor="checkout-email">Email address</label>
         <input
           id="checkout-email"
           type="email"
           value={email}
           onChange={e => setEmail(e.target.value)}
           onKeyDown={e => e.key === 'Enter' && handleEmailContinue()}
           autoComplete="email"
           autoFocus
         />
         <button onClick={handleEmailContinue} disabled={checking}>
           {checking ? 'Checking...' : 'Continue'}
         </button>

         {accountExists && (
           <div className="account-exists-prompt">
             <p>An account with this email already exists.</p>
             <button onClick={() => onLogin(email)} className="btn-primary">Log in</button>
             <button onClick={() => onContinueAsGuest(email)} className="btn-secondary">
               Continue as guest
             </button>
           </div>
         )}
       </div>
     );
   }
   ```

3. **Create a guest order without an account**

   ```javascript
   // api/orders/guest.js
   export async function placeGuestOrder(req, res) {
     const { email, shippingAddress, billingAddress, paymentMethodId, cartId } = req.body;

     // Validate email
     if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
       return res.status(400).json({ error: 'Valid email is required' });
     }

     const cart = await db.carts.findUnique({
       where: { id: cartId },
       include: { items: { include: { variant: true } } },
     });
     if (!cart) return res.status(404).json({ error: 'Cart not found' });

     // Create order without user_id
     const order = await db.orders.create({
       data: {
         userId: null,            // No account
         guestEmail: email,
         status: 'pending',
         shippingAddress,
         billingAddress,
         lineItems: {
           create: cart.items.map(item => ({
             variantId: item.variantId,
             quantity: item.quantity,
             unitPrice: item.unitPrice,
             title: item.title,
           })),
         },
         subtotal: cart.subtotal,
         total: cart.total,
       },
     });

     // Process payment
     const paymentResult = await processPayment({
       amount: order.total,
       currency: 'usd',
       paymentMethodId,
       metadata: { orderId: order.id },
     });

     if (paymentResult.status !== 'succeeded') {
       await db.orders.update({ where: { id: order.id }, data: { status: 'payment_failed' } });
       return res.status(402).json({ error: 'Payment failed', details: paymentResult.error });
     }

     await db.orders.update({ where: { id: order.id }, data: { status: 'confirmed', paidAt: new Date() } });
     await db.carts.update({ where: { id: cartId }, data: { status: 'converted', orderId: order.id } });

     // Generate a temporary account creation token (valid 72 hours)
     const accountToken = await generateAccountCreationToken(email, order.id);
     await sendOrderConfirmationEmail(order, email, accountToken);

     res.json({ orderId: order.id, orderNumber: order.orderNumber });
   }
   ```

4. **Generate post-purchase account creation token**

   ```javascript
   // lib/accountCreationToken.js
   import crypto from 'crypto';

   export async function generateAccountCreationToken(email, orderId) {
     const token = crypto.randomBytes(32).toString('hex');
     const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

     await db.accountCreationTokens.create({
       data: { token, email, orderId, expiresAt },
     });

     return token;
   }

   // POST /api/auth/create-account-from-order
   export async function createAccountFromOrder(req, res) {
     const { token, password } = req.body;

     const record = await db.accountCreationTokens.findUnique({ where: { token } });
     if (!record || record.expiresAt < new Date()) {
       return res.status(400).json({ error: 'Token expired or invalid' });
     }

     // Check no account exists yet
     const existing = await db.users.findUnique({ where: { email: record.email } });
     if (existing) {
       return res.status(409).json({ error: 'An account already exists for this email' });
     }

     // Create account and link existing orders
     const user = await db.users.create({
       data: {
         email: record.email,
         passwordHash: await hashPassword(password),
       },
     });

     // Associate all guest orders with the same email to this new account
     await db.orders.updateMany({
       where: { guestEmail: record.email, userId: null },
       data: { userId: user.id },
     });

     // Clean up the token
     await db.accountCreationTokens.delete({ where: { token } });

     // Log the user in
     req.session.userId = user.id;
     res.json({ success: true });
   }
   ```

5. **Post-purchase account creation prompt**

   ```jsx
   // OrderConfirmationPage.jsx
   export function OrderConfirmationPage({ order, accountCreationToken }) {
     const [password, setPassword] = useState('');
     const [created, setCreated] = useState(false);
     const [creating, setCreating] = useState(false);

     async function handleCreateAccount() {
       setCreating(true);
       const res = await fetch('/api/auth/create-account-from-order', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ token: accountCreationToken, password }),
       });
       if (res.ok) setCreated(true);
       setCreating(false);
     }

     return (
       <div className="order-confirmation">
         <h1>Thank you for your order!</h1>
         <p>Order #{order.orderNumber} confirmed. A confirmation email has been sent to {order.guestEmail}.</p>

         {!created && accountCreationToken && (
           <div className="account-creation-prompt">
             <h2>Save your details for next time</h2>
             <p>Create a free account to track this order and check out faster next time.</p>
             <label htmlFor="new-password">Choose a password</label>
             <input
               id="new-password"
               type="password"
               value={password}
               onChange={e => setPassword(e.target.value)}
               minLength={8}
               autoComplete="new-password"
             />
             <button onClick={handleCreateAccount} disabled={password.length < 8 || creating}>
               {creating ? 'Creating...' : 'Create Account'}
             </button>
             <button className="skip-link" onClick={() => setCreated(true)}>No thanks</button>
           </div>
         )}
         {created && <p className="success">Account created! You can now log in to track your orders.</p>}
       </div>
     );
   }
   ```

## Examples

### Order tracking without an account

Let guest customers track orders via order number + email without logging in:

```javascript
// GET /api/orders/track?orderNumber=ORDER-12345&email=customer@example.com
export async function trackGuestOrder(req, res) {
  const { orderNumber, email } = req.query;

  const order = await db.orders.findFirst({
    where: {
      orderNumber,
      OR: [
        { guestEmail: email.toLowerCase() },
        { user: { email: email.toLowerCase() } },
      ],
    },
    include: { fulfillments: true, lineItems: true },
  });

  if (!order) return res.status(404).json({ error: 'Order not found' });

  res.json({ order });
}
```

### Email template for post-purchase account creation

Include the account creation link prominently in the order confirmation email:

```
Subject: Your order #{{orderNumber}} is confirmed!

Hi {{email}},

Your order has been placed and will ship within 2 business days.

---
SAVE TIME ON YOUR NEXT ORDER
Set your password to create an account and track orders anytime:
{{accountCreationUrl}}
(Link expires in 72 hours)
---
```

## Best Practices

- **Require only email at checkout entry** — do not ask for a password or account creation before taking payment; defer it entirely to post-purchase
- **Offer to log in, not force it** — when the email has an existing account, show both "Log in" and "Continue as guest"; never block checkout
- **Send the account creation link in the confirmation email** — many shoppers miss the on-page prompt; email gives them a second chance
- **Link historical guest orders on account creation** — when the user creates an account, transfer all orders with that email to the new user ID
- **Expire account creation tokens** — 48-72 hours is appropriate; long enough to read the email, short enough for security
- **Track post-purchase account creation rate** — measure how many guests convert to accounts; a rate below 20% suggests the prompt is not compelling enough

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Guest's order becomes inaccessible after they create an account | Associate the guest order using email match when creating the account; update all orders with that `guestEmail` to the new `userId` |
| Account creation token can be reused | Delete (or mark used) the token immediately after successful account creation |
| Guest checkout bypasses fraud prevention | Apply the same fraud scoring (address verification, velocity checks) to guest orders as authenticated orders |
| Confirmation email goes to spam | Ensure the "From" domain has SPF/DKIM configured; avoid spam trigger words in the subject line |

## Related Skills

- @checkout-flow-optimization
- @cart-logic
- @order-processing-pipeline
- @accessibility-commerce
