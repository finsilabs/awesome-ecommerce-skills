---
name: financial-audit-trail
description: "Build immutable audit trails for all financial transactions with user attribution, change logging, tamper detection, and compliance-ready export for external audits"
category: security-compliance
risk: safe
source: curated
date_added: "2026-03-12"
tags: [audit-trail, compliance, financial-records]
triggers: ["create audit trail", "financial transaction logging"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Financial Audit Trail

## Overview

Build an immutable, tamper-evident audit trail for every financial transaction in your ecommerce platform — orders, payments, refunds, manual price adjustments, invoice approvals, and GL postings. Every event records who performed the action, from what IP address, at what exact timestamp, what the record looked like before and after the change, and which business process triggered it. The audit log is append-only at the database level, optionally hashed for tamper detection, and exportable in formats that satisfy external auditors, tax authorities, and regulators. This infrastructure underpins PCI-DSS logging requirements, SOX ITGC evidence, GDPR erasure audit trails, and financial statement audits.

## When to Use This Skill

- When your finance team cannot reconstruct who changed an order total, applied a manual discount, or voided an invoice
- When preparing for an external audit and needing to produce a complete, searchable transaction history for a specific time period
- When building SOX-compliant financial systems that require evidence of control operation
- When implementing PCI-DSS logging requirements for access to cardholder data environments
- When GDPR erasure requests require proof that a customer's financial data was actually deleted or anonymized
- When investigating discrepancies between your ecommerce revenue and the payment processor's settlement report

## Core Instructions

1. **Design the append-only audit event schema**

   ```sql
   CREATE TABLE financial_audit_events (
     id              UUID        NOT NULL DEFAULT gen_random_uuid(),
     seq             BIGSERIAL   NOT NULL,          -- Monotonically increasing — gap detection
     occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     event_type      VARCHAR(64) NOT NULL,           -- 'order.total_changed', 'payment.refund_issued', etc.
     aggregate_type  VARCHAR(32) NOT NULL,           -- 'order', 'invoice', 'payment', 'user'
     aggregate_id    VARCHAR(128) NOT NULL,          -- The entity's primary key
     actor_id        VARCHAR(128) NOT NULL,          -- User ID, 'system', or service name
     actor_role      VARCHAR(64),
     actor_ip        INET,
     before_state    JSONB,                          -- Snapshot of record before change (null for creates)
     after_state     JSONB,                          -- Snapshot of record after change (null for deletes)
     delta           JSONB,                          -- Only the fields that changed
     correlation_id  UUID,                           -- Tie events in the same request together
     causation_id    UUID,                           -- ID of the event that caused this one
     metadata        JSONB,                          -- Request ID, user-agent, feature flags, etc.
     hash            VARCHAR(64),                    -- SHA-256 of (seq || occurred_at || event_type || aggregate_id || actor_id || after_state)
     prev_hash       VARCHAR(64),                    -- Hash of the previous event in this aggregate's chain

     PRIMARY KEY (id)
   );

   -- Enforce immutability at the database level:
   -- The application role must NOT have UPDATE or DELETE on this table.
   -- Grant only: GRANT INSERT, SELECT ON financial_audit_events TO app_role;

   -- Efficient lookups by entity
   CREATE INDEX idx_fae_aggregate ON financial_audit_events (aggregate_type, aggregate_id, occurred_at DESC);
   -- Actor activity timeline
   CREATE INDEX idx_fae_actor     ON financial_audit_events (actor_id, occurred_at DESC);
   -- Chronological scan for compliance exports
   CREATE INDEX idx_fae_seq       ON financial_audit_events (seq);
   -- Event type filtering
   CREATE INDEX idx_fae_type      ON financial_audit_events (event_type, occurred_at DESC);
   ```

2. **Build the audit logger service**

   ```typescript
   import { createHash } from 'crypto';

   interface AuditEventInput {
     eventType: string;
     aggregateType: string;
     aggregateId: string;
     actorId: string;
     actorRole?: string;
     actorIp?: string;
     beforeState?: Record<string, unknown> | null;
     afterState?: Record<string, unknown> | null;
     delta?: Record<string, unknown> | null;
     correlationId?: string;
     causationId?: string;
     metadata?: Record<string, unknown>;
   }

   class FinancialAuditLogger {
     // Write a single audit event.
     // This is the ONLY method that writes to the audit log — never call db.insert directly.
     async record(input: AuditEventInput): Promise<string> {
       const prevEvent = await this.getLastEventForAggregate(input.aggregateType, input.aggregateId);

       const eventId = crypto.randomUUID();
       const occurredAt = new Date().toISOString();

       // Compute the tamper-detection hash
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
         id: eventId,
         occurred_at: occurredAt,
         event_type: input.eventType,
         aggregate_type: input.aggregateType,
         aggregate_id: input.aggregateId,
         actor_id: input.actorId,
         actor_role: input.actorRole ?? null,
         actor_ip: input.actorIp ?? null,
         before_state: input.beforeState ?? null,
         after_state: input.afterState ?? null,
         delta: input.delta ?? null,
         correlation_id: input.correlationId ?? null,
         causation_id: input.causationId ?? null,
         metadata: input.metadata ?? null,
         hash,
         prev_hash: prevEvent?.hash ?? null,
       });

       return eventId;
     }

     private async getLastEventForAggregate(
       aggregateType: string,
       aggregateId: string
     ): Promise<{ seq: number; hash: string } | null> {
       return db.financialAuditEvents.findFirst({
         where: { aggregate_type: aggregateType, aggregate_id: aggregateId },
         orderBy: { seq: 'desc' },
         select: { seq: true, hash: true },
       });
     }
   }

   export const auditLog = new FinancialAuditLogger();
   ```

3. **Wrap financial mutations with automatic audit capture**

   ```typescript
   // Higher-order function that audits any financial record mutation
   function withAudit<T extends Record<string, unknown>>(
     aggregateType: string,
     options: { actorFromContext?: boolean } = {}
   ) {
     return function decorator(
       target: unknown,
       propertyKey: string,
       descriptor: PropertyDescriptor
     ) {
       const originalMethod = descriptor.value;

       descriptor.value = async function (this: unknown, id: string, changes: Partial<T>, ctx: RequestContext) {
         // Capture state before mutation
         const beforeState = await db[aggregateType].findById(id);

         // Execute the original mutation
         const result = await originalMethod.call(this, id, changes, ctx);

         // Capture state after mutation
         const afterState = await db[aggregateType].findById(id);

         // Compute delta — only changed fields
         const delta: Record<string, unknown> = {};
         for (const key of Object.keys(changes)) {
           if (beforeState[key] !== afterState[key]) {
             delta[key] = { from: beforeState[key], to: afterState[key] };
           }
         }

         await auditLog.record({
           eventType: `${aggregateType}.updated`,
           aggregateType,
           aggregateId: id,
           actorId: ctx.userId,
           actorRole: ctx.userRole,
           actorIp: ctx.ip,
           beforeState,
           afterState,
           delta,
           correlationId: ctx.requestId,
           metadata: { method: propertyKey, endpoint: ctx.path },
         });

         return result;
       };

       return descriptor;
     };
   }

   // Example usage on a financial service
   class OrderService {
     @withAudit('order')
     async updateOrderTotal(id: string, changes: { total_cents: number }, ctx: RequestContext) {
       return db.orders.update(id, changes);
     }

     @withAudit('order')
     async applyManualDiscount(id: string, changes: { discount_cents: number; discount_reason: string }, ctx: RequestContext) {
       return db.orders.update(id, changes);
     }
   }
   ```

4. **Implement domain-specific audit event helpers**

   ```typescript
   // Typed helpers for common financial events — provide a clean API for the rest of the codebase

   export const FinancialEvents = {
     async orderCreated(order: Order, ctx: RequestContext) {
       return auditLog.record({
         eventType: 'order.created',
         aggregateType: 'order',
         aggregateId: order.id,
         actorId: ctx.userId ?? 'guest',
         actorRole: ctx.userId ? 'customer' : 'guest',
         actorIp: ctx.ip,
         beforeState: null,
         afterState: order,
         correlationId: ctx.requestId,
         metadata: { channel: ctx.channel, sessionId: ctx.sessionId },
       });
     },

     async paymentCaptured(payment: Payment, order: Order, ctx: RequestContext) {
       return auditLog.record({
         eventType: 'payment.captured',
         aggregateType: 'payment',
         aggregateId: payment.id,
         actorId: 'payment_service',
         actorRole: 'system',
         beforeState: null,
         afterState: {
           id: payment.id,
           order_id: payment.order_id,
           amount_cents: payment.amount_cents,
           currency: payment.currency,
           processor: payment.processor,
           processor_reference: payment.processor_reference,
           status: 'captured',
         },
         causationId: order.id,
         correlationId: ctx.requestId,
       });
     },

     async refundIssued(refund: Refund, requestedBy: string, reason: string, ctx: RequestContext) {
       return auditLog.record({
         eventType: 'payment.refund_issued',
         aggregateType: 'refund',
         aggregateId: refund.id,
         actorId: requestedBy,
         actorRole: ctx.userRole,
         actorIp: ctx.ip,
         beforeState: null,
         afterState: { ...refund, reason },
         causationId: refund.payment_id,
         correlationId: ctx.requestId,
         metadata: { reason },
       });
     },

     async manualPriceAdjustment(
       orderId: string,
       before: { total_cents: number },
       after: { total_cents: number },
       reason: string,
       ctx: RequestContext
     ) {
       return auditLog.record({
         eventType: 'order.manual_price_adjustment',
         aggregateType: 'order',
         aggregateId: orderId,
         actorId: ctx.userId,
         actorRole: ctx.userRole,
         actorIp: ctx.ip,
         beforeState: before,
         afterState: after,
         delta: { total_cents: { from: before.total_cents, to: after.total_cents } },
         correlationId: ctx.requestId,
         metadata: { reason, adjustmentCents: after.total_cents - before.total_cents },
       });
     },
   };
   ```

5. **Verify tamper detection — chain integrity check**

   ```typescript
   interface IntegrityReport {
     checked: number;
     intact: number;
     tampered: { seq: number; aggregateId: string; expectedHash: string; actualHash: string }[];
   }

   async function verifyAuditChainIntegrity(
     aggregateType: string,
     aggregateId: string
   ): Promise<IntegrityReport> {
     const events = await db.financialAuditEvents.findAll({
       where: { aggregate_type: aggregateType, aggregate_id: aggregateId },
       orderBy: { seq: 'asc' },
     });

     const report: IntegrityReport = { checked: events.length, intact: 0, tampered: [] };

     for (let i = 0; i < events.length; i++) {
       const event = events[i];
       const prevSeq = i > 0 ? events[i - 1].seq : 0;

       const expectedHashInput = [
         String(prevSeq),
         event.occurred_at,
         event.event_type,
         event.aggregate_id,
         event.actor_id,
         JSON.stringify(event.after_state ?? null),
       ].join('|');

       const expectedHash = createHash('sha256').update(expectedHashInput).digest('hex');

       if (event.hash === expectedHash) {
         report.intact++;
       } else {
         report.tampered.push({
           seq: event.seq,
           aggregateId: event.aggregate_id,
           expectedHash,
           actualHash: event.hash,
         });
       }
     }

     return report;
   }
   ```

6. **Export compliance-ready audit reports**

   ```typescript
   interface AuditExportOptions {
     aggregateType?: string;
     aggregateId?: string;
     actorId?: string;
     eventTypes?: string[];
     from: Date;
     to: Date;
     format: 'json' | 'csv' | 'xlsx';
   }

   async function exportAuditTrail(options: AuditExportOptions): Promise<Buffer> {
     const where: Record<string, unknown> = {
       occurred_at: { gte: options.from, lte: options.to },
     };
     if (options.aggregateType) where.aggregate_type = options.aggregateType;
     if (options.aggregateId)   where.aggregate_id   = options.aggregateId;
     if (options.actorId)       where.actor_id       = options.actorId;
     if (options.eventTypes?.length) where.event_type = { in: options.eventTypes };

     const events = await db.financialAuditEvents.findAll({
       where,
       orderBy: { seq: 'asc' },
     });

     // Flatten nested JSON for CSV/Excel compatibility
     const rows = events.map(e => ({
       'Seq':           e.seq,
       'Date/Time':     e.occurred_at,
       'Event Type':    e.event_type,
       'Record Type':   e.aggregate_type,
       'Record ID':     e.aggregate_id,
       'Actor':         e.actor_id,
       'Actor Role':    e.actor_role ?? '',
       'IP Address':    e.actor_ip ?? '',
       'Before (JSON)': e.before_state ? JSON.stringify(e.before_state) : '',
       'After (JSON)':  e.after_state  ? JSON.stringify(e.after_state)  : '',
       'Delta (JSON)':  e.delta        ? JSON.stringify(e.delta)         : '',
       'Hash':          e.hash ?? '',
     }));

     if (options.format === 'json') {
       return Buffer.from(JSON.stringify(events, null, 2));
     } else if (options.format === 'csv') {
       return buildCsv(rows);
     } else {
       return buildExcelWorkbook([{ name: 'Audit Trail', data: rows }]);
     }
   }
   ```

## Examples

### Query: all changes to a specific order

```sql
SELECT
  seq,
  occurred_at,
  event_type,
  actor_id,
  actor_role,
  actor_ip,
  delta
FROM financial_audit_events
WHERE aggregate_type = 'order'
  AND aggregate_id   = 'ord_abc123'
ORDER BY seq ASC;
```

### Query: all manual price adjustments in the last 30 days

```sql
SELECT
  fae.occurred_at,
  fae.aggregate_id                              AS order_id,
  fae.actor_id,
  fae.actor_role,
  (fae.delta->'total_cents'->>'from')::bigint   AS before_cents,
  (fae.delta->'total_cents'->>'to')::bigint     AS after_cents,
  ((fae.delta->'total_cents'->>'to')::bigint -
   (fae.delta->'total_cents'->>'from')::bigint) AS adjustment_cents,
  fae.metadata->>'reason'                        AS reason
FROM financial_audit_events fae
WHERE fae.event_type = 'order.manual_price_adjustment'
  AND fae.occurred_at >= NOW() - INTERVAL '30 days'
ORDER BY fae.occurred_at DESC;
```

### Query: actor activity report for a suspected user

```sql
SELECT
  occurred_at,
  event_type,
  aggregate_type,
  aggregate_id,
  actor_ip,
  delta
FROM financial_audit_events
WHERE actor_id = 'usr_suspected_user'
  AND occurred_at >= '2026-01-01'::timestamptz
ORDER BY occurred_at DESC;
```

### Daily integrity check job

```typescript
// Run nightly — alert if any tampered events are found
async function nightlyIntegrityCheck(): Promise<void> {
  // Sample 1,000 most recent events across all aggregates
  const recentEvents = await db.financialAuditEvents.findAll({
    orderBy: { seq: 'desc' },
    limit: 1000,
  });

  const aggregates = [...new Set(recentEvents.map(e => `${e.aggregate_type}:${e.aggregate_id}`))];
  const tampered: string[] = [];

  for (const agg of aggregates) {
    const [type, id] = agg.split(':');
    const report = await verifyAuditChainIntegrity(type, id);
    if (report.tampered.length > 0) {
      tampered.push(`${agg}: ${report.tampered.length} tampered events`);
    }
  }

  if (tampered.length > 0) {
    await alertService.send({
      channel: 'security-alerts',
      severity: 'critical',
      message: `AUDIT TRAIL INTEGRITY FAILURE:\n${tampered.join('\n')}`,
    });
  }

  await auditLog.record({
    eventType: 'audit.integrity_check_completed',
    aggregateType: 'system',
    aggregateId: 'audit_integrity_job',
    actorId: 'system',
    afterState: { checked: aggregates.length, tamperedCount: tampered.length, passed: tampered.length === 0 },
  });
}
```

## Best Practices

- **Revoke UPDATE and DELETE at the database level** — application-layer checks can be bypassed; the only reliable guarantee of immutability is a database permission that the application role simply does not have
- **Include `before_state` and `after_state` on every mutation** — storing only the delta is not enough for compliance; auditors need to reconstruct the full state of a record at any point in time without replaying the entire event chain
- **Use a monotonic sequence column alongside UUID** — UUIDs prevent hot-spot contention on inserts but are non-sequential; add a `BIGSERIAL seq` column for gap detection and ordered export
- **Hash each event and link to the previous event's hash** — the blockchain-style chain makes silent tampering detectable; a gap or hash mismatch is an immediate alert
- **Capture the actor's IP address, not just user ID** — when investigating fraud, the IP is often more useful than the user ID, which may have been compromised; log both
- **Log `correlation_id` from the HTTP request** — if a single API request creates multiple audit events (e.g., order update triggers a payment update triggers a GL posting), a shared `correlation_id` lets you reconstruct the full causal chain
- **Store audit events in a separate database schema or database** — this prevents an application bug or a DBA mistake from accidentally affecting audit records alongside production data; use separate credentials
- **Export and verify a sample monthly** — generate a compliance export and verify the chain hashes on the first of each month; this gives you a tested evidence package before auditors request one

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Audit events are missing because developers call `db.update()` directly instead of going through the audit layer | The audit logger must be called in the service layer (not the controller); add a lint rule or a PR checklist item that flags direct `db.update` calls on financial tables |
| `before_state` is null because the developer only captures state after the change | Fetch and snapshot the record BEFORE the mutation inside the same database transaction; the snapshot must be a deep copy, not a reference |
| The audit table grows to hundreds of millions of rows and queries slow down | Partition the table by `occurred_at` (monthly partitions); keep 12 months on hot storage, archive older partitions to cold storage (S3 + Athena) |
| Audit events are written outside the database transaction and are lost on rollback | Write audit events in the same database transaction as the mutation; if the mutation rolls back, the audit event rolls back too — preventing phantom audit records |
| An attacker who compromises the app database role can still delete audit rows | Revoke DELETE on the audit table from all roles; use a separate, more restricted role for audit writes; consider a secondary write-only log stream to an external service |
| Compliance export requested by auditors takes 2 hours to generate | Pre-build indexed views or materialized aggregates for common audit report patterns; ensure the `occurred_at` index is used in range queries |

## Related Skills

- @financial-compliance-sox
- @pci-dss-compliance
- @accounts-payable-management
- @data-retention-policies
- @gdpr-ecommerce
