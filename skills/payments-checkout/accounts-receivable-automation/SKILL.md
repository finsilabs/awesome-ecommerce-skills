---
name: accounts-receivable-automation
description: "Automate B2B accounts receivable with invoice generation, payment tracking, dunning sequences for past-due invoices, and aging analysis dashboards"
category: payments-checkout
risk: safe
source: curated
date_added: "2026-03-12"
tags: [accounts-receivable, invoicing, b2b-payments]
triggers: ["accounts receivable", "invoice tracking", "dunning emails", "past-due invoices", "AR automation", "B2B billing", "aging report", "invoice follow-up"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Accounts Receivable Automation

## Overview

Accounts receivable (AR) automation converts manual invoice follow-up work — sending reminders, tracking payment status, escalating overdue accounts — into a system-driven workflow. In B2B ecommerce, where customers pay on net-30, net-60, or net-90 terms rather than at checkout, AR management directly impacts cash flow and days sales outstanding (DSO).

This skill covers the complete AR lifecycle: invoice generation linked to orders or service contracts, payment tracking with automated reconciliation when payment arrives, configurable dunning sequences (email sequences for past-due accounts), credit limit enforcement, and aging analysis dashboards that let finance teams see exactly what is owed, by whom, and how overdue it is.

A well-built AR automation system reduces DSO by 5–15 days by ensuring follow-up is timely and persistent, eliminates invoices falling through the cracks in manual workflows, and gives the finance team real-time visibility into cash flow.

## When to Use This Skill

- When your B2B customers pay on credit terms (net-30, net-60, net-90) rather than at checkout
- When your finance team spends more than a few hours per week chasing past-due invoices
- When you have more than 50 active B2B accounts and manual tracking is breaking down
- When you need to enforce credit limits and flag accounts that have exceeded them
- When DSO is higher than industry benchmarks and you need to identify the root cause
- When building a wholesale or distribution ecommerce platform with trade accounts
- When you need audit-ready AR records for lenders or investors doing due diligence

## Core Instructions

### 1. Design the AR data model

```sql
CREATE TABLE invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number    VARCHAR(50) UNIQUE NOT NULL,
  customer_id       UUID NOT NULL REFERENCES customers(id),
  order_id          UUID REFERENCES orders(id),
  status            VARCHAR(30) NOT NULL DEFAULT 'draft',
  -- 'draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'written_off', 'void'
  issue_date        DATE NOT NULL,
  due_date          DATE NOT NULL,
  payment_terms     VARCHAR(30) NOT NULL,  -- 'net_30', 'net_60', 'net_90', 'due_on_receipt', '2/10_net_30'
  subtotal          NUMERIC(12, 2) NOT NULL,
  tax_amount        NUMERIC(12, 2) DEFAULT 0,
  total_amount      NUMERIC(12, 2) NOT NULL,
  amount_paid       NUMERIC(12, 2) DEFAULT 0,
  amount_due        NUMERIC(12, 2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  currency          CHAR(3) NOT NULL DEFAULT 'USD',
  notes             TEXT,
  po_number         VARCHAR(100),          -- Customer's purchase order number
  last_sent_at      TIMESTAMPTZ,
  last_viewed_at    TIMESTAMPTZ,
  paid_at           TIMESTAMPTZ,
  void_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoice_line_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  quantity     NUMERIC(10, 4) NOT NULL,
  unit_price   NUMERIC(12, 4) NOT NULL,
  discount_pct NUMERIC(5, 2) DEFAULT 0,
  line_total   NUMERIC(12, 2) NOT NULL,
  tax_rate     NUMERIC(5, 4) DEFAULT 0,
  tax_amount   NUMERIC(12, 2) DEFAULT 0,
  sort_order   INT DEFAULT 0
);

CREATE TABLE invoice_payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id     UUID NOT NULL REFERENCES invoices(id),
  amount         NUMERIC(12, 2) NOT NULL,
  payment_date   DATE NOT NULL,
  payment_method VARCHAR(50),   -- 'ach', 'wire', 'check', 'credit_card', 'stripe'
  reference      VARCHAR(255),  -- check number, wire reference, etc.
  notes          TEXT,
  recorded_by    VARCHAR(255),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dunning_sequences (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(100) NOT NULL,
  is_default       BOOLEAN DEFAULT FALSE,
  steps            JSONB NOT NULL  -- Array of {days_overdue, action, template_id}
);

CREATE TABLE dunning_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES invoices(id),
  step_number   INT NOT NULL,
  action        VARCHAR(50) NOT NULL,  -- 'email', 'sms', 'phone_task', 'hold_account'
  template_name VARCHAR(100),
  sent_at       TIMESTAMPTZ DEFAULT NOW(),
  opened_at     TIMESTAMPTZ,
  clicked_at    TIMESTAMPTZ
);

CREATE TABLE customer_credit (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       UUID UNIQUE NOT NULL REFERENCES customers(id),
  credit_limit      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  current_balance   NUMERIC(12, 2) DEFAULT 0,  -- Total open AR
  available_credit  NUMERIC(12, 2) GENERATED ALWAYS AS (credit_limit - current_balance) STORED,
  payment_terms     VARCHAR(30) DEFAULT 'net_30',
  credit_hold       BOOLEAN DEFAULT FALSE,
  credit_hold_reason TEXT,
  last_payment_date DATE,
  avg_days_to_pay   NUMERIC(5, 1),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_customer ON invoices (customer_id, status);
CREATE INDEX idx_invoices_due_date ON invoices (due_date, status);
CREATE INDEX idx_invoices_number ON invoices (invoice_number);
```

### 2. Invoice generation service

```javascript
// services/ar/invoice-generator.js
export async function generateInvoice({ orderId, customerId, paymentTerms, lineItems, poNumber }) {
  const customer = await db.customers.findById(customerId, { include: ['credit'] });
  const invoiceNumber = await generateInvoiceNumber();

  const issueDate = new Date();
  const dueDate = computeDueDate(issueDate, paymentTerms);

  const subtotal = lineItems.reduce((sum, item) => {
    const discounted = item.unit_price * item.quantity * (1 - (item.discount_pct ?? 0) / 100);
    return sum + discounted;
  }, 0);

  const taxAmount = lineItems.reduce((sum, item) => sum + (item.tax_amount ?? 0), 0);
  const total = subtotal + taxAmount;

  const invoice = await db.invoices.create({
    data: {
      invoice_number: invoiceNumber,
      customer_id: customerId,
      order_id: orderId ?? null,
      status: 'draft',
      issue_date: issueDate,
      due_date: dueDate,
      payment_terms: paymentTerms,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total,
      amount_paid: 0,
      currency: customer.currency ?? 'USD',
      po_number: poNumber ?? null,
      line_items: {
        create: lineItems.map((item, idx) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_pct: item.discount_pct ?? 0,
          line_total: item.unit_price * item.quantity * (1 - (item.discount_pct ?? 0) / 100),
          tax_rate: item.tax_rate ?? 0,
          tax_amount: item.tax_amount ?? 0,
          sort_order: idx,
        })),
      },
    },
    include: { line_items: true, customer: true },
  });

  // Update customer's open AR balance
  await db.customerCredit.update({
    where: { customer_id: customerId },
    data: { current_balance: { increment: total } },
  });

  return invoice;
}

async function generateInvoiceNumber() {
  // Format: INV-2026-0001234
  const year = new Date().getFullYear();
  const count = await db.invoices.count({ where: { invoice_number: { startsWith: `INV-${year}-` } } });
  return `INV-${year}-${String(count + 1).padStart(7, '0')}`;
}

function computeDueDate(issueDate, paymentTerms) {
  const daysMap = {
    due_on_receipt: 0,
    net_10: 10,
    net_15: 15,
    net_30: 30,
    net_45: 45,
    net_60: 60,
    net_90: 90,
    '2/10_net_30': 30,   // 2% discount if paid in 10 days, otherwise net 30
  };
  const days = daysMap[paymentTerms] ?? 30;
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate;
}
```

### 3. Automated dunning sequences

```javascript
// services/ar/dunning.js — runs daily via cron
export async function runDunningPass() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find all overdue invoices that have not been fully handled
  const overdueInvoices = await db.invoices.findMany({
    where: {
      status: { in: ['sent', 'viewed', 'partially_paid', 'overdue'] },
      due_date: { lt: today },
      void_at: null,
    },
    include: {
      customer: { include: ['credit'] },
      dunning_log: { orderBy: { sent_at: 'desc' }, take: 1 },
    },
  });

  const defaultSequence = await db.dunningSequences.findFirst({ where: { is_default: true } });

  for (const invoice of overdueInvoices) {
    const daysOverdue = Math.floor((today - new Date(invoice.due_date)) / 86400000);
    const nextStep = getNextDunningStep(defaultSequence.steps, daysOverdue, invoice.dunning_log);

    if (!nextStep) continue;

    await executeDunningStep(invoice, nextStep, daysOverdue);

    // Update invoice status
    await db.invoices.update({
      where: { id: invoice.id },
      data: { status: 'overdue', updated_at: new Date() },
    });
  }
}

function getNextDunningStep(steps, daysOverdue, sentLog) {
  const lastStepSent = sentLog[0]?.step_number ?? -1;

  // Find the first step that (1) matches current overdue days and (2) has not been sent
  return steps.find(
    (step) => step.days_overdue <= daysOverdue && step.step_number > lastStepSent
  );
}

async function executeDunningStep(invoice, step, daysOverdue) {
  if (step.action === 'email') {
    await sendDunningEmail(invoice, step.template_id, daysOverdue);
  } else if (step.action === 'hold_account') {
    await db.customerCredit.update({
      where: { customer_id: invoice.customer_id },
      data: {
        credit_hold: true,
        credit_hold_reason: `Invoice ${invoice.invoice_number} is ${daysOverdue} days overdue`,
      },
    });
    await notifyAccountManagement(invoice, daysOverdue);
  }

  await db.dunningLog.create({
    data: {
      invoice_id: invoice.id,
      step_number: step.step_number,
      action: step.action,
      template_name: step.template_id,
    },
  });
}

async function sendDunningEmail(invoice, templateId, daysOverdue) {
  const urgency = daysOverdue > 60 ? 'critical' : daysOverdue > 30 ? 'high' : 'medium';

  await emailService.send({
    to: invoice.customer.billing_email ?? invoice.customer.email,
    subject: getEmailSubject(invoice, daysOverdue),
    template: templateId,
    data: {
      customer_name: invoice.customer.company_name ?? invoice.customer.name,
      invoice_number: invoice.invoice_number,
      due_date: invoice.due_date.toLocaleDateString(),
      amount_due: formatCurrency(invoice.amount_due, invoice.currency),
      days_overdue: daysOverdue,
      urgency,
      payment_link: `${process.env.PAYMENT_PORTAL_URL}/invoices/${invoice.id}/pay`,
      invoice_url: `${process.env.PAYMENT_PORTAL_URL}/invoices/${invoice.id}`,
    },
  });
}
```

### 4. Record a payment and update invoice status

```javascript
// services/ar/payment-recorder.js
export async function recordPayment({ invoiceId, amount, paymentDate, paymentMethod, reference }) {
  const invoice = await db.invoices.findById(invoiceId);
  if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);
  if (invoice.status === 'void') throw new Error(`Cannot apply payment to voided invoice`);

  const newAmountPaid = parseFloat(invoice.amount_paid) + amount;
  const isFullyPaid = newAmountPaid >= parseFloat(invoice.total_amount) - 0.005;

  await db.$transaction([
    db.invoicePayments.create({
      data: { invoice_id: invoiceId, amount, payment_date: new Date(paymentDate), payment_method: paymentMethod, reference },
    }),
    db.invoices.update({
      where: { id: invoiceId },
      data: {
        amount_paid: newAmountPaid,
        status: isFullyPaid ? 'paid' : 'partially_paid',
        paid_at: isFullyPaid ? new Date() : null,
        updated_at: new Date(),
      },
    }),
    // Reduce customer's open AR balance
    db.customerCredit.update({
      where: { customer_id: invoice.customer_id },
      data: {
        current_balance: { decrement: amount },
        last_payment_date: new Date(paymentDate),
      },
    }),
  ]);

  // If fully paid, lift any credit hold if no other overdue invoices
  if (isFullyPaid) {
    await checkAndLiftCreditHold(invoice.customer_id);
  }

  return { invoiceId, newAmountPaid, status: isFullyPaid ? 'paid' : 'partially_paid' };
}
```

### 5. AR aging analysis query

```sql
-- AR Aging Report: Current, 1-30, 31-60, 61-90, 90+ days
SELECT
  c.company_name,
  c.email,
  SUM(CASE WHEN i.due_date >= CURRENT_DATE THEN i.amount_due ELSE 0 END) AS current_amount,
  SUM(CASE WHEN i.due_date < CURRENT_DATE AND i.due_date >= CURRENT_DATE - 30 THEN i.amount_due ELSE 0 END) AS days_1_30,
  SUM(CASE WHEN i.due_date < CURRENT_DATE - 30 AND i.due_date >= CURRENT_DATE - 60 THEN i.amount_due ELSE 0 END) AS days_31_60,
  SUM(CASE WHEN i.due_date < CURRENT_DATE - 60 AND i.due_date >= CURRENT_DATE - 90 THEN i.amount_due ELSE 0 END) AS days_61_90,
  SUM(CASE WHEN i.due_date < CURRENT_DATE - 90 THEN i.amount_due ELSE 0 END) AS days_90_plus,
  SUM(i.amount_due) AS total_outstanding
FROM invoices i
JOIN customers c ON c.id = i.customer_id
WHERE i.status NOT IN ('paid', 'void', 'written_off')
  AND i.amount_due > 0
GROUP BY c.id, c.company_name, c.email
ORDER BY total_outstanding DESC;
```

## Examples

### Default dunning sequence configuration

```json
{
  "name": "Standard Net-30 Dunning",
  "is_default": true,
  "steps": [
    { "step_number": 1, "days_overdue": 1,  "action": "email", "template_id": "dunning-gentle-reminder" },
    { "step_number": 2, "days_overdue": 7,  "action": "email", "template_id": "dunning-second-notice" },
    { "step_number": 3, "days_overdue": 14, "action": "email", "template_id": "dunning-final-notice" },
    { "step_number": 4, "days_overdue": 30, "action": "hold_account", "template_id": "dunning-account-hold" },
    { "step_number": 5, "days_overdue": 60, "action": "email", "template_id": "dunning-collections-warning" }
  ]
}
```

### DSO (Days Sales Outstanding) calculation

```sql
SELECT
  DATE_TRUNC('month', issue_date) AS month,
  SUM(total_amount) AS invoiced,
  AVG(EXTRACT(EPOCH FROM (paid_at - issue_date)) / 86400) AS avg_days_to_pay,
  COUNT(*) FILTER (WHERE paid_at IS NOT NULL) AS paid_count,
  COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_count
FROM invoices
WHERE issue_date >= NOW() - INTERVAL '12 months'
GROUP BY 1
ORDER BY 1 DESC;
```

## Best Practices

- **Send invoices immediately** — do not batch invoices for weekly or monthly sends. Each day of delay is a day added to your DSO.
- **Include a payment link** in every communication — make it a single click for the customer to pay online. Friction in the payment process is the enemy of on-time payment.
- **Track invoice views** — if a customer has not viewed the invoice after 5 days, send a follow-up before it is overdue. Non-views are often a sign of deliverability issues.
- **Separate dunning sequences by customer tier** — your treatment of a $500K annual customer vs a $5K customer should be very different. Senior accounts should trigger account manager outreach, not automated emails.
- **Offer early payment discounts** for strategic customers — "2/10 net-30" (2% discount if paid in 10 days) can dramatically reduce DSO for high-value accounts.
- **Set credit holds automatically** at 45–60 days overdue, not 90+ — by 90 days, the relationship is already damaged and you have been extending credit to an uncreditworthy customer.
- **Reconcile AR daily** against payment processor deposits to ensure partial payments are recorded promptly.

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Dunning emails marked as spam | Use a dedicated sending domain for billing emails; authenticate with SPF, DKIM, DMARC; never send dunning from your marketing domain |
| Customer paid but invoice still shows overdue | Ensure payment recording triggers an immediate status update; do not wait for the nightly job |
| Credit limit not enforced at checkout | Check `available_credit` before processing B2B orders; block or flag orders that exceed the limit |
| Partial payments not tracked correctly | Use `amount_paid` and `amount_due` computed columns; never manually adjust `total_amount` to reflect a payment |
| Month-end AR balance does not reconcile with GL | Ensure every invoice creation and payment is journaled; run a nightly reconciliation between the AR module and your accounting system |
| Customer disputes invoice amount after 60 days | Require PO number at order creation for B2B; send invoice immediately at shipment; document customer's email acknowledgment |

## Related Skills

- @invoice-generation-automation
- @payment-terms-optimization
- @payment-reconciliation-automation
- @stripe-integration
- @tax-compliance-automation
