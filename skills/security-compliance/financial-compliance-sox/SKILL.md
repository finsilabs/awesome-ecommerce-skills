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
platforms: [platform-agnostic]
difficulty: advanced
---

# Financial Compliance — SOX

## Overview

Implement Sarbanes-Oxley (SOX) Section 302 and 404 controls for ecommerce financial systems covering the five COSO control components: control environment, risk assessment, control activities, information and communication, and monitoring. The practical scope for an ecommerce platform includes segregation of duties across the order-to-cash and procure-to-pay cycles, preventive controls (role-based access, approval workflows), detective controls (reconciliation, exception reporting, automated alerts), and evidence collection that satisfies an external auditor reviewing IT General Controls (ITGCs). SOX compliance does not require specific software — it requires documented controls with evidence of operation.

## When to Use This Skill

- When your company is preparing for an IPO and must establish SOX-compliant internal controls over financial reporting (ICFR)
- When external auditors are requesting evidence of IT General Controls for your ecommerce platform
- When building approval workflows that demonstrate segregation of duties across financial processes
- When designing access controls for systems that feed financial statements (order management, payments, ERP)
- When remediating a material weakness or significant deficiency identified by an auditor
- When acquiring a company and assessing the target's financial control environment

## Prerequisites & Platform Notes

**Shopify**: Shopify handles PCI compliance, SSL, and infrastructure security. Focus on app-level security, GDPR consent (via Shopify Privacy API), and access controls.
**WooCommerce**: You manage your own hosting security. Use security plugins (Wordfence, Sucuri), SSL certificate, and PCI-compliant payment gateways. GDPR handled via cookie consent plugins.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: Understanding of your platform's security model, relevant compliance requirements

## Core Instructions

1. **Map your financial data flows and control points**

   Before writing code, document which systems contain financial data and what controls apply:

   ```
   Order-to-Cash Control Points:
   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
   │  Order Entry    │──▶│ Payment Capture │──▶│ Revenue Posting │
   │ Control: Order  │   │ Control: PCI    │   │ Control: GL     │
   │  approval for   │   │  tokenization,  │   │  auto-posting,  │
   │  high-value     │   │  fraud rules    │   │  reconciliation │
   └─────────────────┘   └─────────────────┘   └─────────────────┘

   Procure-to-Pay Control Points:
   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
   │  Purchase Order │──▶│ Invoice Matching│──▶│ Payment Release │
   │ Control: 3-way  │   │ Control: auto   │   │ Control: dual   │
   │  match required │   │  match + human  │   │  approval above │
   │  for POs >$1000 │   │  exception queue│   │  $10,000        │
   └─────────────────┘   └─────────────────┘   └─────────────────┘
   ```

