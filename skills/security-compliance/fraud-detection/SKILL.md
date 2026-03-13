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
platforms: [platform-agnostic]
difficulty: advanced
---

# Fraud Detection

## Overview

Payment fraud costs e-commerce merchants 2–3% of revenue through chargebacks, lost goods, and dispute fees. Effective fraud detection layers rule-based velocity checks, device fingerprinting, 3D Secure (3DS2) authentication, and ML-based risk scoring to block fraudulent transactions while minimizing friction for legitimate customers. This skill covers implementing multi-layer fraud detection using Stripe Radar, custom velocity rules, and a manual review queue.

## When to Use This Skill

- When chargeback rates exceed 0.5% of transaction volume (Visa threshold for "excessive" disputes is 0.9%)
- When launching in a new market with unfamiliar fraud patterns
- When selling high-value, easily resold goods (electronics, gift cards, luxury items)
- When you observe account takeover patterns, card testing, or bulk bot purchases
- When building or auditing a checkout flow that processes card-not-present transactions

## Core Instructions

1. **Enable Stripe Radar and configure rules**

   Stripe Radar is included with standard Stripe processing and provides ML fraud scoring on every charge. Enable it and add custom rules in the Stripe Dashboard under **Radar → Rules**:

   ```javascript
   // Stripe automatically attaches a risk score to every PaymentIntent
   // Retrieve it after the payment attempt
   const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
     expand: ['latest_charge'],
   });

   const charge = paymentIntent.latest_charge;
   const riskScore = charge.outcome?.risk_score;      // 0–100
   const riskLevel = charge.outcome?.risk_level;      // "normal", "elevated", "highest"
   const outcomeType = charge.outcome?.type;          // "authorized", "manual_review", "blocked"

   console.log(`Risk score: ${riskScore}, Level: ${riskLevel}`);
   ```

   Custom Stripe Radar rules (set in Dashboard or via API):
   ```
   # Block orders over $500 from countries with high fraud rates
   Block if :order_amount: > 50000 and :ip_country: in ('NG', 'RO', 'UA')

   # Review new customers placing large orders
   Review if :order_amount: > 20000 and :customer_account_age: < 7

   # Block cards used more than 3 times in the last hour
   Block if :card_velocity_hour: > 3

   # Review if billing/shipping countries differ for digital goods
   Review if :shipping_address_country: != :billing_address_country: and :is_digital_good: = true
   ```

2. **Implement velocity checks in your application layer**

   Don't rely solely on Stripe Radar — add application-layer velocity checks for business-specific patterns:

   ```typescript
   import Redis from 'ioredis';

   const redis = new Redis(process.env.REDIS_URL!);

   interface VelocityCheckResult {
     allowed: boolean;
     reason?: string;
   }

   export async function checkVelocity(params: {
     email: string;
     ip: string;
     cardFingerprint: string;
     amount: number;
   }): Promise<VelocityCheckResult> {
     const {email, ip, cardFingerprint, amount} = params;
     const now = Date.now();
     const oneHour = 3600;
     const oneDay = 86400;

     // Check IP order count in last hour
     const ipKey = `velocity:ip:${ip}`;
     const ipCount = await redis.incr(ipKey);
     if (ipCount === 1) await redis.expire(ipKey, oneHour);
     if (ipCount > 10) return {allowed: false, reason: 'ip_velocity_exceeded'};

     // Check email order count in last 24 hours
     const emailKey = `velocity:email:${email}`;
     const emailCount = await redis.incr(emailKey);
     if (emailCount === 1) await redis.expire(emailKey, oneDay);
     if (emailCount > 5) return {allowed: false, reason: 'email_velocity_exceeded'};

     // Check card fingerprint across multiple accounts
     const cardKey = `velocity:card:${cardFingerprint}`;
     const cardCount = await redis.incr(cardKey);
     if (cardCount === 1) await redis.expire(cardKey, oneDay);
     if (cardCount > 3) return {allowed: false, reason: 'card_velocity_exceeded'};

     // Check daily spend per card
     const spendKey = `velocity:spend:${cardFingerprint}`;
     const currentSpend = parseInt(await redis.get(spendKey) ?? '0');
     const dailyLimit = 50000; // $500 in cents
     if (currentSpend + amount > dailyLimit) return {allowed: false, reason: 'daily_spend_exceeded'};

     return {allowed: true};
   }

   export async function recordSuccessfulTransaction(cardFingerprint: string, amount: number) {
     const spendKey = `velocity:spend:${cardFingerprint}`;
     const ttl = await redis.ttl(spendKey);
     await redis.incrby(spendKey, amount);
     if (ttl < 0) await redis.expire(spendKey, 86400);
   }
   ```

