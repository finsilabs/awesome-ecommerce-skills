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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Accounts Receivable Automation

## Overview

Accounts receivable (AR) automation converts manual invoice follow-up — sending reminders, tracking payment status, escalating overdue accounts — into a system-driven workflow. In B2B ecommerce, where customers pay on net-30, net-60, or net-90 terms rather than at checkout, AR management directly impacts cash flow and days sales outstanding (DSO).

A well-configured AR system reduces DSO by 5–15 days by ensuring follow-up is timely and persistent, eliminates invoices falling through the cracks, and gives the finance team real-time visibility into what is owed and how overdue each invoice is.

## When to Use This Skill

- When your B2B customers pay on credit terms (net-30, net-60, net-90) rather than at checkout
- When your finance team spends more than a few hours per week chasing past-due invoices
- When you have more than 50 active B2B accounts and manual tracking is breaking down
- When you need to enforce credit limits and flag accounts that have exceeded them
- When DSO is higher than industry benchmarks and you need to identify the root cause
- When building a wholesale or distribution ecommerce platform with trade accounts
- When you need audit-ready AR records for lenders or investors

## Core Instructions

### Step 1: Determine your platform and choose the right AR tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Invoiced.com or Apruve (B2B app) + QuickBooks Online | Shopify handles orders; a dedicated AR tool handles net-terms invoicing, dunning, and aging outside Shopify's standard checkout flow |
| **Shopify Plus** | Shopify B2B (built-in) + Invoiced or NetSuite | Shopify Plus has native B2B payment terms, company accounts, and order approval workflows; pair with Invoiced for advanced dunning |
| **WooCommerce** | WooCommerce B2B plugin + WooCommerce PDF Invoices | WooCommerce B2B enables net terms; WooCommerce Payments or Stripe handles payments; FreshBooks/QuickBooks sync handles AR aging |
| **BigCommerce** | BigCommerce B2B Edition + Apruve or NetSuite | BigCommerce B2B Edition supports company accounts, payment terms, and quotes natively |
| **Custom / Headless** | Stripe Invoicing API or build with Stripe + accounting system webhook | Stripe Invoicing handles invoice creation, dunning, and payment links; pair with QuickBooks or Xero for AR aging |

### Step 2: Configure net-terms payment options

#### Shopify (Standard)

1. For basic net-terms invoicing, install **Invoiced** from the Shopify App Store
2. In Invoiced: go to **Settings → Payment Terms** and configure net-30, net-60, net-90 options
3. Assign payment terms per customer in **Invoiced → Customers → [Customer] → Payment Terms**
4. Connect Invoiced to Shopify: go to **Invoiced → Integrations → Shopify** and authorize your store
5. When a B2B order is placed, Invoiced automatically creates a corresponding invoice with the correct due date

#### Shopify Plus (B2B native)

1. Go to **Shopify Admin → Customers → Companies** and create company profiles for B2B accounts
2. For each company, set **Payment Terms** (net 7, net 15, net 30, net 60, net 90, or custom)
3. Set a **Credit Limit** on the company profile to prevent orders beyond the approved amount
4. Orders placed by company buyers automatically generate invoices with the configured payment terms
5. For dunning, install **Klaviyo** or **Invoiced** to automate past-due email sequences beyond Shopify's basic reminders

#### WooCommerce

1. Install the **WooCommerce B2B** plugin and configure payment terms per customer group
2. Install **WooCommerce PDF Invoices & Packing Slips** for branded invoice PDFs
3. For dunning automation, install **AutomateWoo** and configure a workflow:
   - Trigger: **Order status changed to On Hold** (representing unpaid invoices)
   - Add timing rules for 1 day, 7 days, 14 days past the due date
   - Actions: Send reminder email with payment link
4. Connect to **QuickBooks Online** via the WooCommerce QuickBooks plugin for AR aging reports

#### BigCommerce

1. In **BigCommerce B2B Edition**: go to **Company Management → Payment Methods** and enable net-terms
2. Set credit limits and payment terms per company in **B2B Edition → Companies → [Company]**
3. Install **Invoiced** or **NetSuite** from the BigCommerce App Marketplace for advanced AR automation
4. Configure automated dunning sequences in your AR tool for 1 day, 7 days, 14 days, and 30 days past due

#### Custom / Headless

Use **Stripe Invoicing** to handle the full AR lifecycle without building from scratch:

