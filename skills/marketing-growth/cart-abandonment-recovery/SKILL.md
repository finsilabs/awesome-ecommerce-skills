---
name: cart-abandonment-recovery
description: "Win back shoppers who leave with carts by sending timed email, SMS, and push sequences with escalating incentives to complete their purchase"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [cart-abandonment, email, sms, push-notifications, recovery, incentive, retargeting, conversion]
triggers: ["cart abandonment", "abandoned cart recovery", "recover abandoned carts", "cart recovery emails", "abandonment sequence"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Cart Abandonment Recovery

## Overview

Cart abandonment averages 70% across e-commerce, making recovery flows one of the highest-ROI automations available. This skill covers detecting abandonment server-side, orchestrating a multi-channel recovery sequence (email → push → SMS), applying escalating incentives only when needed, and cancelling the sequence immediately on conversion.

## When to Use This Skill

- When more than 60% of initiated checkouts are not completed
- When launching a new store and prioritizing quick revenue recovery
- When adding SMS or push channels to an existing email-only abandonment flow
- When the current flat-discount abandonment email is training customers to abandon intentionally
- When needing to differentiate recovery strategy by cart value or customer segment
- When A/B testing incentive timing (immediate vs. 24h vs. 48h discount reveal)

## Core Instructions

1. **Detect abandonment with a server-side timer**

   Do not rely on `beforeunload` events — they are unreliable. Instead, record when a cart was last updated and run a scheduled job to detect inactivity:

   ```typescript
   // On every cart mutation, stamp the last-active time
   async function onCartUpdated(cartId: string) {
     await db.carts.update(cartId, { lastActiveAt: new Date(), recoveryTriggered: false });
   }

   // Cron: every 5 minutes
   async function findAbandonedCarts() {
     const cutoff = new Date(Date.now() - 60 * 60000); // 1 hour of inactivity
     const carts = await db.carts.findWhere({
       lastActiveAt: { lt: cutoff },
       status: 'active',
       recoveryTriggered: false,
       customerEmail: { not: null },
     });

     for (const cart of carts) {
       await db.carts.update(cart.id, { recoveryTriggered: true });
       await startRecoverySequence(cart);
     }
   }
   ```

2. **Define the multi-channel sequence with escalating incentives**

   ```typescript
   interface RecoveryStep {
     channel: 'email' | 'push' | 'sms';
     delayFromAbandonMs: number;
     incentive: null | { type: 'free_shipping' | 'percent_off'; value: number };
     template: string;
   }

   function getRecoverySequence(cartValue: number): RecoveryStep[] {
     const highValue = cartValue >= 100;

     return [
       // Step 1: Friendly reminder, no incentive
       { channel: 'email', delayFromAbandonMs: 60 * 60000,      incentive: null,                                    template: 'cart-reminder' },
       // Step 2: Add social proof and urgency
       { channel: 'push',  delayFromAbandonMs: 4 * 3600000,     incentive: null,                                    template: 'cart-push-reminder' },
       // Step 3: Free shipping if cart > $100, else 10% off
       { channel: 'email', delayFromAbandonMs: 24 * 3600000,    incentive: highValue ? { type: 'free_shipping', value: 0 } : { type: 'percent_off', value: 10 }, template: 'cart-incentive' },
       // Step 4: Last chance — escalate discount for high-value carts
       { channel: 'sms',   delayFromAbandonMs: 48 * 3600000,    incentive: highValue ? { type: 'percent_off', value: 15 } : { type: 'percent_off', value: 10 }, template: 'cart-last-chance' },
     ];
   }
   ```

3. **Schedule recovery jobs and generate unique recovery links**

   ```typescript
   import { Queue } from 'bullmq';
   import { randomBytes } from 'crypto';

   const recoveryQueue = new Queue('cart-recovery', {
     connection: { host: process.env.REDIS_HOST, port: 6379 },
   });

   async function startRecoverySequence(cart: Cart) {
     const recoveryToken = randomBytes(20).toString('hex');
     await db.cartRecoveryTokens.create({
       cartId: cart.id,
       token: recoveryToken,
       expiresAt: new Date(Date.now() + 7 * 86400000),
     });

     const sequence = getRecoverySequence(cart.totalValue);
     const abandonedAt = cart.lastActiveAt.getTime();

     for (const [i, step] of sequence.entries()) {
       const delay = Math.max(0, step.delayFromAbandonMs - (Date.now() - abandonedAt));
       let discountCode: string | null = null;

       if (step.incentive) {
         discountCode = await createOneTimeDiscount(step.incentive, cart.customerId);
       }

       await recoveryQueue.add(
         'send-recovery',
         { cartId: cart.id, step: i, channel: step.channel, template: step.template, recoveryToken, discountCode, customerEmail: cart.customerEmail, customerPhone: cart.customerPhone, cartItems: cart.items },
         {
           delay,
           jobId: `recovery-${cart.id}-step${i}`,
           removeOnComplete: true,
         }
       );
     }
   }
   ```

4. **Cancel the sequence when the cart converts**

   ```typescript
   async function onOrderCompleted(orderId: string) {
     const order = await db.orders.findById(orderId, { include: ['cart'] });
     if (!order.cartId) return;

     // Remove all pending recovery jobs
     for (let step = 0; step < 4; step++) {
       const job = await recoveryQueue.getJob(`recovery-${order.cartId}-step${step}`);
       await job?.remove();
     }

     await db.carts.update(order.cartId, { status: 'converted' });
   }
   ```

5. **Implement the recovery link endpoint**

   When a customer clicks the recovery email, restore their cart and redirect to checkout:

   ```typescript
   // GET /cart/recover/:token
   export async function recoverCart(req: Request, res: Response) {
     const { token } = req.params;
     const record = await db.cartRecoveryTokens.findByToken(token);

     if (!record || record.expiresAt < new Date()) {
       return res.redirect('/cart?expired=true');
     }

     const cart = await db.carts.findById(record.cartId, { include: ['items'] });
     if (cart.status === 'converted') {
       return res.redirect('/account/orders');
     }

     // Restore session cart
     req.session.cartId = cart.id;

     await db.cartRecoveryTokens.markUsed(record.id);
     await analytics.track('Cart Recovery Link Clicked', {
       cartId: cart.id,
       customerId: cart.customerId,
       cartValue: cart.totalValue,
     });

     return res.redirect('/checkout');
   }
   ```

6. **Send via the appropriate channel in the worker**

   ```typescript
   import { Worker } from 'bullmq';

   new Worker('cart-recovery', async (job) => {
     const { channel, template, customerEmail, customerPhone, cartItems, discountCode, recoveryToken } = job.data;

     const recoveryUrl = `${process.env.STORE_URL}/cart/recover/${recoveryToken}`;

     if (channel === 'email') {
       await sendRecoveryEmail({ to: customerEmail, template, cartItems, discountCode, recoveryUrl });
     } else if (channel === 'push') {
       await sendWebPush({ customerId: job.data.customerId, title: 'Your cart is waiting', body: 'Pick up where you left off', url: recoveryUrl });
     } else if (channel === 'sms') {
       if (!customerPhone) return; // skip if no phone
       await sendSms({ to: customerPhone, body: `Your cart expires soon. ${discountCode ? `Use ${discountCode} for ${job.data.discountCode ? 'a discount' : ''}. ` : ''}Complete your order: ${recoveryUrl}` });
     }
   }, { connection: { host: process.env.REDIS_HOST, port: 6379 } });
   ```

## Examples

### Segment-based incentive strategy

Avoid training loyal customers to abandon — skip the discount for high-LTV segments:

```typescript
async function getIncentiveForCustomer(customerId: string, cartValue: number) {
  const customer = await db.customers.findById(customerId);
  const totalSpend = await db.orders.sumByCustomer(customerId);

  // VIP customers ($500+ lifetime spend) get free shipping, never a % discount
  if (totalSpend >= 500) {
    return { type: 'free_shipping', value: 0 };
  }

  // First-time abandoners: no incentive on first email, discount on second
  const priorRecoveries = await db.cartRecoveryLog.countByCustomer(customerId);
  if (priorRecoveries === 0) {
    return null;
  }

  return { type: 'percent_off', value: cartValue >= 100 ? 15 : 10 };
}
```

### Cart value snapshot to handle price changes

Store a cart snapshot at abandonment time so recovery emails show accurate prices:

```typescript
async function snapshotCart(cartId: string): Promise<CartSnapshot> {
  const cart = await db.carts.findById(cartId, { include: ['items.product'] });

  const snapshot = {
    cartId,
    snapshotAt: new Date(),
    items: cart.items.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      image: item.product.images[0]?.url,
      price: item.product.price,       // snapshot at abandonment
      quantity: item.quantity,
     })),
    totalValue: cart.totalValue,
  };

  await db.cartSnapshots.upsert({ cartId }, snapshot);
  return snapshot;
}
```

## Best Practices

- **Never send more than 4 recovery touchpoints** — beyond that, you damage brand perception more than you recover revenue
- **Do not show the discount on step 1** — most recoveries happen within the first hour without incentive; save margins for genuinely lost carts
- **Expire discount codes in 48 hours** — urgency increases conversion; an open-ended code reduces perceived value
- **Respect SMS opt-in status** — only send SMS recovery to customers who explicitly opted in for marketing SMS
- **Include cart items in every message** — reminder of what they left behind outperforms generic "you forgot something" copy
- **Use one-time use discount codes** — prevents customers from sharing or reusing the code across multiple orders
- **Track recovery attribution separately** — use UTM params and a `recovered=true` query flag to distinguish recovery revenue
- **Suppress within 7 days of a prior recovery sequence** — if a customer abandoned again shortly after a previous recovery, a cooling-off period improves deliverability

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Recovery email sent after order placed | Attach an `order.created` hook that immediately cancels all pending recovery jobs for the associated cart |
| Anonymous cart abandonment not captured | Require email at the first checkout step (before payment) so the customer is identifiable at abandonment |
| Duplicate sequences for the same cart | Use `recoveryTriggered: true` flag and deterministic BullMQ `jobId` to prevent re-triggering |
| SMS sends to customers who didn't opt in | Gate SMS step behind a database `smsMarketingOptIn` flag; default to `false` |
| High unsubscribe rate from recovery emails | Reduce frequency and ensure unsubscribe link is prominent; one-click unsubscribe is now legally required in many jurisdictions |

## Related Skills

- @email-marketing-automation
- @push-notifications
- @sms-marketing
- @conversion-rate-optimization
- @exit-intent-popups
