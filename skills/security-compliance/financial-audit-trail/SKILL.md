---
name: financial-audit-trail
description: "Build immutable audit trails for all financial transactions with user attribution, change logging, tamper detection, and compliance-ready export for external audits"
category: security-compliance
risk: safe
source: curated
date_added: "2026-03-12"
tags: [audit-trail, compliance, financial-records]
triggers: ["create audit trail", "financial transaction logging"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Financial Audit Trail

## Overview

A financial audit trail records every change to financial data — orders, payments, refunds, manual price adjustments, and invoice approvals — with who made the change, when, from what IP, and what the record looked like before and after. This infrastructure is required for PCI-DSS logging compliance, SOX ITGC evidence, GDPR erasure audit trails, and financial statement audits. Every major e-commerce platform generates some audit history; the gap is usually in completeness, manual change attribution, and export format for auditors.

## When to Use This Skill

- When your finance team cannot reconstruct who changed an order total, applied a manual discount, or voided an invoice
- When preparing for an external audit and needing to produce a complete, searchable transaction history for a specific time period
- When building SOX-compliant financial systems that require evidence of control operation
- When implementing PCI-DSS logging requirements for access to cardholder data environments
- When GDPR erasure requests require proof that a customer's financial data was actually anonymized
- When investigating discrepancies between your e-commerce revenue and the payment processor's settlement report

## Core Instructions

### Step 1: Determine the merchant's platform and what is already captured

| Platform | Built-in Audit Capability | What You Need to Add |
|----------|--------------------------|---------------------|
| **Shopify** | Order timeline records all events (created, payment captured, refunded, edited); admin action attribution is limited | Export timeline data via Admin API; for admin changes, enable Staff activity logging under Settings |
| **WooCommerce** | Order notes show customer-visible actions; system notes show some status changes | Install **WooCommerce Admin Audit Log** or **Simple History** plugin for full admin action tracking |
| **BigCommerce** | Store logs in **Advanced Settings → Store Logs** for system events; order history available via API | For admin action attribution, export via API and combine with server access logs |
| **Custom / Headless** | Nothing built in | Must build — see Custom section |

### Step 2: Extract and supplement platform audit data

---

#### Shopify

**Enabling and accessing audit data:**

1. Go to **Settings → Activity** (Shopify admin) to see recent staff activity
2. For more granular data, install **Shopify Audit** or use the **Admin API**:
   - `GET /admin/api/2024-04/events.json` returns all store events
   - Filter by `verb` (confirmed, placed, edited, refunded, etc.) and `subject_type` (Order, Refund, Customer)
3. Each order has a **Timeline** section showing all state changes with timestamps

**Export for auditors:**
1. Go to **Orders → Export** to download order data as CSV
2. For detailed refund records: **Orders → [specific order] → Timeline** shows each action
3. Use the Shopify Admin API to extract the full event stream:
```javascript
// Fetch all financial events for a date range
const events = await shopify.event.list({
  verb: 'confirmed,placed,refunded,voided',
  created_at_min: '2026-01-01T00:00:00Z',
  created_at_max: '2026-12-31T23:59:59Z',
  limit: 250,
});
```

**Staff action tracking (Shopify Plus):**
- Go to **Settings → Users and permissions → Staff activity log**
- This shows admin actions including order edits, price adjustments, and refunds with user attribution

---

#### WooCommerce

WooCommerce order notes provide some audit history, but do not track which admin user made a change. Install a dedicated audit plugin.

**Simple History plugin (free, recommended):**
1. Install **Simple History** from the WordPress plugin directory
2. It automatically logs:
   - Order status changes with user attribution
   - Product price changes
   - WooCommerce setting changes
   - User login/logout events
3. Go to **Dashboard → Simple History** to view the log
4. Export as CSV via **Simple History → Settings → Export**

**WooCommerce Admin Audit Log (premium, ~$50/year):**
1. Install from WooCommerce.com or a third-party marketplace
2. Provides more granular logging including:
   - Manual order total edits
   - Discount application with staff user attribution
   - Refund amounts and approving user
3. Export in CSV or PDF for auditors

**Manual order edit tracking:**
For any manual financial change (discount applied, total adjusted), add an **Order Note** (internal, not visible to customer) documenting:
- What was changed
- Why it was changed
- Who approved it

This is the minimum acceptable evidence for an auditor when automated logging is not in place.

---

#### BigCommerce

**Accessing store logs:**
1. Go to **Advanced Settings → Store Logs**
2. Filter by log type: Order (financial changes), User (admin activity), System
3. Export as CSV

**Order history via API:**
Use the BigCommerce Orders API to extract a complete order history with status transitions:
```javascript
// Get all orders modified in a date range
const orders = await bigcommerce.get('/v2/orders', {
  min_date_modified: '2026-01-01T00:00:00+00:00',
  max_date_modified: '2026-12-31T23:59:59+00:00',
  status_id: '',  // all statuses
  limit: 250,
});
```

Combine with the **Order Transactions API** (`/v2/orders/{id}/transactions`) to get payment captures, refunds, and voids.

---

#### Custom / Headless

For custom storefronts, implement an append-only audit log that records every financial mutation. The key design requirements are: immutable (app role has no UPDATE or DELETE), includes before/after state, and supports tamper detection.

```sql
CREATE TABLE financial_audit_events (
  id             UUID        NOT NULL DEFAULT gen_random_uuid(),
  seq            BIGSERIAL   NOT NULL,          -- Monotonic — gap detection
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type     VARCHAR(64) NOT NULL,           -- 'order.total_changed', 'refund.issued'
  aggregate_type VARCHAR(32) NOT NULL,           -- 'order', 'payment', 'refund'
  aggregate_id   VARCHAR(128) NOT NULL,
  actor_id       VARCHAR(128) NOT NULL,          -- user ID or 'system'
  actor_role     VARCHAR(64),
  actor_ip       INET,
  before_state   JSONB,                          -- Snapshot before change
  after_state    JSONB,                          -- Snapshot after change
  delta          JSONB,                          -- Only changed fields
  correlation_id UUID,                           -- Tie events in same request
  hash           VARCHAR(64),                    -- SHA-256 for tamper detection
  PRIMARY KEY (id)
);

-- Grant INSERT and SELECT only — never UPDATE or DELETE
GRANT INSERT, SELECT ON financial_audit_events TO app_role;
REVOKE UPDATE, DELETE ON financial_audit_events FROM app_role;

CREATE INDEX idx_fae_aggregate ON financial_audit_events (aggregate_type, aggregate_id, occurred_at DESC);
CREATE INDEX idx_fae_actor ON financial_audit_events (actor_id, occurred_at DESC);
CREATE INDEX idx_fae_seq ON financial_audit_events (seq);
```

**Audit logger with tamper-detection hashing:**

```typescript
import { createHash } from 'crypto';

async function recordAuditEvent(input: {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  actorId: string;
  actorRole?: string;
  actorIp?: string;
  beforeState?: object | null;
  afterState?: object | null;
  correlationId?: string;
}): Promise<void> {
  const prevEvent = await db.financialAuditEvents.findFirst({
    where: { aggregate_type: input.aggregateType, aggregate_id: input.aggregateId },
    orderBy: { seq: 'desc' },
    select: { seq: true, hash: true },
  });

  const occurredAt = new Date().toISOString();
  const hashInput = [
    String(prevEvent?.seq ?? 0),
    occurredAt,
    input.eventType,
    input.aggregateId,
    input.actorId,
    JSON.stringify(input.afterState ?? null),
  ].join('|');

  const hash = createHash('sha256').update(hashInput).digest('hex');

  await db.financialAuditEvents.insert({
    occurred_at: occurredAt,
    event_type: input.eventType,
    aggregate_type: input.aggregateType,
    aggregate_id: input.aggregateId,
    actor_id: input.actorId,
    actor_role: input.actorRole ?? null,
    actor_ip: input.actorIp ?? null,
    before_state: input.beforeState ?? null,
    after_state: input.afterState ?? null,
    correlation_id: input.correlationId ?? null,
    hash,
    prev_hash: prevEvent?.hash ?? null,
  });
}
```

**Export for auditors:**
```typescript
async function exportAuditTrail(from: Date, to: Date, format: 'json' | 'csv'): Promise<Buffer> {
  const events = await db.financialAuditEvents.findAll({
    where: { occurred_at: { gte: from, lte: to } },
    orderBy: { seq: 'asc' },
  });

  if (format === 'json') return Buffer.from(JSON.stringify(events, null, 2));

  // CSV for auditor delivery
  const rows = events.map(e => ({
    'Date/Time': e.occurred_at,
    'Event Type': e.event_type,
    'Record Type': e.aggregate_type,
    'Record ID': e.aggregate_id,
    'Actor': e.actor_id,
    'Actor Role': e.actor_role ?? '',
    'IP Address': e.actor_ip ?? '',
    'Before': e.before_state ? JSON.stringify(e.before_state) : '',
    'After': e.after_state ? JSON.stringify(e.after_state) : '',
    'Delta': e.delta ? JSON.stringify(e.delta) : '',
  }));
  return buildCsv(rows);
}
```

## Best Practices

- **Include `before_state` and `after_state` on every mutation** — storing only a delta is not enough for compliance; auditors need to reconstruct the full state of a record at any point in time
- **Revoke UPDATE and DELETE at the database level** — application-layer checks can be bypassed; the only reliable immutability guarantee is a database permission the application role does not have
- **Capture the actor's IP address alongside user ID** — when investigating fraud, the IP is often more useful; log both
- **Log `correlation_id` from the HTTP request** — if a single API request creates multiple audit events, a shared `correlation_id` lets you reconstruct the full causal chain
- **Export and verify a sample monthly** — generate a compliance export on the first of each month and verify chain hashes; this gives you a tested evidence package before auditors request one
- **Store audit events in a separate database schema** — prevents an application bug or a DBA mistake from accidentally affecting audit records alongside production data

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Audit events missing because developers call `db.update()` directly | The audit logger must be called in the service layer, not the controller; add a code review checklist item that flags direct `db.update` calls on financial tables |
| `before_state` is null because the developer only captures state after the change | Fetch and snapshot the record BEFORE the mutation inside the same database transaction |
| Audit table grows to hundreds of millions of rows, slowing queries | Partition the table by `occurred_at` (monthly partitions); keep 12 months on hot storage, archive older partitions to S3 + Athena |
| An attacker who compromises the app role can delete audit rows | Revoke DELETE from all roles; consider a secondary write-only log stream to an external service (CloudWatch Logs, Datadog) |
| Compliance export takes hours to generate | Pre-build indexed views for common audit report patterns; ensure the `occurred_at` index is used in range queries |

## Related Skills

- @financial-compliance-sox
- @pci-dss-compliance
- @data-retention-policies
- @gdpr-ecommerce