```javascript
// Create an invoice for a B2B order using Stripe Invoicing
const invoice = await stripe.invoices.create({
  customer: stripeCustomerId,
  collection_method: 'send_invoice',
  days_until_due: 30, // Net-30 terms
  metadata: { order_id: orderId, po_number: poNumber },
  description: `Invoice for Order ${orderNumber}`,
});

// Add line items
await stripe.invoiceItems.create({
  customer: stripeCustomerId,
  invoice: invoice.id,
  amount: lineTotal, // in cents
  currency: 'usd',
  description: productDescription,
});

// Finalize and send
await stripe.invoices.finalizeInvoice(invoice.id);
await stripe.invoices.sendInvoice(invoice.id);
```

Stripe automatically handles:
- PDF generation with your branding
- Payment link in the email so customers pay online
- Dunning retries (configure in **Stripe Dashboard → Billing → Settings → Invoice reminders**)
- Marking invoices as paid when payment arrives

### Step 3: Configure dunning sequences

Set up automated reminder emails for overdue invoices. The standard escalation sequence:

**Day 0 (due date):** Invoice due reminder — "Your invoice is due today"
**Day 1 overdue:** Friendly reminder — "Your payment is a day past due"
**Day 7 overdue:** Second notice — "Invoice still outstanding — please arrange payment"
**Day 14 overdue:** Final notice — "Account review required — please contact us immediately"
**Day 30 overdue:** Credit hold — stop new orders; escalate to account manager or collections

In **Invoiced**: Configure this under **Settings → Chasing → Chasing Schedules**. Set a default schedule and assign it to all customers, with a separate more aggressive schedule for high-risk accounts.

In **Stripe Invoicing**: Configure under **Stripe Dashboard → Billing → Settings → Invoice reminders**. Enable reminders at due date, 3 days after, 7 days after, and 14 days after.

### Step 4: Set up aging reports

Aging reports show outstanding invoices grouped into buckets: current, 1–30 days, 31–60 days, 61–90 days, and 90+ days.

- **Invoiced**: Built-in aging report under **Reports → Accounts Receivable Aging**
- **QuickBooks Online**: **Reports → Accounts Receivable Aging Summary or Detail**
- **Xero**: **Reports → Aged Receivables**
- **Stripe**: Use Stripe's invoice reporting under **Dashboard → Billing → Revenue Recognition** or export via the API

Review the aging report weekly. Any account in the 61–90 day bucket should get a phone call, not just an email. Any account in the 90+ day bucket should be on credit hold.

### Step 5: Enforce credit limits

Before accepting new orders from a B2B customer on net terms, check that their current AR balance does not exceed their credit limit.

- **Shopify Plus B2B**: Credit limits are enforced natively — orders over the credit limit are blocked or sent for approval
- **Invoiced**: Set credit limits per customer under **Customer → Credit Limit**; Invoiced blocks invoice creation when the limit is exceeded
- **WooCommerce B2B**: Configure credit limits in the plugin's customer settings; orders over the limit go to pending/on-hold status for review

## Best Practices

- **Send invoices immediately** — do not batch invoices for weekly or monthly sends; each day of delay is a day added to your DSO
- **Include a payment link in every invoice** — make it a single click for the customer to pay online; friction in the payment process is the enemy of on-time payment
- **Separate dunning sequences by customer tier** — your treatment of a $500K annual account should be very different from a $5K account; set up separate sequences
- **Offer early payment discounts** for strategic customers — "2/10 net-30" (2% discount if paid in 10 days) can dramatically reduce DSO
- **Set credit holds at 45–60 days overdue**, not 90+ — by 90 days, the relationship is already damaged and you have been extending unsecured credit to an uncreditworthy customer
- **Reconcile AR daily** against payment processor deposits to ensure partial payments are recorded promptly

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Dunning emails marked as spam | Use a dedicated sending domain for billing emails (billing@yourdomain.com); authenticate with SPF, DKIM, DMARC; never send dunning from your marketing domain |
| Customer paid but invoice still shows overdue | Connect your payment processor to your AR tool so payments are matched automatically; Invoiced and Stripe Invoicing both do this automatically |
| Credit limit not enforced at checkout | Use platform-native credit limits (Shopify Plus B2B, BigCommerce B2B Edition) or your AR tool's credit limit feature; check limits before order confirmation |
| Month-end AR balance does not reconcile with accounting | Use a single integration between your ecommerce platform and accounting system (QuickBooks or Xero); avoid manual data entry that creates discrepancies |
| Customer disputes invoice amount after 60 days | Require PO number at order creation for B2B; send invoice immediately at shipment; document customer email acknowledgment |

## Related Skills

- @invoice-generation-automation
- @payment-terms-optimization
- @payment-reconciliation-automation
- @stripe-integration
- @tax-compliance-automation
