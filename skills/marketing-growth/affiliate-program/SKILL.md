---
name: affiliate-program
description: "Track affiliate sales with unique links, manage commission tiers, automate payouts, and detect fraudulent referrals to protect your margins"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [affiliate, referral, commission, tracking, fraud-detection, payout, utm, partner-program]
triggers: ["affiliate program", "affiliate tracking", "commission tiers", "affiliate payout", "partner program", "affiliate fraud detection", "referral tracking"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Affiliate Program

## Overview

An affiliate program pays partners a commission for each sale they refer, making it a performance-based acquisition channel with no upfront media cost. The right setup depends on your platform — most merchants get 90% of the value from a dedicated app without writing any code. Custom commission rules, fraud detection, and automated payouts are where custom development adds value.

## When to Use This Skill

- When launching a creator or influencer partnership program with revenue share
- When replacing a third-party affiliate network (ShareASale, CJ) to reduce 20–30% network fees
- When needing custom commission rules (category-specific rates, SKU exclusions, tiered volume bonuses)
- When fraud in an existing affiliate program is eroding margins
- When generating 1099 tax reporting for US-based affiliates

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Refersion or UpPromote (Shopify App Store) | Native Shopify integration, automatic coupon + link generation, built-in fraud detection, PayPal/Stripe payouts |
| **WooCommerce** | AffiliateWP ($149/yr) or Solid Affiliate | Deep WooCommerce integration, per-product commission rates, real-time reporting, Stripe payout add-on |
| **BigCommerce** | Refersion or Goaffpro (BigCommerce App Marketplace) | Native checkout integration, multi-tier commissions, real-time dashboards |
| **Custom / Headless** | Rewardful (SaaS, $49/mo) or build custom with Stripe Connect | Rewardful handles tracking, fraud detection, and payouts; use custom code only for complex commission logic |

### Step 2: Set up your affiliate app

---

#### Shopify

**Using Refersion (recommended):**

1. Install Refersion from the Shopify App Store
2. Go to **Refersion Dashboard → Settings → General** and configure:
   - Default commission rate (start with 10–15% for most verticals)
   - Cookie duration (30 days is standard)
   - Minimum payout threshold ($50 recommended)
3. Go to **Commissions → Commission Groups** to create tiers:
   - Bronze: 10% (default)
   - Silver: 12% (unlocks at $5k/month referred revenue)
   - Gold: 15% (unlocks at $20k/month)
4. Refersion automatically generates unique tracking links (`yourstore.com?rfsn=XXXXX`) and injects a tracking pixel at checkout — no code required
5. Go to **Affiliates → Recruitment Page** to enable a self-service signup portal where partners can apply
6. For Shopify Plus stores: use Shopify Flow to automatically tag high-value affiliates and trigger tier upgrades

**Using UpPromote (free plan available):**

1. Install UpPromote from the Shopify App Store
2. Go to **UpPromote → Programs → Create Program** and set commission rules
3. Enable automatic discount code generation for each affiliate under **Settings → Affiliate Links**
4. Connect PayPal or Wise under **Settings → Payment** for automated payouts

---

#### WooCommerce

**Using AffiliateWP:**

1. Install and activate AffiliateWP on your WordPress site
2. Go to **AffiliateWP → Settings → General** and configure:
   - Referral rate: 10% (start conservative)
   - Cookie expiration: 30 days
   - Credit last referrer: yes (last-click attribution)
3. Go to **AffiliateWP → Settings → Payouts** and connect PayPal or enable manual payouts
4. Enable per-product commission rates under **Settings → Misc → Per-Product Rates** — this allows you to set 4% on electronics and 20% on digital products
5. Install the **AffiliateWP – Fraud Prevention** add-on ($49) to automatically flag self-referrals and IP velocity abuse
6. Affiliates access their dashboard at `yoursite.com/affiliate-area/`

**Tier automation with WooCommerce hooks:**
```php
// In functions.php — promote affiliate to Silver tier when monthly revenue > $5k
add_action('affwp_update_affiliate', function($affiliate_id) {
    $month_revenue = affwp_get_affiliate_earnings($affiliate_id, true); // current month
    if ($month_revenue >= 5000 && affwp_get_affiliate_rate($affiliate_id) < 0.12) {
        affwp_update_affiliate(['affiliate_id' => $affiliate_id, 'rate' => '12']);
    }
});
```

---

#### BigCommerce

1. Install **Refersion** or **Goaffpro** from the BigCommerce App Marketplace
2. Both apps integrate with BigCommerce's order webhooks automatically — no code required
3. Configure commission tiers and payout schedules in the app dashboard
4. BigCommerce's built-in coupon system works with both apps to generate affiliate-specific discount codes

---

#### Custom / Headless

For headless storefronts, use **Rewardful** (SaaS) to avoid building tracking infrastructure from scratch:

1. Add Rewardful's JavaScript snippet to your storefront
2. On purchase confirmation, identify the customer:
```javascript
rewardful('convert', { email: order.customerEmail });
```
3. Rewardful handles cookie attribution, fraud detection, and Stripe Connect payouts automatically

If you need custom commission logic that Rewardful cannot handle, build the tracking layer:

```typescript
// Track affiliate click and set cookie
export async function trackAffiliateClick(req: Request, res: Response) {
  const code = req.query.aff as string;
  const affiliate = await db.affiliates.findByCode(code);
  if (!affiliate) return res.redirect('/');

  await db.affiliateClicks.create({
    affiliateId: affiliate.id,
    ip: req.ip,
    clickedAt: new Date(),
  });

  res.cookie('aff', affiliate.id, {
    maxAge: 30 * 86400 * 1000, // 30-day cookie
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });

  return res.redirect(req.query.redirect as string ?? '/');
}

// Attribute order and calculate commission
async function attributeOrderToAffiliate(orderId: string, affiliateCookieId: string) {
  const order = await db.orders.findById(orderId);
  const affiliate = await db.affiliates.findById(affiliateCookieId);
  if (!affiliate) return;

  // Fraud check: flag self-referrals
  if (order.customerEmail === affiliate.email) {
    await db.affiliateConversions.create({ orderId, affiliateId: affiliate.id, status: 'flagged' });
    return;
  }

  const commissionRate = { bronze: 0.10, silver: 0.12, gold: 0.15 }[affiliate.tier];
  const commission = (order.subtotalCents / 100) * commissionRate;

  await db.affiliateConversions.create({
    orderId,
    affiliateId: affiliate.id,
    commissionAmount: commission,
    status: 'pending', // hold for 30-day refund window
  });
}
```

Use Stripe Connect for payouts — it handles KYC, tax forms, and international transfers:
```typescript
const transfer = await stripe.transfers.create({
  amount: Math.round(totalCommission * 100),
  currency: 'usd',
  destination: affiliate.stripeConnectAccountId,
  description: `Affiliate commission — ${month}`,
});
```

### Step 3: Configure commission and fraud rules

Regardless of platform, configure these settings in your affiliate app:

1. **Commission base**: set commission on subtotal only — never on tax or shipping
2. **Refund window**: hold commissions for 30 days before approving (most apps call this "pending" status)
3. **Minimum payout**: set $50–$100 to reduce payment fees
4. **Self-referral blocking**: enable in app settings (Refersion and AffiliateWP both have this built in)
5. **Category exclusions**: exclude gift cards and already-discounted items from commission base
6. **FTC compliance**: require affiliates to disclose their relationship in all posts

### Step 4: Measure performance

Track these metrics in your affiliate app's dashboard:

| Metric | Target | Where to Find |
|--------|--------|---------------|
| Click-to-conversion rate | 2–5% | Refersion: Reports → Conversions. AffiliateWP: Reports tab |
| Average commission payout | Track vs. ROAS | Affiliate app → Payout reports |
| Fraud rate (flagged conversions) | < 2% | Check flagged/pending queue monthly |
| Top 10 affiliates by revenue | — | Affiliate app → Leaderboard |

## Best Practices

- **Issue unique discount codes per affiliate** (not just UTM links) — discount codes are more reliable for attribution when affiliates use link-in-bio tools that strip UTM parameters
- **Hold commissions for 30 days** before approving — never pay out on orders that might be returned
- **Set a minimum payout threshold** ($50–$100) to reduce payment processing fees and discourage fraud
- **Require onboarding** (PayPal email or Stripe Connect) before an affiliate can receive payments — this creates a paper trail
- **Audit affiliates with refund rates above 15%** — high refund rates combined with high volume signals return fraud
- **Cap commission on first-time purchases only** for high-discount categories — prevents affiliates from incentivizing repeat coupon use

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Self-referral fraud | Enable self-referral blocking in your affiliate app settings; most dedicated apps include this |
| Commission calculated on full order total including tax and shipping | Configure the commission base to use subtotal in app settings |
| Payout fails for affiliates who haven't completed KYC | Gate payouts on completed onboarding; use Stripe Connect's `charges_enabled` status check |
| Tier not downgrading when affiliate volume drops | Review tier assignments monthly; most apps support manual tier adjustments |
| High refund rate from one affiliate | Pause the affiliate and review recent orders; if pattern continues, terminate partnership |

## Related Skills

- @influencer-tracking
- @referral-viral-loops
- @sms-marketing
- @marketing-attribution-dashboard
