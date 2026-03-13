---
name: invoice-generation-automation
description: "Generate professional invoices automatically with custom branding, payment terms, line item details, tax breakdowns, and integration with accounting systems"
category: payments-checkout
risk: safe
source: curated
date_added: "2026-03-12"
tags: [invoicing, billing, automation]
triggers: ["invoice generation", "automated invoicing", "PDF invoice", "invoice automation", "billing automation", "generate invoice", "invoice template"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Invoice Generation Automation

## Overview

Automated invoice generation turns every completed order into a professional, branded PDF invoice without manual effort. For B2B ecommerce, invoices are legal documents required for the customer's procurement and accounting workflows. In many countries — particularly within the EU — specific invoice formats are legally mandated with sequential numbering, VAT numbers, and mandatory fields. All major platforms support invoice automation through apps and plugins, often requiring zero custom code.

## When to Use This Skill

- When customers request invoices after purchase and you are generating them manually
- When building B2B ecommerce where invoices are required before or after payment
- When you need to comply with EU VAT invoice requirements
- When integrating with accounting software (QuickBooks, Xero) that requires invoice records
- When subscription billing needs to generate invoices for each billing cycle
- When you need branded, professional PDFs rather than a payment processor's default invoice styling

## Core Instructions

### Step 1: Determine your platform and choose the right invoice tool

| Platform | Recommended Tool | Notes |
|----------|-----------------|-------|
| **Shopify** | **Order Printer Pro** or **Sufio** (Shopify App Store) | Shopify has no native invoice PDF; Order Printer Pro is the most widely used free option; Sufio adds EU VAT compliance, accounting sync, and automated sending |
| **WooCommerce** | **WooCommerce PDF Invoices & Packing Slips** (free) or **WooCommerce Germanized** (EU compliance) | The free plugin handles standard invoice PDFs; Germanized adds legally compliant German/EU invoice formats |
| **BigCommerce** | **Order Confirmation PDF** (built-in) + **Sufio** or **Invoice Ninja** via API | BigCommerce sends a default order confirmation; Sufio adds branded PDFs with full EU VAT support |
| **Stripe-based stores** | **Stripe Invoicing** (built-in) | Stripe generates, sends, and tracks payment of invoices automatically; ideal for B2B and subscription billing |
| **Custom / Headless** | **Stripe Invoicing API** or **Docspring** / **PDFMonkey** for custom PDF generation | Stripe Invoicing handles the full lifecycle including dunning; PDF APIs handle custom designs |

### Step 2: Set up automated invoice generation

---

#### Shopify

**Option A: Order Printer Pro (free, basic)**

1. Install **Order Printer Pro** from the Shopify App Store
2. Go to **Apps → Order Printer Pro → Templates** and customize the invoice HTML template with your logo, colors, and footer text
3. Under **Settings**, configure auto-printing triggers — when an order is fulfilled, the app can automatically email the invoice PDF to the customer
4. For EU VAT invoices: the app supports adding VAT numbers and compliant formatting; enable this under **Settings → Tax settings**

**Option B: Sufio (recommended for B2B and EU VAT compliance)**

1. Install **Sufio** from the Shopify App Store (paid, ~$19/month starting)
2. Go to **Sufio → Settings → Document templates** and upload your logo; customize fonts, colors, and layout
3. Under **Sufio → Settings → Automation**, configure when invoices are created and sent:
   - Trigger: **Order paid** or **Order fulfilled**
   - Action: Generate PDF and email to customer automatically
4. For EU VAT: go to **Sufio → Settings → Tax settings** and enable VAT invoice mode — Sufio adds the required fields (sequential number, seller/buyer VAT numbers, tax breakdown per line)
5. Connect to accounting: go to **Sufio → Integrations** and connect QuickBooks Online or Xero — invoices sync automatically

#### WooCommerce

**Option A: WooCommerce PDF Invoices & Packing Slips (free)**

1. Install **WooCommerce PDF Invoices & Packing Slips** from WordPress.org (by WP Overnight — the most popular option with 500,000+ installs)
2. Go to **WooCommerce → PDF Invoices → Documents → Invoice** and configure:
   - Enable invoices for: new orders, processing, completed
   - Upload your company logo
   - Set invoice number format (e.g., year prefix: 2026-0001)
   - Add company details (name, address, VAT number)
3. Under **General**, enable **Attach to order confirmation email** — invoices will be emailed automatically on order status change
4. For sequential numbering (required for EU VAT): go to **Invoice → Number** and enable the sequential counter

**Option B: WooCommerce Germanized (EU VAT legal compliance)**

1. Install **WooCommerce Germanized** — this plugin adds full German/EU legal compliance including legally required invoice elements
2. Configure your seller VAT number under **WooCommerce → Germanized → General → VAT ID**
3. Invoice settings are under **WooCommerce → Germanized → Invoices** — configure numbering, format, and automation triggers

**Sync to accounting:**
1. Install **WooCommerce QuickBooks Online** or **WooCommerce Xero** from the WooCommerce Marketplace
2. Orders and invoices sync automatically to your accounting system

#### BigCommerce

1. BigCommerce sends an order confirmation email by default — this serves as a basic invoice for B2C
2. For branded PDF invoices: install **Sufio** from the BigCommerce App Marketplace (same setup as Shopify above)
3. For custom invoice templates: go to **Marketing → Email Templates → Order Confirmation** and customize the default email template
4. For B2B invoice management: install **Apruve** or **Balance** from the App Marketplace — these handle net-terms invoicing with automated payment collection

---

#### Custom / Headless

**Option A: Stripe Invoicing (recommended for B2B)**

Stripe Invoicing handles the complete lifecycle — creation, PDF generation, customer emailing, payment tracking, and dunning for unpaid invoices:

```javascript
// Create and send an invoice via Stripe Invoicing
const invoice = await stripe.invoices.create({
  customer: stripeCustomerId,
  collection_method: 'send_invoice',
  days_until_due: 30,
  metadata: { order_id: orderId },
  custom_fields: [
    { name: 'PO Number', value: poNumber },
    { name: 'Your VAT Number', value: buyerVatNumber },
  ],
  footer: 'Thank you for your business.',
});

// Add line items
for (const item of order.lineItems) {
  await stripe.invoiceItems.create({
    customer: stripeCustomerId,
    invoice: invoice.id,
    amount: Math.round(item.total * 100), // cents
    currency: 'usd',
    description: item.description,
    tax_rates: [stripeTaxRateId], // if using Stripe Tax
  });
}

// Finalize and send — Stripe generates PDF and emails it automatically
await stripe.invoices.finalizeInvoice(invoice.id);
await stripe.invoices.sendInvoice(invoice.id);
```

The customer receives a Stripe-hosted invoice page where they can pay by card, bank transfer, or other methods. Stripe handles dunning (unpaid invoice reminders) automatically via **Billing → Settings → Invoice reminders**.

**Option B: PDF generation service (for custom branding)**

If you need full design control over the PDF, use **PDFMonkey** or **Docspring**:

```javascript
// Generate a branded PDF using PDFMonkey
const response = await fetch('https://api.pdfmonkey.io/api/v1/documents', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.PDFMONKEY_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    document: {
      document_template_id: process.env.INVOICE_TEMPLATE_ID,
      status: 'pending',
      payload: {
        invoice_number: invoiceNumber,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: dueDateString,
        seller: { name: 'Your Company', address: sellerAddress, vat_number: sellerVat },
        buyer: { name: customer.company_name, address: billingAddress, vat_number: buyerVat },
        line_items: lineItems,
        subtotal: order.subtotal,
        tax_amount: order.taxAmount,
        total: order.total,
      },
    },
  }),
});
const { document } = await response.json();
// Poll for document.status === 'success', then retrieve document.download_url
```

### Step 3: Ensure EU VAT invoice compliance

EU VAT invoices require these mandatory fields (check each is present in your template):

1. Sequential invoice number (no gaps)
2. Invoice date
3. Seller name, address, and VAT registration number
4. Buyer name and address; buyer VAT number (for B2B cross-border within EU)
5. Description of goods or services
6. Unit price, quantity, and line total per item
7. VAT rate and VAT amount per line
8. Total amount excluding VAT
9. Total VAT amount
10. Total amount including VAT

Sufio and WooCommerce Germanized both handle these requirements automatically.

## Best Practices

- **Use sequential numbers with no gaps** for VAT-registered businesses — many tax authorities require sequential numbering; UUIDs are not compliant
- **Snapshot customer and seller data at invoice creation** — if the customer changes their address later, the invoice must reflect the address at the time of issue
- **Store invoices immutably** — never edit a sent invoice; issue a credit note and a replacement invoice for corrections
- **Include a payment link prominently** — bank details, ACH routing, or a pay-now link should be the most visible element on B2B invoices
- **Automate sync to accounting** — use Sufio's built-in QuickBooks/Xero sync or a tool like A2X to avoid manual data entry

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Invoice numbers are not sequential (gaps after failed orders) | Use apps like Sufio or WooCommerce PDF Invoices which maintain their own sequential counter independent of order status |
| Duplicate invoices for the same order | All recommended apps handle idempotency — they check whether an invoice already exists for the order before creating a new one |
| EU VAT invoice missing mandatory fields | Use Sufio (Shopify/BigCommerce), WooCommerce Germanized (WooCommerce), or Stripe Invoicing with custom_fields for the VAT numbers |
| PDF too large for email attachment | Invoice apps use efficient PDF rendering; issues typically occur with large image assets in the template — compress your logo |
| QuickBooks/Xero sync fails silently | Check the integration logs in your invoice app; most apps have a retry mechanism and will alert you on sync failures |
| Customer replies to invoice email but gets no response | Configure invoice delivery from a monitored billing@yourdomain.com address, not a noreply@ address |

## Related Skills

- @accounts-receivable-automation
- @tax-compliance-automation
- @payment-terms-optimization
- @stripe-integration
- @subscription-billing