2. **Implement segregation of duties (SOD) via role-based access control**

   SOX requires that no single individual can initiate AND approve a financial transaction. Model this explicitly in your roles:

   ```typescript
   // Roles designed to enforce SOD — see SOD matrix below
   export enum FinancialRole {
     // Order-to-Cash
     ORDER_ENTRY      = 'order_entry',       // Create orders
     ORDER_APPROVER   = 'order_approver',    // Approve high-value orders
     CASH_RECEIPTS    = 'cash_receipts',     // Record received payments
     REVENUE_REPORTER = 'revenue_reporter',  // Read-only revenue reports

     // Procure-to-Pay
     PO_REQUESTER     = 'po_requester',      // Create purchase orders
     PO_APPROVER      = 'po_approver',       // Approve purchase orders
     INVOICE_PROCESSOR= 'invoice_processor', // Enter/match invoices
     PAYMENT_INITIATOR= 'payment_initiator', // Create payment runs
     PAYMENT_APPROVER = 'payment_approver',  // Approve payment runs

     // System Administration
     USER_ADMIN       = 'user_admin',        // Manage user accounts
     AUDITOR          = 'auditor',           // Read-only audit access (no transactions)
   }

   /*
    * SOD Matrix — X means the combination is PROHIBITED
    *
    *                       | PO_REQUESTER | PO_APPROVER | INVOICE_PROCESSOR | PAYMENT_INITIATOR | PAYMENT_APPROVER |
    * PO_REQUESTER          |              |             |                   |                   |                  |
    * PO_APPROVER           |      X       |             |                   |                   |                  |
    * INVOICE_PROCESSOR     |              |             |                   |                   |                  |
    * PAYMENT_INITIATOR     |              |             |        X          |                   |                  |
    * PAYMENT_APPROVER      |      X       |             |                   |        X          |                  |
    */

   const SOD_CONFLICTS: [FinancialRole, FinancialRole][] = [
     [FinancialRole.PO_REQUESTER,      FinancialRole.PO_APPROVER],
     [FinancialRole.INVOICE_PROCESSOR, FinancialRole.PAYMENT_INITIATOR],
     [FinancialRole.PAYMENT_INITIATOR, FinancialRole.PAYMENT_APPROVER],
     [FinancialRole.PO_REQUESTER,      FinancialRole.PAYMENT_APPROVER],
   ];

   function hasSodConflict(roles: FinancialRole[]): { conflict: boolean; pairs: [FinancialRole, FinancialRole][] } {
     const conflicts = SOD_CONFLICTS.filter(
       ([a, b]) => roles.includes(a) && roles.includes(b)
     );
     return { conflict: conflicts.length > 0, pairs: conflicts };
   }

   // Enforce SOD when assigning roles to users
   async function assignUserRoles(userId: string, newRoles: FinancialRole[], assignedBy: string): Promise<void> {
     const { conflict, pairs } = hasSodConflict(newRoles);

     if (conflict) {
       const description = pairs.map(([a, b]) => `"${a}" conflicts with "${b}"`).join('; ');
       throw new SodViolationError(`Role assignment would create SOD conflict: ${description}`);
     }

     await db.userRoles.setRoles(userId, newRoles);

     // Log to immutable audit trail — auditors will review this
     await financialAuditLog.write({
       event: 'user_roles_changed',
       actor: assignedBy,
       subject: userId,
       data: { newRoles },
       controlRef: 'SOX-ITGC-AC-001',
     });
   }
   ```

3. **Build the financial control evidence framework**

   SOX auditors require evidence that controls operated effectively during the audit period. Structure your audit evidence to answer: who, what, when, and what was the outcome?

   ```typescript
   interface FinancialControlEvent {
     id: string;             // Immutable UUID
     timestamp: string;      // ISO 8601 with timezone — never mutable
     controlRef: string;     // e.g., 'SOX-OTC-001', 'SOX-ITGC-AC-001'
     controlName: string;    // Human-readable control description
     event: string;          // Specific activity
     actor: string;          // User ID or system process name
     actorRole: string;      // Role at time of event
     subject: string;        // Entity acted on (invoice ID, user ID, etc.)
     outcome: 'pass' | 'fail' | 'exception'; // Control operated, failed, or exception raised
     data: Record<string, unknown>; // Supporting detail
     ipAddress?: string;
   }

   class FinancialAuditLog {
     // Events are written to an append-only store.
     // Use PostgreSQL table with no UPDATE/DELETE grants to the application role,
     // or write to an immutable log service (AWS CloudWatch Logs, Datadog).
     async write(entry: Omit<FinancialControlEvent, 'id' | 'timestamp'>): Promise<void> {
       await db.financialControlEvents.create({
         data: {
           id: crypto.randomUUID(),
           timestamp: new Date().toISOString(),
           ...entry,
         },
       });
     }

     async getEvidenceForControl(
       controlRef: string,
       from: Date,
       to: Date
     ): Promise<FinancialControlEvent[]> {
       return db.financialControlEvents.findAll({
         where: {
           control_ref: controlRef,
           timestamp: { gte: from.toISOString(), lte: to.toISOString() },
         },
         orderBy: { timestamp: 'asc' },
       });
     }
   }

   export const financialAuditLog = new FinancialAuditLog();
   ```

