---
name: payment-terms-optimization
description: "Configure flexible payment terms for B2B customers with net-30/60/90 options, early payment discounts, credit limit management, and automated collections"
category: payments-checkout
risk: safe
source: curated
date_added: "2026-03-12"
tags: [payment-terms, b2b, credit-management]
triggers: ["payment terms", "net-30 billing", "net-60", "credit terms", "B2B credit", "early payment discount", "credit limit", "trade credit", "payment terms management"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Payment Terms Optimization

## Overview

Payment terms define when a B2B customer must pay for goods or services delivered on credit. Standard options include net-30 (payment due 30 days after invoice date), net-60, net-90, and variants like "2/10 net-30" (2% discount if paid within 10 days, otherwise due in 30). Offering flexible payment terms is a competitive advantage in B2B commerce — it reduces friction in the purchase decision and builds customer loyalty — but it also introduces credit risk and cash flow exposure that must be carefully managed.

This skill covers the full payment terms lifecycle: configuring terms per customer segment, enforcing credit limits, offering early payment discount (EPD) incentives, automating collections escalation for overdue accounts, and building the analytics to measure the cost of extended terms against the revenue they generate.

The goal is not just flexibility but optimization: offering the right terms to the right customers while minimizing bad debt, DSO (days sales outstanding), and the hidden cost of financing your customers' working capital.

## When to Use This Skill

- When moving from prepay-only to net-terms for B2B customers to increase conversion
- When different customer segments need different terms (SMB net-30 vs. enterprise net-60)
- When you want to incentivize early payment with discounts to improve cash flow
- When setting up a new wholesale or distribution channel with trade accounts
- When credit losses are rising and you need better credit limit enforcement
- When building a self-serve payment terms application workflow for new accounts
- When you need to model the cash flow impact of extending or tightening terms

## Core Instructions

### 1. Design the credit and payment terms data model

```sql
CREATE TABLE payment_terms_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(30) UNIQUE NOT NULL,  -- 'net_30', 'net_60', '2_10_net_30'
  display_name    VARCHAR(100) NOT NULL,         -- 'Net 30 Days'
  net_days        INT NOT NULL,                  -- Days until payment is due
  discount_pct    NUMERIC(4, 2) DEFAULT 0,       -- Early payment discount percentage
  discount_days   INT DEFAULT 0,                 -- Days within which discount applies
  description     TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Insert standard terms
INSERT INTO payment_terms_config (code, display_name, net_days, discount_pct, discount_days) VALUES
  ('due_on_receipt', 'Due on Receipt', 0, 0, 0),
  ('net_10', 'Net 10', 10, 0, 0),
  ('net_15', 'Net 15', 15, 0, 0),
  ('net_30', 'Net 30', 30, 0, 0),
  ('net_45', 'Net 45', 45, 0, 0),
  ('net_60', 'Net 60', 60, 0, 0),
  ('net_90', 'Net 90', 90, 0, 0),
  ('2_10_net_30', '2/10 Net 30', 30, 2.00, 10),
  ('1_10_net_30', '1/10 Net 30', 30, 1.00, 10),
  ('2_10_net_60', '2/10 Net 60', 60, 2.00, 10);

CREATE TABLE customer_credit_profiles (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id            UUID UNIQUE NOT NULL REFERENCES customers(id),
  credit_status          VARCHAR(30) DEFAULT 'pending',
  -- 'pending', 'approved', 'probationary', 'suspended', 'declined'
  credit_limit           NUMERIC(12, 2) DEFAULT 0,
  available_credit       NUMERIC(12, 2) DEFAULT 0,  -- Credit limit minus open AR
  current_ar_balance     NUMERIC(12, 2) DEFAULT 0,  -- Total outstanding invoices
  payment_terms_code     VARCHAR(30) REFERENCES payment_terms_config(code),
  approved_by            VARCHAR(255),
  approved_at            TIMESTAMPTZ,
  last_reviewed_at       DATE,
  next_review_date       DATE,
  credit_application_id  UUID,
  risk_score             INT,                        -- Internal score 0-100
  risk_tier              VARCHAR(20),                -- 'low', 'medium', 'high'
  avg_days_to_pay        NUMERIC(5, 1),              -- Computed from payment history
  on_time_payment_rate   NUMERIC(5, 2),              -- Percentage paid on time
  late_payment_count     INT DEFAULT 0,
  notes                  TEXT,
  credit_hold            BOOLEAN DEFAULT FALSE,
  credit_hold_reason     TEXT,
  credit_hold_date       TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE credit_applications (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id        UUID NOT NULL REFERENCES customers(id),
  requested_limit    NUMERIC(12, 2) NOT NULL,
  requested_terms    VARCHAR(30),
  -- Business info
  company_name       VARCHAR(255),
  years_in_business  INT,
  annual_revenue     NUMERIC(15, 2),
  tax_id             VARCHAR(50),
  bank_name          VARCHAR(255),
  bank_account_ref   VARCHAR(100),
  -- Trade references
  trade_references   JSONB,  -- Array of {company, contact, phone, email}
  -- Decision
  status             VARCHAR(30) DEFAULT 'submitted',
  -- 'submitted', 'under_review', 'approved', 'declined', 'more_info_needed'
  approved_limit     NUMERIC(12, 2),
  approved_terms     VARCHAR(30),
  decision_reason    TEXT,
  decided_by         VARCHAR(255),
  decided_at         TIMESTAMPTZ,
  submitted_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payment_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  invoice_id      UUID REFERENCES invoices(id),
  invoice_amount  NUMERIC(12, 2),
  due_date        DATE,
  paid_date       DATE,
  days_to_pay     INT,       -- positive = late, negative = early
  payment_method  VARCHAR(50),
  early_discount_taken BOOLEAN DEFAULT FALSE,
  discount_amount NUMERIC(8, 2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_customer ON customer_credit_profiles (customer_id);
CREATE INDEX idx_credit_status ON customer_credit_profiles (credit_status, credit_hold);
CREATE INDEX idx_payment_history_customer ON payment_history (customer_id, due_date);
```

### 2. Credit limit enforcement at order checkout

```javascript
// services/payment-terms/credit-check.js
export async function checkCreditAvailability(customerId, orderAmount) {
  const profile = await db.customerCreditProfiles.findUnique({
    where: { customer_id: customerId },
  });

  if (!profile) {
    return { approved: false, reason: 'no_credit_profile', requiresApplication: true };
  }

  if (profile.credit_hold) {
    return {
      approved: false,
      reason: 'credit_hold',
      message: `Account is on credit hold: ${profile.credit_hold_reason}`,
    };
  }

  if (profile.credit_status !== 'approved') {
    return { approved: false, reason: `credit_status_${profile.credit_status}` };
  }

  if (orderAmount > profile.available_credit) {
    return {
      approved: false,
      reason: 'insufficient_credit',
      available_credit: profile.available_credit,
      requested: orderAmount,
      shortfall: orderAmount - profile.available_credit,
    };
  }

  // Temporarily reserve the credit (will be confirmed when order is placed)
  await db.customerCreditProfiles.update({
    where: { customer_id: customerId },
    data: {
      available_credit: { decrement: orderAmount },
      current_ar_balance: { increment: orderAmount },
    },
  });

  return {
    approved: true,
    payment_terms: profile.payment_terms_code,
    available_credit_after: profile.available_credit - orderAmount,
  };
}

export async function releaseReservedCredit(customerId, amount) {
  // Called if order is cancelled before confirmation
  await db.customerCreditProfiles.update({
    where: { customer_id: customerId },
    data: {
      available_credit: { increment: amount },
      current_ar_balance: { decrement: amount },
    },
  });
}
```

### 3. Early payment discount calculation

```javascript
// services/payment-terms/early-payment.js
export function calculateEarlyPaymentDiscount(invoice, paymentDate) {
  const terms = PAYMENT_TERMS[invoice.payment_terms];
  if (!terms || terms.discount_pct === 0) return null;

  const discountCutoffDate = new Date(invoice.issue_date);
  discountCutoffDate.setDate(discountCutoffDate.getDate() + terms.discount_days);

  const isWithinDiscountPeriod = new Date(paymentDate) <= discountCutoffDate;

  if (!isWithinDiscountPeriod) return null;

  const discountAmount = invoice.total_amount * (terms.discount_pct / 100);
  const amountDue = invoice.total_amount - discountAmount;

  return {
    eligible: true,
    discount_pct: terms.discount_pct,
    discount_amount: discountAmount,
    amount_due_with_discount: amountDue,
    discount_expires: discountCutoffDate,
  };
}

// Compute the annualized cost of NOT taking an early payment discount
// For "2/10 net-30": customer gives up 2% to defer payment 20 days
// Annualized rate = (discount% / (1 - discount%)) * (365 / (net_days - discount_days))
export function computeImpliedCostOfCredit(termsCode) {
  const terms = PAYMENT_TERMS[termsCode];
  if (!terms || terms.discount_pct === 0) return null;

  const deferralDays = terms.net_days - terms.discount_days;
  const discountRate = terms.discount_pct / 100;
  const annualizedRate = (discountRate / (1 - discountRate)) * (365 / deferralDays);

  return {
    terms_code: termsCode,
    discount_pct: terms.discount_pct,
    deferral_days: deferralDays,
    annualized_cost_pct: (annualizedRate * 100).toFixed(2),
    equivalent_apr: `${(annualizedRate * 100).toFixed(2)}%`,
  };
}
// "2/10 net-30" = annualized cost of ~36.7% — most customers should take the discount
```

### 4. Automated risk scoring and terms recommendation

```javascript
// services/payment-terms/risk-scorer.js
export async function scoreCustomerCredit(customerId) {
  const history = await db.paymentHistory.findMany({
    where: { customer_id: customerId, created_at: { gte: new Date(Date.now() - 365 * 86400000) } },
  });

  const totalPayments = history.length;
  if (totalPayments === 0) return { score: 50, tier: 'medium', terms_recommendation: 'net_30' };

  const lateDays = history.map((h) => Math.max(0, h.days_to_pay - 0));
  const avgDaysLate = lateDays.reduce((a, b) => a + b, 0) / totalPayments;
  const onTimePct = history.filter((h) => h.days_to_pay <= 0).length / totalPayments;

  // Score 0-100 (higher = lower risk)
  let score = 50;
  score += onTimePct >= 0.95 ? 25 : onTimePct >= 0.80 ? 10 : -10;
  score += avgDaysLate <= 3 ? 15 : avgDaysLate <= 10 ? 5 : -15;
  score += totalPayments >= 12 ? 10 : totalPayments >= 6 ? 5 : 0;

  score = Math.max(0, Math.min(100, score));

  const tier = score >= 75 ? 'low' : score >= 50 ? 'medium' : 'high';
  const recommendations = {
    low: { terms: 'net_60', limit_multiplier: 3.0 },
    medium: { terms: 'net_30', limit_multiplier: 1.5 },
    high: { terms: 'net_15', limit_multiplier: 0.75 },
  };

  await db.customerCreditProfiles.update({
    where: { customer_id: customerId },
    data: {
      risk_score: score,
      risk_tier: tier,
      avg_days_to_pay: avgDaysLate,
      on_time_payment_rate: onTimePct * 100,
      last_reviewed_at: new Date(),
    },
  });

  return { score, tier, ...recommendations[tier] };
}
```

### 5. Collections escalation policy

```javascript
// services/payment-terms/collections.js
export const COLLECTIONS_POLICY = {
  low_risk:    [{ days: 5,  action: 'reminder_email' }, { days: 15, action: 'second_notice' }, { days: 30, action: 'account_manager_call' }, { days: 45, action: 'credit_hold' }],
  medium_risk: [{ days: 3,  action: 'reminder_email' }, { days: 10, action: 'second_notice' }, { days: 20, action: 'credit_hold' },           { days: 45, action: 'collections_referral' }],
  high_risk:   [{ days: 1,  action: 'reminder_email' }, { days: 7,  action: 'credit_hold' },   { days: 21, action: 'collections_referral' }],
};

export async function enforceCollectionsPolicy() {
  const overdueInvoices = await db.invoices.findMany({
    where: { status: 'overdue', void_at: null },
    include: { customer: { include: ['credit_profile'] } },
  });

  for (const invoice of overdueInvoices) {
    const tier = invoice.customer.credit_profile?.risk_tier ?? 'medium_risk';
    const policy = COLLECTIONS_POLICY[tier];
    const daysOverdue = Math.floor((new Date() - invoice.due_date) / 86400000);

    const nextAction = policy.find(
      (step) => step.days <= daysOverdue && !hasActionBeenTaken(invoice.id, step.action)
    );

    if (nextAction) await executeCollectionsAction(invoice, nextAction);
  }
}
```

## Examples

### Credit terms performance dashboard query

```sql
SELECT
  ptc.display_name AS payment_terms,
  COUNT(DISTINCT ccp.customer_id) AS customer_count,
  AVG(ccp.avg_days_to_pay) AS avg_dso,
  AVG(ccp.on_time_payment_rate) AS on_time_pct,
  SUM(ccp.current_ar_balance) AS total_ar,
  SUM(ccp.credit_limit) AS total_credit_extended,
  ROUND(SUM(ccp.current_ar_balance) / NULLIF(SUM(ccp.credit_limit), 0) * 100, 1) AS utilization_pct
FROM customer_credit_profiles ccp
JOIN payment_terms_config ptc ON ptc.code = ccp.payment_terms_code
WHERE ccp.credit_status = 'approved'
GROUP BY ptc.display_name, ptc.net_days
ORDER BY ptc.net_days;
```

### Early payment discount uptake analysis

```sql
SELECT
  i.payment_terms,
  COUNT(*) AS total_invoices,
  COUNT(*) FILTER (WHERE ph.early_discount_taken) AS discounts_taken,
  ROUND(COUNT(*) FILTER (WHERE ph.early_discount_taken)::NUMERIC / COUNT(*) * 100, 1) AS uptake_pct,
  SUM(ph.discount_amount) AS total_discounts_given,
  AVG(ph.days_to_pay) AS avg_days_to_pay
FROM invoices i
LEFT JOIN payment_history ph ON ph.invoice_id = i.id
WHERE i.payment_terms IN ('2_10_net_30', '1_10_net_30', '2_10_net_60')
  AND i.issue_date >= NOW() - INTERVAL '6 months'
GROUP BY i.payment_terms;
```

## Best Practices

- **Start new customers on stricter terms** — onboard new B2B accounts at net-30 or even net-15 and upgrade terms after 6 months of on-time payment. Never start with net-60 or net-90 without a credit check.
- **Review credit limits annually at minimum** — a customer who qualified for $50,000 credit three years ago may look very different today. Set calendar reminders for annual reviews.
- **Price early payment discounts correctly** — "2/10 net-30" implies an annualized cost of ~36.7% to the customer; it should be taken by any customer with a cost of capital above ~10%.
- **Segment collections intensity by risk tier** — high-risk customers need follow-up on day 3; low-risk, long-term accounts with a perfect history deserve more grace.
- **Never ship to accounts on credit hold** — enforce credit holds at the order level, not just the invoicing level. Once goods leave the warehouse you have lost leverage.
- **Document credit decisions** — store the reason for every credit limit change and terms upgrade; you will need this if you ever have to defend a write-off to auditors.

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Customer places an order that exceeds credit limit | Check available credit before order confirmation, not just at invoicing; reserve the credit at order creation |
| Early payment discounts taken after the discount period | Record the payment date and check against the discount cutoff strictly; partial payments during the discount period only earn a pro-rated discount |
| Credit limits not refreshed as AR balance changes | Update `available_credit` in real-time whenever an invoice is issued (decrement) or payment is received (increment) |
| Different departments grant different terms informally | Centralize terms configuration; sales reps should request terms changes through the credit system, not set them directly |
| High bad debt write-off rate | Implement a credit score before any terms approval; require a credit application and trade references for limits above $10K |
| Terms change does not apply to in-flight orders | Clearly define whether terms changes apply to future orders only or also to existing unpaid invoices; document the policy |

## Related Skills

- @accounts-receivable-automation
- @invoice-generation-automation
- @payment-reconciliation-automation
- @stripe-integration