3. **Enforce 3D Secure (3DS2) for high-risk transactions**

   3DS2 shifts chargeback liability from the merchant to the card issuer for authenticated transactions:

   ```typescript
   // Always request 3DS for high-risk orders; optionally for normal risk
   async function createPaymentIntentWithFraudCheck(order: Order, customer: Customer) {
     const riskScore = await calculateRiskScore(order, customer);

     const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
       amount: order.totalCents,
       currency: order.currency,
       customer: customer.stripeId,
       metadata: {orderId: order.id, riskScore: riskScore.toString()},
       automatic_payment_methods: {enabled: true},
     };

     // Force 3DS for high-risk orders
     if (riskScore > 70) {
       paymentIntentParams.payment_method_options = {
         card: {request_three_d_secure: 'challenge'},
       };
     }
     // Prefer 3DS even for normal risk (shifts liability)
     else {
       paymentIntentParams.payment_method_options = {
         card: {request_three_d_secure: 'automatic'},
       };
     }

     return stripe.paymentIntents.create(paymentIntentParams);
   }
   ```

4. **Build a composite fraud score**

   Combine multiple signals into a single risk score before deciding to approve/review/block:

   ```typescript
   interface FraudSignals {
     stripeRiskScore: number;           // 0-100 from Stripe Radar
     velocityViolations: number;        // Count of velocity rule violations
     addressMismatch: boolean;          // Billing ≠ shipping country
     proxyOrVpn: boolean;               // IP is a known proxy/VPN
     emailAgeHours: number;             // Age of email on file
     isFirstOrder: boolean;
     orderAmountCents: number;
     deviceFingerprintSeen: boolean;    // Device seen before
   }

   export function calculateRiskScore(signals: FraudSignals): number {
     let score = signals.stripeRiskScore * 0.4; // Stripe ML score weighted at 40%

     if (signals.velocityViolations > 0) score += signals.velocityViolations * 15;
     if (signals.addressMismatch) score += 10;
     if (signals.proxyOrVpn) score += 20;
     if (signals.emailAgeHours < 24) score += 15;
     if (signals.isFirstOrder && signals.orderAmountCents > 30000) score += 10;
     if (!signals.deviceFingerprintSeen) score += 5;

     return Math.min(100, Math.round(score));
   }

   type FraudDecision = 'approve' | 'review' | 'block';

   export function getFraudDecision(score: number): FraudDecision {
     if (score >= 80) return 'block';
     if (score >= 50) return 'review';
     return 'approve';
   }
   ```

5. **Implement a manual review queue**

   Orders flagged for review should be held pending human inspection before fulfillment:

   ```typescript
   // When a transaction is flagged for review:
   async function flagForManualReview(orderId: string, riskScore: number, signals: FraudSignals) {
     await db.orders.update(orderId, {
       status: 'pending_fraud_review',
       fraudRiskScore: riskScore,
       fraudSignals: signals,
       reviewRequestedAt: new Date(),
     });

     // Do NOT fulfill the order
     // Do NOT capture the payment yet — authorize only

     // Notify the fraud review team
     await sendSlackAlert({
       channel: '#fraud-review',
       text: `Order ${orderId} flagged for review. Risk score: ${riskScore}/100`,
       fields: [
         {title: 'Amount', value: formatCurrency(signals.orderAmountCents)},
         {title: 'Signals', value: Object.entries(signals).filter(([, v]) => v).join(', ')},
       ],
       actions: [
         {text: 'Approve', url: `${ADMIN_URL}/fraud-review/${orderId}/approve`},
         {text: 'Reject', url: `${ADMIN_URL}/fraud-review/${orderId}/reject`},
       ],
     });
   }

   // Auto-expire unreviewed orders after 48 hours (release the authorization hold)
   // Run as a cron job
   async function expireUnreviewedOrders() {
     const expiredOrders = await db.orders.findExpiredReviewOrders(48);
     for (const order of expiredOrders) {
       await stripe.paymentIntents.cancel(order.paymentIntentId);
       await db.orders.update(order.id, {status: 'fraud_review_expired'});
       await sendOrderCancellationEmail(order);
     }
   }
   ```

