---
name: product-launch-campaigns
description: "Plan and execute multi-channel product launches with pre-launch waitlists, early access for VIPs, launch day orchestration, and post-launch momentum"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [product-launch, campaigns, go-to-market]
triggers: ["launch new product", "product launch campaign"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Product Launch Campaigns

## Overview

A successful product launch orchestrates email, SMS, paid social, influencer seeding, and organic content into a coordinated sequence that builds anticipation, converts pre-launch interest into day-one sales, and sustains momentum afterward. The difference between a flat launch and a sellout launch is rarely the product itself — it is the pre-launch waitlist size, VIP early access timing, and the velocity of day-one social proof. Most of the mechanics (waitlists, email sequences, paid campaigns) are configured in your existing tools without custom code.

## When to Use This Skill

- When launching a new product and needing a structured multi-channel campaign plan
- When previous product launches were underwhelming and lacked pre-launch buildup
- When building a waitlist or early-access mechanic to create demand signaling
- When needing to coordinate influencer seeding, email sequences, and paid ads into a single timeline
- When wanting to measure the incremental revenue lift of launch campaigns vs. organic listings

## Core Instructions

### Step 1: Plan your launch timeline

Run three phases for every product launch:

| Phase | Timing | Key Activities |
|-------|--------|----------------|
| Pre-launch | T-21 to T-1 | Teaser email, waitlist open, influencer seeding, product reveal |
| Launch day | T-0 | VIP early access, public launch email + SMS, paid social activation |
| Post-launch | T+1 to T+30 | Review collection, social proof email, retargeting campaigns |

**Minimum viable timeline:**
- T-14: Open waitlist + send reveal email
- T-7: Seed influencers with product
- T-1: Send "tomorrow is the day" email + SMS
- T-0 (8am): VIP early access email (24h before public)
- T+24h: Public launch email to full list + paid social goes live
- T+7: "X units sold in first week" social proof email

### Step 2: Build your waitlist

---

#### Shopify

**Option A: Klaviyo embedded form (recommended):**
1. Go to **Klaviyo → Sign-up Forms → Create Form**
2. Build an embedded form with email + "What's your interest in this product?" question
3. Tag submitters with `product-launch-[product-name]` so you can email them as a segment
4. Embed the form on a dedicated landing page (use a Shopify page template)
5. Create a Klaviyo segment: `"Has tag" = "product-launch-[product-name]"` — this is your waitlist

**Option B: Klaviyo back-in-stock (for limited inventory launches):**
1. Set product status to **Draft** or inventory to 0
2. Enable **Back in Stock** in Klaviyo — it adds a "Notify Me" button automatically
3. Klaviyo collects waitlist signups and triggers the launch email when you set inventory > 0

---

#### WooCommerce

1. Install **WooCommerce Waitlist** plugin ($79/yr) — adds a "Join Waitlist" button when a product is out of stock
2. Or use **OptinMonster** to build a dedicated waitlist landing page with email capture
3. Tag waitlist subscribers in your email platform (Klaviyo or Mailchimp) with the product launch tag

---

#### BigCommerce

1. Set the product to a hidden category or make it unlisted to prevent organic discovery
2. Use **Klaviyo's** embedded form to collect waitlist emails on a pre-launch landing page
3. Send the launch email to the waitlist segment when the product goes live

---

### Step 3: Configure VIP early access

Grant early access 24 hours before public launch to your highest-tier loyalty members and waitlist subscribers who signed up first.

---

#### Shopify with Smile.io + Klaviyo

1. In **Smile.io → VIP → [Your Platinum/Gold Tier]**, export the list of Gold and Platinum members
2. Import this list as a Klaviyo segment called "VIP Early Access — [Product Name]"
3. Create a product page with a **password** (Shopify Admin → Online Store → Pages → set password on a specific page), or use a **draft order** with a unique URL
4. Send an email to the VIP segment 24 hours before public launch with the early access link
5. Set the early access page to go public at launch time by removing the password

**Simpler alternative:** Create a 10% discount code called `VIP-EARLY-[PRODUCT]` valid only for VIP members and send it in the early access email.

---

#### WooCommerce with YITH Members or AffiliateWP

1. Create a **WooCommerce Membership** level called "VIP Early Access"
2. Assign Gold/Platinum loyalty customers to this membership
3. Restrict the new product's visibility to the VIP membership level until public launch
4. Send the early access email with the direct product link

---

### Step 4: Build the launch email sequence in Klaviyo

Create a **Segment-triggered flow** for the waitlist segment:

**Email 1 — Pre-launch reveal (send at T-14):**
- Subject: "Something new is coming. Here's your first look."
- Content: Product name + hero image + key benefit + CTA to join waitlist
- Send to: Full email list

**Email 2 — Urgency nudge (send at T-7):**
- Subject: "[Product] launches in 7 days — you're on the list"
- Content: Product features + social proof (early feedback from influencers if available)
- Send to: Waitlist segment only

**Email 3 — VIP early access (send at T-0 8am):**
- Subject: "[Early Access] [Product] is yours — 24 hours before everyone else"
- Content: Early access link + clear end time ("Access ends tomorrow at 8am")
- Send to: VIP / Gold & Platinum loyalty tier

**Email 4 — Public launch (send at T+24h):**
- Subject: "Introducing [Product] — available now"
- Content: Full product reveal + add to cart CTA + waitlist social proof ("X people have been waiting for this")
- Send to: Full email list (exclude VIP segment who received early access)

**Email 5 — Social proof follow-up (send at T+7):**
- Subject: "[X] people love [Product] in the first week"
- Content: Early reviews + UGC photos from first buyers + CTA
- Send to: Non-converters from the full list

### Step 5: Activate paid social on launch day

Build campaigns in Meta Ads Manager before launch day so they can be switched on instantly:

**Launch day campaign structure:**

| Campaign | Audience | Budget | Creative |
|---------|---------|--------|---------|
| Retargeting — Waitlist | Upload waitlist as custom audience | 30% of daily budget | Product reveal video or carousel |
| Prospecting — Lookalike | 1% lookalike of email list | 50% of daily budget | Launch video + testimonial |
| Retargeting — Page visitors | Visitors to pre-launch landing page (last 30 days) | 20% of daily budget | Dynamic product ad |

1. Build all three campaigns in **Meta Ads Manager** with the budget set, but set status to **Paused**
2. On launch day, switch all campaigns to **Active** simultaneously
3. After 48 hours, pause the lowest-performing ad set and reallocate budget to winners

### Step 6: Seed influencers before launch

1. Ship product samples to influencers 21 days before launch with a written brief that includes:
   - Embargo date: "Do not post before [public launch date]"
   - Required tags: brand hashtag, `#gifted` or `#ad`
   - Suggested messaging (not a script — just key benefits)
2. Confirm the embargo verbally and in writing — this is the most common failure point
3. Coordinate with influencers to post within the first 48 hours of launch for maximum velocity
4. See @influencer-tracking for UTM link and discount code setup per influencer

### Step 7: Measure launch performance

| Metric | Target | Where to Find |
|--------|--------|---------------|
| Waitlist size at launch | 500+ | Klaviyo segment size |
| Day-1 revenue | 5–10× a normal day for that product | Shopify Analytics |
| Day-7 revenue | 3–5× normal daily average | Shopify Analytics |
| Waitlist conversion rate | > 20% | Klaviyo flow analytics |
| Post-launch review velocity | 10+ reviews in first 14 days | Your review platform |

## Best Practices

- **Build the waitlist at least 14 days before launch** — 500+ waitlist signups on launch day creates measurable velocity; below 200 makes it difficult to generate social proof momentum
- **Seed influencers 3–4 weeks before launch** — content takes time to produce; seeding too late means influencer posts go live after the launch window
- **Lift VIP early access 24 hours before public** — this is the sweet spot; same day creates no VIP benefit, earlier than 24 hours dilutes the public launch
- **Post UGC from early access customers on launch day** — real customer photos posted by the brand (with permission) on launch day dramatically boost credibility
- **Have a back-order mechanism ready** — if launch velocity exceeds forecasts, show "Back-ordered — ships in X weeks" rather than "Sold out" with no action path

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Waitlist emails going to spam | Use a plain-text email template for the launch sequence; avoid image-heavy designs for deliverability |
| Influencer content posted before embargo | Include the embargo date prominently in the brief; send a reminder 3 days before the embargo lifts |
| VIP early access page accessible to everyone | Use Shopify's password-protected page or a discount code valid only for VIP customers — do not just hide the URL |
| Launch email to full list scheduled at wrong time | Schedule all launch emails at least 24 hours in advance; use Klaviyo's scheduled send, not manual |
| Low review count after launch | Send a review request email 7 days after delivery (not 3 days — product needs to be used first) |

## Related Skills

- @email-marketing-automation
- @loyalty-program-optimization
- @influencer-marketplace-integration
- @meta-ads-integration
- @seasonal-campaign-automation
