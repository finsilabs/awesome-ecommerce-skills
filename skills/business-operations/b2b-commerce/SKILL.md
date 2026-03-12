---
name: b2b-commerce
description: "B2B features — company accounts, quote workflows, custom catalogs, net terms"
category: business-operations
risk: critical
source: curated
date_added: "2026-03-12"
tags: [b2b, wholesale, company-accounts, quote-workflow, net-terms, custom-catalog, purchase-order, CPQ]
triggers: ["B2B commerce", "wholesale portal", "company accounts", "quote workflow", "net terms", "custom catalog B2B", "business accounts"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# B2B Commerce

## Overview

Implement B2B-specific features on top of an existing e-commerce platform: company account management with multiple buyers and spending controls, a quote request and approval workflow, company-specific product catalogs and pricing, and net payment terms (Net 30/60/90) with invoice generation. Designed to serve wholesale buyers who need purchasing controls, approval workflows, and deferred payment.

## When to Use This Skill

- When onboarding wholesale customers who require account-level pricing, catalogs, and credit terms
- When building a distributor portal where multiple employees at the same company can place orders under a shared credit limit
- When implementing a configure-price-quote (CPQ) flow for custom or large-volume orders
- When replacing a phone/email-based wholesale ordering process with a self-service portal
- When B2B customers require purchase order numbers on invoices for their accounts payable process

## Core Instructions

1. **Model company accounts and roles**

   ```sql
   CREATE TABLE companies (
     id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name             VARCHAR(128) NOT NULL,
     tax_id           VARCHAR(64),          -- EIN, VAT number, etc.
     billing_address  JSONB NOT NULL,
     payment_terms    VARCHAR(16) NOT NULL DEFAULT 'net30'
                        CHECK (payment_terms IN ('prepay', 'net15', 'net30', 'net60', 'net90')),
     credit_limit     INTEGER,              -- cents; NULL = no limit
     credit_used      INTEGER NOT NULL DEFAULT 0,
     status           VARCHAR(16) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'suspended')),
     approved_at      TIMESTAMPTZ,
     created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE TABLE company_users (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     company_id  UUID NOT NULL REFERENCES companies(id),
     user_id     UUID NOT NULL REFERENCES users(id),
     role        VARCHAR(16) NOT NULL DEFAULT 'buyer'
                   CHECK (role IN ('admin', 'buyer', 'approver', 'viewer')),
     spending_limit INTEGER,               -- cents/order; NULL = no per-user limit
     UNIQUE (company_id, user_id)
   );

   CREATE TABLE company_catalogs (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     company_id  UUID NOT NULL REFERENCES companies(id),
     product_id  UUID NOT NULL REFERENCES products(id),
     custom_price INTEGER,                 -- cents; NULL = use volume pricing
     is_visible   BOOLEAN NOT NULL DEFAULT true,
     UNIQUE (company_id, product_id)
   );
   ```

2. **Quote request and approval workflow**

   ```sql
   CREATE TABLE quotes (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     company_id   UUID NOT NULL REFERENCES companies(id),
     requested_by UUID NOT NULL REFERENCES users(id),
     status       VARCHAR(24) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'ordered')),
     notes        TEXT,
     valid_until  TIMESTAMPTZ,
     approved_by  UUID REFERENCES users(id),
     po_number    VARCHAR(64),            -- buyer's internal PO number
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE TABLE quote_lines (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     quote_id     UUID NOT NULL REFERENCES quotes(id),
     product_id   UUID NOT NULL REFERENCES products(id),
     quantity     INTEGER NOT NULL,
     requested_price INTEGER,            -- cents; buyer's requested price
     offered_price INTEGER,              -- cents; sales rep's counter-price
     unit_price   INTEGER,              -- cents; final agreed price
     notes        TEXT
   );
   ```

   ```typescript
   async function submitQuote(quoteId: string, buyerNotes?: string): Promise<void> {
     const quote = await db.quotes.findById(quoteId);
     if (quote.status !== 'draft') throw new Error('Quote is not in draft status');

     await db.quotes.update(quoteId, {
       status: 'submitted',
       notes: buyerNotes,
     });

     // Notify sales rep / account manager
     const company = await db.companies.findById(quote.company_id);
     await emailService.send({
       to: await getAccountManagerEmail(company.id),
       template: 'quote-submitted',
       data: { quoteId, companyName: company.name },
     });
   }

   async function approveQuote(
     quoteId: string,
     approvedBy: string,
     finalPrices: { quoteLineId: string; unitPrice: number }[]
   ): Promise<void> {
     await db.transaction(async tx => {
       for (const { quoteLineId, unitPrice } of finalPrices) {
         await tx.quoteLines.update(quoteLineId, { unit_price: unitPrice, offered_price: unitPrice });
       }
       await tx.quotes.update(quoteId, {
         status: 'approved',
         approved_by: approvedBy,
         valid_until: new Date(Date.now() + 30 * 86400000), // valid 30 days
       });
     });

     const quote = await db.quotes.findById(quoteId);
     await emailService.send({
       to: await getBuyerEmail(quote.requested_by),
       template: 'quote-approved',
       data: { quoteId, validUntil: quote.valid_until },
     });
   }
   ```

3. **Convert an approved quote to an order**

   ```typescript
   async function placeOrderFromQuote(
     quoteId: string,
     buyerId: string,
     poNumber?: string
   ): Promise<string> {
     const quote = await db.quotes.findById(quoteId);
     if (quote.status !== 'approved') throw new Error('Quote is not approved');
     if (quote.valid_until && quote.valid_until < new Date()) throw new Error('Quote has expired');

     const company = await db.companies.findById(quote.company_id);
     const lines = await db.quoteLines.findByQuoteId(quoteId);
     const orderTotal = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0);

     // Check credit limit
     if (company.credit_limit !== null && company.credit_used + orderTotal > company.credit_limit) {
       throw new Error('Order would exceed company credit limit');
     }

     return db.transaction(async tx => {
       const order = await tx.orders.insert({
         company_id: company.id,
         customer_id: buyerId,
         status: 'awaiting_fulfillment',
         payment_terms: company.payment_terms,
         po_number: poNumber ?? quote.po_number,
         quote_id: quoteId,
       });

       await tx.orderLines.insertMany(
         lines.map(l => ({ order_id: order.id, product_id: l.product_id, quantity: l.quantity, unit_price: l.unit_price }))
       );

       // Consume credit
       if (company.credit_limit !== null) {
         await tx.companies.update(company.id, { credit_used: company.credit_used + orderTotal });
       }

       await tx.quotes.update(quoteId, { status: 'ordered' });
       return order.id;
     });
   }
   ```

4. **Generate a net-terms invoice**

   ```typescript
   async function generateInvoice(orderId: string): Promise<Buffer> {
     const order = await db.orders.findById(orderId);
     const company = await db.companies.findById(order.company_id);
     const lines = await db.orderLines.findByOrderId(orderId);

     const dueDate = new Date(order.created_at);
     const termsDays = parseInt(company.payment_terms.replace('net', ''), 10);
     dueDate.setDate(dueDate.getDate() + termsDays);

     const subtotal = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0);
     const tax = await calculateTax(order);
     const total = subtotal + tax;

     // Build PDF using pdfkit (same pattern as packing slip)
     return buildInvoicePdf({
       invoiceNumber: `INV-${order.order_number}`,
       issueDate: order.created_at,
       dueDate,
       company,
       lines,
       subtotal,
       tax,
       total,
       paymentTerms: company.payment_terms,
       poNumber: order.po_number,
     });
   }
   ```

5. **Enforce per-user spending limits and approval requirements**

   ```typescript
   async function checkOrderApprovalRequired(
     companyId: string,
     buyerId: string,
     orderTotal: number
   ): Promise<boolean> {
     const companyUser = await db.companyUsers.findOne({ company_id: companyId, user_id: buyerId });
     if (!companyUser) throw new Error('User is not a member of this company');

     // Require approval if over per-user spending limit
     if (companyUser.spending_limit !== null && orderTotal > companyUser.spending_limit) {
       return true;
     }

     // Require approval if buyer role (not approver or admin)
     return companyUser.role === 'buyer';
   }
   ```

## Examples

### Company catalog — hide products not in the company's catalog

```typescript
async function getCatalogForCompany(companyId: string): Promise<Product[]> {
  const catalogItems = await db.companyCatalogs.findAll({
    company_id: companyId,
    is_visible: true,
  });

  if (catalogItems.length === 0) {
    // No custom catalog — show all products at volume pricing
    return db.products.findAll({ is_active: true });
  }

  const productIds = catalogItems.map(c => c.product_id);
  const products = await db.products.findByIds(productIds);

  // Apply company-specific custom prices
  return products.map(p => {
    const catalogItem = catalogItems.find(c => c.product_id === p.id);
    return { ...p, price: catalogItem?.custom_price ?? p.price };
  });
}
```

### Credit utilization dashboard query

```sql
SELECT
  c.name,
  c.credit_limit / 100.0 AS credit_limit_usd,
  c.credit_used / 100.0 AS credit_used_usd,
  ROUND(c.credit_used::numeric / NULLIF(c.credit_limit, 0) * 100, 1) AS utilization_pct,
  c.payment_terms
FROM companies c
WHERE c.status = 'approved' AND c.credit_limit IS NOT NULL
ORDER BY utilization_pct DESC NULLS LAST;
```

## Best Practices

- **Require company approval before enabling net terms** — run a credit check or at minimum a manual review before setting `status = 'approved'` and `credit_limit`
- **Enforce credit limits in the order transaction** — check `credit_used + orderTotal <= credit_limit` inside the same database transaction that creates the order, not before it
- **Release credit when orders are paid or cancelled** — decrement `credit_used` in the payment received webhook handler; cancelled orders should also release credit immediately
- **Put quotes on a validity timer** — approved quotes that sit unconverted become a pricing liability; expire them after 30 days and require re-approval
- **Always surface the PO number on invoices** — B2B buyers require their internal PO number on the invoice for their accounts payable workflow; missing this causes payment delays
- **Store company-level contact and billing info separately from the individual user** — a company's billing address rarely changes; a user's shipping address may differ per order
- **Audit every quote change** — log who changed which line item price and when; quote negotiation is a regulated activity in some industries

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Credit limit exceeded due to concurrent orders | Use `UPDATE companies SET credit_used = credit_used + ? WHERE credit_used + ? <= credit_limit` and check `rowCount === 1` |
| Quote prices become stale if product costs change | Store `unit_price` on the quote line at approval time; don't recalculate from current product price when converting to order |
| Individual user sees another company's pricing | Always scope all catalog and pricing queries with `company_id = req.user.company_id` |
| B2B checkout bypasses mandatory approval flow | Check `checkOrderApprovalRequired` in the checkout API, not just the UI; never trust client-side approval state |

## Related Skills

- @volume-pricing
- @multi-channel-selling
- @vendor-management
- @order-management-system
- @returns-refund-policy
