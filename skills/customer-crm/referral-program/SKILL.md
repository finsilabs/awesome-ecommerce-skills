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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Referral Program

## Overview

A referral program turns your existing customers into an acquisition channel by rewarding them for introducing new customers. Referral apps like ReferralCandy and Referral Hero handle unique link generation, double-sided rewards (referrer and referee), fraud detection, and post-purchase email triggers without custom code. Only build a custom referral system if your tiering logic, CRM integration, or fraud rules exceed what these tools support.

## When to Use This Skill

- When building a "give $10, get $10" refer-a-friend program
- When adding tiered rewards that escalate with the number of successful referrals
- When fraud from self-referrals or multiple accounts is draining referral reward budget
- When measuring referral program CAC versus other acquisition channels
- When integrating referral tracking with post-purchase email flows in Klaviyo

## Core Instructions

### Step 1: Determine platform and choose the right referral tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | ReferralCandy | Purpose-built for e-commerce; auto-generates referral links per customer, handles double-sided rewards, post-purchase email trigger, and fraud detection |
| **Shopify** | Referral Hero | More flexible reward types (cash, gift cards, store credit, custom); deep Klaviyo integration for referral email flows |
| **Shopify** | Smile.io | Combines loyalty points with referral mechanics in one app — best when you want both |
| **WooCommerce** | ReferralCandy or Referral Hero | Both offer WooCommerce plugins; connect via REST API to track orders and issue rewards |
| **BigCommerce** | ReferralCandy | Available on the BigCommerce App Marketplace |
| **Custom / Headless** | Build referral tracking + reward logic | Required when platform integrations or fraud rules don't match your needs |

---

### Step 2: Platform-specific setup

---

#### Shopify

**Option A: ReferralCandy (recommended — full referral suite)**

1. Install **ReferralCandy** from the Shopify App Store
2. Connect your Shopify store — ReferralCandy automatically imports existing customers
3. Configure your reward structure:
   - Go to **ReferralCandy → Rewards → Set Rewards**
   - Choose reward type for referrer: cash via PayPal, store discount, or custom gift
   - Choose reward type for referee: discount code applied at checkout
   - Example: Referrer gets $10 store credit; referee gets $10 off their first order

4. Configure referral email timing:
   - Go to **Post-Purchase Email → Settings**
   - Set send delay to 1–3 days after purchase (customer is in the honeymoon phase)
   - Customize the email template with your brand and the referral link

5. ReferralCandy automatically:
   - Generates a unique referral link per customer
   - Tracks clicks and attributions with a 30-day cookie window
   - Detects self-referrals and blocks reward issuance
   - Sends the referee a welcome email with their discount code when they sign up via the link

6. View performance in **ReferralCandy → Analytics**:
   - Referrals sent, clicks, signups, and purchases
   - Revenue attributed to referrals
   - Top referrers (for VIP outreach)

**Option B: Referral Hero (Klaviyo-first)**

1. Install **Referral Hero** from the App Store
2. Configure in **Referral Hero → Campaigns → Create Campaign**
3. Referral Hero integrates with Klaviyo — when a referral converts, it triggers a Klaviyo flow for reward notification emails
4. Reward types include store credit (issued via Shopify discount codes), cash (PayPal), or gift cards

**Adding a referral entry point in post-purchase emails (Klaviyo):**
1. In Klaviyo, go to the **Post-Purchase flow**
2. Add an email at the 3-day step with the referral link
3. ReferralCandy and Referral Hero both provide a Klaviyo integration that injects `{{ customer.referral_link }}` as a merge tag

---

#### WooCommerce

**ReferralCandy for WooCommerce:**

1. Install the **ReferralCandy** plugin from WordPress.org or the ReferralCandy integrations page
2. Connect your WooCommerce store with your ReferralCandy API credentials
3. ReferralCandy tracks WooCommerce orders and attributes purchases to referrers automatically
4. Configure rewards and email timing in the ReferralCandy dashboard (same as Shopify above)

