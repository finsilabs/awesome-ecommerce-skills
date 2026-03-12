---
name: affiliate-program
description: "Affiliate tracking, commission tiers, payout management, and fraud detection"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [affiliate, referral, commission, tracking, fraud-detection, payout, utm, partner-program]
triggers: ["affiliate program", "affiliate tracking", "commission tiers", "affiliate payout", "partner program", "affiliate fraud detection", "referral tracking"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Affiliate Program

## Overview

An affiliate program pays partners a commission for each sale they refer, making it a performance-based acquisition channel with no upfront media cost. This skill covers building the core affiliate tracking pipeline: generating unique tracking links, attributing conversions via first-click or last-click cookies, calculating tiered commissions based on volume, managing payouts through Stripe or PayPal, and detecting common fraud patterns including self-referrals and cookie stuffing.

## When to Use This Skill

- When launching a creator or influencer partnership program with revenue share
- When replacing a third-party affiliate network (ShareASale, CJ) with a first-party system to reduce 20–30% network fees
- When building a white-label affiliate portal for a SaaS e-commerce platform
- When needing custom commission rules (category-specific rates, SKU exclusions, tiered volume bonuses)
- When fraud in an existing affiliate program is eroding margins
- When generating W-9 collection and 1099 tax reporting for US-based affiliates

## Core Instructions

1. **Generate unique affiliate tracking links and cookies**

   ```typescript
   import { randomBytes } from 'crypto';

   interface Affiliate {
     id: string;
     slug: string;           // human-readable: "john-doe"
     commissionTier: 'bronze' | 'silver' | 'gold';
     cookieDurationDays: number;
   }

   // Generate a unique affiliate code
   function generateAffiliateCode(): string {
     return randomBytes(6).toString('hex').toUpperCase(); // e.g., "A3F9C2"
   }

   // Track link: yourstore.com?aff=A3F9C2
   // GET /api/affiliate/track
   export async function trackAffiliateClick(req: Request, res: Response) {
     const code = req.query.aff as string;
     const affiliate = await db.affiliates.findByCode(code);
     if (!affiliate) return res.redirect(req.query.redirect as string ?? '/');

     await db.affiliateClicks.create({
       affiliateId: affiliate.id,
       ip: req.ip,
       userAgent: req.headers['user-agent'],
       referrer: req.headers.referer,
       clickedAt: new Date(),
     });

     // Set affiliate cookie — last click wins
     res.cookie('aff', affiliate.id, {
       maxAge: affiliate.cookieDurationDays * 86400 * 1000,
       httpOnly: true,
       secure: true,
       sameSite: 'lax',
     });

     return res.redirect(req.query.redirect as string ?? '/');
   }
   ```

2. **Attribute conversions and calculate tiered commissions**

   ```typescript
   const COMMISSION_RATES: Record<string, Record<Affiliate['commissionTier'], number>> = {
     default: { bronze: 0.08, silver: 0.12, gold: 0.15 },
     electronics: { bronze: 0.04, silver: 0.06, gold: 0.08 }, // lower margin category
     digital: { bronze: 0.20, silver: 0.25, gold: 0.30 },
   };

   async function attributeOrderToAffiliate(orderId: string, affiliateCookieId: string) {
     const order = await db.orders.findById(orderId, { include: ['lineItems.product'] });
     const affiliate = await db.affiliates.findById(affiliateCookieId);
     if (!affiliate) return;

     // Fraud checks before attribution
     if (await isFraudulent(order, affiliate)) {
       await db.affiliateConversions.create({ orderId, affiliateId: affiliate.id, status: 'flagged' });
       await alertFraudTeam(order, affiliate);
       return;
     }

     // Calculate commission per line item based on product category
     let totalCommission = 0;
     for (const item of order.lineItems) {
       const category = item.product.affiliateCategory ?? 'default';
       const rate = COMMISSION_RATES[category]?.[affiliate.commissionTier] ?? COMMISSION_RATES.default[affiliate.commissionTier];
       const itemRevenue = (item.priceInCents * item.quantity) / 100;
       totalCommission += itemRevenue * rate;
     }

     // Exclude shipping and tax from commission base
     await db.affiliateConversions.create({
       orderId,
       affiliateId: affiliate.id,
       orderRevenue: order.subtotalCents / 100,
       commissionAmount: totalCommission,
       commissionRate: affiliate.commissionTier,
       status: 'pending',       // Becomes 'approved' after refund window (30 days)
       approvedAt: null,
     });

     // Upgrade tier if monthly volume threshold crossed
     await checkAndUpgradeTier(affiliate.id);
   }
   ```

3. **Implement tier upgrade logic based on monthly volume**

   ```typescript
   const TIER_THRESHOLDS = {
     silver: 5000,   // $5k referred revenue/month
     gold: 20000,    // $20k referred revenue/month
   };

   async function checkAndUpgradeTier(affiliateId: string) {
     const monthStart = startOfMonth(new Date());
     const monthRevenue = await db.affiliateConversions.sumRevenue(affiliateId, {
       createdAfter: monthStart,
       status: ['pending', 'approved'],
     });

     const newTier =
       monthRevenue >= TIER_THRESHOLDS.gold ? 'gold' :
       monthRevenue >= TIER_THRESHOLDS.silver ? 'silver' : 'bronze';

     const affiliate = await db.affiliates.findById(affiliateId);
     if (affiliate.commissionTier !== newTier) {
       await db.affiliates.update(affiliateId, { commissionTier: newTier });
       await sendTierUpgradeEmail(affiliate, newTier);
     }
   }
   ```

4. **Process payouts via Stripe Connect**

   ```typescript
   import Stripe from 'stripe';
   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

   // Approve conversions after 30-day refund window and pay out
   async function processMonthlyPayouts() {
     const approvalCutoff = subDays(new Date(), 30);

     // Approve aged pending conversions
     await db.affiliateConversions.updateMany(
       { status: 'pending', createdAt: { lt: approvalCutoff } },
       { status: 'approved', approvedAt: new Date() }
     );

     // Group approved unpaid commissions by affiliate
     const payouts = await db.affiliateConversions.groupByAffiliate({
       status: 'approved',
       paidAt: null,
     });

     for (const { affiliateId, totalCommission } of payouts) {
       const affiliate = await db.affiliates.findById(affiliateId, { include: ['stripeConnectAccountId'] });
       if (!affiliate.stripeConnectAccountId) continue;
       if (totalCommission < 50) continue; // Minimum payout threshold

       const transfer = await stripe.transfers.create({
         amount: Math.round(totalCommission * 100),
         currency: 'usd',
         destination: affiliate.stripeConnectAccountId,
         description: `Affiliate commission — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
       });

       await db.affiliateConversions.markPaid(affiliateId, { transferId: transfer.id, paidAt: new Date() });
     }
   }
   ```

5. **Detect and prevent common affiliate fraud patterns**

   ```typescript
   interface FraudSignal {
     signal: string;
     score: number; // 0–100
   }

   async function isFraudulent(order: Order, affiliate: Affiliate): Promise<boolean> {
     const signals: FraudSignal[] = [];

     // Self-referral: affiliate orders from their own link
     if (order.customerEmail === affiliate.email) {
       signals.push({ signal: 'self_referral', score: 100 });
     }

     // Same IP as affiliate account registration
     const affiliateIp = affiliate.registrationIp;
     if (order.ipAddress === affiliateIp) {
       signals.push({ signal: 'ip_match_registration', score: 80 });
     }

     // Velocity: more than 5 orders from the same IP in 24h
     const recentOrders = await db.orders.countByIp(order.ipAddress, subHours(new Date(), 24));
     if (recentOrders > 5) {
       signals.push({ signal: 'ip_velocity', score: 70 });
     }

     // New account created same day as order (coupon stacking)
     const customerAge = differenceInHours(order.createdAt, order.customer.createdAt);
     if (customerAge < 1) {
       signals.push({ signal: 'same_day_account', score: 40 });
     }

     // High refund rate: affiliate has >20% refund rate historically
     const refundRate = await db.affiliateConversions.getRefundRate(affiliate.id);
     if (refundRate > 0.20) {
       signals.push({ signal: 'high_refund_rate', score: 60 });
     }

     const totalScore = signals.reduce((sum, s) => sum + s.score, 0);
     return totalScore >= 100;
   }
   ```

## Examples

### Affiliate dashboard stats API

Expose an API endpoint that the affiliate portal frontend calls:

```typescript
export async function getAffiliateDashboard(req: Request, res: Response) {
  const affiliateId = req.user.affiliateId;
  const { period = '30d' } = req.query;
  const since = period === '7d' ? subDays(new Date(), 7) : subDays(new Date(), 30);

  const [clicks, conversions, earnings] = await Promise.all([
    db.affiliateClicks.count({ affiliateId, clickedAt: { gte: since } }),
    db.affiliateConversions.findMany({ affiliateId, createdAt: { gte: since }, status: { not: 'flagged' } }),
    db.affiliateConversions.sumCommission({ affiliateId, status: 'approved', paidAt: null }),
  ]);

  const conversionRate = clicks > 0 ? (conversions.length / clicks) * 100 : 0;

  res.json({
    clicks,
    conversions: conversions.length,
    conversionRate: conversionRate.toFixed(2),
    pendingEarnings: conversions
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + c.commissionAmount, 0),
    approvedEarnings: earnings,
    tier: req.user.affiliate.commissionTier,
  });
}
```

### Cookie stuffing detection

Detect suspiciously short click-to-purchase windows that suggest cookie stuffing:

```typescript
async function detectCookieStuffing(orderId: string, affiliateId: string) {
  const order = await db.orders.findById(orderId);
  const lastClick = await db.affiliateClicks.findLast({ affiliateId, before: order.createdAt });

  if (!lastClick) return false;

  const secondsBetweenClickAndOrder = differenceInSeconds(order.createdAt, lastClick.clickedAt);

  // Legitimate referrals rarely convert in under 10 seconds
  if (secondsBetweenClickAndOrder < 10) {
    await db.fraudAlerts.create({ type: 'cookie_stuffing', affiliateId, orderId, secondsBetweenClickAndOrder });
    return true;
  }
  return false;
}
```

## Best Practices

- **Use HttpOnly, Secure, SameSite=Lax cookies** for affiliate attribution — this prevents JavaScript injection from hijacking commission attribution
- **Apply a 30-day refund hold before approving commissions** — never pay out on orders that might be returned; set `status: 'pending'` until the return window passes
- **Implement a minimum payout threshold** ($50–$100) to reduce payment processing fees and discourage fraudulent micro-conversions
- **Exclude non-commissionable items** (gift cards, taxes, shipping) from the commission base in every calculation
- **Require Stripe Connect onboarding or PayPal email verification** before an affiliate can receive payments — this creates a paper trail and reduces fake account fraud
- **Audit affiliates with refund rates above 15%** — high refund rates combined with high volume is a strong signal of return fraud
- **Send monthly 1099-K forms** (or equivalent) for US affiliates earning over $600/year — consult a tax advisor for jurisdiction-specific requirements
- **Log every click with IP, user agent, and referrer** — this data is essential for fraud investigation and dispute resolution

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Self-referral fraud by affiliates ordering from their own links | Compare order customer email and shipping address against the affiliate account; flag matches automatically |
| Cookie stuffing — affiliate injects cookie without a real click | Compare click timestamp to order timestamp; flag conversions where the gap is < 10 seconds |
| Commission calculated on full order total including tax and shipping | Always compute commission only on `subtotal` (pre-tax, pre-shipping line item total) |
| Payout fails for affiliates who haven't completed KYC | Gate the payout endpoint on `stripeConnectAccountId` presence; remind affiliates to complete onboarding |
| Tier not downgraded when affiliate's monthly volume drops | Run a monthly cron that recalculates tier based on the trailing 3-month average, not just the current month |

## Related Skills

- @influencer-tracking
- @referral-program
- @attribution-modeling
- @customer-lifetime-value
- @sms-marketing
