---
name: cart-abandonment-recovery
description: "Win back shoppers who leave items in their cart by setting up timed email, SMS, and push sequences with escalating incentives to complete their purchase"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [cart-abandonment, email, sms, push-notifications, recovery, incentive, retargeting, conversion]
triggers: ["cart abandonment", "abandoned cart recovery", "recover abandoned carts", "cart recovery emails", "abandonment sequence"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Cart Abandonment Recovery

## Overview

Cart abandonment averages 70% across e-commerce, making recovery flows one of the highest-ROI automations available. A good recovery sequence sends 2–4 messages across email, SMS, and push — starting with a simple reminder, then adding social proof or urgency, and only offering a discount as a last resort. The sequence cancels immediately when the customer completes checkout.

This skill guides you through setting up cart abandonment recovery on your specific platform, choosing the right tools, and configuring the sequence for maximum revenue recovery without training customers to abandon on purpose.

## When to Use This Skill

- When more than 60% of initiated checkouts are not completed
- When launching a new store and prioritizing quick revenue recovery
- When adding SMS or push channels to an existing email-only abandonment flow
- When the current flat-discount abandonment email is training customers to abandon intentionally
- When needing to differentiate recovery strategy by cart value or customer segment
- When A/B testing incentive timing (immediate vs. 24h vs. 48h discount reveal)

## Core Instructions

### Step 1: Determine the merchant's platform and recommend the right tool

Ask which platform the store runs on. The setup is completely different depending on the platform:

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Klaviyo (free up to 250 contacts) or Shopify's built-in abandoned checkout emails | Klaviyo has deep Shopify integration, tracks cart events automatically, and supports email + SMS in one tool |
| **WooCommerce** | AutomateWoo ($99/yr) or CartFlows + FluentCRM | AutomateWoo hooks directly into WooCommerce cart events; CartFlows adds funnel recovery |
| **BigCommerce** | Klaviyo or Omnisend | Both integrate natively with BigCommerce cart events |
| **Magento** | Dotdigital (bundled with Adobe Commerce) or Klaviyo | Dotdigital is the default marketing automation for Magento; Klaviyo works for open-source Magento |
| **Custom / Headless** | Klaviyo (via API) or build a custom sequence with BullMQ + SendGrid | Use Klaviyo's Track API to send cart events, then build flows in their visual editor |

### Step 2: Set up the recovery sequence

The optimal sequence follows this pattern — start without a discount and escalate only if needed:

**Message 1 — Reminder (1 hour after abandonment)**
- Channel: Email
- Content: Show the cart items with images + prices, a "Complete your purchase" button
- No discount — most recoveries happen here without incentive

**Message 2 — Social proof or urgency (4–6 hours)**
- Channel: Push notification or email
- Content: "X people are viewing this item" or "Low stock — only Y left"
- Still no discount

**Message 3 — Small incentive (24 hours)**
- Channel: Email
- Content: Free shipping (if cart > $75) or 10% off
- Include a unique, single-use discount code that expires in 48 hours

**Message 4 — Final push (48 hours)**
- Channel: SMS (only if opted in)
- Content: "Last chance — your cart expires tomorrow" + discount reminder
- This is the last message. Stop after this.

> **Never send more than 4 messages.** Beyond that, you damage brand perception more than you recover revenue.

### Step 3: Platform-specific setup

---

#### Shopify

**Option A: Built-in abandoned checkout emails (free, basic)**

1. Go to **Settings → Checkout → Abandoned checkouts**
2. Check "Automatically send abandoned checkout emails"
3. Set the delay (recommend: 1 hour for first email, 10 hours for second)
4. Customize the email template under **Notifications → Abandoned checkout**

Limitations: Shopify's built-in recovery only supports one email (or two on Plus), no SMS, no conditional incentives. Move to Klaviyo when you need a full sequence.

**Option B: Klaviyo (recommended for multi-step flows)**

1. Install Klaviyo from the Shopify App Store
2. Klaviyo automatically syncs with Shopify and tracks `Checkout Started` events
3. In Klaviyo, go to **Flows → Create Flow → Abandoned Cart** (use their pre-built template)
4. Configure the sequence:

```
Trigger: "Checkout Started" event
  ↓
Wait 1 hour → Check: "Has Placed Order since starting flow?" → If no:
  ↓
Email 1: Cart reminder (no discount)
  ↓
Wait 4 hours → Check: "Has Placed Order?" → If no:
  ↓
Email 2: Urgency/social proof
  ↓
Wait 20 hours → Check: "Has Placed Order?" → If no:
  ↓
Email 3: Include discount code (use Klaviyo's coupon block — creates unique single-use Shopify discount codes)
  ↓
Wait 24 hours → Check: "Has Placed Order?" → If no:
  ↓
SMS 4 (only to SMS-consented contacts): Final reminder with discount
```

5. To segment by cart value: add a **Conditional Split** on `$value` of the checkout event:
   - Cart ≥ $100: offer free shipping
   - Cart < $100: offer 10% off
6. To protect VIP customers from discounts: add a Split on **Customer Lifetime Value** or **Total Orders** — skip the discount step for repeat buyers

**Shopify Flow (Plus only) — auto-tag for advanced routing:**

```liquid
Trigger: Checkout abandoned
Condition: Cart total > 200
Action: Add customer tag "high-value-abandoner"
```

Then use this tag in Klaviyo to route high-value abandoners to a VIP recovery sequence.

---

#### WooCommerce

**Option A: AutomateWoo (recommended)**

1. Install and activate the AutomateWoo plugin
2. Go to **AutomateWoo → Workflows → Add Workflow**
3. Set the trigger to **"Cart Abandoned"**
4. Configure timing and actions:

```
Workflow 1: Cart Reminder
  Trigger: Cart Abandoned
  Timing Rule: Wait 1 hour
  Action: Send Email (template: cart contents with images)

Workflow 2: Urgency Email
  Trigger: Cart Abandoned
  Timing Rule: Wait 6 hours
  Action: Send Email (template: "Items selling fast")

Workflow 3: Discount Email
  Trigger: Cart Abandoned
  Timing Rule: Wait 24 hours
  Action: Generate Coupon (10% off, single-use, expires in 48 hours)
  Action: Send Email (template: include generated coupon code)

Workflow 4: SMS Last Chance (requires Twilio add-on)
  Trigger: Cart Abandoned
  Timing Rule: Wait 48 hours
  Opt-in Rule: Customer has SMS marketing consent
  Action: Send SMS via Twilio
```

5. Set a **Rule** on each workflow: "Customer has not purchased since workflow started" — this auto-cancels the sequence on conversion
6. For VIP segmentation: add a Rule checking `Customer → Total Spent > $500` to skip the discount workflow

**Option B: CartFlows + FluentCRM (free alternative)**

1. Install CartFlows (cart abandonment tracking) and FluentCRM (email automation)
2. CartFlows captures abandoned checkouts and syncs to FluentCRM as contacts
3. Build the email sequence in FluentCRM's automation builder

---

#### BigCommerce

1. Install **Klaviyo** or **Omnisend** from the BigCommerce app marketplace
2. Both platforms automatically track BigCommerce abandoned cart events
3. Build the flow using the same 4-step sequence described above
4. BigCommerce also has a built-in abandoned cart saver (**Marketing → Abandoned Cart Emails**) but it's limited to 3 emails with no SMS or conditional logic

---

#### Custom / Headless

For headless storefronts, you have two paths:

**Path A: Use Klaviyo's API (recommended)**

Send cart events to Klaviyo, then build the flow in Klaviyo's visual editor:

```typescript
// When a cart is updated, send the event to Klaviyo
async function trackCartUpdate(cart: Cart) {
  await fetch('https://a.]klaviyo.com/api/events/', {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_KEY}`,
      'Content-Type': 'application/json',
      'revision': '2024-10-15',
    },
    body: JSON.stringify({
      data: {
        type: 'event',
        attributes: {
          metric: { data: { type: 'metric', attributes: { name: 'Checkout Started' } } },
          profile: { data: { type: 'profile', attributes: { email: cart.customerEmail } } },
          properties: {
            value: cart.totalValue,
            items: cart.items.map(i => ({
              ProductName: i.name,
              ProductURL: i.url,
              ImageURL: i.imageUrl,
              Price: i.price,
              Quantity: i.quantity,
            })),
            checkout_url: `${process.env.STORE_URL}/checkout?cart=${cart.id}`,
          },
        },
      },
    }),
  });
}
```

Then build the abandoned cart flow in Klaviyo's UI — same 4-step sequence, no need to manage timers or queues yourself.

**Path B: Build it yourself (only if you need full control)**

If you need custom logic that Klaviyo can't handle (custom discount rules, proprietary channels, etc.), build the sequence with a job queue:

```typescript
// Detect abandoned carts — run every 5 minutes via cron
async function findAbandonedCarts() {
  const cutoff = new Date(Date.now() - 60 * 60000); // 1 hour inactive
  const carts = await db.carts.findWhere({
    lastActiveAt: { lt: cutoff },
    status: 'active',
    recoveryTriggered: false,
    customerEmail: { not: null },
  });

  for (const cart of carts) {
    await db.carts.update(cart.id, { recoveryTriggered: true });
    await recoveryQueue.add('send-step-1', { cartId: cart.id }, { delay: 0 });
    await recoveryQueue.add('send-step-2', { cartId: cart.id }, { delay: 4 * 3600000 });
    await recoveryQueue.add('send-step-3', { cartId: cart.id }, { delay: 24 * 3600000 });
    await recoveryQueue.add('send-step-4', { cartId: cart.id }, { delay: 48 * 3600000 });
  }
}

