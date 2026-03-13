---
name: email-marketing-automation
description: "Build automated email flows for welcome series, post-purchase follow-ups, win-back campaigns, and browse abandonment to drive repeat revenue"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [email, automation, klaviyo, sendgrid, welcome-series, post-purchase, win-back, browse-abandonment, lifecycle]
triggers: ["email automation", "triggered emails", "welcome email flow", "post-purchase email", "win-back campaign", "browse abandonment email", "email marketing flows"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Email Marketing Automation

## Overview

Triggered email flows automatically send personalized messages based on customer behavior and lifecycle stage, achieving 3–5x higher open rates than broadcast campaigns. Klaviyo (for Shopify/BigCommerce) and AutomateWoo or Klaviyo plugin (for WooCommerce) provide pre-built flow templates for the four critical flows: welcome series, post-purchase nurture, win-back campaigns, and browse abandonment. Most merchants can set these up without writing any code.

## When to Use This Skill

- When setting up a new store and needing baseline lifecycle email coverage
- When replacing manual one-off campaigns with behavior-triggered sequences
- When recovering revenue from customers who browsed but did not purchase
- When re-engaging lapsed customers who have not ordered in 60–180 days
- When personalizing post-purchase communication to reduce returns and increase LTV

## Core Instructions

### Step 1: Choose the right tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Klaviyo | Pre-built flow templates, deep Shopify integration, automatic event tracking (Viewed Product, Added to Cart, Checkout Started, Placed Order), predictive analytics |
| **WooCommerce** | AutomateWoo ($99/yr) or Klaviyo (WooCommerce plugin) | AutomateWoo has native WooCommerce triggers and hooks; Klaviyo plugin syncs WooCommerce events |
| **BigCommerce** | Klaviyo or Omnisend | Both have native BigCommerce integrations and pre-built lifecycle flow templates |
| **Custom / Headless** | Klaviyo (via Track API) or SendGrid | Send events to Klaviyo's API; build flows in their visual editor |

### Step 2: Set up the four core flows

---

#### Shopify with Klaviyo

Install Klaviyo from the Shopify App Store. Klaviyo automatically tracks Shopify events — no additional setup required for event capture.

**Flow 1: Welcome Series**

1. Go to **Klaviyo → Flows → Create Flow → Welcome Series** (use the pre-built template)
2. The default template sends 3 emails:
   - Email 1 (immediate): Welcome + brand story + 10% discount for first purchase
   - Email 2 (day 2): Bestsellers or curated collection
   - Email 3 (day 7): Brand mission / social proof
3. Customize the email copy and design using Klaviyo's drag-and-drop editor
4. The flow triggers automatically when someone subscribes via your Shopify popups, checkout opt-in, or newsletter form
5. Add a **conditional split** on "Has placed an order" to skip the discount email for customers who already purchased after subscribing

**Flow 2: Post-Purchase Series**

1. Go to **Klaviyo → Flows → Create Flow → Post-Purchase** (use template)
2. Default 4-step structure:
   - Email 1 (immediate): Order confirmation + product care tips
   - Email 2 (day 2): Shipping notification (Klaviyo connects to Shopify's fulfillment events)
   - Email 3 (day 7): Delivery check-in + cross-sell recommendations
   - Email 4 (day 21): Review request (connects to Klaviyo's review integration or Judge.me)
3. Add a filter: **"Has NOT placed order since starting this flow"** → skip the review request if they ordered again (they are already happy)

**Flow 3: Browse Abandonment**

1. Go to **Klaviyo → Flows → Create Flow → Browse Abandonment** (use template)
2. Trigger: **Viewed Product** metric
3. Wait 30 minutes → Check: **"Has NOT started checkout since flow start"** → send email
4. Email content: Use Klaviyo's **Dynamic Product Block** — it automatically shows the exact product the customer was viewing with live price and image
5. Wait 24 hours → Send follow-up with "Others also liked" product recommendations

**Flow 4: Win-Back / At-Risk**

1. Go to **Klaviyo → Flows → Create Flow → Win Back** (use template)
2. Trigger: **Segment membership** → "Predicted Churn Risk: High" (Klaviyo calculates this automatically)
3. Default 3-step structure:
   - Email 1 (day 0): "We miss you" + personalized product recommendations based on past purchases
   - Email 2 (day 7): Social proof + new arrivals
   - Email 3 (day 14): Final offer with 10–15% discount + expiry date
4. Add a **flow filter**: "Has not placed an order" — this ensures the flow stops immediately when the customer converts

---

#### WooCommerce with AutomateWoo

1. Go to **AutomateWoo → Workflows → Add Workflow**

**Welcome Series:**
- Trigger: **Customer → Created** (new customer account) or **Subscribe → Newsletter** (with your email plugin)
- Add 3 email actions with timing delays: immediate, +2 days, +7 days
- Use AutomateWoo's variable system to insert first name, recommended products, etc.

**Post-Purchase Series:**
- Trigger: **Order → Status Changed to Completed**
- Action 1 (immediate): Send order confirmation email
- Action 2 (+7 days): Send review request (AutomateWoo integrates with YITH Reviews and WooCommerce Reviews Pro)
- Add Rule: "Order was placed by this customer" and "Customer has not created a review for this order"

**Browse Abandonment:**
- Requires: AutomateWoo Pro + the **Browse Abandonment add-on**
- Trigger: **Browse Abandonment** → Wait 30 minutes → Send email with viewed product

**Win-Back:**
- Trigger: **Customer → Win Back** (built-in AutomateWoo trigger)
- Set "No order in the last" to 60 days
- Create 3 workflows for escalating interventions at 60, 90, and 120 days

---

#### BigCommerce

1. Install **Klaviyo** from the BigCommerce App Marketplace
2. Klaviyo syncs all BigCommerce order and browse events automatically
3. Follow the same Klaviyo flow setup as the Shopify instructions above
4. BigCommerce does not have an equivalent to Shopify's native abandoned checkout emails — Klaviyo handles this entirely

---

#### Custom / Headless

Send behavioral events to Klaviyo's API, then build flows in Klaviyo's visual editor:

```typescript
// Track key events via Klaviyo's Events API
async function trackKlaviyoEvent(email: string, eventName: string, properties: object) {
  await fetch('https://a.klaviyo.com/api/events/', {
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
          metric: { data: { type: 'metric', attributes: { name: eventName } } },
          profile: { data: { type: 'profile', attributes: { email } } },
          properties,
          time: new Date().toISOString(),
        },
      },
    }),
  });
}

// Usage:
await trackKlaviyoEvent(customer.email, 'Viewed Product', {
  ProductName: product.name, ProductID: product.id,
  ImageURL: product.imageUrl, URL: product.url, Price: product.price,
});

await trackKlaviyoEvent(customer.email, 'Placed Order', {
  $value: order.subtotal, OrderId: order.id,
  Items: order.lineItems.map(i => ({ ProductName: i.name, ItemPrice: i.price })),
});
```

Once events are flowing into Klaviyo, build the flows in Klaviyo's visual editor using the same instructions as the Shopify section.

### Step 3: Configure suppression and frequency rules

**In Klaviyo:**
- Enable **Smart Sending** on all flows: go to each flow, click the email step, and toggle "Smart Sending" on — this prevents sending more than 1 email per 16-hour window to any contact
- Set a daily message limit under **Account Settings → Email Sending Limits**
- Add "Unsubscribed from email" as a **Flow Filter** on every flow — contacts unsubscribed from Klaviyo will not receive flow emails regardless, but this makes the logic explicit

**In AutomateWoo:**
- Go to **AutomateWoo → Settings → Email** and configure sending limits
- Add "Customer has unsubscribed" as a Rule on every workflow

### Step 4: Measure flow performance

| Flow | Key Metric | Target |
|------|-----------|--------|
| Welcome Series | Revenue per recipient | $1–$5 for first 30 days |
| Post-Purchase | Review submission rate (email 4) | 5–15% |
| Browse Abandonment | Recovered revenue per trigger | $2–$8 |
| Win-Back | Re-activation rate | 5–10% of at-risk contacts |

In Klaviyo: go to **Flows → [Flow name] → Analytics** to see revenue, open rate, and click rate per email step.

## Best Practices

- **Use Klaviyo's pre-built flow templates** — they incorporate years of industry learning; customize the copy and design, not the flow structure
- **Cancel competing flows** — in Klaviyo, use flow filters: "Has placed an order since starting flow → exit flow"; this prevents win-back emails reaching customers who just bought
- **Personalize with dynamic product blocks** — Klaviyo's product recommendation blocks automatically show the right products based on browsing and purchase history
- **Respect quiet hours** — Klaviyo's Smart Sending respects timezone-based sending windows; enable it on all flows
- **A/B test subject lines** — Klaviyo's built-in A/B test sends to 20% of recipients and picks the winner automatically; use it on every flow's first email

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Win-back emails sent after customer just placed an order | Add flow filter: "Has NOT placed order since starting flow" — Klaviyo exits the contact from the flow immediately |
| Browse abandonment fires for anonymous visitors | Gate the Viewed Product event on having a known email (logged-in user or cookie-captured email); Klaviyo only tracks identified profiles |
| Duplicate emails sent when Shopify webhooks fire twice | Klaviyo's flow deduplication prevents this automatically — each profile enters a flow only once per trigger period |
| High unsubscribe rate on win-back step 3 | 120-day lapsed customers are cold; lead with value (new arrivals, social proof) before the discount |
| Email renders broken on Outlook | Use Klaviyo's email templates — they are pre-tested across clients; avoid custom HTML in Outlook without Litmus testing |

## Related Skills

- @cart-abandonment-recovery
- @sms-marketing
- @email-list-segmentation
- @customer-retention-engine
- @push-notifications
