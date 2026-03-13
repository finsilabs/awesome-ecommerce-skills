---
name: fraud-detection
description: "Protect your store from fraudulent orders using risk scoring, 3D Secure challenges, velocity checks, and manual review queues for suspicious orders"
category: security-compliance
risk: critical
source: curated
date_added: "2026-03-12"
tags: [fraud, fraud-detection, 3ds, velocity-checks, stripe-radar, machine-learning, manual-review, chargeback]
triggers: ["fraud detection", "fraud prevention", "chargeback prevention", "3ds authentication", "velocity checks", "fraud scoring", "payment fraud"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Fraud Detection

## Overview

Payment fraud costs e-commerce merchants 2–3% of revenue through chargebacks, lost goods, and dispute fees. Effective fraud detection layers platform-native risk scoring, 3D Secure authentication, velocity checks, and manual review queues for suspicious orders. The right approach depends on your platform — Shopify includes a built-in fraud analysis tool, while WooCommerce and BigCommerce require a dedicated fraud prevention service or payment processor's fraud tools.

## When to Use This Skill

- When chargeback rates exceed 0.5% of transaction volume (Visa's threshold for "excessive" disputes is 0.9%)
- When launching in a new market with unfamiliar fraud patterns
- When selling high-value, easily resold goods (electronics, gift cards, luxury items)
- When you observe account takeover patterns, card testing, or bulk bot purchases
- When building or auditing a checkout flow that processes card-not-present transactions

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right fraud tools

| Platform | Built-in Fraud Analysis | Recommended Fraud Service |
|----------|------------------------|--------------------------|
| **Shopify** | Shopify Fraud Analysis (included free); basic risk scoring on orders | Enable Stripe Radar or Signifyd (Shopify App Store) for advanced ML scoring |
| **WooCommerce** | None built in | Use Stripe (with Radar) or Braintree as payment processor; or install Kount or NoFraud plugin |
| **BigCommerce** | Payment processor fraud tools (varies by processor) | Signifyd integrates natively with BigCommerce; NoFraud also supports BigCommerce |
| **All platforms** | — | Stripe Radar (if using Stripe) provides ML-based fraud scoring on every charge at no extra cost |

### Step 2: Enable and configure platform-native fraud tools

---

#### Shopify

Shopify includes a **Fraud analysis** indicator on every order based on signals like IP/billing address mismatch, card verification failure, and known fraud patterns.

**Reviewing fraud indicators:**
1. Open any order in Shopify admin
2. Click **Fraud analysis** in the order details panel
3. Shopify shows a risk level (High / Medium / Low) with specific reasons (e.g., "Card verification value failed", "IP and billing address country differ")

**Configuring fraud response rules:**
1. Go to **Settings → Payments → Fraud prevention** (if using Shopify Payments)
2. Enable **Automatic review** for orders flagged as high risk — Shopify will hold these orders and send you an email
3. Set **Automatically cancel** for orders Shopify deems highest risk

**Signifyd (Shopify App Store — Guaranteed Fraud Protection):**
Signifyd provides chargeback guarantees — if they approve an order and it results in a chargeback, they reimburse you. This is the most comprehensive solution for Shopify.
1. Install **Signifyd** from the Shopify App Store
2. Signifyd automatically reviews every order using ML scoring
3. Orders Signifyd flags go into a review queue in the Signifyd console
4. Set up the Signifyd Shopify integration to automatically hold or cancel high-risk orders

---

#### WooCommerce

WooCommerce does not include fraud detection. You need either a payment processor with built-in fraud tools or a dedicated plugin.

**Option A: Stripe Radar (recommended if using Stripe for WooCommerce)**

If using the **WooCommerce Stripe Payment Gateway**:
1. Stripe Radar is automatically enabled — it scores every charge on your Stripe account
2. In the Stripe Dashboard, go to **Radar → Rules** to add custom blocking/review rules:
   ```
   # Block orders over $500 from high-fraud-rate IP countries
   Block if :order_amount: > 50000 and :ip_country: in ('NG', 'RO')

   # Review first-time customers placing large orders
   Review if :order_amount: > 20000 and :customer_account_age: < 7

   # Block cards used more than 3 times in the last hour
   Block if :card_velocity_hour: > 3
   ```
3. Orders flagged for review appear in Stripe Dashboard → Radar → Reviews

**Option B: WooCommerce Anti-Fraud plugin (free)**
1. Install **WooCommerce Anti-Fraud** from the plugin directory
2. Configure risk scoring rules based on:
   - Order amount thresholds
   - New customer + high value combination
   - Proxy/VPN IP detection
   - Billing/shipping country mismatch
3. High-risk orders are placed in "On Hold" status for manual review

**Option C: Kount or NoFraud (enterprise)**
For high-volume WooCommerce stores, enterprise fraud prevention platforms offer:
- **Kount**: full fraud management platform with ML scoring, manual review tools, and chargeback management
- **NoFraud**: provides a fraud protection guarantee similar to Signifyd; integrates via WooCommerce plugin

---

#### BigCommerce

**Signifyd for BigCommerce:**
1. Install the **Signifyd** app from the BigCommerce App Marketplace
2. Configure automatic hold or cancellation of high-risk orders
3. Signifyd's guarantee covers chargebacks on approved orders

**Payment processor fraud tools:**
- **Stripe (via BigCommerce Stripe integration)**: Radar is included; configure rules in the Stripe Dashboard
- **PayPal**: PayPal's fraud management filters are available in your PayPal business account settings
- **Braintree**: Advanced fraud protection via Kount is available as an add-on

---

#### Custom / Headless

For custom storefronts using Stripe, leverage Stripe Radar for ML scoring and add application-layer velocity checks for business-specific patterns.

**Retrieve Stripe's fraud score after payment attempt:**

```typescript
const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
  expand: ['latest_charge'],
});
const riskScore = paymentIntent.latest_charge.outcome?.risk_score;   // 0–100
const riskLevel = paymentIntent.latest_charge.outcome?.risk_level;   // 'normal', 'elevated', 'highest'
```

**Request 3D Secure for high-risk transactions** (shifts chargeback liability to card issuer):

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: order.totalCents,
  currency: 'usd',
  payment_method_options: {
    card: {
      // 'automatic' = Stripe decides; 'challenge' = always require 3DS for high-risk
      request_three_d_secure: riskScore > 70 ? 'challenge' : 'automatic',
    },
  },
});
```

**Application-layer velocity checks:**

```typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL!);

