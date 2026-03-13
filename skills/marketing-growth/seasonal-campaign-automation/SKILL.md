---
name: seasonal-campaign-automation
description: "Automate seasonal marketing campaigns for Black Friday, holidays, and shopping events with templated workflows, countdown sequences, and year-round planning"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [seasonal, black-friday, holiday-marketing]
triggers: ["plan seasonal campaigns", "Black Friday campaign"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Seasonal Campaign Automation

## Overview

Seasonal peaks — Black Friday/Cyber Monday, holiday gifting, Valentine's Day, Back-to-School — can account for 30–50% of annual ecommerce revenue for many categories. Automating seasonal campaigns means building reusable email flows and discount templates that activate on calendar triggers rather than requiring manual setup each time. Klaviyo's scheduled sends and Shopify's automated discounts handle most of this without custom code.

## When to Use This Skill

- When planning Black Friday/Cyber Monday campaigns and needing a structured playbook
- When seasonal campaigns are built from scratch every year with no reusable templates
- When wanting to automate countdown email sequences for a sale event
- When needing to schedule promotional pricing changes in sync with email and ad campaigns

## Core Instructions

### Step 1: Define the seasonal campaign calendar

Plan your full campaign year in a single document. The most important ecommerce events by revenue impact:

| Event | Timing | Lead Time Needed |
|-------|--------|-----------------|
| Black Friday / Cyber Monday | 4th Friday of November | 8 weeks |
| Holiday gifting (Christmas) | Dec 1–20 | 6 weeks |
| Valentine's Day | Feb 14 | 4 weeks |
| Mother's Day | 2nd Sunday of May | 4 weeks |
| Back-to-School | August | 6 weeks |
| Summer Sale | July | 4 weeks |

Build email templates and discount codes for each event in September (for BFCM) or 8 weeks in advance for other events.

### Step 2: Build your BFCM email sequence

---

#### Shopify with Klaviyo

1. Go to **Klaviyo → Campaigns → Create Campaign** and create a folder called "BFCM 2026"
2. Build the following scheduled campaigns (all as one-time sends):

| Campaign Name | Send Date | Segment | Subject |
|-------------|-----------|---------|---------|
| BFCM Teaser | T-21 | All subscribers | "Something big is coming…" |
| BFCM Preview | T-14 | All subscribers | "Early access preview — save the date" |
| VIP Early Access | T-7 | VIP segment (loyalty Gold+) | "25% off — yours 24h early" |
| Countdown (3 days) | T-3 | All subscribers | "3 days until Black Friday" |
| Launch Eve | T-1 | All subscribers | "Tomorrow: our biggest sale of the year" |
| Launch Day | T-0 (8am) | All subscribers | "25% off everything — Black Friday is live" |
| Cyber Monday | T+3 | Non-purchasers from above | "Last chance: Cyber Monday sale ends tonight" |

3. Build each email template now, save as a reusable Klaviyo template — next year you update the discount value and dates only
4. Add a **countdown timer image** to launch day and Cyber Monday emails using Klaviyo's native countdown timer block (available under Content → Dynamic Content)

**Segment non-purchasers for Cyber Monday:**
In Klaviyo, create a segment: "Has received BFCM Launch campaign AND has NOT placed an order since [T-0 date]" — send Cyber Monday email only to this group

---

#### WooCommerce with Klaviyo (or Mailchimp)

1. Connect Klaviyo to WooCommerce using the Klaviyo plugin or the **Klaviyo for WooCommerce** extension
2. Build the same campaign sequence as above in Klaviyo — the campaign structure is platform-agnostic
3. For customers using Mailchimp: build a Customer Journey map with scheduled email nodes at the same offsets

**Alternative (simpler):** Use **AutomateWoo** workflows triggered by dates — set up date-based triggers for each campaign step.

---

#### BigCommerce with Klaviyo

1. Klaviyo syncs all BigCommerce order history automatically
2. Follow the same Klaviyo campaign setup as the Shopify section above
3. For the VIP segment: use Klaviyo's `Total Customer Value > $500` predicate to identify high-value customers

---

### Step 3: Schedule promotional pricing

---

#### Shopify

1. Go to **Shopify Admin → Discounts → Create Discount → Amount off products**
2. Configure:
   - Discount type: Percentage (e.g., 25%)
   - Applies to: All products (or specific collections)
   - Active dates: Set start = Black Friday 12:00am, End = Cyber Monday 11:59pm
   - Shopify automatically activates and deactivates the discount at the set times
3. For automatic discount (applied at checkout without code): go to **Shopify → Discounts → Create Automatic Discount**
4. For a sitewide sale with original/sale price displayed on product pages: use **Shopify → Products → Bulk Edit** to set compare_at_price = original price and price = sale price; then revert after the sale

**Important:** If using a discount code approach (recommended for BFCM), announce the code in every email and across social — friction from requiring a code reduces conversion; automatic discounts convert better.

---

#### WooCommerce

1. Go to **WooCommerce → Marketing → Coupons → Add Coupon**
2. Configure:
   - Coupon type: Percentage discount
   - Coupon amount: 25
   - Usage restriction: No minimum order (for BFCM)
   - Usage limits: Leave blank (unlimited)
   - Expiry date: Cyber Monday 11:59pm
3. For automatic pricing on all products: use **WooCommerce → Products → Bulk Edit** to set sale price, then bulk-remove it after the event

---

#### BigCommerce

1. Go to **BigCommerce → Marketing → Promotions → Create Promotion**
2. Configure the percentage off, start date, and end date
3. BigCommerce applies and removes promotions automatically based on the schedule

---

### Step 4: Set up SMS for seasonal events

Send 1–2 SMS per event maximum. More than 2 SMS in a 4-day period causes significant unsubscribe spikes.

**In Klaviyo SMS:**
1. Create an SMS campaign alongside the email campaigns
2. Best send times: Launch day at 9am (first SMS), Cyber Monday morning (second SMS if not purchased)
3. Subject for launch day: "BFCM is live — 25% off everything: [store link] — Reply STOP to opt out"

**In Postscript (Shopify):**
1. Go to **Postscript → Campaigns → Create Campaign**
2. Set the audience to "All subscribed" minus "Has purchased in last 3 days"
3. Schedule for launch day at 9am local time

### Step 5: Warm up your email domain before BFCM

Sending a sudden volume spike on Black Friday damages your domain reputation. Start 4 weeks before:

1. In Klaviyo, increase sends by 10% per week starting in October
2. Go to **Klaviyo → Account → Sending Infrastructure** and check your sending domain health
3. Suppress unengaged contacts (no opens in 90+ days) before BFCM — sending to cold contacts tanks deliverability

### Step 6: Measure seasonal lift

| Metric | Target | Where to Find |
|--------|--------|---------------|
| Revenue vs. prior year (YoY growth) | 15–30% YoY | Shopify Analytics → Compare dates |
| Email revenue during event | 30–40% of event revenue | Klaviyo → Campaign analytics |
| Email list unsubscribe rate (BFCM week) | < 0.5% per campaign | Klaviyo campaign analytics |
| Discount code redemption rate | > 25% of emails clicked | Shopify → Analytics → Discounts |

## Best Practices

- **Build templates in September, send in November** — last-minute BFCM campaigns have poor creative and poor deliverability; email templates must be ready 8 weeks out
- **Cap at 4–5 emails total across BFCM week** — sending 7+ emails causes significant unsubscribe spikes; 4 is the comfortable maximum per customer
- **Give VIPs 24-hour early access** — loyalty Gold and Platinum customers get the same discount 24 hours before the public launch; this is the most cost-effective way to make your best customers feel valued
- **Use automatic discounts for conversion rate** — removing the friction of entering a coupon code typically increases conversion rate 10–15% compared to code-based discounts
- **Schedule the pricing rollback before launch** — setting the end date in Shopify's discount scheduler before BFCM starts prevents the most common post-sale mistake (forgetting to turn off the discount)

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Discount still active after Cyber Monday | Always set an end date/time in the discount or promotion settings before launching |
| BFCM email going to spam | Suppress unengaged contacts 2 weeks before BFCM; use a confirmed warm sending domain |
| VIP early access email sent to entire list | Build the VIP segment in Klaviyo before scheduling the campaign; verify segment size before sending |
| Countdown timer shows wrong timezone | Use Klaviyo's native countdown timer which adapts to the recipient's timezone automatically |
| Email sequence sending to already-purchased customers | Add a flow filter to all post-launch emails: "Has NOT placed an order since [launch date] → continue" |

## Related Skills

- @email-marketing-automation
- @product-launch-campaigns
- @sms-marketing
- @meta-ads-integration
- @loyalty-program-optimization
