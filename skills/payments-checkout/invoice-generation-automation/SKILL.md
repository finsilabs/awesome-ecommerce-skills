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
platforms: [platform-agnostic]
difficulty: intermediate
---

# Invoice Generation Automation

## Overview

Automated invoice generation turns every completed order, subscription renewal, or service delivery into a professional, branded PDF invoice without manual effort. For B2B ecommerce, invoices are legal documents required for the customer's procurement and accounting workflows. For B2C, they are often required for expense reimbursement. For tax authorities in many countries, specific invoice formats are legally mandated.

This skill covers the full invoice generation pipeline: triggering invoice creation from order events, rendering PDF invoices with custom branding using a template engine, attaching and emailing invoices, storing PDFs with signed access URLs, and pushing invoice data to accounting systems (QuickBooks, Xero, NetSuite).

The design prioritizes idempotency (re-generating the same invoice produces the same PDF), legal compliance (sequential invoice numbers, required fields for VAT invoices), and extensibility (new invoice types without rewriting the renderer).

## When to Use This Skill

- When customers request invoices after purchase and you are generating them manually
- When building B2B ecommerce where invoices are required before or after payment
- When you need to comply with EU VAT invoice requirements (specific mandatory fields)
- When integrating with accounting software (QuickBooks, Xero) that requires invoice records
- When subscription billing needs to generate invoices for each billing cycle
- When you need branded, professional PDFs rather than Stripe's default invoice styling
- When selling in jurisdictions that require sequential invoice numbering for tax compliance

## Core Instructions

### 1. Design the invoice template data model

```sql
CREATE TABLE invoice_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  is_default      BOOLEAN DEFAULT FALSE,
  template_html   TEXT NOT NULL,          -- Handlebars/Mustache template
  logo_url        VARCHAR(1000),
  primary_color   CHAR(7) DEFAULT '#1a1a2e',
  accent_color    CHAR(7) DEFAULT '#0066cc',
  footer_text     TEXT,
  locale          VARCHAR(10) DEFAULT 'en-US',
  paper_size      VARCHAR(10) DEFAULT 'A4',  -- 'A4', 'letter'
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number   VARCHAR(50) UNIQUE NOT NULL,  -- Sequential per company/year
  invoice_type     VARCHAR(30) DEFAULT 'standard', -- 'standard', 'vat', 'credit_note', 'proforma'
  customer_id      UUID REFERENCES customers(id),
  order_id         UUID REFERENCES orders(id),
  subscription_id  UUID,
  template_id      UUID REFERENCES invoice_templates(id),
  status           VARCHAR(30) DEFAULT 'draft',
  -- 'draft', 'issued', 'sent', 'viewed', 'paid', 'void', 'credit_note_issued'
  issue_date       DATE NOT NULL,
  due_date         DATE,
  payment_terms    VARCHAR(30),
  -- Seller info snapshot (as of invoice date)
  seller_name      VARCHAR(255),
  seller_address   JSONB,
  seller_tax_id    VARCHAR(100),
  -- Buyer info snapshot
  buyer_name       VARCHAR(255),
  buyer_address    JSONB,
  buyer_tax_id     VARCHAR(100),   -- VAT number for B2B EU invoices
  -- Amounts
  subtotal         NUMERIC(12, 2) NOT NULL,
  discount_amount  NUMERIC(12, 2) DEFAULT 0,
  tax_amount       NUMERIC(12, 2) DEFAULT 0,
  total_amount     NUMERIC(12, 2) NOT NULL,
  currency         CHAR(3) DEFAULT 'USD',
  amount_paid      NUMERIC(12, 2) DEFAULT 0,
  -- Files
  pdf_url          VARCHAR(1000),
  pdf_generated_at TIMESTAMPTZ,
  -- Delivery
  sent_at          TIMESTAMPTZ,
  viewed_at        TIMESTAMPTZ,
  -- Metadata
  notes            TEXT,
  po_number        VARCHAR(100),
  credit_note_for  UUID REFERENCES invoices(id),
  void_reason      TEXT,
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoice_line_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id     UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description    TEXT NOT NULL,
  sku            VARCHAR(100),
  quantity       NUMERIC(10, 4) NOT NULL,
  unit_price     NUMERIC(12, 4) NOT NULL,
  discount_pct   NUMERIC(5, 2) DEFAULT 0,
  line_total     NUMERIC(12, 2) NOT NULL,
  tax_rate       NUMERIC(5, 4) DEFAULT 0,
  tax_amount     NUMERIC(12, 2) DEFAULT 0,
  tax_name       VARCHAR(100),   -- 'VAT 20%', 'CA Sales Tax 8.25%'
  sort_order     INT DEFAULT 0
);

CREATE INDEX idx_invoices_customer ON invoices (customer_id);
CREATE INDEX idx_invoices_order ON invoices (order_id);
CREATE INDEX idx_invoices_status ON invoices (status, due_date);
```

