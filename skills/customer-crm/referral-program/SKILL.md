---
name: referral-program
description: "Grow your customer base with a refer-a-friend program featuring unique shareable links, tiered rewards, and built-in fraud prevention"
category: customer-crm
risk: safe
source: curated
date_added: "2026-03-12"
tags: [referral, refer-a-friend, viral, word-of-mouth, reward, fraud-prevention, acquisition, unique-links]
triggers: ["referral program", "refer a friend", "referral tracking", "word of mouth program", "referral rewards", "referral fraud prevention", "referral link"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Referral Program

## Overview

A referral program turns your existing customers into an acquisition channel by rewarding them for introducing new customers. This skill covers generating unique referral links per customer, managing a double-sided reward (referrer and referee), implementing tiered rewards that escalate with the number of successful referrals, and detecting self-referral and multi-account fraud patterns.

## When to Use This Skill

- When building a "give $10, get $10" refer-a-friend program from scratch
- When adding tiered rewards to an existing referral program to incentivize heavy referrers
- When fraud from self-referrals or multiple accounts is draining referral reward budget
- When measuring referral program CAC versus other acquisition channels
- When implementing a waitlist with referral mechanics (move up the queue by referring friends)
- When integrating referral tracking with post-purchase email flows

## Core Instructions

1. **Generate unique referral codes and links**

   ```typescript
   import { randomBytes } from 'crypto';

   async function createReferralCode(customerId: string): Promise<string> {
     // Check if customer already has a code
     const existing = await db.referralCodes.findByCustomer(customerId);
     if (existing) return existing.code;

     // Generate a short, human-friendly code
     const customer = await db.customers.findById(customerId);
     const prefix = customer.firstName.slice(0, 4).toUpperCase();
     const suffix = randomBytes(3).toString('hex').toUpperCase();
     const code = `${prefix}${suffix}`; // e.g., JANE3A9F

     await db.referralCodes.create({
       customerId,
       code,
       createdAt: new Date(),
       totalReferrals: 0,
       totalRewardsCents: 0,
     });

     return code;
   }

   function buildReferralLink(code: string): string {
     return `${process.env.STORE_URL}?ref=${code}`;
   }
   ```

2. **Track referral visits and attribute signups**

   ```typescript
   // Middleware: detect referral code from URL and store in cookie
   export function referralTrackingMiddleware(req: Request, res: Response, next: NextFunction) {
     const code = req.query.ref as string;
     if (code && !req.cookies.ref_code) {
       res.cookie('ref_code', code, {
         maxAge: 30 * 86400 * 1000,  // 30-day attribution window
         httpOnly: true,
         secure: true,
         sameSite: 'lax',
       });

       db.referralClicks.create({
         code,
         ip: req.ip,
         userAgent: req.headers['user-agent'],
         clickedAt: new Date(),
       });
     }
     next();
   }

   // On new account creation, check for referral cookie
   async function onCustomerCreated(customerId: string, req: Request) {
     const refCode = req.cookies.ref_code;
     if (!refCode) return;

     const referralCode = await db.referralCodes.findByCode(refCode);
     if (!referralCode) return;

     // Fraud check: prevent obvious self-referrals
     if (referralCode.customerId === customerId) return;

     await db.referrals.create({
       referrerId: referralCode.customerId,
       refereeId: customerId,
       code: refCode,
       status: 'pending',  // Reward after first purchase
       createdAt: new Date(),
     });
   }
   ```

3. **Define reward tiers and grant rewards on first purchase**

   ```typescript
   const REFERRAL_TIERS = [
     { minReferrals: 0,  referrerRewardCents: 1000, refereeRewardCents: 1000 }, // $10/$10
     { minReferrals: 5,  referrerRewardCents: 1500, refereeRewardCents: 1000 }, // $15/$10 after 5 referrals
     { minReferrals: 10, referrerRewardCents: 2500, refereeRewardCents: 1500 }, // $25/$15 after 10 referrals
   ];

   function getReferralReward(successfulReferrals: number): typeof REFERRAL_TIERS[number] {
     return [...REFERRAL_TIERS].reverse().find((t) => successfulReferrals >= t.minReferrals)!;
   }

   // Triggered when the referee places their first order
   async function onRefereeFirstPurchase(refereeId: string, orderId: string) {
     const referral = await db.referrals.findPendingByReferee(refereeId);
     if (!referral) return;

     // Verify minimum order value to prevent low-value gaming
     const order = await db.orders.findById(orderId);
     if (order.subtotalCents < 2500) return; // Minimum $25 order

     const referrerStats = await db.referralCodes.findByCustomer(referral.referrerId);
     const tier = getReferralReward(referrerStats.totalReferrals);

     // Issue store credit to both parties
     await Promise.all([
       issueStoreCredit(referral.referrerId, tier.referrerRewardCents, `Referral reward — ${refereeId} made their first purchase`),
       issueStoreCredit(refereeId, tier.refereeRewardCents, 'Welcome reward — referred by a friend'),
     ]);

     await db.referrals.update(referral.id, { status: 'rewarded', rewardedAt: new Date(), orderId });
     await db.referralCodes.increment(referral.referrerId, 'totalReferrals', 1);
     await db.referralCodes.increment(referral.referrerId, 'totalRewardsCents', tier.referrerRewardCents);

     // Notify referrer
     await sendReferralRewardEmail(referral.referrerId, tier.referrerRewardCents, refereeId);
   }
   ```

4. **Detect and prevent fraud**

   ```typescript
   interface FraudSignal { signal: string; block: boolean }

   async function checkReferralFraud(referrerId: string, refereeId: string, refereeEmail: string): Promise<FraudSignal[]> {
     const signals: FraudSignal[] = [];
     const referee = await db.customers.findById(refereeId);
     const referrer = await db.customers.findById(referrerId);

     // Same email domain as referrer (likely same household or self-referral)
     const referrerDomain = referrer.email.split('@')[1];
     const refereeDomain = refereeEmail.split('@')[1];
     if (referrerDomain === refereeDomain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(referrerDomain)) {
       signals.push({ signal: 'same_corporate_email_domain', block: false });
     }

     // Same shipping address as referrer
     if (referee.defaultShippingAddress && referrer.defaultShippingAddress) {
       if (referee.defaultShippingAddress.hash === referrer.defaultShippingAddress.hash) {
         signals.push({ signal: 'same_shipping_address', block: true });
       }
     }

     // Referrer has multiple referrals from the same IP range
     const ipRange = refereeId.split('.').slice(0, 3).join('.');
     const ipReferrals = await db.referrals.countByIpRange(referrerId, ipRange, subDays(new Date(), 30));
     if (ipReferrals > 3) {
       signals.push({ signal: 'ip_cluster', block: false });
     }

     // Referee account was created within 5 minutes of click
     const click = await db.referralClicks.findRecent(referrerId);
     if (click && differenceInMinutes(referee.createdAt, click.clickedAt) < 5) {
       signals.push({ signal: 'immediate_signup_after_click', block: false });
     }

     return signals;
   }
   ```

5. **Build the referral dashboard for customers**

   ```typescript
   // GET /api/referral/dashboard
   export async function getReferralDashboard(req: Request, res: Response) {
     const customerId = req.session.customerId!;
     const [code, referrals, credit] = await Promise.all([
       db.referralCodes.findOrCreateByCustomer(customerId),
       db.referrals.findByReferrer(customerId, { orderBy: { createdAt: 'desc' } }),
       db.storeCredits.getBalance(customerId),
     ]);

     const successful = referrals.filter((r) => r.status === 'rewarded');
     const currentTier = getReferralReward(successful.length);
     const nextTier = REFERRAL_TIERS.find((t) => t.minReferrals > successful.length);

     res.json({
       referralLink: buildReferralLink(code.code),
       referralCode: code.code,
       totalReferrals: successful.length,
       totalEarned: code.totalRewardsCents / 100,
       availableCredit: credit / 100,
       currentReward: currentTier.referrerRewardCents / 100,
       nextTierAt: nextTier?.minReferrals,
       nextTierReward: nextTier ? nextTier.referrerRewardCents / 100 : null,
       referrals: referrals.slice(0, 10),
     });
   }
   ```

## Examples

### Store credit issuance function

```typescript
async function issueStoreCredit(customerId: string, amountCents: number, reason: string) {
  await db.storeCredits.create({
    customerId,
    amountCents,
    reason,
    expiresAt: new Date(Date.now() + 365 * 86400000), // 1 year expiry
    createdAt: new Date(),
  });

  const customer = await db.customers.findById(customerId);
  await sendTransactionalEmail(customer.email, 'store-credit-issued', {
    amount: amountCents / 100,
    reason,
    expiresAt: new Date(Date.now() + 365 * 86400000).toDateString(),
  });
}
```

### Referral program analytics query

```sql
-- Referral program performance by month
SELECT
  DATE_TRUNC('month', r.created_at) AS month,
  COUNT(*) AS total_referrals,
  COUNT(CASE WHEN r.status = 'rewarded' THEN 1 END) AS successful_referrals,
  ROUND(100.0 * COUNT(CASE WHEN r.status = 'rewarded' THEN 1 END) / NULLIF(COUNT(*), 0), 1) AS conversion_rate_pct,
  SUM(CASE WHEN r.status = 'rewarded' THEN rc.total_rewards_cents END) / 100.0 AS rewards_paid_out,
  AVG(o.subtotal_cents) / 100.0 AS avg_referred_order_value
FROM referrals r
JOIN referral_codes rc ON r.referrer_id = rc.customer_id
LEFT JOIN orders o ON r.order_id = o.id
GROUP BY 1
ORDER BY 1 DESC;
```

## Best Practices

- **Require a minimum first-order value** to qualify for the referral reward — this prevents reward farming with $1 orders
- **Apply a 30-day attribution window** for the referral cookie — shorter windows miss customers who take time to convert; longer windows create false attribution
- **Use store credit, not discount codes** for rewards — store credit is more valuable (customer must return to spend it) and creates a second purchase occasion
- **Send a referral reward email immediately** when the referee purchases — the referrer often doesn't know the reward was granted; this email also prompts further referrals
- **Rate-limit referral link clicks** per IP — more than 10 clicks from the same IP in 24 hours likely indicates link sharing on deal sites, not genuine referrals
- **Block referrals to the same shipping address** — this is the clearest fraud signal for household self-referrals
- **Track referral CAC vs. other channels** — compare (reward cost + promotional credit) / successful referrals to your paid CAC to justify the program budget

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Self-referral fraud via multiple email accounts | Hash-compare shipping address between referrer and referee; flag same-address referrals for manual review |
| Referral cookie overwritten by later ad click | Store the first referral click separately; last-click attribution would erase the referral attribution |
| Store credit issued before 30-day return window | Delay reward issuance by 30 days after the referee's first order to account for returns |
| Referral link shared on coupon forums, attracting low-quality customers | Analyze CLV of referred customers vs. other channels; apply a higher minimum order if referred-cohort quality is poor |
| Referral dashboard not updating after a successful referral | Bust the dashboard cache after `db.referrals.update` is called; React query cache should be invalidated on status change |

## Related Skills

- @affiliate-program
- @customer-lifetime-value
- @customer-segmentation
- @email-marketing-automation
- @customer-support-integration
