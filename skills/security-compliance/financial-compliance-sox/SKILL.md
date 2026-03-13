---
name: financial-compliance-sox
description: "Implement SOX-compliant financial controls for ecommerce with audit trails, segregation of duties, access controls, and compliance-ready transaction logging"
category: security-compliance
risk: safe
source: curated
date_added: "2026-03-12"
tags: [sox, financial-compliance, audit, controls]
triggers: ["implement SOX compliance", "financial audit controls"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Financial Compliance — SOX

## Overview

SOX (Sarbanes-Oxley Act) Section 302 and 404 require publicly traded companies to maintain documented internal controls over financial reporting (ICFR). For e-commerce, this means implementing controls across the order-to-cash and procure-to-pay cycles: segregation of duties (no single person can initiate and approve a financial transaction), approval workflows for high-value transactions, automated reconciliation, and immutable audit evidence. SOX compliance is primarily a process and documentation challenge, not a software challenge — but the systems you build must generate auditable evidence that controls are operating.

## When to Use This Skill

- When your company is preparing for an IPO and must establish SOX-compliant ICFR
- When external auditors are requesting evidence of IT General Controls for your e-commerce platform
- When building approval workflows that demonstrate segregation of duties
- When designing access controls for systems that feed financial statements
- When remediating a material weakness or significant deficiency identified by an auditor

## Core Instructions

### Step 1: Map your financial data flows and control points

Before any configuration or code, document which systems contain financial data and what controls apply. SOX auditors want to see this documentation:

**Order-to-Cash control points:**
- Order entry → Payment capture → Revenue posting
- Key controls: approval for high-value orders, fraud rules, GL auto-posting, monthly reconciliation

**Procure-to-Pay control points:**
- Purchase order creation → Invoice matching → Payment release
- Key controls: 3-way match for POs above threshold, dual approval for large payment runs

Document each control with:
1. Control objective (what risk does this control mitigate?)
2. Control owner (which role performs this control?)
3. Frequency (continuous, daily, monthly, per transaction)
4. Evidence (what record proves the control operated?)

### Step 2: Platform-specific SOX implementation

---

#### Shopify

Shopify does not provide SOX-specific tooling, but you can implement key controls using platform features and third-party integrations.

**Access controls (segregation of duties):**
1. Go to **Settings → Users and permissions**
2. Configure staff account permissions — Shopify allows granular permission scoping:
   - Separate "can issue refunds" from "can edit orders" from "can access reports"
   - Create separate accounts for each staff member (no shared admin credentials)
3. For stricter SOD, use **Shopify Plus** organizations to manage permissions across stores

**Approval workflows for high-value orders:**
Shopify does not have native approval workflows. Use **Shopify Flow** (Shopify/Plus) to create a hold-and-notify workflow:
1. In Shopify Flow, create a trigger: **Order created**
2. Add a condition: Order total > $10,000
3. Add an action: Add a tag "pending_approval" and send an internal email/Slack notification
4. Your team reviews and either manually removes the tag and fulfills, or cancels the order
5. Log the approval decision as an order note (for audit evidence)

**Reconciliation:**
1. Use Shopify's **Finances → Payments** report to see all payment captures, refunds, and payouts
2. Download monthly reports and reconcile against your payment processor's (Stripe, PayPal) settlement reports
3. Document any variances with explanations — this is your reconciliation control evidence

**Change management evidence:**
For Shopify theme and app changes:
1. Use a version-controlled theme development workflow (GitHub)
2. Require pull request reviews before deploying theme changes
3. Document app installations and permission grants in a change log

---

#### WooCommerce

WooCommerce gives you more control over role-based access and custom approval workflows.

**Role-based access (segregation of duties):**
1. Install **User Role Editor** or **Members** plugin
2. Create separate WordPress roles with specific WooCommerce capabilities:
   - **Order Viewer**: can view orders, cannot edit or refund
   - **Order Processor**: can update order status, cannot refund
   - **Finance Manager**: can issue refunds, cannot create orders
   - **Auditor**: read-only access to all reports, cannot make any changes
3. Assign staff to roles; no single person should have both "create order" and "issue refund" capabilities

**High-value order approval workflow:**
Install **WooCommerce Order Approval** (free) or **YITH WooCommerce Order Approval** (~$70/year):
1. Configure an approval threshold (e.g., orders over $10,000 require manual approval)
2. The plugin holds the order in "Pending Approval" status
3. A designated approver receives an email notification and can approve or reject in the WooCommerce admin
4. Approval decision and approver name are logged in the order notes (audit evidence)

**Audit logging:**
Install **Simple History** (free plugin) to capture all WooCommerce admin actions with user attribution, timestamps, and before/after values.

**Monthly reconciliation:**
1. Export WooCommerce order totals by month (**WooCommerce → Reports → Orders**)
2. Download Stripe/PayPal settlement reports for the same period
3. Reconcile totals; document variances; store evidence in a shared compliance folder

---

#### BigCommerce

**User access controls:**
1. Go to **Account Settings → Users → Add User**
2. BigCommerce supports role-based access with granular permissions
3. Create roles aligned to SOD requirements: separate Order Processing from Refund Authorization from Report Viewer

**Approval workflows:**
BigCommerce does not have native approval workflows. Options:
- Use **BigCommerce Webhooks** to trigger an approval process in an external workflow tool (Zapier, Monday.com, or a custom app) when a high-value order is created
- Manually hold high-value orders via a custom order status and a standard operating procedure

**Reconciliation:**
Use the **BigCommerce Analytics → Revenue report** and compare against your payment processor settlement. Export both as CSV and document the comparison monthly.

---

#### Custom / Headless

For custom storefronts, implement the controls programmatically. The three most critical controls for a SOX audit are: segregation of duties enforcement, approval workflows with evidence capture, and automated reconciliation.

**Segregation of duties — role model:**

```typescript
enum FinancialRole {
  ORDER_ENTRY      = 'order_entry',
  ORDER_APPROVER   = 'order_approver',
  CASH_RECEIPTS    = 'cash_receipts',
  PO_REQUESTER     = 'po_requester',
  PO_APPROVER      = 'po_approver',
  PAYMENT_INITIATOR = 'payment_initiator',
  PAYMENT_APPROVER = 'payment_approver',
  AUDITOR          = 'auditor',  // Read-only — zero transaction capability
}

// SOD conflicts — these role combinations are prohibited
const SOD_CONFLICTS: [FinancialRole, FinancialRole][] = [
  [FinancialRole.PO_REQUESTER,       FinancialRole.PO_APPROVER],
  [FinancialRole.PAYMENT_INITIATOR,  FinancialRole.PAYMENT_APPROVER],
  [FinancialRole.PO_REQUESTER,       FinancialRole.PAYMENT_APPROVER],
  [FinancialRole.ORDER_ENTRY,        FinancialRole.ORDER_APPROVER],
];

function hasSodConflict(roles: FinancialRole[]): { conflict: boolean; pairs: [FinancialRole, FinancialRole][] } {
  const conflicts = SOD_CONFLICTS.filter(([a, b]) => roles.includes(a) && roles.includes(b));
  return { conflict: conflicts.length > 0, pairs: conflicts };
}

// Enforce SOD when assigning roles
async function assignRoles(userId: string, newRoles: FinancialRole[], assignedBy: string) {
  const { conflict, pairs } = hasSodConflict(newRoles);
  if (conflict) {
    throw new Error(`SOD conflict: ${pairs.map(([a, b]) => `${a} + ${b}`).join(', ')}`);
  }
  await db.userRoles.setRoles(userId, newRoles);
  // Log to immutable audit trail
  await auditLog.record({ eventType: 'user_roles_changed', actorId: assignedBy, aggregateId: userId,
    afterState: { roles: newRoles }, controlRef: 'SOX-ITGC-AC-001' });
}
```

**High-value order approval control:**

```typescript
const HIGH_VALUE_THRESHOLD_CENTS = 1_000_000; // $10,000

async function processOrderApproval(orderId: string, approverId: string) {
  const order = await db.orders.findById(orderId);
  const approver = await db.users.findById(approverId);

  if (order.total_cents >= HIGH_VALUE_THRESHOLD_CENTS) {
    const hasRole = approver.roles.includes(FinancialRole.ORDER_APPROVER);

    await auditLog.record({
      eventType: 'high_value_order_approval_check',
      aggregateId: orderId,
      actorId: approverId,
      afterState: { orderTotal: order.total_cents, hasApprovalRole: hasRole, outcome: hasRole ? 'pass' : 'fail' },
      controlRef: 'SOX-OTC-001',
    });

    if (!hasRole) throw new Error('ORDER_APPROVER role required for orders above $10,000');
  }
}
```

**Monthly reconciliation automation:**

```typescript
async function runMonthlyReconciliation(month: Date) {
  const [ordersRevenue, processorSettlements] = await Promise.all([
    db.orders.sumRevenue(month),
    paymentProcessor.getSettlementsForMonth(month),
  ]);

  const varianceCents = ordersRevenue.totalCents - processorSettlements.totalCents;
  const outcome = Math.abs(varianceCents) <= 100 ? 'pass' : 'exception'; // $1 tolerance

  await auditLog.record({
    eventType: 'monthly_revenue_reconciliation',
    aggregateId: month.toISOString().slice(0, 7),
    actorId: 'system_recon_job',
    afterState: { ordersRevenue: ordersRevenue.totalCents, processorSettlements: processorSettlements.totalCents, varianceCents, outcome },
    controlRef: 'SOX-OTC-RECON-001',
  });

  if (outcome === 'exception') {
    await alertFinanceTeam(`Reconciliation exception: ${varianceCents / 100} variance for ${month.toISOString().slice(0, 7)}`);
  }
}
```

**Quarterly user access review:**

```typescript
async function generateQuarterlyAccessReview(quarter: string) {
  const financialUsers = await db.users.findWithFinancialRoles();
  const report = {
    quarter,
    generatedAt: new Date().toISOString(),
    users: financialUsers.map(u => ({
      userId: u.id, email: u.email,
      roles: u.financialRoles,
      lastLogin: u.lastLoginAt,
      dormant: !u.lastLoginAt || u.lastLoginAt < new Date(Date.now() - 90 * 86400000),
      sodConflict: hasSodConflict(u.financialRoles).conflict,
    })),
  };
  report.exceptions = report.users.filter(u => u.dormant || u.sodConflict);
  // Route to manager for sign-off with 30-day deadline
  await routeForManagerApproval(report);
  await auditLog.record({ eventType: 'quarterly_access_review_generated', aggregateId: quarter,
    actorId: 'system', afterState: { exceptionCount: report.exceptions.length }, controlRef: 'SOX-ITGC-AC-002' });
  return report;
}
```

## Best Practices

- **Document controls before automating them** — write a one-page control description (objective, risk mitigated, owner, frequency, evidence) before building the code; auditors read documentation first
- **Make control failures throw exceptions, not log warnings** — a SOX control that logs a failure and allows the transaction to proceed is worse than no control; preventive controls must block the transaction
- **Use immutable audit log storage** — grant the application role only INSERT on the audit table; revoke UPDATE and DELETE; use an append-only log service as a secondary store
- **Log the control reference ID on every audit event** — when an auditor requests evidence for Control SOX-P2P-002, a single query filtered by `control_ref` should return all evidence
- **Automate the quarterly access review** — manual reviews are the most common control deficiency; automate report generation and route to managers with a deadline
- **Test controls in staging quarterly** — run a mock walkthrough; submit a sample transaction through each control and verify the evidence is captured before auditors test in production

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| SOD conflicts exist because role enforcement was added after users were onboarded | Run a one-time SOD scan on all existing user-role assignments; generate exception tickets and remediate before the audit period begins |
| Audit log is mutable — DBA can delete rows | Revoke DELETE from all database roles; use a separate log aggregation service (CloudWatch Logs, Datadog) as a tamper-evident secondary copy |
| Control evidence is missing for weekends and holidays | Controls must operate every day the financial system processes transactions; reconciliation jobs must run 7 days a week |
| Approval controls bypassed via a direct API call | Every financial mutation endpoint must check the control in the service layer, not just the UI; the control function is called in service code, never only in the controller |
| Change management evidence missing for hotfixes | All production changes — including hotfixes — must go through code review; create a `hotfix` branch type with the same review requirements as main |

## Related Skills

- @financial-audit-trail
- @pci-dss-compliance
- @account-security
- @data-retention-policies