**Referral Hero for WooCommerce:**
1. Install the **Referral Hero** WooCommerce plugin
2. Configure a campaign and set reward type to WooCommerce coupon code
3. Referral Hero issues a unique coupon code to each referee upon signup and notifies the referrer when they convert

**Manual referral program with AutomateWoo:**
- If you prefer full control, use **AutomateWoo** to trigger referral emails and issue discount codes
- AutomateWoo has a built-in Referral workflow template under **AutomateWoo → Workflows → Referrals**

---

#### BigCommerce

**ReferralCandy for BigCommerce:**

1. Go to **Apps → Search "ReferralCandy"** and install
2. Configuration is the same as the Shopify version
3. ReferralCandy tracks BigCommerce orders and issues BigCommerce discount codes as rewards

---

#### Custom / Headless

For headless storefronts, build referral tracking with tiered rewards and fraud detection:

```typescript
// lib/referrals.ts
import { randomBytes } from 'crypto';

// Generate a unique, human-friendly referral code per customer
export async function getOrCreateReferralCode(customerId: string): Promise<string> {
  const existing = await db.referralCodes.findFirst({ where: { customerId } });
  if (existing) return existing.code;

  const customer = await db.customers.findUnique({ where: { id: customerId } });
  const prefix = (customer!.firstName ?? 'USER').slice(0, 4).toUpperCase();
  const suffix = randomBytes(3).toString('hex').toUpperCase();
  const code = `${prefix}${suffix}`; // e.g., JANE3A9F

  await db.referralCodes.create({ data: { customerId, code } });
  return code;
}

// Middleware: capture referral code from ?ref= URL param into a 30-day cookie
export function referralTrackingMiddleware(req: Request, res: Response, next: NextFunction) {
  const code = req.query.ref as string;
  if (code && !req.cookies.ref_code) {
    res.cookie('ref_code', code, { maxAge: 30 * 86400000, httpOnly: true, secure: true, sameSite: 'lax' });
  }
  next();
}

// Tiered rewards: reward amount increases as referrer accumulates successful referrals
const REFERRAL_TIERS = [
  { minReferrals: 0,  referrerRewardCents: 1000, refereeRewardCents: 1000 }, // $10/$10
  { minReferrals: 5,  referrerRewardCents: 1500, refereeRewardCents: 1000 }, // $15/$10 after 5
  { minReferrals: 10, referrerRewardCents: 2500, refereeRewardCents: 1500 }, // $25/$15 after 10
];

function getReferralReward(successfulReferrals: number) {
  return [...REFERRAL_TIERS].reverse().find(t => successfulReferrals >= t.minReferrals)!;
}

// On new account creation: attribute referral, run fraud checks
export async function onCustomerCreated(customerId: string, refCode: string | undefined) {
  if (!refCode) return;

  const referralCode = await db.referralCodes.findFirst({ where: { code: refCode } });
  if (!referralCode || referralCode.customerId === customerId) return; // block self-referral

  // Fraud check: same shipping address as referrer
  const [referee, referrer] = await Promise.all([
    db.customers.findUnique({ where: { id: customerId }, include: { addresses: true } }),
    db.customers.findUnique({ where: { id: referralCode.customerId }, include: { addresses: true } }),
  ]);

  const refereeAddr = referee?.addresses[0]?.addressHash;
  const referrerAddr = referrer?.addresses[0]?.addressHash;
  if (refereeAddr && refereeAddr === referrerAddr) return; // same address = block

  await db.referrals.create({ data: { referrerId: referralCode.customerId, refereeId: customerId, code: refCode, status: 'pending' } });
}

// On referee's first purchase: issue rewards to both parties
export async function onRefereeFirstPurchase(refereeId: string, orderId: string) {
  const referral = await db.referrals.findFirst({ where: { refereeId, status: 'pending' } });
  if (!referral) return;

  const order = await db.orders.findUnique({ where: { id: orderId } });
  if (!order || order.subtotalCents < 2500) return; // require minimum $25 order

  const referrerStats = await db.referralCodes.findFirst({ where: { customerId: referral.referrerId } });
  const tier = getReferralReward(referrerStats?.totalReferrals ?? 0);

  await Promise.all([
    issueStoreCredit(referral.referrerId, tier.referrerRewardCents, `Referral reward`),
    issueStoreCredit(refereeId, tier.refereeRewardCents, 'Welcome reward — referred by a friend'),
  ]);

  await db.referrals.update({ where: { id: referral.id }, data: { status: 'rewarded', orderId } });
  await db.referralCodes.update({ where: { customerId: referral.referrerId }, data: { totalReferrals: { increment: 1 } } });
}
```

