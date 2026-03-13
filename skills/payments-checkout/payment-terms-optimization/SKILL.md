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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Payment Terms Optimization

## Overview

Payment terms define when a B2B customer must pay for goods delivered on credit: net-30 (due 30 days after invoice), net-60, net-90, or early-payment variants like "2/10 net-30" (2% discount if paid within 10 days). Offering flexible payment terms is a competitive advantage in B2B commerce — it reduces friction in the purchase decision — but introduces credit risk that must be carefully managed.

The right tools depend on your platform. Shopify Plus, BigCommerce B2B Edition, and several WooCommerce plugins provide native net-terms support. For smaller setups, a combination of your ecommerce platform and an invoicing tool (Invoiced, Stripe Invoicing) is the most practical approach.

## When to Use This Skill

- When moving from prepay-only to net-terms for B2B customers to increase conversion
- When different customer segments need different terms (SMB net-30 vs. enterprise net-60)
- When you want to incentivize early payment with discounts to improve cash flow
- When setting up a new wholesale or distribution channel with trade accounts
- When credit losses are rising and you need better credit limit enforcement

## Core Instructions

### Step 1: Determine your platform and choose the right payment terms tool

| Platform | Recommended Tool | Native Support |
|----------|-----------------|---------------|
| **Shopify (Standard)** | **Invoiced** app or **Balance** app | No native net-terms; use an app |
| **Shopify Plus** | **Shopify B2B** (native) + **Invoiced** for advanced dunning | Net-30/60/90 built into Shopify B2B; credit limits and company accounts native |
| **WooCommerce** | **WooCommerce B2B** plugin + **WooCommerce PDF Invoices** | WooCommerce B2B adds payment terms per customer group |
| **BigCommerce** | **BigCommerce B2B Edition** (native) | Net-terms, credit limits, and company accounts built in |
| **Custom / Headless** | **Stripe Invoicing** + **Stripe Billing** for terms enforcement | Stripe Invoicing supports net-30/60/90 natively |

### Step 2: Configure payment terms per customer

---

#### Shopify Plus (B2B native)

1. Go to **Shopify Admin → Customers → Companies** and create a company profile for each B2B account
2. Click a company and go to **Payment methods** — set their payment terms:
   - Net 7, Net 15, Net 30, Net 60, Net 90
   - or a custom number of days
3. Set a **Credit limit** on the company — orders that would exceed the limit are blocked or sent for approval
4. When a company buyer places an order, Shopify automatically creates an invoice with the correct due date and sends it to the buyer's email
5. The buyer can pay via a link in the invoice email; Shopify marks the order as paid automatically

**Early payment discounts on Shopify Plus:**
Shopify B2B does not natively support "2/10 net-30" early payment discounts. Use **Invoiced** app for early payment discount terms — configure in **Invoiced → Settings → Payment Terms → Early Payment Discount**.

#### Shopify (Standard, via Invoiced app)

1. Install **Invoiced** from the Shopify App Store
2. Go to **Invoiced → Settings → Payment Terms** and create your term configurations: Net 30, Net 60, Net 90, 2/10 Net 30
3. In **Invoiced → Customers**, assign payment terms per customer
4. When a Shopify order is placed by a net-terms customer, Invoiced automatically generates an invoice with the correct due date
5. Configure dunning: go to **Invoiced → Settings → Chasing** and set up a reminder schedule (1 day before due, 1 day overdue, 7 days overdue, 14 days overdue)

#### WooCommerce

1. Install **WooCommerce B2B** plugin (by WooCommerce or a third-party B2B plugin)
2. Go to **WooCommerce → B2B Settings → Payment Terms** and configure terms per customer role or per customer
3. Install **WooCommerce PDF Invoices & Packing Slips** to automatically generate invoices with due dates
4. For early payment discounts, you can use a custom pricing rule (WooCommerce Dynamic Pricing plugin) that applies a percentage discount when a coupon code representing the early payment option is used

**Credit limit enforcement in WooCommerce:**
1. In the B2B plugin settings, set credit limits per customer or customer group
2. Configure the behavior when the limit is exceeded: block the order or notify an admin for approval
3. Credit is automatically released when an invoice is paid

#### BigCommerce B2B Edition

1. In **B2B Edition → Company Management → Payment Methods**, enable net-terms
2. In **B2B Edition → Companies → [Company] → Credit**, set:
   - Credit limit
   - Payment terms (Net 30, Net 60, etc.)
   - Credit status (Approved, Pending, Suspended)
3. When a company buyer places an order, BigCommerce B2B Edition generates an invoice with the configured terms
4. The buyer can view and pay outstanding invoices from their account portal

