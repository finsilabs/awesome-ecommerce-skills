---
name: win-back-reactivation
description: "Re-engage lapsed customers with automated win-back campaigns using personalized comeback offers based on purchase history and inactivity windows"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [win-back, reactivation, retention]
triggers: ["win back inactive customers", "reactivation campaign"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Win-Back Reactivation

## Overview

Lapsed customers — those who have not purchased within 2× their typical repurchase cycle — represent a high-ROI recovery opportunity because they already know your brand. Win-back campaigns targeting these customers typically yield 5–15% reactivation rates, compared to 1–3% for cold prospecting. For Shopify, Klaviyo's predictive churn risk segment automates lapsed customer identification without manual RFM scoring. For WooCommerce, AutomateWoo provides a dedicated "Win Back" automation trigger. The strategic work is structuring a three-step email sequence, personalizing offers by customer LTV, and sunsetting contacts who remain unresponsive.

## When to Use This Skill

> **Note:** For proactive churn prevention before customers lapse, see @customer-retention-engine. This skill focuses on re-engaging customers who have already become inactive.

- When a large portion of your customer base has not purchased in 90–180 days
- When overall repeat purchase rate is declining year-over-year
- When you have never systematically targeted lapsed customers before
- When lifecycle marketing is in place but there is no specific win-back workflow
- When wanting to identify which lapsed customers are worth discounting vs. sunsetting

## Core Instructions

### Step 1: Choose your win-back automation tool

| Platform | Recommended Tool | Why | Price |
|----------|-----------------|-----|-------|
| **Shopify** | Klaviyo | Predictive churn risk segment built-in; syncs Shopify orders natively | Free up to 500 contacts; $20+/mo |
| **WooCommerce** | AutomateWoo | Native "Win Back" trigger based on days since last order | $99/yr |
| **BigCommerce** | Klaviyo | Same as Shopify — Klaviyo has a native BigCommerce integration | Free up to 500 contacts; $20+/mo |
| **Any platform** | Drip | Ecommerce-focused automation with built-in win-back workflow templates | $39+/mo |

**Recommendation:** If you already use Klaviyo for cart abandonment or post-purchase flows, add win-back there — no additional tool needed. If you are on WooCommerce without Klaviyo, AutomateWoo is the most cost-effective option.

### Step 2: Set up lapsed customer segments

---

#### Shopify / BigCommerce with Klaviyo

Klaviyo includes a **Predictive Churn Risk** property on every customer profile, calculated automatically from purchase history. No manual RFM setup required.

1. In Klaviyo, go to **Lists & Segments → Create Segment**
2. Create three segments using **Properties about someone**:

   **Early Lapsed (60–120 days):**
   - Predictive Churn Risk `equals` `High`
   - AND Date of last order `is between` `120 days ago` and `60 days ago`
   - AND Email marketing consent `is` `subscribed`

   **Mid-Lapsed (121–180 days):**
   - Predictive Churn Risk `equals` `High`
   - AND Date of last order `is between` `180 days ago` and `121 days ago`

   **Deep-Lapsed (181–365 days):**
   - Predictive Churn Risk `equals` `High`
   - AND Date of last order `is between` `365 days ago` and `181 days ago`

3. Alternatively, use Klaviyo's pre-built **Winback** flow template: go to **Flows → Create Flow → Browse Templates** → search "Win Back" → the template creates segments and email sequence automatically

---

#### WooCommerce with AutomateWoo

1. Go to **WordPress Admin → AutomateWoo → Workflows → Add Workflow**
2. Set the trigger to **Win Back Inactive Customer**
3. Configure trigger settings:
   - **Days since last order:** set to `60` for early-lapsed, create a second workflow at `120` for deeper lapsed
   - **Order status:** `completed`
4. Add a **Send Email** action for each step in the sequence
5. AutomateWoo automatically excludes customers who have placed an order since the workflow started — no manual cancellation needed

---

#### Manual segmentation (any platform)

If you do not use an automation tool, export your customer list filtered by last order date:

- **Shopify:** go to **Customers → All customers** → use the date filter "Last order date is before [date]" → export as CSV → import into your email platform
- **WooCommerce:** go to **WooCommerce → Reports → Customers** → filter by last active date
- **BigCommerce:** go to **Customers → Export** and filter by last order date in your spreadsheet

### Step 3: Build the win-back email sequence

A three-email sequence performs better than a single message. The sequence escalates from warm reconnection to an explicit offer to a last-chance message:

| Step | Timing | Goal | Discount |
|------|--------|------|----------|
| Email 1: "We've missed you" | Immediately | Warm reconnect, no hard sell | None — highlight new arrivals |
| Email 2: "Here's something for you" | Day 5 | Product highlights + offer | 10–15% off or free shipping |
| Email 3: "Last chance" | Day 12 | Create urgency — offer expires soon | Same code, "expires in 48 hours" |

**Subject line examples that work:**
- Email 1: "It's been a while, [first name]" / "We've been thinking about you"
- Email 2: "Still thinking about [last purchased category]?" / "A little something for your return"
- Email 3: "Your offer expires tomorrow" / "This is our last email — we mean it"

**Klaviyo sequence setup:**
1. Go to **Flows → Create Flow → Start from Scratch**
2. Set the trigger to **Segment → [your lapsed segment]**
3. Add **Email** → **Time Delay (5 days)** → **Email** → **Time Delay (7 days)** → **Email**
4. Add a **Conditional Split** after Email 1: if the customer has placed an order since the flow started, exit them from the flow
5. For the discount: go to **Content → Coupon Codes** → create a unique dynamic coupon for each recipient (Klaviyo generates unique single-use codes automatically)

### Step 4: Personalize offers by customer LTV

Not all lapsed customers deserve the same discount. Tailor the offer based on historical spend:

**In Klaviyo:**
- Use the **Historic Customer Lifetime Value** property in your email template
- Create two versions of Email 2 using A/B test or conditional content blocks:
  - **High LTV (over $300 lifetime):** free shipping + 15% off
  - **Standard LTV (under $300):** 10% off

**In AutomateWoo:**
- Add a **Check Customer Total Spent** condition to your workflow
- If total spent `>` `300`: proceed to the high-value email variation
- Otherwise: proceed to the standard email variation

### Step 5: Cancel win-back sequence on purchase

This step prevents sending a discount email to a customer who already bought.

**In Klaviyo:** Klaviyo handles this automatically — any profile that exits the lapsed segment (by making a purchase) immediately exits all active flows for that segment.

**In AutomateWoo:** the "Win Back Inactive Customer" trigger natively cancels pending workflow steps when an order is placed — no additional configuration needed.

**Manual check (custom setups):** Before sending each email in your sequence, verify the customer's last order date is still beyond your lapse threshold. Cancel the remaining sequence if they have purchased.

### Step 6: Sunset unresponsive contacts

Continuing to email completely unresponsive lapsed contacts hurts your sending domain's deliverability.

**In Klaviyo:**
1. Go to **Lists & Segments → Create Segment**:
   - Email marketing consent `is` `subscribed`
   - AND Last opened email `more than` `90 days ago`
   - AND Last clicked email `more than` `90 days ago`
   - AND Date of last order `more than` `180 days ago`
2. Send a single **Re-permission email**: "We'll stop sending you emails unless you click to stay subscribed"
3. Anyone who does not click within 14 days: go to the segment → **Manage Members → Suppress All** — this removes them from all future sends without deleting them
4. Suppression is reversible — they can re-subscribe at any time

**In AutomateWoo:**
- Add a final step to your win-back workflow: after 30 days of no engagement, add the customer to an "unsubscribe" list or use the **Unsubscribe Customer** action

## Best Practices

- **Lead with connection, not desperation** — the first message should feel warm ("We've missed you") rather than transactional; aggressive discounts on message 1 train customers to wait for the win-back offer
- **Personalize with previous purchase context** — referencing what the customer previously bought increases open rates by 25–35% vs. generic "we miss you" subject lines; Klaviyo's `{{ event.extra.product_name }}` pulls last purchased product name automatically
- **Respect the email sunset** — suppressing non-engagers after 90 days of inactivity protects your domain reputation and improves deliverability for everyone else
- **Vary offer levels by LTV** — a 15% discount that wins back a $500 LTV customer is excellent ROI; the same discount on a $40 LTV customer barely covers the cost
- **Set a 60-day cooldown** — after a completed win-back cycle (converted or suppressed), do not re-enter the customer into another win-back flow for at least 60 days
- **Use SMS for mid-lapsed only** — SMS has high engagement but also high unsubscribe rates when used for lapsed contacts; reserve SMS for the mid-lapsed tier (121–180 days) where the customer relationship is still warm

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Win-back email sent the day after a purchase | Ensure exit conditions are set in Klaviyo flows; add a last-order-date check as a conditional split at every step |
| Discount codes being shared publicly | Create all win-back codes as single-use in Klaviyo (dynamic coupon codes); Klaviyo generates a unique code per recipient automatically |
| Win-back sequence triggering on customers who just unsubscribed | Klaviyo excludes suppressed profiles from all flows automatically; for manual setups, check consent status before every send |
| Repeat win-back campaigns on the same customer every 30 days | Set a 60-day cooldown segment condition; exclude customers who have exited any win-back flow in the last 60 days |
| Low reactivation rate on deep-lapsed (180+ days) | Try a "we're sorry, is everything okay?" empathetic tone for deep-lapsed; include a preference center link so they can choose email frequency rather than unsubscribing entirely |

## Related Skills

- @customer-retention-engine
- @lifecycle-marketing-automation
- @email-marketing-automation
- @email-list-segmentation
- @loyalty-program-optimization