### 2. Invoice number generator

```javascript
// services/invoicing/number-generator.js
// Different jurisdictions require different formats
// EU VAT: typically YYYY-NNNNNN (sequential per year with no gaps)
// US: flexible but must be unique

const COUNTER_LOCK_KEY = 'invoice_counter_lock';

export async function generateInvoiceNumber({ year, prefix = 'INV', locale = 'en-US' }) {
  // Use a database sequence or advisory lock to guarantee no gaps
  return db.$transaction(async (tx) => {
    // PostgreSQL advisory lock to prevent race conditions
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(12345)`;

    const count = await tx.invoices.count({
      where: {
        invoice_number: { startsWith: `${prefix}-${year}-` },
        invoice_type: { not: 'proforma' },  // Proforma invoices use separate series
      },
    });

    const sequence = count + 1;
    const paddedSeq = String(sequence).padStart(6, '0');

    return `${prefix}-${year}-${paddedSeq}`;
  });
}

export async function generateCreditNoteNumber(originalInvoiceNumber) {
  // Credit notes reference the original invoice
  const year = new Date().getFullYear();
  const count = await db.invoices.count({
    where: {
      invoice_number: { startsWith: `CN-${year}-` },
      invoice_type: 'credit_note',
    },
  });
  return `CN-${year}-${String(count + 1).padStart(6, '0')}`;
}
```

### 3. PDF rendering with Puppeteer

```javascript
// services/invoicing/pdf-renderer.js
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { formatCurrency, formatDate } from '../../lib/formatters.js';

// Register Handlebars helpers
Handlebars.registerHelper('formatCurrency', (amount, currency) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
);
Handlebars.registerHelper('formatDate', (date, locale = 'en-US') =>
  new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date))
);
Handlebars.registerHelper('multiply', (a, b) => (parseFloat(a) * parseFloat(b)).toFixed(2));

export async function renderInvoicePDF(invoice, template) {
  const compiledTemplate = Handlebars.compile(template.template_html);

  const taxBreakdown = computeTaxBreakdown(invoice.line_items);

  const html = compiledTemplate({
    invoice: {
      ...invoice,
      issue_date_formatted: formatDate(invoice.issue_date),
      due_date_formatted: invoice.due_date ? formatDate(invoice.due_date) : null,
      subtotal_formatted: formatCurrency(invoice.subtotal, invoice.currency),
      discount_formatted: invoice.discount_amount > 0 ? formatCurrency(invoice.discount_amount, invoice.currency) : null,
      tax_formatted: formatCurrency(invoice.tax_amount, invoice.currency),
      total_formatted: formatCurrency(invoice.total_amount, invoice.currency),
      amount_due_formatted: formatCurrency(invoice.total_amount - invoice.amount_paid, invoice.currency),
    },
    line_items: invoice.line_items.map((item) => ({
      ...item,
      unit_price_formatted: formatCurrency(item.unit_price, invoice.currency),
      line_total_formatted: formatCurrency(item.line_total, invoice.currency),
      tax_formatted: item.tax_amount > 0 ? formatCurrency(item.tax_amount, invoice.currency) : null,
    })),
    tax_breakdown: taxBreakdown,
    template,
  });

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: template.paper_size ?? 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
  });

  await browser.close();
  return pdfBuffer;
}

function computeTaxBreakdown(lineItems) {
  const breakdown = {};
  for (const item of lineItems) {
    if (item.tax_rate && item.tax_amount > 0) {
      const key = item.tax_name ?? `Tax ${(item.tax_rate * 100).toFixed(2)}%`;
      if (!breakdown[key]) {
        breakdown[key] = { rate: item.tax_rate, taxable_amount: 0, tax_amount: 0 };
      }
      breakdown[key].taxable_amount += parseFloat(item.line_total);
      breakdown[key].tax_amount += parseFloat(item.tax_amount);
    }
  }
  return Object.entries(breakdown).map(([name, data]) => ({ name, ...data }));
}
```

### 4. Invoice generation orchestrator

```javascript
// services/invoicing/invoice-service.js
import { generateInvoiceNumber } from './number-generator.js';
import { renderInvoicePDF } from './pdf-renderer.js';
import { uploadToS3, getSignedUrl } from '../../lib/storage.js';
import { sendInvoiceEmail } from './invoice-email.js';
import { pushToAccounting } from './accounting-sync.js';

