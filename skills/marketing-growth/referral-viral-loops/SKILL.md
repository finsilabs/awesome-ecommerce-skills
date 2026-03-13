---
name: referral-viral-loops
description: "Build referral mechanics with dual-sided rewards, unique tracking links, viral coefficient optimization, and anti-fraud controls for referral abuse"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [referral, viral, word-of-mouth]
triggers: ["build referral program", "create viral loop"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Referral Viral Loops

## Overview

Word-of-mouth referral programs are one of the lowest-cost customer acquisition channels — referred customers have 37% higher retention rates and 25% higher LTV than non-referred customers. A dual-sided referral (reward both the referrer and the new customer) typically outperforms one-sided rewards by 2–3×. Dedicated referral apps (ReferralCandy, Friendbuy, Yotpo Loyalty) handle link generation, reward fulfillment, and fraud controls without custom code.

## When to Use This Skill

- When CAC is high and word-of-mouth is underutilized
- When existing customers frequently refer friends informally but there is no structured program to track and reward it
- When needing to scale a referral program that has been running manually
- When wanting to calculate K-factor and optimize the program's viral coefficient

## Core Instructions

### Step 1: Choose the right referral platform

| Platform | Best For | Shopify | WooCommerce | BigCommerce | Price |
|----------|---------|---------|-------------|-------------|-------|
| **ReferralCandy** | Simple setup, all major platforms | App Store | Plugin | App Marketplace | $59+/mo |
| **Friendbuy** | Mid-market DTC, A/B testing rewards | App Store | Via JS | Via JS | $249+/mo |
| **Yotpo Loyalty** | Brands already using Yotpo | App Store | Limited | App Marketplace | $199+/mo |
| **Smile.io Referrals** | Already using Smile.io for loyalty | App Store | Plugin | App Marketplace | Included in $49/mo plan |
| **Rewardful** | SaaS + ecommerce via Stripe | Via Stripe | Via Stripe | Via Stripe | $49+/mo |
| **AffiliateWP** | WooCommerce-native | — | Plugin | — | $149/yr |

**Recommendation:** Use **ReferralCandy** for most stores — quick setup, dual-sided rewards built in, fraud detection included, and competitive pricing. If you are already using Smile.io for loyalty, add their referral module instead of a separate app.

### Step 2: Design your referral program structure

Before installing anything, define the reward structure:

**Dual-sided reward (recommended):**
- Referrer reward: $10 store credit for every successful referral (paid after refund window)
- Referee reward (new customer): 15% off first order, no minimum

**Single-sided reward (simpler but lower share rate):**
- Referrer reward only: $15 store credit

**Minimum order for referral to qualify:** $30 (prevents micro-order gaming)

**Refund window:** Wait 7–14 days after the referee's order before granting the referrer reward — this prevents rewards on returned orders.

### Step 3: Set up your referral program

---

#### Shopify with ReferralCandy

1. Install **ReferralCandy** from the Shopify App Store
2. Go to **ReferralCandy → Program → Rewards** and configure:
   - Referrer reward: "$10 store credit" (or cash via PayPal)
   - Referee reward: "15% off first order" (ReferralCandy creates a unique discount code per referral link)
   - Minimum order: $30
3. Go to **ReferralCandy → Program → Fraud Settings** and enable:
   - Block self-referrals
   - Flag same-IP conversions for review
   - Set maximum referrals per customer per month (10)
4. Go to **ReferralCandy → Integrations** and connect Klaviyo — this allows referral events to trigger Klaviyo flows
5. ReferralCandy automatically:
   - Generates a unique referral link per customer (e.g., `yourstore.com/?via=sarah123`)
   - Displays the referral widget on the post-purchase page
   - Sends referral invitation emails to new customers after purchase
   - Tracks clicks, signups, and conversions per referrer
6. Go to **ReferralCandy → Promote** and add the referral widget to your account dashboard and post-purchase confirmation page

---

#### Shopify with Smile.io Referrals

1. Go to **Smile.io → Programs → Referrals**
2. Enable the referral program and configure:
   - Referrer reward: points or store credit
   - Referee reward: discount code sent automatically when they click the referral link
3. Go to **Smile.io → Rewards Panel** to customize how the referral link appears in the loyalty widget

---

#### WooCommerce with AffiliateWP

1. Install **AffiliateWP** ($149/yr) from the WooCommerce marketplace
2. Go to **AffiliateWP → Settings → General** and configure:
   - Commission rate: fixed amount ($10) or percentage
   - Cookie expiration: 30 days (referral attribution window)
3. Go to **AffiliateWP → Affiliates → Add Affiliate** to manually add customers, or enable self-registration so customers can join as affiliates
4. AffiliateWP generates a unique affiliate link per referrer: `yourstore.com/?ref=AFFILIATE_ID`
5. For referee discount: create a WooCommerce coupon code and link it to the referral program (AffiliateWP has a coupon integration add-on)
6. For fraud controls: go to **AffiliateWP → Settings → Advanced** and enable IP address duplicate detection

**Alternative:** Install **ReferralCandy** for WooCommerce (plugin) for a simpler dual-sided setup.

---

#### BigCommerce with ReferralCandy

1. Install **ReferralCandy** from the BigCommerce App Marketplace
2. Configuration is identical to the Shopify setup above
3. ReferralCandy integrates with BigCommerce's native coupon system to issue referee discount codes

---

#### Custom / Headless

Use a dedicated referral API platform like **Friendbuy** or **Rewardful** rather than building from scratch. These provide:
- Unique referral link generation
- Cookie-based and URL-based attribution
- Webhook events for referral conversions
- Fraud signal APIs

If you must build custom, the core components are:

```typescript
// Generate a unique referral code per customer
async function generateReferralCode(customerId: string): Promise<string> {
  const existing = await db.referralLinks.findOne({ where: { customerId } });
  if (existing) return existing.code;

  const customer = await db.customers.findById(customerId);
  const baseCode = customer.firstName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6);
  let code = `${baseCode}${Math.floor(100 + Math.random() * 900)}`;

  while (await db.referralLinks.findOne({ where: { code } })) {
    code = `${baseCode}${Math.floor(100 + Math.random() * 900)}`;
  }

  await db.referralLinks.create({ customerId, code, clicks: 0, conversions: 0 });
  return code;
}

// Attribute referral on order completion — check cookie for referral code
async function attributeReferral(order: Order, referralCode: string | null) {
  if (!referralCode) return;

  const referralLink = await db.referralLinks.findByCode(referralCode);
  if (!referralLink) return;
  if (referralLink.customerId === order.customerId) return; // no self-referral

  // Check if this email has already been referred (one referral per email per program)
  const existing = await db.referralConversions.findOne({ where: { refereeEmail: order.customerEmail } });
  if (existing) return;

  await db.referralConversions.create({
    referralLinkId: referralLink.id,
    referrerId: referralLink.customerId,
    refereeEmail: order.customerEmail,
    orderId: order.id,
    orderValue: order.subtotal,
    status: 'pending', // set to 'approved' after 7-day refund window
  });

  // Grant referee discount immediately (e.g., store credit or discount code)
  // Schedule referrer reward 7 days after order — after refund window
}
```

### Step 4: Promote your referral program

**Highest-traffic placements:**
1. **Post-purchase confirmation page** — add a referral widget immediately after checkout (highest-intent moment)
2. **Transactional email** — add "Give $10, Get $10" block to every order confirmation email in Klaviyo
3. **Account dashboard** — show the customer's referral link and stats (how many friends referred, how much earned)
4. **Packaging insert** — include a card with the customer's referral URL printed or handwritten

In ReferralCandy: go to **Promote → Post-Purchase Popup** to enable the automatic widget and **Promote → Emails** to configure referral invitation emails.

### Step 5: Measure program performance

| Metric | Target | Where to Find |
|--------|--------|---------------|
| Share rate (% of customers who refer) | > 5% | ReferralCandy dashboard |
| Referral conversion rate | > 15% of clicks convert | App analytics |
| K-factor (share rate × conversion rate) | 0.3–0.5 = strong; 1.0+ = viral | Calculate from share rate × conversion rate |
| Revenue from referred customers | 10–20% of total new customer revenue | App analytics |
| Cost per acquisition via referral | Usually 40–60% below paid CAC | Reward cost ÷ referred orders |

## Best Practices

- **Dual-sided rewards outperform one-sided** — giving both referrer and referee a reward increases share rates by 2–3× vs. rewarding only the referrer
- **Show the referral widget on the post-purchase confirmation page** — this is the highest-intent moment; customers who just had a great purchase experience are most likely to share
- **Delay referrer reward by 7–14 days** — wait until the refund window passes before granting the reward; prevents fraudsters getting rewards on returned orders
- **Use store credit over discount codes for referrer rewards** — store credit ties the referrer back to your brand; perceived value is higher than a percentage off
- **Set a monthly cap per customer** — even legitimate customers should not earn unlimited rewards; cap at 5–10 referrals per month
- **Add a pre-filled WhatsApp or SMS share button** — most customers will not manually copy and paste a link; a one-tap share button doubles share rates

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Self-referral fraud (customer creates new account to get referee discount) | Enable IP-based duplicate detection; flag same-IP conversions for manual review (ReferralCandy has this built in) |
| Referral codes shared publicly on coupon sites | Make codes unique per referrer so bulk sharing is detectable; ReferralCandy monitors velocity automatically |
| Referrer reward given before order ships | Always delay referrer reward by 7+ days; use the app's built-in reward delay setting |
| Low share rate despite good rewards | Reduce friction — use pre-filled share messages; show the referral widget immediately post-purchase |
| Referred customers do not convert | Increase the referee incentive — 15% off typically outperforms 10% off for first-order conversion |

## Related Skills

- @loyalty-program-optimization
- @affiliate-program
- @customer-retention-engine
- @email-marketing-automation
- @first-party-data-collection