async function checkVelocity(params: { email: string; ip: string; cardFingerprint: string; amountCents: number }) {
  const { email, ip, cardFingerprint, amountCents } = params;

  // IP: max 10 orders per hour
  const ipCount = await redis.incr(`vel:ip:${ip}`);
  if (ipCount === 1) await redis.expire(`vel:ip:${ip}`, 3600);
  if (ipCount > 10) return { allowed: false, reason: 'ip_velocity' };

  // Email: max 5 orders per 24 hours
  const emailCount = await redis.incr(`vel:email:${email.toLowerCase()}`);
  if (emailCount === 1) await redis.expire(`vel:email:${email.toLowerCase()}`, 86400);
  if (emailCount > 5) return { allowed: false, reason: 'email_velocity' };

  // Card: max $500 per day
  const spendKey = `vel:spend:${cardFingerprint}`;
  const currentSpend = parseInt(await redis.get(spendKey) ?? '0');
  if (currentSpend + amountCents > 50000) return { allowed: false, reason: 'daily_spend_limit' };

  return { allowed: true };
}
```

**Manual review queue:**

```typescript
async function flagForManualReview(orderId: string, riskScore: number, signals: Record<string, unknown>) {
  // Hold the order — do NOT fulfill; do NOT capture payment (authorize only)
  await db.orders.update(orderId, {
    status: 'pending_fraud_review',
    fraud_risk_score: riskScore,
    fraud_signals: signals,
    review_requested_at: new Date(),
  });

  // Notify fraud review team
  await sendSlackAlert('#fraud-review', {
    text: `Order ${orderId} flagged for review. Risk score: ${riskScore}/100`,
    actions: [
      { text: 'Approve', url: `${ADMIN_URL}/fraud-review/${orderId}/approve` },
      { text: Reject', url: `${ADMIN_URL}/fraud-review/${orderId}/reject` },
    ],
  });
}

// Auto-cancel unreviewed orders after 48 hours
async function expireUnreviewedOrders() {
  const expired = await db.orders.findExpiredReviews(48);
  for (const order of expired) {
    await stripe.paymentIntents.cancel(order.payment_intent_id);
    await db.orders.update(order.id, { status: 'fraud_review_expired' });
    await sendOrderCancellationEmail(order);
  }
}
```

## Best Practices

- **Layer defenses** — no single signal reliably stops all fraud; combine Stripe Radar, velocity checks, IP reputation, and device fingerprinting
- **Use authorize-then-capture for high-risk orders** — authorize at checkout to hold funds, then capture only after fraud review passes; releasing an authorization is less costly than issuing a refund
- **Track false positive rate as a KPI** — if more than 1% of legitimate orders are blocked or held, your rules are too aggressive; measure both fraud losses and revenue lost to false positives
- **Rotate and obfuscate fraud rules** — sophisticated fraudsters probe checkout flows to find rule thresholds; never expose block reasons in API error messages
- **Keep a deny-list of fraudulent emails, cards, and devices** — once fraud is confirmed via chargeback, add the identifiers to a blocklist for future orders
- **Review your chargeback rate monthly** — if it climbs above 0.5% for Visa/Mastercard, review your fraud rules; exceeding 0.9% triggers Visa's dispute monitoring program

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| 3DS causing checkout abandonment | Use `automatic` 3DS mode — Stripe decides when a challenge is needed; this frictionlessly authenticates low-risk transactions |
| Velocity rules blocking legitimate bulk buyers | Whitelist B2B customers or high-LTV customer segments from velocity rules; use tiered limits based on account history |
| Manual review queue growing unboundedly | Set SLA targets (4-hour review window); implement auto-cancellation for orders not reviewed within 48 hours |
| Chargeback filed despite 3DS authentication | Verify your processor submits 3DS authentication data (`eci`, `cavv`, `xid`) correctly; without these fields the liability shift does not apply |
| Redis velocity keys never expiring | Always call `EXPIRE` when setting a new key; use `SET key value EX seconds NX` for atomic set-if-not-exists with expiry |

## Related Skills

- @secure-checkout
- @account-security
- @stripe-integration
- @bot-protection
- @gdpr-ecommerce