---

#### Custom / Headless

Use **Stripe Invoicing** for net-terms enforcement without building a credit system from scratch:

```javascript
// Create a customer with payment terms in Stripe
const customer = await stripe.customers.create({
  email: customerEmail,
  name: companyName,
  metadata: { payment_terms: 'net_30', credit_limit: '50000' },
});

// Create an invoice with net-30 terms
const invoice = await stripe.invoices.create({
  customer: customer.id,
  collection_method: 'send_invoice',
  days_until_due: 30,            // Net-30
  auto_advance: true,            // Automatically finalize and send
  description: `Invoice for Order ${orderNumber}`,
  metadata: { order_id: orderId, po_number: poNumber },
});

// Add line items, then finalize and send
await stripe.invoiceItems.create({ customer: customer.id, invoice: invoice.id, amount: orderTotal, currency: 'usd', description: orderDescription });
await stripe.invoices.finalizeInvoice(invoice.id);
// Stripe auto-sends the invoice and handles dunning reminders via Billing settings
```

**Configure dunning in Stripe Billing settings:**
Go to **Stripe Dashboard → Billing → Settings → Invoice reminders** and configure automatic reminders: 3 days before due, on due date, 3 days after, 7 days after, 14 days after.

**Credit limit enforcement (custom):**

```javascript
async function checkCreditAvailability(customerId, orderAmount) {
  const customer = await db.customers.findUnique({ where: { id: customerId } });
  const openInvoicesTotal = await db.invoices.aggregate({
    where: { customerId, status: { in: ['sent', 'overdue', 'partially_paid'] } },
    _sum: { amountDue: true },
  });

  const currentBalance = openInvoicesTotal._sum.amountDue ?? 0;
  const availableCredit = customer.creditLimit - currentBalance;

  if (orderAmount > availableCredit) {
    return { approved: false, availableCredit, shortfall: orderAmount - availableCredit };
  }
  return { approved: true, availableCredit: availableCredit - orderAmount };
}
```

### Step 3: Optimize terms for cash flow and credit risk

**The right terms for each customer tier:**

| Customer Tier | Recommended Terms | Rationale |
|--------------|-------------------|-----------|
| New account (< 3 orders) | Net 15 or prepay | Insufficient payment history to extend credit |
| Established (3–12 months on-time) | Net 30 | Standard B2B terms |
| Strategic (12+ months, large volume) | Net 60 or "2/10 Net 30" | Reward loyalty; early discount improves your cash flow |
| High-risk (2+ late payments) | Prepay or Net 15 only | Protect against bad debt |

**Early payment discount economics:**
"2/10 net-30" means the customer gets a 2% discount if they pay within 10 days instead of 30. For the customer, this is equivalent to borrowing at ~36.7% APR — most customers with any cost of capital should take the discount. For you, paying 2% to receive payment 20 days earlier is typically better than your borrowing cost.

**Annual credit review:**
Review every credit account annually — set a calendar reminder. A customer who qualified for $50,000 credit 2 years ago may look very different today. Reduce limits for customers who have developed slow-pay patterns.

## Best Practices

- **Start new B2B customers on stricter terms** — onboard new accounts at net-30 or net-15 and upgrade after 6 months of on-time payment; never start with net-60 or net-90 without a credit check
- **Never ship to accounts on credit hold** — enforce credit holds at the order level, not just the invoicing level; once goods leave the warehouse you have lost leverage
- **Price early payment discounts correctly** — "2/10 net-30" implies an annualized cost of ~36.7% to the customer; communicate this value clearly
- **Segment collections intensity by risk tier** — high-risk customers need follow-up on day 3 overdue; long-term accounts with a perfect history deserve more grace
- **Document every credit decision** — store the reason for every credit limit change; you will need this if you ever need to defend a write-off to auditors

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Customer places an order exceeding their credit limit | Check available credit before order confirmation, not just at invoicing; Shopify Plus B2B and BigCommerce B2B Edition enforce this natively |
| Early payment discounts taken after the discount period | Record the payment date strictly; Invoiced and Stripe Invoicing track this automatically |
| Credit limits not updated as AR balance changes | Use a tool that deducts from available credit when an invoice is created and restores it when paid; Invoiced and Stripe handle this automatically |
| Different departments granting different terms informally | Centralize terms configuration in your platform or AR tool; sales reps should request terms changes through the credit system |
| High bad-debt write-off rate | Implement a credit application process before approving any account for net terms above $5,000 |

## Related Skills

- @accounts-receivable-automation
- @invoice-generation-automation
- @payment-reconciliation-automation
- @stripe-integration