4. **Implement approval workflow controls with evidence capture**

   ```typescript
   const SOX_CONTROLS = {
     HIGH_VALUE_ORDER_APPROVAL: 'SOX-OTC-001',  // Orders > $10,000 require manager approval
     PO_APPROVAL_REQUIRED:      'SOX-P2P-001',  // All POs require approval before submission
     PAYMENT_RUN_DUAL_APPROVAL: 'SOX-P2P-002',  // Payment runs > $50,000 require two approvers
     INVOICE_MATCH_BEFORE_PAY:  'SOX-P2P-003',  // Invoices must pass 3-way match before payment
   };

   // Control SOX-OTC-001: High-value order approval
   async function checkHighValueOrderControl(orderId: string, userId: string): Promise<void> {
     const order = await db.orders.findById(orderId);
     const HIGH_VALUE_THRESHOLD_CENTS = 1_000_000; // $10,000

     if (order.total_cents >= HIGH_VALUE_THRESHOLD_CENTS) {
       const approver = await db.adminUsers.findById(userId);
       const hasApprovalRole = approver.roles.includes(FinancialRole.ORDER_APPROVER);

       await financialAuditLog.write({
         controlRef: SOX_CONTROLS.HIGH_VALUE_ORDER_APPROVAL,
         controlName: 'High-value order requires manager approval',
         event: 'high_value_order_approval_check',
         actor: userId,
         actorRole: approver.roles.join(','),
         subject: orderId,
         outcome: hasApprovalRole ? 'pass' : 'fail',
         data: {
           orderTotal: order.total_cents,
           threshold: HIGH_VALUE_THRESHOLD_CENTS,
           approvalRolePresent: hasApprovalRole,
         },
       });

       if (!hasApprovalRole) {
         throw new ControlViolationError(
           `Order ${orderId} totals ${formatCents(order.total_cents)} and requires ORDER_APPROVER role`
         );
       }
     }
   }

   // Control SOX-P2P-002: Payment run dual approval
   async function requireDualApprovalForLargePaymentRun(runId: string): Promise<void> {
     const run = await db.apPaymentRuns.findById(runId);
     const DUAL_APPROVAL_THRESHOLD = 5_000_000; // $50,000

     if (run.total_cents >= DUAL_APPROVAL_THRESHOLD) {
       const approvals = await db.apPaymentApprovals.findAll({ where: { run_id: runId } });
       const uniqueApprovers = new Set(approvals.map(a => a.approved_by));

       await financialAuditLog.write({
         controlRef: SOX_CONTROLS.PAYMENT_RUN_DUAL_APPROVAL,
         controlName: 'Large payment run requires two approvers',
         event: 'dual_approval_check',
         actor: 'system',
         actorRole: 'system',
         subject: runId,
         outcome: uniqueApprovers.size >= 2 ? 'pass' : 'fail',
         data: {
           runTotal: run.total_cents,
           threshold: DUAL_APPROVAL_THRESHOLD,
           approvalCount: uniqueApprovers.size,
           approvers: [...uniqueApprovers],
         },
       });

       if (uniqueApprovers.size < 2) {
         throw new ControlViolationError(
           `Payment run ${runId} totals ${formatCents(run.total_cents)} and requires two distinct approvers`
         );
       }
     }
   }
   ```

5. **Build period-end reconciliation controls**

   ```typescript
   // Monthly reconciliation: orders revenue vs. payment processor settlements
   async function runRevenueReconciliation(month: Date): Promise<ReconciliationResult> {
     const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
     const endOfMonth   = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

     const [ordersRevenue, processorSettlements] = await Promise.all([
       db.orders.sumRevenue({ from: startOfMonth, to: endOfMonth }),
       paymentProcessor.getSettlementsForPeriod({ from: startOfMonth, to: endOfMonth }),
     ]);

     const varianceCents = ordersRevenue.totalCents - processorSettlements.totalCents;
     const toleranceCents = 100; // $1.00 rounding tolerance

     const outcome = Math.abs(varianceCents) <= toleranceCents ? 'pass' : 'exception';

     await financialAuditLog.write({
       controlRef: 'SOX-OTC-RECON-001',
       controlName: 'Monthly revenue reconciliation: orders vs. processor settlements',
       event: 'period_end_reconciliation',
       actor: 'system_reconciliation_job',
       actorRole: 'system',
       subject: `recon_${month.getFullYear()}_${String(month.getMonth() + 1).padStart(2, '0')}`,
       outcome,
       data: {
         period: startOfMonth.toISOString().slice(0, 7),
         ordersRevenueCents: ordersRevenue.totalCents,
         processorSettlementsCents: processorSettlements.totalCents,
         varianceCents,
         toleranceCents,
       },
     });

     if (outcome === 'exception') {
       await alertService.send({
         channel: 'finance-alerts',
         severity: 'high',
         message: `Revenue reconciliation exception for ${month.toISOString().slice(0, 7)}: variance ${formatCents(varianceCents)}`,
       });
     }

     return { outcome, varianceCents, ordersRevenueCents: ordersRevenue.totalCents, processorSettlementsCents: processorSettlements.totalCents };
   }
   ```

