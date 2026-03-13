---
name: customer-retention-engine
description: "Build automated retention campaigns targeting at-risk customers with behavioral triggers, personalized offers, and churn prevention workflows"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [retention, churn-prevention, lifecycle]
triggers: ["reduce churn", "build retention campaigns", "at-risk customers", "proactive retention", "repeat purchase rate"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Customer Retention Engine

## Overview

Acquiring a new customer costs 5–7x more than retaining an existing one. A retention engine identifies customers who show declining engagement — reduced purchase frequency, decreasing order values, browsing without buying — and intervenes with personalized campaigns before they lapse. Klaviyo and AutomateWoo can build these workflows with no custom code using predictive analytics built into the platform.

> **Note:** For reactivating already-lapsed customers, see @win-back-reactivation. This skill focuses on proactive churn prevention before customers lapse.

## When to Use This Skill

- When repeat purchase rate is declining month-over-month
- When a significant percentage of customers only ever purchase once
- When you want to proactively contact customers before they go fully dormant
- When building a post-purchase nurture program beyond the first 30 days
- When needing to identify which customers are worth offering a discount vs. which will repurchase anyway

## Core Instructions

### Step 1: Choose the right tool for your platform

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Klaviyo | Klaviyo's predictive analytics automatically calculates expected next purchase date and churn risk for every customer; no manual scoring needed |
| **WooCommerce** | AutomateWoo ($99/yr) | Deep WooCommerce integration, "Customer win-back" workflow type, RFM segmentation built in |
| **BigCommerce** | Klaviyo or Omnisend | Both integrate natively with BigCommerce order events and offer predictive churn scoring |
| **Custom / Headless** | Klaviyo (via API) | Send order events to Klaviyo; use their predictive analytics to identify at-risk customers |

### Step 2: Define your churn threshold

Churn timing depends on your product's natural repurchase cycle:

| Product Category | Expected Repurchase Cycle | At-Risk Threshold | Churned Threshold |
|-----------------|--------------------------|-------------------|-------------------|
| Consumables (skincare, supplements) | 30–60 days | 60+ days since last order | 120+ days |
| Apparel/fashion | 60–90 days | 90+ days | 180+ days |
| Home goods | 90–180 days | 180+ days | 365+ days |
| Electronics accessories | 120–365 days | 180+ days | 365+ days |

In Klaviyo, go to **Analytics → Predictive Analytics** to see Klaviyo's automatically calculated churn risk for your customer base. Klaviyo uses your actual order history to set these thresholds — no manual calculation needed.

### Step 3: Build retention flows

---

#### Shopify with Klaviyo

**Flow 1: Early warning — customers approaching their expected repurchase date**

1. Go to **Klaviyo → Flows → Create Flow → Start from Scratch**
2. Set trigger: **Metric → Expected Date of Next Order is in 7 days**
   - Klaviyo calculates this automatically using predictive analytics
3. Add an email action with subject line: "Your favorites are waiting for you"
   - Include: personalized product recommendations based on past purchases
   - Use the `{{ person.predicted_next_purchase_date }}` variable to acknowledge timing
4. Wait 3 days → Add a conditional: "Has placed an order since flow start?" → If No: send a follow-up email

**Flow 2: High-value at-risk customers — personalized offer**

1. Create a new flow triggered by: **Segment** → "High-Value At-Risk" segment (configure segment below)
2. Email: personalized exclusive offer (free shipping or 15% off for top-tier; no discount for mid-tier)
3. Wait 5 days → If no purchase: SMS follow-up (for SMS-consented customers)

**Create the "High-Value At-Risk" segment in Klaviyo:**
1. Go to **Klaviyo → Segments → Create Segment**
2. Conditions:
   - `Predicted Churn Risk` equals `High` OR `Mid`
   - AND `Total Customer Value` (Historic CLV) greater than $150
   - AND `Has not placed order in last 60 days`
3. Save as "High-Value At-Risk"

**Flow 3: One-time buyer reminder**

1. Create a flow triggered by: **Metric → Placed Order**
2. Wait 45 days
3. Check: "Total number of orders equals 1" → If yes:
4. Email: "Based on your [product name] purchase, you might love these..." with 3–4 complementary product recommendations
5. Wait 14 days → If still only 1 order: send final email with 10% welcome-back discount

---

#### WooCommerce with AutomateWoo

1. Go to **AutomateWoo → Workflows → Add Workflow**
2. Set trigger: **Customer → Win Back**
   - AutomateWoo has a built-in "Customer Win Back" trigger that fires at configurable intervals after last purchase
3. Set timing rules:
   - Workflow A: 45 days since last purchase — send personalized recommendations email
   - Workflow B: 75 days since last purchase — send exclusive offer email with discount
4. Add a rule to each workflow: "Customer has not purchased since workflow was created" — auto-cancels on conversion
5. For VIP customers: add a rule "Customer total spend > $500" to route to a separate workflow with better offers

AutomateWoo also includes built-in RFM segmentation — go to **AutomateWoo → Reports → RFM Analysis** to see your customer segments visually.

---

#### BigCommerce

1. Install **Klaviyo** from the BigCommerce App Marketplace
2. Klaviyo automatically syncs all BigCommerce order history
3. Follow the same Klaviyo flow setup described in the Shopify section above
4. BigCommerce order events trigger Klaviyo flows in real-time after the integration is connected

---

#### Custom / Headless

Send order events to Klaviyo's API to trigger retention flows:

```typescript
// Send order event to Klaviyo when an order is completed
async function trackKlaviyoOrder(order: Order) {
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
          metric: { data: { type: 'metric', attributes: { name: 'Placed Order' } } },
          profile: { data: { type: 'profile', attributes: { email: order.customerEmail } } },
          properties: {
            $value: order.subtotal,
            OrderId: order.id,
            Items: order.lineItems.map(i => ({ ProductName: i.name, ItemPrice: i.price })),
          },
        },
      },
    }),
  });
}
```

Klaviyo's predictive analytics then automatically calculates churn risk and expected next purchase date based on these events.

### Step 4: Configure intervention timing and incentives

Match interventions to customer value tier:

| Customer Tier | Intervention | Incentive |
|--------------|-------------|-----------|
| VIP (6+ orders, $500+ LTV) | Personalized email from "founder" | No discount — just recognition and early access |
| High-value (3–5 orders) | Email + SMS follow-up | Free shipping (protects margin) |
| Standard (1–2 orders) | Email sequence | 10% discount at final step only |
| One-time buyer | Email at 45 days | 10% off second order |

### Step 5: Measure retention lift

Track these in Klaviyo or AutomateWoo dashboards:

| Metric | Target | Where to Find |
|--------|--------|---------------|
| Flow revenue | Growing month-over-month | Klaviyo → Flows → Analytics |
| Repeat purchase rate | > 25% of customers | Shopify: Analytics → Customer cohorts. Klaviyo: Segment analytics |
| At-risk segment shrinking | Decrease vs. prior month | Klaviyo → Segments → Size history |
| Churn rate | Declining | Compare lapsed customer count month-over-month |

## Best Practices

- **Never discount VIP customers reflexively** — high-LTV customers who are slightly overdue may just be busy; a soft nudge without discount often works and protects margin
- **Personalize based on actual purchase history** — Klaviyo's dynamic product blocks automatically show recommendations based on what the customer has bought
- **Set a contact frequency cap** — in Klaviyo, use Smart Sending and set a daily message limit; at-risk customers should not receive more than one touchpoint per week
- **Use Klaviyo's predictive analytics** — do not manually calculate churn scores; Klaviyo computes expected next purchase date and churn risk automatically from your order data
- **Close the loop with CS for high-value customers** — for accounts over $1,000 LTV showing high churn risk, route to a customer success rep via Gorgias or Zendesk for personal outreach

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Sending retention emails to customers who just bought | Add a flow filter in Klaviyo: "Has placed an order in last 7 days → skip"; AutomateWoo's "Customer has not purchased since workflow was created" rule handles this |
| Discounts eroding margin on customers who would have repurchased anyway | Use Klaviyo's predictive analytics: only offer discounts when predicted churn risk is "High"; skip for "Mid" and "Low" |
| Single-purchase customers receiving win-back messaging too early | Set a minimum 45-day window before treating a one-time buyer as at-risk |
| Flows sending to unsubscribed contacts | Klaviyo respects unsubscribes automatically; ensure your Shopify/WooCommerce unsubscribe events sync to Klaviyo in real-time |

## Related Skills

- @lifecycle-marketing-automation
- @win-back-reactivation
- @loyalty-program-optimization
- @email-marketing-automation
- @email-list-segmentation
