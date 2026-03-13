---
name: b2b-commerce
description: "Enable wholesale and B2B sales with company accounts, custom catalogs, quote workflows, purchase orders, and net payment terms"
category: business-operations
risk: critical
source: curated
date_added: "2026-03-12"
tags: [b2b, wholesale, company-accounts, quote-workflow, net-terms, custom-catalog, purchase-order, CPQ]
triggers: ["B2B commerce", "wholesale portal", "company accounts", "quote workflow", "net terms", "custom catalog B2B", "business accounts"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# B2B Commerce

## Overview

B2B commerce adds wholesale capabilities to your store: company accounts where multiple employees order under one credit limit, custom pricing per account, a quote-to-order workflow for large or custom orders, and net payment terms (Net 30/60/90) with invoice generation. Most platforms have first-party B2B features or dedicated apps that handle these requirements without custom development.

## When to Use This Skill

- When onboarding wholesale customers who require account-level pricing, catalogs, and credit terms
- When building a distributor portal where multiple employees at the same company can place orders under a shared credit limit
- When implementing a configure-price-quote (CPQ) flow for custom or large-volume orders
- When replacing a phone/email-based wholesale ordering process with a self-service portal
- When B2B customers require purchase order numbers on invoices for their accounts payable process

## Core Instructions

### Step 1: Determine your platform and choose the right B2B tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify Plus** | Shopify B2B (built-in) | Shopify Plus includes Company accounts, custom catalogs, payment terms, and a dedicated B2B checkout — no extra app needed |
| **Shopify (non-Plus)** | Wholesale Club or Wholesale Gorilla | Both apps add customer-tag-based wholesale pricing, minimum order quantities, and hidden wholesale sections without requiring Plus |
| **WooCommerce** | WooCommerce B2B (WooCommerce.com extension) or B2BWoo | WooCommerce B2B handles company registration, role-based pricing, and net terms; B2BWoo is a premium alternative |
| **BigCommerce** | BigCommerce B2B Edition or the built-in Customer Groups | BigCommerce B2B Edition adds company accounts and quotes; Customer Groups (all plans) handle tiered wholesale pricing |
| **Custom / Headless** | Build company accounts, custom catalogs, and a quote workflow from scratch | Full control over credit limits, approval workflows, and invoice generation |

### Step 2: Set up company accounts and wholesale pricing

#### Shopify Plus — B2B (built-in)

1. In Shopify admin, go to **Customers → B2B → Companies → Create company**
2. Enter the company name, billing address, payment terms (e.g., Net 30), and credit limit
3. Add company locations (shipping addresses) and assign buyer contacts to the company
4. Create a **Price List** for the company: go to **Customers → B2B → Price Lists → Create price list** and set custom prices per product or a percentage discount on all products
5. Assign the price list to the company — company buyers see these prices when logged in
6. Company buyers see a B2B-specific checkout with net terms payment options and a PO number field

**Quote workflow on Shopify Plus:**
- Shopify's built-in B2B includes a **Draft Orders** feature — sales reps create draft orders for buyers, the buyer reviews and approves, then the draft converts to an order
- Go to **Orders → Create order** to create a draft; share the link with the buyer for approval

#### Shopify (non-Plus) — Wholesale Club

1. Install **Wholesale Club** from the Shopify App Store
2. Create a "Wholesale" customer tag in Shopify
3. In Wholesale Club, create a discount tier for the "Wholesale" tag: e.g., 30% off everything for tagged customers
4. Apply the wholesale tag to customer accounts when you approve them for wholesale
5. Tagged customers see the discounted prices when logged in; non-tagged customers see retail prices
6. For minimum order quantities: Wholesale Club's paid tier supports MOQs per product or order

#### WooCommerce

**WooCommerce B2B (official extension):**
1. Install from WooCommerce.com
2. Go to **WooCommerce → B2B → Registration** to create a wholesale account registration form with business details (company name, tax ID, etc.)
3. Manually approve wholesale registrations in WooCommerce → B2B → Customers
4. Set pricing rules: apply a percentage discount to user role "Wholesale Customer" across all products or per category
5. For net terms: WooCommerce B2B adds a "Pay by Invoice" payment gateway — orders placed with net terms generate an invoice PDF and allow deferred payment

**Alternative — WooCommerce Role-Based Pricing:**
- Create a "Wholesale" user role (using the **User Role Editor** plugin)
- Use the **WooCommerce Role-Based Pricing** plugin to set per-role prices per product or per category

#### BigCommerce

**Customer Groups (available on all plans):**
1. Go to **Customers → Customer Groups → Add**
2. Create a "Wholesale" group with a percentage discount on all products or category-specific discounts
3. Assign wholesale customers to this group manually or via registration form rules
4. Customers in the Wholesale group see group-specific pricing at checkout

**BigCommerce B2B Edition (add-on for growing wholesale operations):**
1. Contact BigCommerce sales to add B2B Edition to your plan
2. B2B Edition adds: company accounts with multiple buyers, quote requests, corporate payment methods, and a buyer portal
3. The buyer portal lets company admins manage users, view order history, and request quotes from a self-service interface

### Step 3: Set up a quote workflow

For large or custom orders, a quote workflow lets buyers request a price before committing.

#### Shopify Plus

1. Use **Draft Orders** — a sales rep creates a draft order with custom pricing
2. Share the draft order link with the buyer via email
3. The buyer reviews the order in Shopify's checkout and approves/places the order
4. For a more formal quote system: install **QuoteIQ** or **CPQ Configurator** apps from the Shopify App Store

#### WooCommerce

1. Install **WooCommerce Request a Quote** (free, by YITH or similar)
2. Add a "Request a Quote" button to product pages — buyers add items to a quote cart
3. Buyer submits the quote request; you receive an email with the items and quantities
4. Edit the quote (adjust pricing) and send back to the buyer with an approval link
5. Buyer approves → quote converts to a WooCommerce order automatically

#### BigCommerce B2B Edition

- B2B Edition includes a native quote module — buyers click "Request a Quote" on any product
- You receive the quote request in the BigCommerce admin, set pricing, and send it back
- Buyers approve quotes and place the order in one step

### Step 4: Configure net payment terms and invoice generation

Net terms let B2B buyers pay after receiving goods (Net 30 = pay within 30 days of invoice).

#### Shopify Plus

1. On the company record: set **Payment Terms** to Net 15, Net 30, Net 60, or Net 90
2. When a B2B buyer places an order, Shopify creates a "due on" date automatically
3. Track outstanding invoices in **Customers → B2B → Orders → Invoices**
4. Send payment reminders: Shopify automatically emails buyers when invoices are due (configure in Settings → Notifications)

**Accounting integration for net terms:**
- Connect Shopify to **QuickBooks Online** or **Xero** via their Shopify connectors
- Net terms orders sync as unpaid invoices in QuickBooks/Xero
- Your accounting team manages the payment collection follow-up from QuickBooks/Xero

#### WooCommerce

- The **WooCommerce B2B** extension's "Pay by Invoice" gateway creates PDF invoices with due dates based on net terms
- Connect to QuickBooks via the **QuickBooks Online** WooCommerce extension for AR tracking
- For automated payment reminders: use **AutomateWoo** to send reminder emails 7 days before and on the invoice due date

#### BigCommerce

- B2B Edition's corporate payment methods include "Net terms" options
- Connect to QuickBooks or NetSuite via their BigCommerce connectors for invoice tracking

### Step 5: Custom / Headless — core B2B data model

```typescript
// Company account with credit management
interface Company {
  id: string;
  name: string;
  taxId?: string;             // EIN, VAT number
  billingAddress: Address;
  paymentTerms: 'prepay' | 'net15' | 'net30' | 'net60' | 'net90';
  creditLimitCents: number | null;  // null = no limit
  creditUsedCents: number;
  status: 'pending' | 'approved' | 'suspended';
}

// Check credit before placing an order
async function checkCreditAvailability(
  companyId: string,
  orderTotalCents: number
): Promise<{ approved: boolean; reason?: string }> {
  const company = await db.companies.findById(companyId);
  if (company.status !== 'approved') {
    return { approved: false, reason: 'Company account not approved' };
  }
  if (company.creditLimitCents !== null) {
    const availableCredit = company.creditLimitCents - company.creditUsedCents;
    if (orderTotalCents > availableCredit) {
      return {
        approved: false,
        reason: `Order exceeds available credit. Available: $${(availableCredit / 100).toFixed(2)}`,
      };
    }
  }
  return { approved: true };
}

// Record credit usage when order is placed (in same DB transaction as order creation)
async function consumeCredit(companyId: string, amountCents: number): Promise<void> {
  // Atomic update prevents race condition when multiple buyers order simultaneously
  await db.raw(
    'UPDATE companies SET credit_used_cents = credit_used_cents + ? WHERE id = ? AND credit_used_cents + ? <= COALESCE(credit_limit_cents, 2147483647)',
    [amountCents, companyId, amountCents]
  );
}
```

## Best Practices

- **Require company approval before enabling net terms** — run a basic credit check or manual review before setting net terms; at minimum, verify the company's business registration
- **Enforce credit limits atomically** — check and update credit in the same database transaction that creates the order; race conditions can allow two buyers to exceed the limit simultaneously
- **Always put the PO number on invoices** — B2B buyers require their internal PO number on every invoice for their accounts payable workflow; missing this causes payment delays of 30–60 days
- **Release credit when orders are paid or cancelled** — decrement credit_used when you receive payment; this lets buyers place new orders without waiting for manual adjustments
- **Set quote expiration dates** — approved quotes with custom pricing should expire after 30 days to prevent buyers from ordering at stale prices after costs change
- **Audit all quote price changes** — log who changed which line item price and when; this is important for margin tracking and potential disputes

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Individual buyer sees another company's pricing | Scope all catalog and pricing queries strictly by company ID; test by logging in as buyers from different companies |
| Credit limit exceeded due to concurrent orders | Use atomic SQL update with a WHERE clause checking credit headroom; Shopify Plus's built-in B2B handles this automatically |
| B2B checkout bypasses the approval flow | Enforce approval checks server-side in your order creation logic, not just in the UI |
| Wholesale prices show to non-wholesale customers | Customer tags on Shopify and user roles in WooCommerce must be verified server-side; never trust client-side state for pricing |

## Related Skills

- @vendor-management
- @order-management-system
- @returns-refund-policy
- @multi-channel-selling
- @accounts-payable-management