6. **Automate user access review (quarterly)**

   ```typescript
   // SOX requires quarterly review of who has access to financial systems
   async function generateAccessReviewReport(quarter: { year: number; q: 1 | 2 | 3 | 4 }): Promise<AccessReviewReport> {
     const financialRoles = Object.values(FinancialRole);

     const usersWithFinancialAccess = await db.adminUsers.findAll({
       where: { active: true },
       include: ['roles', 'lastLogin'],
     });

     const financialUsers = usersWithFinancialAccess.filter(u =>
       u.roles.some(r => financialRoles.includes(r as FinancialRole))
     );

     const report: AccessReviewReport = {
       quarter: `${quarter.year}-Q${quarter.q}`,
       generatedAt: new Date().toISOString(),
       totalUsersReviewed: financialUsers.length,
       users: financialUsers.map(u => ({
         userId: u.id,
         email: u.email,
         name: u.name,
         roles: u.roles.filter(r => financialRoles.includes(r as FinancialRole)),
         lastLoginAt: u.lastLogin,
         dormant: !u.lastLogin || u.lastLogin < new Date(Date.now() - 90 * 86400000),
         sodConflict: hasSodConflict(u.roles as FinancialRole[]).conflict,
       })),
     };

     // Flag dormant and SOD-conflicted accounts for manager action
     report.exceptions = report.users.filter(u => u.dormant || u.sodConflict);

     await financialAuditLog.write({
       controlRef: 'SOX-ITGC-AC-002',
       controlName: 'Quarterly user access review for financial systems',
       event: 'access_review_generated',
       actor: 'system',
       actorRole: 'system',
       subject: report.quarter,
       outcome: report.exceptions.length === 0 ? 'pass' : 'exception',
       data: { userCount: report.totalUsersReviewed, exceptionCount: report.exceptions.length },
     });

     return report;
   }
   ```

## Examples

### SOX control matrix for ecommerce systems

```markdown
## IT General Controls (ITGC) — Ecommerce Platform

### Access Controls (AC)
| Control ID      | Description                                     | Frequency  | Evidence                          |
|----------------|-------------------------------------------------|------------|-----------------------------------|
| SOX-ITGC-AC-001 | Role assignments logged with approver           | Continuous | financialControlEvents table      |
| SOX-ITGC-AC-002 | Quarterly access review — financial roles       | Quarterly  | accessReviewReport PDF + log      |
| SOX-ITGC-AC-003 | Dormant accounts (90 days) disabled             | Monthly    | Automated job run log             |
| SOX-ITGC-AC-004 | MFA required for all admin and financial access | Continuous | Auth provider MFA enforcement log |

### Change Management (CM)
| Control ID      | Description                                     | Frequency  | Evidence                          |
|----------------|-------------------------------------------------|------------|-----------------------------------|
| SOX-ITGC-CM-001 | Code changes require PR review before deploy    | Per change | GitHub PR merged status           |
| SOX-ITGC-CM-002 | Production deploys logged with deployer ID      | Per deploy | CI/CD deployment log              |
| SOX-ITGC-CM-003 | DB schema changes tracked in migration files    | Per change | Migration history table           |

### Financial Application Controls (FC)
| Control ID      | Description                                     | Frequency  | Evidence                          |
|----------------|-------------------------------------------------|------------|-----------------------------------|
| SOX-OTC-001     | Orders >$10,000 require manager approval        | Per order  | financialControlEvents            |
| SOX-P2P-001     | All POs require approval before submission      | Per PO     | purchase_orders.approved_at       |
| SOX-P2P-002     | Payment runs >$50,000 require dual approval     | Per run    | ap_payment_approvals              |
| SOX-P2P-003     | 3-way match required before invoice payment     | Per invoice| ap_invoices.match_status          |
| SOX-OTC-RECON-001 | Monthly revenue reconciliation orders vs. settlement | Monthly | financialControlEvents          |
```

