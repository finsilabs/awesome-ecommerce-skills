---
name: accounts-payable-management
description: "Manage supplier invoices and vendor payments with automated receipt matching, payment scheduling, early discount optimization, and reconciliation workflows"
category: business-operations
risk: critical
source: curated
date_added: "2026-03-12"
tags: [accounts-payable, vendor-payments, procurement]
triggers: ["manage vendor payments", "automate accounts payable"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Accounts Payable Management

## Overview

Accounts payable (AP) management covers ingesting supplier invoices, matching them against purchase orders and goods receipts, scheduling payments, capturing early-payment discounts, and reconciling against the vendor ledger. For most e-commerce merchants, a dedicated AP tool or accounting software integration handles this far better than custom code.

## When to Use This Skill

- When your AP team is manually keying invoices from PDFs into spreadsheets and payment delays are causing vendor friction
- When you need automated three-way matching between purchase orders, goods receipts, and invoices
- When early-payment discounts (e.g., 2/10 net 30) are being missed because payment scheduling is reactive
- When preparing for an ERP integration (NetSuite, SAP, QuickBooks) and need a clean AP data model
- When audit requirements demand an immutable record of every invoice approval, payment authorization, and GL posting

## Core Instructions

### Step 1: Determine your current setup and choose the right AP tool

| Store Stage | Recommended Tool | Why |
|-------------|-----------------|-----|
| **Small (< $1M revenue)** | QuickBooks Online or Xero | Both handle AP with supplier invoices, payment scheduling, and bank reconciliation; integrate with Shopify/WooCommerce via native connectors |
| **Mid-market ($1M–$20M)** | BILL (formerly Bill.com) or Tipalti | BILL handles invoice capture via email, approval workflows, ACH/check payments, and vendor portals; Tipalti adds mass global payments |
| **Enterprise ($20M+)** | NetSuite ERP or SAP Business One | Full ERP with three-way matching, GL coding, and multi-entity consolidation |
| **Custom / Headless** | Build an AP data model + integrate with Stripe Treasury or Plaid for payments | For platforms with non-standard procurement workflows |

### Step 2: Connect your e-commerce platform to your AP system

#### Shopify

**Connect Shopify to QuickBooks Online:**
1. Install **QuickBooks Online** connector from the Shopify App Store (free, by Intuit) or use **A2X** (paid, more reliable for high-volume)
2. The connector syncs Shopify sales, refunds, and payouts to QuickBooks automatically
3. In QuickBooks → Expenses → Vendors, manage your supplier invoices and payment schedules
4. Enter vendor invoices manually in QuickBooks or forward supplier invoices to your QuickBooks inbox email (QuickBooks extracts invoice data via OCR)

**Connect Shopify to BILL:**
1. Install **BILL** from the Shopify App Store or connect via Zapier
2. BILL receives supplier invoices via email (forward to your BILL inbox address)
3. BILL extracts invoice data, routes for approval based on your rules, and schedules ACH or check payments
4. For Shopify inventory vendors: create purchase orders in BILL and match incoming invoices against them

#### WooCommerce

**Connect WooCommerce to QuickBooks:**
1. Install the **QuickBooks Online** plugin from WooCommerce.com (official extension)
2. Configure sync settings: sales orders, refunds, and fees sync automatically
3. Manage supplier invoices in QuickBooks → Expenses

**Connect WooCommerce to Xero:**
1. Install **Xero** from WooCommerce.com or use a third-party connector like **WooSync** or **Xero for WooCommerce** by Codisto
2. Xero handles AP with a built-in bills module, payment approvals, and bank reconciliation

#### BigCommerce

**Connect BigCommerce to QuickBooks:**
1. Use **QuickBooks Online** connector from the BigCommerce App Marketplace or **A2X Accounting**
2. A2X is specifically designed for e-commerce accounting and handles Shopify/WooCommerce/BigCommerce → QuickBooks sync accurately

**Connect BigCommerce to NetSuite:**
1. Use the **NetSuite Connector** from the BigCommerce App Marketplace or a middleware like **Celigo** or **Boomi**
2. NetSuite provides enterprise AP with full three-way matching, multi-entity support, and audit trails

### Step 3: Set up invoice capture and approval workflows

#### Using BILL (best-in-class dedicated AP tool)

1. **Invoice capture:** Forward supplier invoices to your BILL inbox email or have suppliers submit directly via a BILL supplier portal link
2. **AP inbox in BILL:** Review captured invoices at BILL → Payables → Inbox; BILL's OCR extracts vendor name, invoice number, date, amount, and due date
3. **Approval routing:** Go to BILL → Settings → Approval Policies to configure amount-based routing:
   - Under $500: auto-approve
   - $500–$5,000: AP Manager approval
   - $5,000–$50,000: Controller approval
   - Over $50,000: CFO approval
4. **Approvers** receive an email with a one-click approve/reject link
5. **Payment scheduling:** BILL schedules payments based on vendor due dates; you can also set to pay X days before due date to capture 2/10 early discounts

#### Using QuickBooks Online for smaller operations

1. Go to **Expenses → Vendors → [Vendor] → New Transaction → Bill**
2. Enter invoice details manually or forward the invoice PDF to your QuickBooks inbox email
3. Set the due date based on vendor terms (e.g., net 30)
4. To pay: go to **Expenses → Pay Bills**, select invoices due, choose payment method (bank transfer, check)
5. QuickBooks tracks outstanding AP and generates an aging report (Reports → Accounts Payable Aging)

### Step 4: Implement three-way matching

Three-way matching compares: the purchase order (what you ordered), the goods receipt (what you received), and the vendor invoice (what the vendor is charging).

**In NetSuite:**
- NetSuite handles three-way matching natively — create a PO, receive the goods (Inventory → Receive Inventory), then match the vendor bill against both; discrepancies auto-flag as exceptions

**In QuickBooks:**
- QuickBooks does not do three-way matching automatically
- Workflow: create a PO in QuickBooks (Expenses → Purchase Orders), receive the items in inventory, then match the bill to the PO manually
- Third-party add-on: **Zahara** or **Lightyear** add PO matching and approval automation on top of QuickBooks

**In BILL:**
- BILL supports PO matching — create POs in BILL, then when an invoice arrives, BILL prompts you to match it against an open PO

### Step 5: Capture early-payment discounts

Common vendor terms are "2/10 net 30" — 2% discount if paid within 10 days, full amount due in 30.

**In BILL:**
1. In your vendor record, set payment terms to "2/10 Net 30"
2. BILL automatically flags invoices where early payment would save money
3. Go to BILL → Payables → Early Pay to see all discount opportunities sorted by savings amount

**In QuickBooks:**
1. When entering a vendor bill, set the payment terms to "2/10 Net 30"
2. QuickBooks calculates the discount amount automatically
3. When paying: select the bill and QuickBooks shows the discount available if paid today

**Key rule:** Set a weekly payment run on a fixed day (e.g., every Tuesday). Pay all invoices due in the next 10 days. This captures early discounts systematically without manual review.

### Step 6: Reconcile and report

#### AP aging report

Run monthly to see all outstanding payables by age:
- **QuickBooks:** Reports → Accounts Payable Aging Summary
- **BILL:** Reports → AP Aging
- **Xero:** Reports → Aged Payables Summary

This shows you what's current, 30–60 days, 60–90 days, and 90+ days overdue.

#### Cash flow forecast

- **QuickBooks:** Reports → Cash Flow Forecast (shows projected outflows based on bill due dates)
- **Float** (add-on for QuickBooks/Xero): provides a more accurate 90-day cash flow forecast including AP obligations

#### Custom / Headless — core AP data model

```typescript
// Minimal AP invoice schema for custom implementations
interface ApInvoice {
  id: string;
  vendorId: string;
  invoiceNumber: string;      // unique per vendor
  invoiceDate: Date;
  dueDate: Date;
  currency: string;           // 'USD'
  totalCents: number;
  paidCents: number;          // increments as payments are applied
  status: 'received' | 'pending_approval' | 'approved' | 'scheduled' | 'paid' | 'disputed';
  poId?: string;              // linked purchase order for matching
  earlyDiscountRate?: number; // e.g., 0.02 for 2%
  earlyDiscountDeadline?: Date;
}

// Identify invoices where early payment saves money
function findEarlyPaymentOpportunities(
  invoices: ApInvoice[],
  todayDate: Date
): { invoiceId: string; discountCents: number; deadline: Date }[] {
  return invoices
    .filter(inv => inv.status === 'approved')
    .filter(inv => inv.earlyDiscountRate && inv.earlyDiscountDeadline! > todayDate)
    .map(inv => ({
      invoiceId: inv.id,
      discountCents: Math.round(inv.totalCents * inv.earlyDiscountRate!),
      deadline: inv.earlyDiscountDeadline!,
    }))
    .sort((a, b) => b.discountCents - a.discountCents);
}
```

## Best Practices

- **Separate invoice approval from payment authorization** — the person who approves an invoice should not be the person who initiates the payment; this is a basic internal control
- **Run payment runs on a fixed weekly cadence** — predictable payment dates reduce bank fees, simplify cash forecasting, and vendors learn to expect payment on those days
- **Store original invoice PDFs for 7 years** — attach the PDF to every bill in QuickBooks/BILL; required for tax audits and vendor disputes
- **Send remittance advice** — when paying multiple invoices in one ACH batch, email the vendor a list of which invoices were paid and for what amounts so they can reconcile their AR
- **Lock invoice amounts after approval** — never edit a bill's total after it's been approved; create a credit memo or debit memo for adjustments instead

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Duplicate invoice payments | QuickBooks and BILL both alert on duplicate invoice numbers per vendor — enable these warnings and require staff to acknowledge them before saving |
| Early discount window missed because invoice sat in approval queue | Add a "discount deadline" badge in your approval tool; BILL shows this prominently; set escalation reminders 2 days before the discount expires |
| AP aging report shows negative balances | Vendor credits and credit memos can create negative balances; ensure credits are applied against open invoices as part of your payment run |
| Vendor disputes payment amount | Always store the PO, goods receipt, and invoice together with your matching result; this is your paper trail for disputes |

## Related Skills

- @vendor-management
- @order-management-system
- @returns-refund-policy