export async function generateAndSendInvoice(order) {
  // Idempotency: return existing invoice if already generated for this order
  const existing = await db.invoices.findFirst({ where: { order_id: order.id, status: { not: 'void' } } });
  if (existing?.pdf_url) return existing;

  const customer = await db.customers.findById(order.customer_id);
  const template = await db.invoiceTemplates.findFirst({ where: { is_default: true } });
  const settings = await db.companySettings.findFirst();

  // Generate sequential invoice number
  const invoiceNumber = await generateInvoiceNumber({ year: new Date().getFullYear() });

  // Build line items from order
  const lineItems = order.line_items.map((item, idx) => ({
    description: item.product_name + (item.variant_name ? ` — ${item.variant_name}` : ''),
    sku: item.sku,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_pct: item.discount_pct ?? 0,
    line_total: item.line_total,
    tax_rate: item.tax_rate ?? 0,
    tax_amount: item.tax_amount ?? 0,
    tax_name: item.tax_name ?? null,
    sort_order: idx,
  }));

  // Create the invoice record
  const invoice = await db.invoices.create({
    data: {
      invoice_number: invoiceNumber,
      invoice_type: needsVATInvoice(customer, settings) ? 'vat' : 'standard',
      customer_id: customer.id,
      order_id: order.id,
      template_id: template.id,
      status: 'issued',
      issue_date: new Date(),
      due_date: computeDueDate(new Date(), order.payment_terms ?? 'due_on_receipt'),
      payment_terms: order.payment_terms ?? 'due_on_receipt',
      seller_name: settings.company_name,
      seller_address: settings.address,
      seller_tax_id: settings.tax_id,
      buyer_name: customer.company_name ?? customer.name,
      buyer_address: order.billing_address,
      buyer_tax_id: customer.vat_number ?? null,
      subtotal: order.subtotal,
      discount_amount: order.discount_amount ?? 0,
      tax_amount: order.tax_amount ?? 0,
      total_amount: order.total_amount,
      currency: order.currency,
      amount_paid: order.status === 'paid' ? order.total_amount : 0,
      po_number: order.po_number ?? null,
      line_items: { create: lineItems },
    },
    include: { line_items: { orderBy: { sort_order: 'asc' } }, customer: true },
  });

  // Generate PDF
  const pdfBuffer = await renderInvoicePDF(invoice, template);
  const pdfKey = `invoices/${new Date().getFullYear()}/${invoice.invoice_number}.pdf`;
  await uploadToS3(pdfKey, pdfBuffer, 'application/pdf');
  const pdfUrl = await getSignedUrl(pdfKey, 60 * 60 * 24 * 365);  // 1-year signed URL

  await db.invoices.update({
    where: { id: invoice.id },
    data: { pdf_url: pdfUrl, pdf_generated_at: new Date() },
  });

  // Send to customer
  await sendInvoiceEmail(invoice, pdfBuffer, customer);
  await db.invoices.update({ where: { id: invoice.id }, data: { sent_at: new Date(), status: 'sent' } });

  // Push to accounting system
  await pushToAccounting(invoice).catch((err) => {
    // Non-blocking — log and continue
    console.error('Accounting sync failed for invoice', invoice.id, err.message);
  });

  return invoice;
}

function needsVATInvoice(customer, settings) {
  // EU B2B invoices need VAT invoice format with supplier and customer VAT numbers
  return customer.country && EU_COUNTRIES.includes(customer.country) && settings.vat_registered;
}
```

### 5. Accounting system sync (QuickBooks example)

```javascript
// services/invoicing/accounting-sync.js
import QuickBooks from 'node-quickbooks';

