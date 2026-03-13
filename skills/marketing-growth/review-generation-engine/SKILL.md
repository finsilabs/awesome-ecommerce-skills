---
name: review-generation-engine
description: "Automatically request and collect product reviews post-purchase with timed email/SMS sequences, photo incentives, and fraud detection for fake reviews"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [reviews, ratings, social-proof]
triggers: ["generate more reviews", "automate review requests"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Review Generation Engine

## Overview

Product reviews are the most trusted form of social proof — 88% of shoppers consult reviews before purchasing, and products with 50+ reviews convert 4.6% better than those with none. The fastest path to high review volume is a systematic post-purchase request sequence triggered by delivery confirmation, not order placement. Dedicated review apps (Judge.me, Yotpo, Stamped) handle the entire request flow, photo upload UI, and verified buyer badges without custom code.

## When to Use This Skill

- When a new product has fewer than 10 reviews and needs social proof to convert
- When overall review volume is low despite healthy order volume
- When wanting to add photo or video review incentives to an existing text-only system
- When migrating to a new review platform and needing to rebuild the request sequence

## Core Instructions

### Step 1: Choose the right review platform

| Platform | Best For | Shopify | WooCommerce | BigCommerce | Price |
|----------|---------|---------|-------------|-------------|-------|
| **Judge.me** | Best value, full features | App Store | Plugin | App Marketplace | Free tier; $15/mo for photos |
| **Yotpo** | Enterprise, social sharing, UGC | App Store | Plugin | App Marketplace | Free tier; $119+/mo |
| **Stamped.io** | Loyalty + review combination | App Store | Plugin | App Marketplace | $23+/mo |
| **Okendo** | DTC brands, media reviews, attributes | App Store | — | — | $19+/mo |
| **WooCommerce Reviews** | Basic, built-in | — | Built-in | — | Free |

**Recommendation:** Use **Judge.me** for most stores — the best feature-to-price ratio, free plan allows unlimited reviews, and $15/month unlocks photo reviews (the single highest-converting feature).

### Step 2: Configure your review request sequence

---

#### Shopify with Judge.me

1. Install **Judge.me** from the Shopify App Store
2. Go to **Judge.me → Settings → Review Requests**
3. Configure the request timing:
   - First request: **7 days after order fulfillment** (not order placement — wait until the product is received and used)
   - Second request (if no review): **14 days after first request**
4. Go to **Judge.me → Settings → Emails** and customize:
   - Email 1 (day 7): Simple request with star rating widget — clicking a star pre-fills the rating in the form
   - Email 2 (day 21): Add a photo review incentive — "Add a photo and get 15% off your next order"
5. Enable **Verified Buyer badge** — displayed automatically on reviews from confirmed purchasers
6. Go to **Judge.me → Settings → Moderation** and set auto-publish rules:
   - Auto-publish: ratings 3–5 stars
   - Hold for manual review: ratings 1–2 stars

---

#### WooCommerce with Judge.me

1. Install the **Judge.me for WooCommerce** plugin
2. Configuration mirrors the Shopify setup
3. Alternatively, use **Yotpo for WooCommerce** if you want UGC and social sharing built in

**For WooCommerce's built-in reviews + AutomateWoo:**
1. Enable **WooCommerce → Settings → Products → Reviews**
2. Create an AutomateWoo workflow:
   - Trigger: **Order Delivered** (or Order Status = Completed + 7 day delay)
   - Action: **Send Email** with a link to the product review page
3. This is free but lacks photo review support and star rating widgets — use Judge.me for higher conversion rates

---

#### BigCommerce with Yotpo

1. Install **Yotpo** from the BigCommerce App Marketplace
2. Go to **Yotpo → Reviews → Mail After Purchase** and configure:
   - Send timing: 7 days after order fulfilled
   - Enable follow-up email: 14 days if no review submitted
3. Configure the smart prompts — Yotpo's review form is embedded in the email itself, allowing customers to submit a rating without leaving the email

---

### Step 3: Set up photo review incentives

Photo reviews increase conversion rate 4× more than text reviews. The incentive should reward the photo specifically, not the review itself (incentivizing reviews violates FTC guidelines; incentivizing photo submission is permitted with proper disclosure).

**In Judge.me:**
1. Go to **Judge.me → Settings → Coupons**
2. Enable **Photo review coupon**: "Add a photo to your review and receive 15% off your next order"
3. Judge.me issues the coupon automatically after a photo review is approved

**In Yotpo:**
1. Go to **Yotpo → Reviews → Incentives**
2. Enable **Media Reviews incentive** with a discount code

### Step 4: Display reviews on product pages

All review apps provide a widget snippet or theme block. For Shopify:

1. Go to **Judge.me → Widgets → Review Widget**
2. Install the widget in your theme via **Shopify → Online Store → Themes → Customize → Add Section → Judge.me Review Widget**
3. Place the review widget below the product description on product pages
4. Enable **Review Carousel** for the homepage to display your best reviews site-wide

### Step 5: Measure review program health

| Metric | Healthy Target | Where to Find |
|--------|----------------|---------------|
| Review request open rate | > 35% | App analytics |
| Review submission rate | 5–15% of requests | App analytics |
| Photo review rate | > 20% of all reviews | App analytics |
| Average product rating | > 4.2 stars | Product pages / app dashboard |
| Review count per product (top products) | > 50 | App analytics |

If submission rate is below 5%, the request is being sent too early (before delivery) or the form has too many required fields. Set the request to fire 7 days after fulfillment and reduce the form to star rating + 1 text field.

### Step 6: Custom / Headless

For headless stores, use a review platform API (Judge.me, Yotpo, or Stamped all have REST APIs) rather than building a custom review system. The review collection, moderation, and display widgets are all available as embeddable components.

If you must collect reviews via a custom form, generate a tokenized review link that pre-identifies the customer and product so they do not need to log in:

```typescript
// Generate a signed review link — valid for 30 days
function generateReviewToken(orderId: string, productId: string, customerId: string): string {
  const payload = { orderId, productId, customerId, exp: Math.floor(Date.now() / 1000) + 30 * 86400 };
  return jwt.sign(payload, process.env.REVIEW_JWT_SECRET!);
}

// Include ?rating=4 in the link when the customer clicks a star in the email
// This pre-fills the rating on the form — single most important UX optimization for review volume

// Schedule review requests via your order webhook (Shopify/WooCommerce/BigCommerce)
// Trigger: order status transitions to "delivered" (use carrier tracking webhook)
// Step 1: 7 days after delivery
// Step 2: 14 days after delivery (if no review submitted yet) — add photo incentive
// Cancel remaining steps when a review is submitted
```

## Best Practices

- **Time the request to after confirmed delivery** — asking for a review before the product arrives damages trust; use your platform's order fulfillment status, not order placed
- **Make the star rating widget clickable in the email** — each star links to the review form with `?rating=N` pre-filled; this single feature typically doubles review submission rates
- **Never pay cash for positive reviews** — financial incentives for reviews violate FTC guidelines; only offer incentives for adding media (photos/video) to an existing review
- **Verified buyer badge drives conversion** — mark reviews from confirmed purchasers and display it prominently; shoppers trust verified reviews significantly more than anonymous ones
- **Respond to negative reviews publicly** — brands that respond to 1–2 star reviews with empathy and resolution offers build more trust than brands with only 5-star reviews
- **Cap at 2 review requests per order** — a third request causes unsubscribes; two requests (day 7 + day 21) is the maximum

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Review requests sent to customers who returned the order | Configure the app to skip review requests when an order has a return or refund; most review apps support this under refund settings |
| Low review rate despite high open rate | The form has too much friction — reduce required fields to star rating + one text field |
| Photo reviews not triggering the coupon | Check the app's approval settings — the coupon fires only after the photo review is approved, not submitted |
| Review volume spikes followed by sudden drops | You may have trained customers to wait for the incentive; make the incentive visible in email 2 only, not email 1 |
| Products with no reviews showing a blank section | Configure a fallback in the review widget — show "Be the first to review this product" with a CTA |

## Related Skills

- @social-proof-widgets
- @ugc-campaign-management
- @email-marketing-automation
- @loyalty-program-optimization
- @customer-retention-engine
