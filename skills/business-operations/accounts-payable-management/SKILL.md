---
name: accounts-payable-management
description: "Manage supplier invoices and vendor payments with automated receipt matching, payment scheduling, early discount optimization, and reconciliation workflows"
category: business-operations
risk: safe
source: curated
date_added: "2026-03-12"
tags: [accounts-payable, vendor-payments, procurement]
triggers: ["manage vendor payments", "automate accounts payable"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Accounts Payable Management

## Overview

Build an accounts payable system that ingests supplier invoices, matches them against purchase orders and goods receipts (three-way matching), schedules payments according to vendor terms, identifies early-payment discount opportunities, and produces bank-ready payment runs. The workflow covers invoice capture via email parsing or EDI, automated GL coding, approval routing by amount tier, payment scheduling (ACH, wire, check), and monthly reconciliation against the vendor ledger. Finance teams gain full visibility into outstanding liabilities, cash flow projections, and discount capture rates without manual data entry.

## When to Use This Skill

- When your AP team is manually keying invoices from PDFs into spreadsheets and payment delays are causing vendor friction
- When you need automated three-way matching between purchase orders, goods receipts, and invoices to eliminate manual reconciliation
- When early-payment discounts (e.g., 2/10 net 30) are being missed because payment scheduling is reactive rather than proactive
- When building multi-entity AP workflows where each legal entity has its own bank account and chart of accounts
- When preparing for an ERP integration (NetSuite, SAP, QuickBooks) and need a clean AP data model to migrate from
- When audit requirements demand an immutable record of every invoice approval, payment authorization, and GL posting

## Core Instructions

1. **Design the AP data model**

   ```sql
   CREATE TABLE ap_invoices (
     id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     vendor_id         UUID NOT NULL REFERENCES vendors(id),
     invoice_number    VARCHAR(64) NOT NULL,
     invoice_date      DATE NOT NULL,
     due_date          DATE NOT NULL,
     currency          VARCHAR(3) NOT NULL DEFAULT 'USD',
     subtotal_cents    BIGINT NOT NULL,
     tax_cents         BIGINT NOT NULL DEFAULT 0,
     total_cents       BIGINT NOT NULL,
     paid_cents        BIGINT NOT NULL DEFAULT 0,
     status            VARCHAR(24) NOT NULL DEFAULT 'received'
                         CHECK (status IN (
                           'received', 'processing', 'pending_approval',
                           'approved', 'scheduled', 'paid', 'disputed', 'void'
                         )),
     po_id             UUID REFERENCES purchase_orders(id),
     receipt_id        UUID REFERENCES goods_receipts(id),
     match_status      VARCHAR(16) DEFAULT 'unmatched'
                         CHECK (match_status IN ('unmatched', 'partial', 'matched', 'exception')),
     gl_account        VARCHAR(32),
     approved_by       UUID REFERENCES admin_users(id),
     approved_at       TIMESTAMPTZ,
     payment_method    VARCHAR(16) CHECK (payment_method IN ('ach', 'wire', 'check', 'card')),
     notes             TEXT,
     created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     UNIQUE (vendor_id, invoice_number)
   );

   CREATE TABLE ap_invoice_lines (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     invoice_id      UUID NOT NULL REFERENCES ap_invoices(id) ON DELETE CASCADE,
     description     VARCHAR(256) NOT NULL,
     quantity        NUMERIC(12, 4) NOT NULL DEFAULT 1,
     unit_price_cents BIGINT NOT NULL,
     line_total_cents BIGINT NOT NULL,
     gl_account      VARCHAR(32),
     po_line_id      UUID REFERENCES po_lines(id),
     tax_rate        NUMERIC(6, 4) DEFAULT 0,
     created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE TABLE ap_payments (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     payment_run_id  UUID NOT NULL REFERENCES ap_payment_runs(id),
     invoice_id      UUID NOT NULL REFERENCES ap_invoices(id),
     amount_cents    BIGINT NOT NULL,
     discount_cents  BIGINT NOT NULL DEFAULT 0,
     payment_method  VARCHAR(16) NOT NULL,
     bank_reference  VARCHAR(128),
     paid_at         TIMESTAMPTZ,
     status          VARCHAR(16) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'submitted', 'cleared', 'returned', 'cancelled')),
     created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE TABLE ap_payment_runs (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     run_date        DATE NOT NULL,
     total_cents     BIGINT NOT NULL DEFAULT 0,
     invoice_count   INTEGER NOT NULL DEFAULT 0,
     status          VARCHAR(16) NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft', 'approved', 'submitted', 'completed')),
     approved_by     UUID REFERENCES admin_users(id),
     approved_at     TIMESTAMPTZ,
     created_by      UUID NOT NULL,
     created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   -- Index for due-date payment scheduling queries
   CREATE INDEX idx_ap_invoices_due ON ap_invoices (due_date, status)
     WHERE status IN ('approved', 'scheduled');

   -- Index for vendor outstanding balance lookups
   CREATE INDEX idx_ap_invoices_vendor ON ap_invoices (vendor_id, status)
     WHERE status NOT IN ('paid', 'void');
   ```

2. **Ingest invoices from email attachments**

   ```typescript
   import { parseInvoicePDF } from './invoice-ocr';
   import { emailListener } from './email-listener';

   // Listen for emails on ap@yourcompany.com
   emailListener.on('attachment', async (email) => {
     for (const attachment of email.attachments) {
       if (!['application/pdf', 'image/png', 'image/jpeg'].includes(attachment.contentType)) continue;

       const extracted = await parseInvoicePDF(attachment.content);

       // Look up vendor by sender email domain or extracted vendor name
       const vendor = await resolveVendor(email.from, extracted.vendorName);
       if (!vendor) {
         await flagForManualReview(email, 'Unknown vendor');
         continue;
       }

       await db.apInvoices.create({
         data: {
           vendor_id: vendor.id,
           invoice_number: extracted.invoiceNumber,
           invoice_date: extracted.invoiceDate,
           due_date: calculateDueDate(extracted.invoiceDate, vendor.paymentTerms),
           currency: extracted.currency ?? 'USD',
           subtotal_cents: toCents(extracted.subtotal),
           tax_cents: toCents(extracted.taxAmount ?? 0),
           total_cents: toCents(extracted.total),
           status: 'received',
           notes: `Auto-ingested from ${email.from} on ${new Date().toISOString()}`,
         },
       });
     }
   });

   function calculateDueDate(invoiceDate: Date, terms: string): Date {
     const days = parseNetDays(terms); // 'net30' → 30, 'net60' → 60
     const due = new Date(invoiceDate);
     due.setDate(due.getDate() + days);
     return due;
   }

   function parseNetDays(terms: string): number {
     const match = terms.match(/net(\d+)/i);
     return match ? parseInt(match[1], 10) : 30;
   }
   ```

3. **Implement three-way matching (PO + receipt + invoice)**

   ```typescript
   interface MatchResult {
     status: 'matched' | 'partial' | 'exception';
     variance: number; // cents — positive means invoice exceeds PO
     exceptions: string[];
   }

   async function performThreeWayMatch(invoiceId: string): Promise<MatchResult> {
     const invoice = await db.apInvoices.findById(invoiceId, { include: ['lines'] });
     if (!invoice.po_id) return { status: 'exception', variance: 0, exceptions: ['No PO linked to invoice'] };

     const po = await db.purchaseOrders.findById(invoice.po_id, { include: ['lines'] });
     const receipt = invoice.receipt_id
       ? await db.goodsReceipts.findById(invoice.receipt_id, { include: ['lines'] })
       : null;

     const exceptions: string[] = [];
     let variance = 0;

     // Compare invoice total to PO total
     const poCostCents = po.lines.reduce((s, l) => s + l.unit_cost * l.quantity_ordered, 0);
     const toleranceCents = Math.round(poCostCents * 0.01); // 1% tolerance
     variance = invoice.total_cents - poCostCents;

     if (Math.abs(variance) > toleranceCents) {
       exceptions.push(
         `Invoice total ${formatCents(invoice.total_cents)} exceeds PO total ${formatCents(poCostCents)} by ${formatCents(Math.abs(variance))}`
       );
     }

     // Check receipt quantities if goods receipt exists
     if (receipt) {
       for (const invLine of invoice.lines) {
         if (!invLine.po_line_id) continue;
         const poLine = po.lines.find(l => l.id === invLine.po_line_id);
         const receiptLine = receipt.lines.find(l => l.po_line_id === invLine.po_line_id);

         if (!receiptLine) {
           exceptions.push(`Invoice line for "${invLine.description}" has no goods receipt`);
           continue;
         }

         if (receiptLine.quantity_received < invLine.quantity) {
           exceptions.push(
             `Invoice quantity ${invLine.quantity} for "${invLine.description}" exceeds received quantity ${receiptLine.quantity_received}`
           );
         }

         if (poLine && invLine.unit_price_cents !== poLine.unit_cost) {
           exceptions.push(
             `Unit price mismatch for "${invLine.description}": PO=${formatCents(poLine.unit_cost)}, Invoice=${formatCents(invLine.unit_price_cents)}`
           );
         }
       }
     } else {
       exceptions.push('No goods receipt on file — cannot verify quantities');
     }

     const status = exceptions.length === 0 ? 'matched' : variance === 0 ? 'partial' : 'exception';

     await db.apInvoices.update(invoiceId, {
       match_status: status,
       status: status === 'matched' ? 'pending_approval' : 'processing',
     });

     await logApEvent(invoiceId, 'three_way_match', { status, variance, exceptions });

     return { status, variance, exceptions };
   }
   ```

4. **Route invoices for approval based on amount tiers**

   ```typescript
   interface ApprovalTier {
     maxCents: number | null; // null = unlimited
     approverRole: string;
   }

   const APPROVAL_TIERS: ApprovalTier[] = [
     { maxCents: 50000,      approverRole: 'ap_clerk' },      // up to $500
     { maxCents: 500000,     approverRole: 'ap_manager' },    // up to $5,000
     { maxCents: 5000000,    approverRole: 'controller' },    // up to $50,000
     { maxCents: null,       approverRole: 'cfo' },           // unlimited
   ];

   async function routeForApproval(invoiceId: string): Promise<void> {
     const invoice = await db.apInvoices.findById(invoiceId);
     const tier = APPROVAL_TIERS.find(
       t => t.maxCents === null || invoice.total_cents <= t.maxCents
     );

     if (!tier) throw new Error('No approval tier matched');

     const approver = await db.adminUsers.findFirst({
       where: { role: tier.approverRole, active: true },
     });

     if (!approver) throw new Error(`No active approver found for role ${tier.approverRole}`);

     await emailService.send({
       to: approver.email,
       template: 'invoice-approval-request',
       data: {
         invoiceNumber: invoice.invoice_number,
         vendorName: (await db.vendors.findById(invoice.vendor_id)).name,
         amount: formatCents(invoice.total_cents),
         dueDate: invoice.due_date,
         approveUrl: `${process.env.ADMIN_URL}/ap/invoices/${invoiceId}/approve`,
         rejectUrl:  `${process.env.ADMIN_URL}/ap/invoices/${invoiceId}/reject`,
       },
     });

     await db.apInvoices.update(invoiceId, { status: 'pending_approval' });
   }

   async function approveInvoice(invoiceId: string, approverId: string): Promise<void> {
     await db.apInvoices.update(invoiceId, {
       status: 'approved',
       approved_by: approverId,
       approved_at: new Date(),
     });
     await logApEvent(invoiceId, 'approved', { approvedBy: approverId });
   }
   ```

5. **Identify and capture early-payment discounts**

   ```typescript
   interface DiscountOpportunity {
     invoiceId: string;
     invoiceNumber: string;
     vendorName: string;
     totalCents: number;
     discountCents: number;
     discountDeadline: Date;
     netPaymentCents: number;
   }

   async function getEarlyPaymentOpportunities(): Promise<DiscountOpportunity[]> {
     const today = new Date();
     const lookAheadDays = 10;
     const horizon = new Date(today.getTime() + lookAheadDays * 86400000);

     // Approved invoices from vendors that offer early-payment terms (e.g., 2/10 net30)
     const invoices = await db.apInvoices.findAll({
       where: {
         status: 'approved',
         due_date: { lte: horizon },
       },
       include: [{ model: 'vendors', attributes: ['name', 'early_discount_rate', 'early_discount_days'] }],
     });

     const opportunities: DiscountOpportunity[] = [];

     for (const inv of invoices) {
       const vendor = inv.vendor;
       if (!vendor.early_discount_rate || vendor.early_discount_rate <= 0) continue;

       const discountDeadline = new Date(inv.invoice_date);
       discountDeadline.setDate(discountDeadline.getDate() + vendor.early_discount_days);

       if (discountDeadline < today) continue; // Discount window already passed

       const discountCents = Math.round(inv.total_cents * vendor.early_discount_rate);

       opportunities.push({
         invoiceId: inv.id,
         invoiceNumber: inv.invoice_number,
         vendorName: vendor.name,
         totalCents: inv.total_cents,
         discountCents,
         discountDeadline,
         netPaymentCents: inv.total_cents - discountCents,
       });
     }

     // Sort by discount value descending — biggest savings first
     return opportunities.sort((a, b) => b.discountCents - a.discountCents);
   }
   ```

6. **Build and execute a payment run**

   ```typescript
   async function buildPaymentRun(options: {
     runDate: Date;
     includeDiscounts: boolean;
     paymentMethod: 'ach' | 'wire' | 'check';
     createdBy: string;
   }): Promise<string> {
     // Select approved invoices due by run date + any with expiring discounts
     const invoicesToPay = await db.apInvoices.findAll({
       where: {
         status: 'approved',
         due_date: { lte: options.runDate },
       },
     });

     if (options.includeDiscounts) {
       const discountOpportunities = await getEarlyPaymentOpportunities();
       const discountInvoiceIds = new Set(discountOpportunities.map(o => o.invoiceId));
       const additionalInvoices = await db.apInvoices.findAll({
         where: { id: { in: [...discountInvoiceIds] }, status: 'approved' },
       });
       // Merge without duplicates
       for (const inv of additionalInvoices) {
         if (!invoicesToPay.find(i => i.id === inv.id)) invoicesToPay.push(inv);
       }
     }

     const discountMap = new Map(
       (await getEarlyPaymentOpportunities()).map(o => [o.invoiceId, o.discountCents])
     );

     const totalCents = invoicesToPay.reduce((sum, inv) => {
       return sum + inv.total_cents - (discountMap.get(inv.id) ?? 0);
     }, 0);

     return db.transaction(async tx => {
       const run = await tx.apPaymentRuns.create({
         data: {
           run_date: options.runDate,
           total_cents: totalCents,
           invoice_count: invoicesToPay.length,
           status: 'draft',
           created_by: options.createdBy,
         },
       });

       await tx.apPayments.createMany({
         data: invoicesToPay.map(inv => ({
           payment_run_id: run.id,
           invoice_id: inv.id,
           amount_cents: inv.total_cents - (discountMap.get(inv.id) ?? 0),
           discount_cents: discountMap.get(inv.id) ?? 0,
           payment_method: options.paymentMethod,
           status: 'pending',
         })),
       });

       // Mark invoices as scheduled
       await tx.apInvoices.updateMany({
         where: { id: { in: invoicesToPay.map(i => i.id) } },
         data: { status: 'scheduled' },
       });

       return run.id;
     });
   }
   ```

7. **Post payments and reconcile against the vendor ledger**

   ```typescript
   async function markPaymentRunComplete(runId: string, bankConfirmations: { paymentId: string; bankReference: string }[]): Promise<void> {
     const confirmationMap = new Map(bankConfirmations.map(c => [c.paymentId, c.bankReference]));

     await db.transaction(async tx => {
       for (const [paymentId, bankReference] of confirmationMap) {
         const payment = await tx.apPayments.findById(paymentId);

         await tx.apPayments.update(paymentId, {
           status: 'cleared',
           bank_reference: bankReference,
           paid_at: new Date(),
         });

         await tx.apInvoices.update(payment.invoice_id, {
           status: 'paid',
           paid_cents: payment.amount_cents,
         });

         await logApEvent(payment.invoice_id, 'payment_cleared', {
           bankReference,
           amountCents: payment.amount_cents,
           discountCents: payment.discount_cents,
         });
       }

       await tx.apPaymentRuns.update(runId, { status: 'completed' });
     });
   }

   async function getVendorOutstandingBalance(vendorId: string): Promise<number> {
     const result = await db.raw(`
       SELECT COALESCE(SUM(total_cents - paid_cents), 0) AS balance
       FROM ap_invoices
       WHERE vendor_id = $1
         AND status NOT IN ('paid', 'void')
     `, [vendorId]);
     return result.rows[0].balance;
   }
   ```

## Examples

### AP aging report query

```sql
SELECT
  v.name                                               AS vendor,
  COUNT(i.id)                                          AS open_invoices,
  SUM(CASE WHEN i.due_date >= NOW()             THEN i.total_cents - i.paid_cents ELSE 0 END) AS current_cents,
  SUM(CASE WHEN i.due_date < NOW() - INTERVAL '30 days'
            AND i.due_date >= NOW() - INTERVAL '60 days'
                                                       THEN i.total_cents - i.paid_cents ELSE 0 END) AS aged_30_60_cents,
  SUM(CASE WHEN i.due_date < NOW() - INTERVAL '60 days'
            AND i.due_date >= NOW() - INTERVAL '90 days'
                                                       THEN i.total_cents - i.paid_cents ELSE 0 END) AS aged_60_90_cents,
  SUM(CASE WHEN i.due_date < NOW() - INTERVAL '90 days'
                                                       THEN i.total_cents - i.paid_cents ELSE 0 END) AS aged_90_plus_cents,
  SUM(i.total_cents - i.paid_cents)                    AS total_outstanding_cents
FROM vendors v
JOIN ap_invoices i ON i.vendor_id = v.id
WHERE i.status NOT IN ('paid', 'void')
GROUP BY v.id, v.name
ORDER BY total_outstanding_cents DESC;
```

### Cash flow forecast for next 30 days

```typescript
async function getApCashFlowForecast(days = 30): Promise<{ date: string; amountCents: number }[]> {
  const result = await db.raw(`
    SELECT
      due_date::text            AS date,
      SUM(total_cents - paid_cents) AS amount_cents
    FROM ap_invoices
    WHERE status NOT IN ('paid', 'void')
      AND due_date BETWEEN NOW() AND NOW() + ($1 || ' days')::INTERVAL
    GROUP BY due_date
    ORDER BY due_date
  `, [days]);

  return result.rows;
}
```

### Discount capture rate KPI

```sql
SELECT
  DATE_TRUNC('month', p.paid_at)  AS month,
  COUNT(*)                         AS payments_with_discount_eligible,
  COUNT(CASE WHEN p.discount_cents > 0 THEN 1 END) AS discounts_captured,
  ROUND(
    COUNT(CASE WHEN p.discount_cents > 0 THEN 1 END)::numeric /
    NULLIF(COUNT(*), 0) * 100, 1
  )                                AS capture_rate_pct,
  SUM(p.discount_cents)            AS total_savings_cents
FROM ap_payments p
JOIN ap_invoices i ON i.id = p.invoice_id
JOIN vendors v ON v.id = i.vendor_id
WHERE v.early_discount_rate > 0
  AND p.status = 'cleared'
GROUP BY 1
ORDER BY 1 DESC;
```

## Best Practices

- **Use three-way matching tolerances, not hard equality** — a 1% price variance on large POs is usually a rounding difference in the vendor's system; requiring exact match will flood the exception queue with noise
- **Separate approval from payment authorization** — the person who approves an invoice should not be the person who initiates the payment run; this is a fundamental segregation of duties control
- **Store invoice amounts in the invoice currency, convert to home currency for reporting** — never convert on ingest and discard the original; exchange rates change and you need the source amount for vendor disputes
- **Lock invoice records after approval** — disallow edits to `total_cents`, `due_date`, and `vendor_id` after status reaches `approved`; require a void-and-reissue workflow for corrections
- **Set vendor `early_discount_days` and `early_discount_rate` on the vendor record** — this lets the system automatically flag discount opportunities without manual review of each invoice's terms text
- **Run payment runs on a fixed weekly cadence** — predictable payment dates reduce bank fees, simplify cash forecasting, and vendors learn to expect payment on those days
- **Archive paid invoices with their PDF attachments** — maintain the original document for 7 years minimum; store in immutable object storage (S3 Object Lock) to satisfy audit and tax requirements
- **Send remittance advice to vendors** — when paying multiple invoices in one ACH batch, email the vendor a remittance PDF listing each invoice number and amount paid so they can reconcile their AR

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Duplicate invoice payments because the same invoice number is entered twice | Add a `UNIQUE (vendor_id, invoice_number)` database constraint; catch the duplicate key violation and surface it as a user-friendly warning |
| Three-way match fails because receipt is logged under a different vendor SKU than the PO | Store both your internal product ID and the vendor's SKU on PO lines; match invoice lines by vendor SKU first, then fall back to product ID |
| Payment run includes invoices that are still in dispute | Only include invoices with `status = 'approved'` in payment run queries; disputed invoices must be explicitly approved after resolution |
| Early discount window is missed because the invoice sat in the approval queue | Add a business-day countdown badge in the approval UI and send a reminder email 2 days before the discount deadline |
| AP aging report shows negative balances because credit memos were not modeled | Add a `type` column to `ap_invoices` with values `'invoice'` and `'credit_memo'`; credit memos have negative `total_cents` and offset open invoice balances |
| Bank rejects ACH because the vendor's bank account changed | Store bank account details with a `verified_at` timestamp; flag any invoice from a vendor whose bank details changed in the last 7 days for manual verification |

## Related Skills

- @vendor-management
- @order-management-system
- @financial-compliance-sox
- @financial-audit-trail
- @erp-integration