### Auditor evidence export

```typescript
async function exportControlEvidenceForAudit(
  controlRef: string,
  periodStart: Date,
  periodEnd: Date
): Promise<Buffer> {
  const events = await financialAuditLog.getEvidenceForControl(controlRef, periodStart, periodEnd);

  const passCount = events.filter(e => e.outcome === 'pass').length;
  const failCount = events.filter(e => e.outcome === 'fail').length;
  const exceptionCount = events.filter(e => e.outcome === 'exception').length;

  const rows = events.map(e => ({
    Date: e.timestamp,
    'Control ID': e.controlRef,
    'Control Name': e.controlName,
    Event: e.event,
    Actor: e.actor,
    'Actor Role': e.actorRole,
    Subject: e.subject,
    Outcome: e.outcome,
    Detail: JSON.stringify(e.data),
  }));

  // Export to Excel for auditor delivery
  return buildExcelWorkbook([
    { name: 'Summary', data: [{ 'Control Ref': controlRef, 'Period': `${periodStart.toISOString().slice(0,10)} to ${periodEnd.toISOString().slice(0,10)}`, 'Total Events': events.length, Pass: passCount, Fail: failCount, Exception: exceptionCount }] },
    { name: 'Events', data: rows },
  ]);
}
```

## Best Practices

- **Document controls before automating them** — write a one-page control description (objective, risk mitigated, who performs it, frequency, evidence) before building the code; auditors read the documentation first
- **Make control failures throw exceptions, not log warnings** — a SOX control that silently logs a failure and allows the transaction to proceed is worse than no control; preventive controls must block the transaction
- **Use immutable audit log storage** — grant the application database role only INSERT on the `financial_control_events` table; revoke UPDATE and DELETE; supplement with an append-only log service as a secondary store
- **Separate the AUDITOR role from all transaction roles** — auditors should have read-only access to all evidence and zero ability to create, modify, or approve transactions; this prevents conflict-of-interest findings
- **Log the control reference ID on every audit event** — when an auditor asks for evidence of Control SOX-P2P-002, you should be able to run a single query filtered by `control_ref`; this dramatically reduces PBC (Provided by Client) list effort
- **Automate the quarterly access review** — manual reviews are consistently the most common control deficiency; automate the report generation and route it to managers for sign-off with a deadline
- **Test controls in staging before auditors test in production** — run a mock walkthrough quarterly; submit a sample transaction through each control and verify the evidence is captured correctly

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| SOD conflicts exist in production because role enforcement was added after users were onboarded | Run a one-time SOD scan on all existing user-role assignments on day one; generate exception tickets and remediate within 30 days before the audit period begins |
| Audit log is mutable — DBA can delete rows | Revoke DELETE on the audit table from all database roles including the DBA service account; use a separate log aggregation service (CloudWatch Logs, Datadog) as a tamper-evident secondary copy |
| Control evidence is missing for weekends and holidays | Controls must operate every day a financial system processes transactions; scheduled reconciliation jobs must run 7 days a week; never skip weekends |
| Approval controls can be bypassed via a direct API call | Every financial mutation endpoint must check the control, not just the UI; the control function is called in the service layer, never only in the controller |
| Access review is performed but reviewers rubber-stamp without real scrutiny | Include last-login dates and SOD flags in the review report; require reviewers to explain in writing any dormant account they choose to keep active |
| Change management evidence is missing for hotfixes | All production changes — including hotfixes — must go through the PR review process; create a `hotfix` branch type with the same review requirements, never commit directly to main |

## Related Skills

- @financial-audit-trail
- @accounts-payable-management
- @pci-dss-compliance
- @account-security
- @data-retention-policies