export async function pushToAccounting(invoice) {
  const qbo = new QuickBooks(
    process.env.QB_CLIENT_ID,
    process.env.QB_CLIENT_SECRET,
    process.env.QB_ACCESS_TOKEN,
    false,
    process.env.QB_REALM_ID,
    process.env.NODE_ENV !== 'production',
    false,
    null,
    '2.0',
    process.env.QB_REFRESH_TOKEN
  );

  const qbInvoice = {
    DocNumber: invoice.invoice_number,
    TxnDate: invoice.issue_date.toISOString().split('T')[0],
    DueDate: invoice.due_date?.toISOString().split('T')[0],
    CustomerRef: { value: invoice.customer.qb_customer_id },
    Line: invoice.line_items.map((item) => ({
      DetailType: 'SalesItemLineDetail',
      Amount: item.line_total,
      Description: item.description,
      SalesItemLineDetail: {
        Qty: item.quantity,
        UnitPrice: item.unit_price,
        ItemRef: { value: item.sku ?? '1' },
      },
    })),
    CurrencyRef: { value: invoice.currency },
  };

  return new Promise((resolve, reject) => {
    qbo.createInvoice(qbInvoice, (err, result) => {
      if (err) return reject(err);
      db.invoices.update({
        where: { id: invoice.id },
        data: { metadata: { ...invoice.metadata, qb_invoice_id: result.Id } },
      }).then(resolve).catch(reject);
    });
  });
}
```

## Examples

### Minimal invoice HTML template (Handlebars)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; font-size: 12px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo img { max-height: 60px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: {{template.primary_color}}; color: white; padding: 8px; text-align: left; }
    td { padding: 8px; border-bottom: 1px solid #eee; }
    .total-row { font-weight: bold; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo"><img src="{{template.logo_url}}" alt="Logo"></div>
    <div>
      <h2>INVOICE</h2>
      <p><strong>#{{invoice.invoice_number}}</strong></p>
      <p>Date: {{formatDate invoice.issue_date}}</p>
      {{#if invoice.due_date_formatted}}<p>Due: {{invoice.due_date_formatted}}</p>{{/if}}
    </div>
  </div>
  <table>
    <thead>
      <tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
    </thead>
    <tbody>
      {{#each line_items}}
      <tr>
        <td>{{description}}</td>
        <td>{{quantity}}</td>
        <td>{{unit_price_formatted}}</td>
        <td>{{line_total_formatted}}</td>
      </tr>
      {{/each}}
    </tbody>
    <tfoot>
      <tr><td colspan="3">Subtotal</td><td>{{invoice.subtotal_formatted}}</td></tr>
      <tr><td colspan="3">Tax</td><td>{{invoice.tax_formatted}}</td></tr>
      <tr class="total-row"><td colspan="3">Total</td><td>{{invoice.total_formatted}}</td></tr>
    </tfoot>
  </table>
</body>
</html>
```

### Trigger invoice generation from order webhook

```javascript
// On order completion
eventBus.on('order.completed', async (order) => {
  if (order.customer_type === 'b2b' || order.requires_invoice) {
    await generateAndSendInvoice(order);
  }
});
```

## Best Practices

- **Use sequential numbers with no gaps** for VAT-registered businesses — many tax authorities require sequential numbering; using UUIDs or non-sequential numbers is not compliant.
- **Snapshot customer and seller data at invoice creation** — if the customer changes their address later, the invoice must reflect the address at the time of issue.
- **Store invoices immutably** — never edit a sent invoice. Issue a credit note and a replacement invoice instead. This is a legal and audit requirement in most jurisdictions.
- **Generate PDFs asynchronously** for high-volume scenarios — queue PDF generation jobs rather than blocking the order completion flow.
- **Include payment instructions prominently** — bank details, ACH routing, or a pay-now link should be the most visible element on the invoice.
- **Test VAT invoice compliance** per jurisdiction — EU VAT invoices require: sequential number, issue date, seller name/address/VAT number, buyer VAT number (for B2B), description of goods/services, unit price, rate and amount of VAT per line.

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| PDF looks different across environments | Pin the puppeteer version and use a consistent Chrome version; test PDFs in CI before deploying template changes |
| Duplicate invoices for the same order | Implement idempotency check on `order_id` before creating a new invoice; return the existing invoice if one already exists |
| Invoice number gaps after failed transactions | Use a database sequence (`SERIAL` or `SEQUENCE`) within an advisory lock; never generate numbers in application code outside a transaction |
| Large PDF files causing email attachment issues | Compress images in the template; most invoices should be under 200KB; split large detail invoices into a summary + detail appendix |
| QuickBooks/Xero sync fails silently | Wrap accounting sync in a retry queue; always store the accounting system's document ID in invoice metadata for reconciliation |
| Customer replies to invoice email but gets no response | Use a monitored `billing@` address for invoice delivery, not `noreply@` |

## Related Skills

- @accounts-receivable-automation
- @tax-compliance-automation
- @payment-terms-optimization
- @stripe-integration
- @subscription-billing