**Referral program analytics SQL:**

```sql
-- Monthly referral program performance
SELECT
  DATE_TRUNC('month', r.created_at) AS month,
  COUNT(*) AS total_referrals,
  COUNT(CASE WHEN r.status = 'rewarded' THEN 1 END) AS successful_referrals,
  ROUND(100.0 * COUNT(CASE WHEN r.status = 'rewarded' THEN 1 END) / NULLIF(COUNT(*), 0), 1) AS conversion_rate_pct,
  SUM(CASE WHEN r.status = 'rewarded' THEN rc.total_rewards_cents END) / 100.0 AS rewards_paid_usd
FROM referrals r
JOIN referral_codes rc ON r.referrer_id = rc.customer_id
GROUP BY 1
ORDER BY 1 DESC;
```

---

### Step 3: Promote the referral program

The referral link needs to be visible — customers won't find it if it's buried:

1. **Post-purchase confirmation page** — add a referral CTA to the order confirmation page: "Love your order? Share with a friend and you both get $10"
2. **Post-purchase email** — include the referral link in the 3-day post-purchase email (ReferralCandy and Klaviyo both support this automatically)
3. **Customer account page** — add a "Refer a Friend" section showing their link and referral history
4. **Transactional emails** — include a subtle referral CTA in shipping confirmation emails

---

### Step 4: Measure referral program ROI

| Metric | How to Measure |
|--------|---------------|
| Referral conversion rate | Successful referrals / total referral clicks |
| Referral CAC | Total rewards paid / successful referrals |
| Revenue attributed to referrals | Tag referred orders and compare total revenue |
| Referred customer CLV vs. non-referred | Cohort comparison at 90 days and 12 months |

Compare referral CAC against your paid acquisition channels. Referral programs typically produce 20–30% lower CAC than paid channels when optimized.

## Best Practices

- **Use ReferralCandy before building from scratch** — it handles link generation, attribution, fraud detection, and reward issuance in minutes
- **Require a minimum first-order value** to qualify for the reward — prevents reward farming with $1 test orders
- **Use store credit, not one-time discount codes** — store credit requires the customer to return and creates a second purchase occasion
- **Apply a 30-day attribution window** — shorter windows miss customers who take time to convert
- **Send a reward notification email immediately** when the referee purchases — the referrer often doesn't know the reward was granted; this also prompts further referrals
- **Block referrals to the same shipping address** — this is the clearest fraud signal for household self-referrals

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Self-referral fraud via multiple email accounts | Block same shipping address referrals (strongest signal); ReferralCandy detects this automatically |
| Referral link shared on coupon forums | Monitor referred cohort CLV; if it's significantly lower than organic, apply a higher minimum order value |
| Store credit issued before 30-day return window | Delay reward issuance by 30 days after the referee's order to account for returns |
| Referral cookie overwritten by later ad click | Store the first referral click separately; ReferralCandy uses first-click attribution for referrals |
| Low referral email open rates | Move the referral ask from the receipt email to a dedicated 3-day post-purchase email when customer satisfaction is highest |

## Related Skills

- @affiliate-program
- @customer-lifetime-value
- @customer-segmentation
- @email-marketing-automation