// Cancel on conversion
async function onOrderCompleted(orderId: string) {
  const order = await db.orders.findById(orderId);
  if (!order.cartId) return;
  const jobs = await recoveryQueue.getJobs(['delayed']);
  for (const job of jobs) {
    if (job.data.cartId === order.cartId) await job.remove();
  }
}
```

### Step 4: Configure incentive strategy

Regardless of platform, follow these rules for discounts:

1. **Never offer a discount on the first message** — most carts recover without one
2. **Use single-use codes** — prevents sharing and reuse
3. **Set a 48-hour expiry** on all discount codes — urgency converts
4. **Segment by customer value:**
   - New customers (0 orders): 10% off after 24 hours
   - Returning customers (1–5 orders): free shipping only
   - VIP customers (6+ orders or $500+ lifetime): no discount, just a reminder — they'll come back
5. **Track discount abuse** — if a customer has abandoned and recovered with a discount 3+ times, remove them from discount flows

### Step 5: Measure and optimize

Track these metrics weekly:

| Metric | Good Benchmark | How to Find It |
|--------|---------------|----------------|
| Recovery rate | 5–15% of abandoned carts | Klaviyo: Flow analytics. AutomateWoo: Reports → Workflows |
| Revenue recovered | Track with UTM params (`?utm_source=recovery&utm_medium=email`) | Google Analytics → Campaigns |
| Unsubscribe rate from recovery emails | < 0.5% per send | Your email provider's analytics |
| Discount usage rate | < 30% of recoveries should use a discount | Compare discount vs. non-discount recovery orders |

If more than 30% of recovered orders use a discount, you're revealing the discount too early. Push it to step 3 or 4, or increase the delay.

## Best Practices

- **Capture email before payment** — place the email field as the first checkout step so you can identify abandoners even if they don't finish
- **Include cart item images in every message** — a visual reminder outperforms "you forgot something" text
- **Respect SMS opt-in** — only send SMS recovery to customers who explicitly opted in; violations of TCPA/GDPR carry heavy fines
- **Suppress for 7 days after a prior sequence** — if a customer abandoned again right after a recovery sequence, give them space
- **A/B test the first email's delay** — try 30 min vs. 1 hour vs. 2 hours and measure recovery rate for each
- **Don't include discount codes in subject lines** — it trains customers to look for them and damages brand perception

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Recovery email sent after order placed | Ensure your flow checks "Has Placed Order" before each step (Klaviyo does this with flow filters; AutomateWoo uses rules) |
| Anonymous cart abandonment not captured | Require email at the first checkout step, before payment details |
| Customers learn to abandon for discounts | Never offer discount on message 1; skip discounts for repeat customers; track and exclude serial abandoners |
| SMS sends to customers who didn't opt in | Gate SMS behind explicit opt-in; use your platform's consent tracking (Klaviyo tracks SMS consent separately from email) |
| High unsubscribe rate from recovery emails | Reduce to 2–3 messages instead of 4; ensure one-click unsubscribe link is prominent |
| Recovery emails land in spam | Use your platform's authenticated sending domain (DKIM/SPF); avoid spam trigger words like "FREE" in caps |

## Related Skills

- @email-marketing-automation
- @push-notifications
- @sms-marketing
- @conversion-rate-optimization
- @exit-intent-popups