6. **Monitor chargeback rates and tune rules**

   ```typescript
   // Daily fraud metrics report
   async function generateFraudMetrics(dateRange: {start: Date; end: Date}) {
     const orders = await db.orders.findByDateRange(dateRange);
     const chargebacks = await db.chargebacks.findByDateRange(dateRange);

     const totalRevenue = orders.reduce((sum, o) => sum + o.totalCents, 0);
     const chargebackVolume = chargebacks.reduce((sum, c) => sum + c.amountCents, 0);
     const chargebackRate = chargebacks.length / orders.length;

     return {
       totalOrders: orders.length,
       blockedOrders: orders.filter(o => o.status === 'blocked_fraud').length,
       reviewedOrders: orders.filter(o => o.status.includes('fraud_review')).length,
       chargebacks: chargebacks.length,
       chargebackRate: (chargebackRate * 100).toFixed(3) + '%', // Target < 0.5%
       chargebackVolume: formatCurrency(chargebackVolume),
       revenueProtected: formatCurrency(orders.filter(o => o.status === 'blocked_fraud').reduce((sum, o) => sum + o.totalCents, 0)),
     };
   }
   ```

## Examples

### Device fingerprinting with FingerprintJS

```typescript
// Client-side: collect fingerprint at checkout load
import FingerprintJS from '@fingerprintjs/fingerprintjs';

async function getDeviceFingerprint(): Promise<string> {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  return result.visitorId; // Stable across sessions on same device
}

// Include in checkout session
const visitorId = await getDeviceFingerprint();
await fetch('/api/checkout/start', {
  method: 'POST',
  body: JSON.stringify({cartId, deviceFingerprint: visitorId}),
});
```

```typescript
// Server-side: check if device is known
async function isKnownDevice(fingerprint: string, customerId: string): Promise<boolean> {
  const knownDevices = await db.customerDevices.findByCustomer(customerId);
  const isKnown = knownDevices.some(d => d.fingerprint === fingerprint);

  if (!isKnown) {
    await db.customerDevices.insert({customerId, fingerprint, firstSeenAt: new Date()});
  }
  return isKnown;
}
```

### IP reputation check with IP-API

```typescript
interface IpInfo {
  proxy: boolean;
  vpn: boolean;
  tor: boolean;
  country: string;
  riskScore: number;
}

export async function checkIpReputation(ip: string): Promise<IpInfo> {
  // IPQualityScore, MaxMind, or ip-api.com for IP intelligence
  const res = await fetch(
    `https://ipqualityscore.com/api/json/ip/${process.env.IPQS_API_KEY}/${ip}?strictness=1`
  );
  const data = await res.json();

  return {
    proxy: data.proxy,
    vpn: data.vpn,
    tor: data.tor,
    country: data.country_code,
    riskScore: data.fraud_score,
  };
}
```

## Best Practices

- **Layer defenses** — no single signal is reliable; combine velocity checks, IP reputation, device fingerprinting, and ML scoring so fraudsters must bypass multiple layers simultaneously
- **Tune rules using historical chargeback data** — build a confusion matrix mapping your risk thresholds to false-positive and false-negative rates; over-blocking legitimate customers costs more than the fraud itself
- **Use authorize-then-capture for high-risk orders** — authorize the card at checkout to hold the funds, then capture only after fraud review passes; releases are less costly than refunds
- **Track false positive rate as a KPI** — if more than 1% of legitimate orders are blocked or held, your rules are too aggressive; measure both fraud losses and revenue lost to false positives
- **Rotate and obfuscate your fraud rules** — sophisticated fraudsters probe checkout flows to identify rule thresholds; don't expose block reasons in API error messages
- **Keep a deny-list of fraudulent emails, cards, and devices** — once fraud is confirmed via chargeback, add the associated identifiers to a block list for future orders
- **Log all fraud signals for model training** — store the full signal set for every order regardless of outcome; this data trains better ML models over time

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| 3DS causing checkout abandonment | Use `automatic` 3DS mode rather than always requiring a challenge; this frictionlessly authenticates low-risk transactions and only prompts challenges when the issuer requires it |
| Velocity rules blocking legitimate bulk buyers | Whitelist B2B customers or high-LTV customer segments from velocity rules; use a tiered limit system based on account history |
| Chargeback filed despite 3DS authentication | Ensure your payment processor submits 3DS authentication data (`eci`, `cavv`, `xid`) correctly; without these fields the liability shift does not apply |
| Redis velocity keys never expiring | Always call `EXPIRE` when setting a new key; use `SET key value EX seconds NX` for atomic set-if-not-exists with expiry |
| Manual review queue growing unboundedly | Set SLA targets (e.g., 4-hour review window); implement auto-cancellation for orders not reviewed within 48 hours |

## Related Skills

- @secure-checkout
- @account-security
- @stripe-integration
- @bot-protection
- @gdpr-ecommerce
