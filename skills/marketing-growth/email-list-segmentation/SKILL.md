---
name: email-list-segmentation
description: "Create dynamic email segments based on purchase behavior, RFM scores, engagement signals, and lifecycle stage with automated rebalancing and list hygiene"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [email, segmentation, personalization, rfm, klaviyo, list-hygiene]
triggers: ["segment email list", "create email segments", "RFM segmentation", "email list hygiene", "targeted email campaigns"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Email List Segmentation

## Overview

Sending the same email to your entire list is one of the most expensive mistakes in ecommerce marketing. ISPs throttle senders with low engagement, unsubscribe rates spike for irrelevant content, and you leave revenue on the table by treating a VIP customer identically to someone who has never purchased. Klaviyo (for Shopify/BigCommerce) and AutomateWoo or Mailchimp (for WooCommerce) include RFM and behavioral segmentation built-in — no custom code needed for most stores.

## When to Use This Skill

- When email open rates drop below 20% and you suspect low engagement dragging deliverability
- When migrating from blast-and-pray sends to targeted campaign logic
- When building a suppression system to protect high-value subscribers from over-messaging
- When launching a win-back program and need to identify the "at-risk" vs. "lapsed" cohort
- When analyzing email revenue and needing to attribute performance to specific segments

## Core Instructions

### Step 1: Choose the right segmentation tool

| Platform | Recommended Tool | Built-in Segmentation Capabilities |
|----------|-----------------|-------------------------------------|
| **Shopify** | Klaviyo | Predictive CLV, churn risk, RFM scoring, purchase behavior segments — all built-in |
| **WooCommerce** | Klaviyo (via plugin) or AutomateWoo | Klaviyo plugin syncs order data; AutomateWoo has native WooCommerce RFM reports |
| **BigCommerce** | Klaviyo | Native BigCommerce integration with full order history sync |
| **All platforms** | Klaviyo (via API) | Use Klaviyo's Track/Identify API to send behavioral events from any platform |

### Step 2: Set up the essential segments — start with five

Build these five segments first. They cover 80% of the value. Add more only when you have campaigns ready for each.

---

#### Klaviyo (Shopify, BigCommerce, or API-connected)

**Segment 1: Champions (VIP buyers)**
1. Go to **Klaviyo → Segments → Create Segment**
2. Conditions:
   - `Has placed order` at least 5 times ever
   - AND `Total Customer Value` greater than $500
   - AND `Opened email` in the last 60 days
3. Save as "Champions — VIP Buyers"

**Segment 2: Active buyers (engaged, not yet VIP)**
1. Create segment with conditions:
   - `Has placed order` at least 2 times ever
   - AND `Has placed order in the last 90 days`
2. Save as "Active Buyers"

**Segment 3: At-risk (used to buy, now quiet)**
1. Create segment using Klaviyo's predictive analytics:
   - `Predicted Churn Risk` equals `High`
   - AND `Has placed order` at least 1 time ever
2. Save as "At-Risk Customers"

**Segment 4: Email-engaged non-buyers**
1. Create segment with conditions:
   - `Has placed 0 orders`
   - AND `Opened email` in the last 30 days
2. Save as "Engaged Subscribers — No Purchase"

**Segment 5: Unengaged (to suppress)**
1. Create segment with conditions:
   - `Has NOT opened email` in the last 180 days
   - AND `Has NOT clicked email` in the last 180 days
   - AND `Email subscription status` is `Subscribed`
2. Save as "Unengaged — Suppression List"

**Suppress the unengaged segment before every campaign send:**
- When creating a campaign in Klaviyo, under **Excluded Segments**, add "Unengaged — Suppression List"
- This protects deliverability by not sending to cold contacts who will mark you as spam

---

#### WooCommerce with Mailchimp or Klaviyo

**Mailchimp:**
1. Go to **Mailchimp → Audience → Segments → Create Segment**
2. Mailchimp's ecommerce segments require the WooCommerce + Mailchimp plugin for purchase data sync
3. Common conditions: "Purchased" / "Has not purchased" / "Total spent is greater than" / "Last purchase was more than 90 days ago"

**AutomateWoo (for WooCommerce automation, not campaigns):**
1. Go to **AutomateWoo → Reports → RFM Analysis** to view your customers plotted on an RFM grid
2. Export customer lists from each RFM quadrant and import into your ESP for targeted campaigns

---

#### WooCommerce with Klaviyo plugin

1. Install the Klaviyo plugin from the WordPress plugin directory
2. In Klaviyo, all WooCommerce orders and customers sync automatically
3. Follow the same segment setup as the Shopify/Klaviyo instructions above

---

### Step 3: Set up behavioral segments for campaign targeting

Beyond RFM, create segments that map to specific campaigns:

**Sale shoppers** (always use discounts — suppress from full-price launches):
- Klaviyo condition: `Has used a discount code` more than 2 times ever

**High AOV customers** (show premium products):
- Klaviyo condition: `Average Order Value` greater than $150

**Category-specific buyers** (for product launches):
- Klaviyo condition: `Ordered product in category` = "Skincare" (use your Shopify product type or Klaviyo collection data)

**Recently subscribed non-buyers** (in welcome flow):
- Klaviyo condition: `Subscribed to email` in the last 30 days AND `Has placed 0 orders`

### Step 4: Apply segments to campaigns

In Klaviyo, when creating a campaign:
1. Under **Recipient Selection**, choose your target segment (e.g., "Active Buyers")
2. Under **Excluded Segments**, always add "Unengaged — Suppression List"
3. Preview the segment size before sending — avoid sending to segments under 200 contacts (can trigger spam filters on some providers)

**Frequency rules by segment:**
- Champions: max 2 emails/week (they are engaged; maintain relationship but don't over-message)
- Active Buyers: 1–2 emails/week
- At-Risk: 1 email/week (retention focus)
- Engaged Subscribers (no purchase): 1–2 emails/week (nurture toward first purchase)

### Step 5: List hygiene — run quarterly

1. In Klaviyo, go to **Segments → [Unengaged list]** and check the size
2. If unengaged segment exceeds 20% of your total list, run a sunset campaign:
   - Send one final email: "We've noticed you haven't engaged lately — still want to hear from us?"
   - Wait 7 days
   - Suppress anyone who did not open the sunset email
3. Never delete unsubscribed contacts — suppress them. Klaviyo retains the unsubscribe signal to prevent accidental re-subscription.

## Best Practices

- **Start with 5 segments, not 50** — champion, active, at-risk, engaged non-buyer, unengaged is enough to see 80% of the benefit
- **Suppress before you send** — always build a suppression list (unengaged + unsubscribed) and apply it to every campaign
- **Protect champions** — never include your champions segment in sales/discount campaigns unless you want to train VIPs to wait for promotions
- **Engagement tier beats purchase history for deliverability** — for inbox placement, behavioral engagement signals matter more than how much someone has spent
- **Process unsubscribes immediately** — Klaviyo handles this automatically via webhooks; ensure your ESP is connected to your platform's unsubscribe events
- **GDPR**: for EU contacts, track consent separately and never rely on legitimate interest for marketing emails — require explicit opt-in

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Open rates drop after adding segmentation | Ensure segments are correctly excluding unsubscribed contacts; check Klaviyo's suppression list under Audience → Suppressions |
| Klaviyo lists go out of sync with Shopify | Confirm the Klaviyo–Shopify integration is connected under Klaviyo → Integrations → Shopify; enable "Sync historical data" |
| Champions segment shrinks after every send | You are emailing them too frequently — apply Klaviyo's Smart Sending limit (once every 16 hours per person) |
| GDPR violations from imported list | Validate lawful basis for all contacts before import; only import contacts who have explicitly opted in |
| Segments overlap and contacts receive duplicate emails | In Klaviyo, use "Send to unique recipients" option and check for segment overlap before sending |

## Related Skills

- @email-marketing-automation
- @win-back-reactivation
- @lifecycle-marketing-automation
- @customer-retention-engine
- @first-party-data-collection
