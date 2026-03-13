---
name: chargeback-management-prevention
description: "Prevent and manage chargebacks with fraud scoring, compelling evidence automation, Visa CE 3.0 / Mastercom integration, and win-rate optimization"
category: payments-checkout
risk: safe
source: curated
date_added: "2026-03-12"
tags: [chargebacks, disputes, fraud-prevention]
triggers: ["chargeback management", "dispute handling", "prevent chargebacks", "fraud disputes", "visa compelling evidence", "mastercom", "chargeback representment"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: advanced
---

# Chargeback Management and Prevention

## Overview

A chargeback occurs when a cardholder disputes a transaction with their bank, forcing a reversal of funds and levying a fee (typically $15–$100 per dispute) on the merchant. Beyond the direct financial loss, a chargeback ratio above 1% (Visa) or 1.5% (Mastercard) triggers the card network's dispute monitoring programs, which can result in monthly fines and ultimately account termination.

This skill covers the full chargeback lifecycle: proactive prevention through fraud scoring and order velocity checks, automated evidence compilation for representment, integration with Visa Compelling Evidence 3.0 (CE 3.0) and Mastercard's Mastercom system, win-rate analysis, and threshold-based alerting before monitoring program thresholds are breached.

Effective chargeback management requires two simultaneous tracks: (1) reducing the volume of disputes by catching fraud before authorization, and (2) winning more of the disputes that do occur by submitting complete, well-organized evidence packages automatically and within the response window.

## When to Use This Skill

- When chargeback ratio is approaching 0.65% (the early-warning level Visa monitors before the 1% threshold)
- When your team is manually compiling evidence packages in spreadsheets and missing response deadlines
- When you need to integrate with Stripe Radar, Kount, Signifyd, or a custom fraud scoring system
- When processing international transactions that have higher dispute rates due to authorization declines
- When building a marketplace where seller-side fraud creates merchant liability
- When you want to implement Visa CE 3.0 to shift liability on friendly fraud disputes
- When your dispute win rate is below 40% and you need to understand why

## Prerequisites & Platform Notes

**Shopify**: Shopify handles checkout natively. Use Shopify Payments (powered by Stripe), checkout extensions, and Shopify Functions for custom discount/payment logic. You cannot modify the core checkout without Checkout Extensions.
**WooCommerce**: WooCommerce supports payment gateways via plugins (WooCommerce Stripe, WooCommerce PayPal). Extend checkout with woocommerce_checkout_process and woocommerce_payment_complete hooks.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store, Stripe or PayPal account, relevant payment plugin/app

## Core Instructions

### 1. Model the chargeback lifecycle

```sql
CREATE TABLE chargebacks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES orders(id),
  charge_id             VARCHAR(255) NOT NULL,   -- Stripe charge_id or processor reference
  processor             VARCHAR(50) NOT NULL,    -- 'stripe', 'paypal', 'adyen'
  processor_dispute_id  VARCHAR(255) UNIQUE NOT NULL,
  network               VARCHAR(20),             -- 'visa', 'mastercard', 'amex', 'discover'
  reason_code           VARCHAR(20) NOT NULL,    -- e.g., '10.4', '13.1', '4853'
  reason_category       VARCHAR(50) NOT NULL,    -- 'fraud', 'not_received', 'not_as_described', 'processing_error', 'authorization'
  disputed_amount       NUMERIC(10, 2) NOT NULL,
  currency              CHAR(3) NOT NULL DEFAULT 'USD',
  chargeback_date       DATE NOT NULL,
  response_due_date     DATE NOT NULL,
  status                VARCHAR(50) NOT NULL DEFAULT 'open',
  -- 'open', 'evidence_submitted', 'won', 'lost', 'accepted', 'pre_arbitration', 'arbitration'
  outcome               VARCHAR(50),             -- 'won', 'lost', 'accepted'
  outcome_date          DATE,
  chargeback_fee        NUMERIC(8, 2) DEFAULT 0,
  evidence_submitted_at TIMESTAMPTZ,
  auto_submitted        BOOLEAN DEFAULT FALSE,
  win_probability_score NUMERIC(4, 3),
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chargeback_evidence (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chargeback_id  UUID NOT NULL REFERENCES chargebacks(id),
  evidence_type  VARCHAR(100) NOT NULL,
  -- 'customer_communication', 'shipping_documentation', 'refund_policy', 'duplicate_charge_proof',
  -- 'service_documentation', 'customer_signature', 'delivery_confirmation', 'prior_undisputed_transactions'
  content        TEXT,
  file_url       VARCHAR(1000),
  collected_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cb_status ON chargebacks (status, response_due_date);
CREATE INDEX idx_cb_order ON chargebacks (order_id);
CREATE INDEX idx_cb_date ON chargebacks (chargeback_date);
```

### 2. Ingest disputes via Stripe webhooks

```javascript
// webhooks/stripe-disputes.js
export async function handleDisputeWebhook(event) {
  switch (event.type) {
    case 'charge.dispute.created':
      await onDisputeCreated(event.data.object);
      break;
    case 'charge.dispute.updated':
      await onDisputeUpdated(event.data.object);
      break;
    case 'charge.dispute.closed':
      await onDisputeClosed(event.data.object);
      break;
  }
}

async function onDisputeCreated(dispute) {
  const charge = await stripe.charges.retrieve(dispute.charge, {
    expand: ['payment_intent', 'payment_intent.metadata'],
  });

  const orderId = charge.payment_intent?.metadata?.order_id;
  const order = orderId ? await db.orders.findById(orderId) : null;

  // Calculate response deadline — typically 7–21 days depending on network
  const responseDueDays = getResponseDueDays(dispute.payment_method_details?.card?.network, dispute.reason);
  const responseDueDate = new Date(dispute.created * 1000);
  responseDueDate.setDate(responseDueDate.getDate() + responseDueDays);

  const chargeback = await db.chargebacks.create({
    data: {
      order_id: orderId,
      charge_id: dispute.charge,
      processor: 'stripe',
      processor_dispute_id: dispute.id,
      network: charge.payment_method_details?.card?.network,
      reason_code: dispute.reason,
      reason_category: mapDisputeReasonToCategory(dispute.reason),
      disputed_amount: dispute.amount / 100,
      currency: dispute.currency.toUpperCase(),
      chargeback_date: new Date(dispute.created * 1000),
      response_due_date: responseDueDate,
      status: 'open',
    },
  });

  // Automatically collect and score evidence
  const { score, evidence } = await collectAndScoreEvidence(chargeback, order, dispute);

  await db.chargebacks.update({
    where: { id: chargeback.id },
    data: { win_probability_score: score },
  });

  // Auto-submit if score is high enough and there's enough time
  const daysUntilDue = Math.floor((responseDueDate - new Date()) / 86400000);
  if (score >= 0.65 && daysUntilDue >= 3) {
    await submitDisputeEvidence(chargeback.id, evidence);
  } else if (score < 0.25) {
    // Very low win probability — consider accepting the dispute
    await notifyTeamLowWinProbability(chargeback);
  } else {
    await notifyTeamForReview(chargeback, score, daysUntilDue);
  }
}

function getResponseDueDays(network, reason) {
  if (network === 'amex') return 20;
  if (network === 'discover') return 45;
  // Visa and Mastercard: most reasons are 20 days, some fraud are 30
  return reason?.includes('fraud') ? 30 : 20;
}
```

### 3. Automate evidence collection

```javascript
// services/chargebacks/evidence-collector.js
export async function collectAndScoreEvidence(chargeback, order, dispute) {
  const evidence = {};
  let scoreFactors = [];

  // 1. Delivery confirmation — strongest evidence for "item not received"
  if (order?.tracking_number) {
    const deliveryProof = await fetchDeliveryConfirmation(order.tracking_number, order.carrier);
    if (deliveryProof?.delivered) {
      evidence.shipping_documentation = formatDeliveryEvidence(deliveryProof, order);
      scoreFactors.push({ weight: 0.35, hit: true, label: 'delivery_confirmed' });
    } else {
      scoreFactors.push({ weight: 0.35, hit: false, label: 'delivery_confirmed' });
    }
  }

  // 2. Customer communication history
  const communications = await fetchCustomerCommunications(order?.customer_email);
  if (communications.length > 0) {
    evidence.customer_communication = formatCommunicationEvidence(communications);
    scoreFactors.push({ weight: 0.25, hit: true, label: 'customer_communication' });
  }

  // 3. Refund policy acceptance
  if (order?.policy_accepted_at) {
    evidence.refund_policy = formatPolicyEvidence(order);
    scoreFactors.push({ weight: 0.10, hit: true, label: 'policy_accepted' });
  }

  // 4. Visa CE 3.0 — prior undisputed transactions (most powerful for friendly fraud)
  if (chargeback.network === 'visa' && chargeback.reason_category === 'fraud') {
    const priorTxns = await findPriorUndisputedTransactions(order?.customer_email, chargeback.charge_id);
    if (priorTxns.length >= 2) {
      evidence.prior_undisputed_transactions = formatCE3Evidence(priorTxns, order);
      scoreFactors.push({ weight: 0.30, hit: true, label: 'ce3_eligible' });
    }
  }

  // 5. IP and device fingerprint matching
  const deviceMatch = await checkDeviceFingerprint(order?.session_id, order?.customer_ip);
  if (deviceMatch?.matches_cardholder_history) {
    scoreFactors.push({ weight: 0.15, hit: true, label: 'device_match' });
  }

  const score = scoreFactors.reduce((sum, f) => sum + (f.hit ? f.weight : 0), 0);

  return { score, evidence };
}

async function findPriorUndisputedTransactions(customerEmail, excludeChargeId) {
  // CE 3.0 requires 2 prior non-disputed transactions in the past 120 days
  // with the same card / email combination
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 120);

  return db.orders.findMany({
    where: {
      customer_email: customerEmail,
      created_at: { gte: cutoff },
      status: 'completed',
      chargebacks: { none: {} },
      NOT: { stripe_charge_id: excludeChargeId },
    },
    orderBy: { created_at: 'desc' },
    take: 5,
  });
}
```

### 4. Submit evidence to Stripe

```javascript
// services/chargebacks/representment.js
export async function submitDisputeEvidence(chargebackId, evidenceData) {
  const chargeback = await db.chargebacks.findById(chargebackId);

  // Build the Stripe evidence payload
  const stripeEvidence = {
    customer_name: evidenceData.customer_name,
    customer_email_address: evidenceData.customer_email,
    customer_ip_address: evidenceData.customer_ip,
    billing_address: evidenceData.billing_address,
    shipping_address: evidenceData.shipping_address,
    shipping_date: evidenceData.shipping_date,
    shipping_carrier: evidenceData.carrier,
    shipping_tracking_number: evidenceData.tracking_number,
    refund_policy: evidenceData.refund_policy_text,
    refund_policy_disclosure: evidenceData.policy_url,
    service_documentation: evidenceData.service_description,
    customer_communication: evidenceData.customer_comms,
    uncategorized_text: buildNarrativeSummary(chargeback, evidenceData),
  };

  // Upload files if present (Stripe requires file IDs)
  if (evidenceData.delivery_screenshot_path) {
    const fileUpload = await stripe.files.create({
      purpose: 'dispute_evidence',
      file: {
        data: readFileSync(evidenceData.delivery_screenshot_path),
        name: 'delivery_confirmation.pdf',
        type: 'application/pdf',
      },
    });
    stripeEvidence.uncategorized_file = fileUpload.id;
  }

  // Submit to Stripe
  await stripe.disputes.update(chargeback.processor_dispute_id, {
    evidence: stripeEvidence,
    submit: true,
  });

  // Record the submission
  await db.chargebacks.update({
    where: { id: chargebackId },
    data: {
      status: 'evidence_submitted',
      evidence_submitted_at: new Date(),
      auto_submitted: true,
    },
  });

  await db.chargebackEvidence.createMany({
    data: Object.entries(stripeEvidence)
      .filter(([, v]) => v)
      .map(([type, content]) => ({
        chargeback_id: chargebackId,
        evidence_type: type,
        content: String(content),
      })),
  });
}

function buildNarrativeSummary(chargeback, evidence) {
  const lines = [
    `Order ${chargeback.order_id} was placed on ${evidence.order_date} by ${evidence.customer_email}.`,
    `The item was shipped via ${evidence.carrier} (tracking: ${evidence.tracking_number}) on ${evidence.shipping_date}.`,
  ];
  if (evidence.delivered) {
    lines.push(`Delivery was confirmed on ${evidence.delivery_date} with signature ${evidence.signature ?? 'not required'}.`);
  }
  if (evidence.prior_orders_count > 0) {
    lines.push(`This customer has placed ${evidence.prior_orders_count} prior orders without disputes.`);
  }
  return lines.join(' ');
}
```

### 5. Monitor chargeback ratio and trigger alerts

```javascript
// services/chargebacks/monitoring.js
const VISA_WARNING_THRESHOLD = 0.0065;   // 0.65% — early warning
const VISA_CRITICAL_THRESHOLD = 0.0100;  // 1.00% — monitoring program
const MC_WARNING_THRESHOLD = 0.0100;     // 1.00% — early warning
const MC_CRITICAL_THRESHOLD = 0.0150;   // 1.50% — excessive chargeback program

export async function computeMonthlyChargebackRatio(month) {
  const [chargebacks, transactions] = await Promise.all([
    db.chargebacks.count({
      where: {
        chargeback_date: { gte: startOfMonth(month), lte: endOfMonth(month) },
        network: 'visa',
      },
    }),
    db.orders.count({
      where: {
        created_at: { gte: startOfMonth(month), lte: endOfMonth(month) },
        payment_processor: 'stripe',
      },
    }),
  ]);

  const ratio = chargebacks / (transactions || 1);

  if (ratio >= VISA_CRITICAL_THRESHOLD) {
    await sendCriticalAlert({ ratio, chargebacks, transactions, network: 'Visa', month });
  } else if (ratio >= VISA_WARNING_THRESHOLD) {
    await sendWarningAlert({ ratio, chargebacks, transactions, network: 'Visa', month });
  }

  return { ratio, chargebacks, transactions };
}
```

## Best Practices

- **Respond to every dispute** — even low-value ones ($5–$20). Accepting chargebacks still counts against your ratio. Only accept if the dispute is clearly valid and the win probability is near zero.
- **Collect evidence at order creation**, not when the dispute arrives. Delivery confirmations, IP addresses, and device fingerprints are often unavailable 60 days after the order.
- **Use Visa CE 3.0 proactively** — submit prior undisputed transaction data for all Visa fraud disputes. It shifts liability to the issuer when you have two qualifying prior transactions.
- **Segment win rates by reason code** — your strategy for "item not received" (10.4) is completely different from "not as described" (13.1). Track win rates separately per reason code.
- **Set response deadline reminders at T-5 days** — the response window is non-negotiable. Build automated reminders 5 and 2 days before the deadline for any open dispute.
- **Fight chargebacks on high-value orders** — prioritize evidence compilation for orders above your average order value. The ROI of winning a $500 dispute is much higher than a $25 one.
- **Block repeat disputers** — customers with two or more chargebacks in 12 months should be flagged and require manual review for future purchases.

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Missing the response deadline | Set automated calendar alerts at T-7 and T-2 days; never rely on manual tracking |
| Evidence submitted but dispute still lost | Stripe requires evidence to be in a specific format; use the Stripe Dashboard to verify evidence was accepted before the deadline |
| High friendly fraud rate | Implement Visa CE 3.0; add explicit refund policy acceptance at checkout with a checkbox and timestamp |
| Dispute ratio counted differently by processor and card network | Visa counts chargebacks-to-transactions in the same calendar month; use the same calculation window for your monitoring |
| Chargebacks not linked to orders | Always pass `order_id` in Stripe metadata; without it, evidence collection is manual |
| Pre-arbitration fees surprise | Understand the escalation path: dispute → representment → pre-arbitration → arbitration; each step has fees; know when to concede |

## Related Skills

- @stripe-integration
- @payment-reconciliation-automation
- @fraud-detection
- @order-processing-pipeline
