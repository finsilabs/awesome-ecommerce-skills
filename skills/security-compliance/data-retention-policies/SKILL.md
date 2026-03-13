---
name: data-retention-policies
description: "Automate the lifecycle of order and customer data — archive old records, anonymize personal data on request, and purge expired data on schedule"
category: security-compliance
risk: critical
source: curated
date_added: "2026-03-12"
tags: [data-retention, gdpr, lifecycle, purging, archival, compliance, cron-jobs, data-governance]
triggers: ["data retention", "data lifecycle", "automated purging", "order data retention", "customer data lifecycle", "data archival ecommerce"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Data Retention Policies

## Overview

E-commerce platforms accumulate vast amounts of personal data — customer profiles, order histories, payment records, browsing sessions, and marketing interactions. Data retention policies define how long each data category is kept, when it is archived, and when it is purged, balancing legal obligations (tax records, consumer protection laws) against privacy regulations (GDPR's data minimization principle). This skill covers defining retention schedules, implementing automated purge jobs, archiving data for compliance, and auditing the data lifecycle.

## When to Use This Skill

- When implementing GDPR data minimization requirements for a new or existing e-commerce platform
- When legal or compliance teams request a documented data retention policy
- When preparing for a data protection audit or SOC 2 Type II assessment
- When storage costs are growing due to uncontrolled data accumulation
- When a customer submits a Subject Access Request and you need to know exactly where their data lives

## Core Instructions

1. **Define a data retention schedule**

   Map every data category to a retention period based on legal requirements and business need:

   ```typescript
   // lib/data-retention/schedule.ts
   export const RETENTION_SCHEDULE = {
     // Legal obligations — cannot be shortened
     orders: {
       retentionDays: 365 * 7,    // 7 years — tax law (US IRS, EU VAT)
       action: 'anonymize',        // Keep order record, anonymize PII
       legalBasis: 'tax_compliance',
     },
     invoices: {
       retentionDays: 365 * 7,
       action: 'archive',          // Move to cold storage, do not delete
       legalBasis: 'tax_compliance',
     },

     // Contractual/operational
     customerAccounts: {
       retentionDays: 365 * 3,    // 3 years after last activity
       action: 'delete',
       trigger: 'last_activity',
       legalBasis: 'legitimate_interest',
     },
     sessions: {
       retentionDays: 90,
       action: 'delete',
       legalBasis: 'legitimate_interest',
     },

     // Consent-based — must delete when consent is withdrawn
     marketingEmails: {
       retentionDays: null,        // Indefinite while consent is active
       action: 'delete_on_unsubscribe',
       legalBasis: 'consent',
     },
     browsingHistory: {
       retentionDays: 365,
       action: 'delete',
       legalBasis: 'legitimate_interest',
     },

     // Short-lived operational data
     cartData: {
       retentionDays: 30,
       action: 'delete',
       legalBasis: 'contract',
     },
     fraudLogs: {
       retentionDays: 90,
       action: 'anonymize',
       legalBasis: 'legitimate_interest',
     },
     analyticsEvents: {
       retentionDays: 395,         // 13 months — GA4 default, aligns with annual comparison
       action: 'aggregate_then_delete', // Keep aggregate stats, delete event-level data
       legalBasis: 'legitimate_interest',
     },
   } as const;
   ```

2. **Implement automated purge jobs**

   Run retention jobs on a schedule using a job queue or cron. Never delete in one large batch — use pagination to avoid locking tables:

   ```typescript
   // jobs/data-retention.ts
   import {CronJob} from 'cron';

   // Run nightly at 2 AM UTC
   new CronJob('0 2 * * *', async () => {
     await runRetentionJobs();
   }).start();

   async function runRetentionJobs() {
     const jobs = [
       purgeSessions,
       purgeAbandonedCarts,
       anonymizeOldFraudLogs,
       archiveOldOrders,
       purgeInactiveCustomers,
       deleteExpiredMarketingData,
     ];

     for (const job of jobs) {
       try {
         const result = await job();
         await db.retentionAudit.log({job: job.name, ...result, runAt: new Date()});
       } catch (err) {
         await alertOpsTeam(`Retention job failed: ${job.name}`, err);
       }
     }
   }

   async function purgeSessions(): Promise<{deleted: number}> {
     const cutoff = new Date(Date.now() - RETENTION_SCHEDULE.sessions.retentionDays * 86400_000);
     let deleted = 0;
     let cursor = 0;

     do {
       const batch = await db.sessions.findExpired(cutoff, {limit: 1000, cursor});
       if (batch.length === 0) break;

       await db.sessions.deleteBatch(batch.map(s => s.id));
       deleted += batch.length;
       cursor = batch[batch.length - 1].id;

       // Yield between batches to avoid overloading the database
       await new Promise(resolve => setTimeout(resolve, 100));
     } while (true);

     return {deleted};
   }

   async function archiveOldOrders(): Promise<{archived: number}> {
     const cutoff = new Date(Date.now() - RETENTION_SCHEDULE.orders.retentionDays * 86400_000);
     const orders = await db.orders.findOlderThan(cutoff, {archived: false, limit: 500});

     if (orders.length === 0) return {archived: 0};

     // Write to cold storage (S3 Glacier)
     const s3Key = `archive/orders/${new Date().toISOString().split('T')[0]}.json.gz`;
     await s3.putObject({
       Bucket: process.env.ARCHIVE_BUCKET!,
       Key: s3Key,
       Body: gzip(JSON.stringify(orders)),
       ContentType: 'application/json',
       ContentEncoding: 'gzip',
       StorageClass: 'GLACIER',
     });

     // Mark as archived in the database (keep metadata, not full data)
     await db.orders.markArchived(orders.map(o => o.id), s3Key);
     return {archived: orders.length};
   }
   ```

3. **Anonymize data instead of deleting when records must be kept**

   For orders required by tax law, anonymize the customer PII while keeping the financial record:

   ```typescript
   async function anonymizeOldOrders(cutoffDays: number) {
     const cutoff = new Date(Date.now() - cutoffDays * 86400_000);

     // Use a database transaction to ensure atomicity
     await db.transaction(async (trx) => {
       const orders = await trx.orders
         .where('created_at', '<', cutoff)
         .where('pii_anonymized_at', null)
         .limit(500);

       for (const order of orders) {
         await trx.orders.update(order.id, {
           // Preserve financial data
           // total_amount, tax_amount, payment_method_brand, payment_method_last4: unchanged

           // Anonymize PII
           customer_email: `anon_${order.id}@deleted.invalid`,
           customer_name: 'Anonymous Customer',
           shipping_name: 'Anonymous',
           shipping_street: null,
           shipping_city: order.shipping_city,    // Keep for tax jurisdiction
           shipping_country: order.shipping_country,
           billing_name: 'Anonymous',
           billing_street: null,

           // Stamp the anonymization date
           pii_anonymized_at: new Date(),
         });
       }
     });
   }
   ```

4. **Track data lineage and create an audit log**

   ```typescript
   // Every retention action must be logged
   interface RetentionAuditEntry {
     jobName: string;
     dataCategory: string;
     action: 'deleted' | 'anonymized' | 'archived';
     recordCount: number;
     cutoffDate: Date;
     executedAt: Date;
     executedByJob: string;
     durationMs: number;
   }

   // Store retention audit log in a separate, append-only table
   // Never delete from this table — it is your compliance evidence

   export async function logRetentionAction(entry: RetentionAuditEntry) {
     await db.retentionAuditLog.insert(entry);
   }

   // Query to produce a compliance report
   export async function getRetentionReport(year: number) {
     return db.retentionAuditLog
       .where('executed_at', '>=', new Date(`${year}-01-01`))
       .where('executed_at', '<', new Date(`${year + 1}-01-01`))
       .groupBy(['data_category', 'action'])
       .select(['data_category', 'action', db.raw('SUM(record_count) as total'), db.raw('MAX(executed_at) as last_run')]);
   }
   ```

5. **Handle deletion cascades across services**

   When a customer account is purged, ensure all satellite services are notified:

   ```typescript
   // lib/data-retention/purge-customer.ts
   export async function purgeCustomerData(customerId: string, reason: 'gdpr_request' | 'inactivity' | 'account_closure') {
     // Verify no legal hold prevents deletion
     const legalHold = await checkLegalHold(customerId);
     if (legalHold) {
       throw new Error(`Cannot purge ${customerId}: active legal hold — ${legalHold.reason}`);
     }

     const purgeLog: string[] = [];

     // 1. Primary database
     await anonymizeOrdersForCustomer(customerId);
     await deleteCustomerProfile(customerId);
     purgeLog.push('primary_db');

     // 2. Search index (Elasticsearch/Algolia)
     await searchIndex.deleteCustomer(customerId);
     purgeLog.push('search_index');

     // 3. Analytics platform
     await analytics.deleteUser(customerId);
     purgeLog.push('analytics');

     // 4. Email platform
     await emailPlatform.deleteContact(customerId);
     purgeLog.push('email_platform');

     // 5. CDN edge cache (invalidate any cached account pages)
     await cdn.purgePrefix(`/account/${customerId}`);
     purgeLog.push('cdn_cache');

     // 6. Backup system (flag for exclusion from next restore)
     await backupSystem.excludeFromRestore(customerId);
     purgeLog.push('backup_exclusion_flag');

     await db.retentionAuditLog.insert({
       action: 'customer_purged',
       customerId,
       reason,
       systemsPurged: purgeLog,
       executedAt: new Date(),
     });
   }
   ```

6. **Test data retention jobs in staging**

   ```typescript
   // test/data-retention.test.ts
   describe('Data Retention Jobs', () => {
     it('should purge sessions older than 90 days', async () => {
       // Create sessions at different ages
       await db.sessions.insert({id: 'session_old', createdAt: daysAgo(91), customerId: 'cust_1'});
       await db.sessions.insert({id: 'session_new', createdAt: daysAgo(10), customerId: 'cust_2'});

       await purgeSessions();

       expect(await db.sessions.findById('session_old')).toBeNull();
       expect(await db.sessions.findById('session_new')).not.toBeNull();
     });

     it('should anonymize order PII but preserve financial data', async () => {
       const orderId = await db.orders.insert({
         customerEmail: 'jane@example.com',
         customerName: 'Jane Doe',
         totalAmount: 5999,
         createdAt: daysAgo(365 * 8),
       });

       await anonymizeOldOrders(365 * 7);

       const order = await db.orders.findById(orderId);
       expect(order.customerEmail).toContain('@deleted.invalid');
       expect(order.customerName).toBe('Anonymous Customer');
       expect(order.totalAmount).toBe(5999); // Financial data preserved
     });
   });
   ```

## Examples

### PostgreSQL scheduled purge with pg_cron

```sql
-- Install pg_cron extension (available on RDS, Supabase, Neon)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Purge expired sessions nightly at 02:00 UTC
SELECT cron.schedule(
  'purge-expired-sessions',
  '0 2 * * *',
  $$DELETE FROM sessions WHERE expires_at < NOW() AND id IN (
    SELECT id FROM sessions WHERE expires_at < NOW() LIMIT 10000
  )$$
);

-- Anonymize old order PII monthly
SELECT cron.schedule(
  'anonymize-old-orders',
  '0 3 1 * *',  -- 1st of each month at 03:00
  $$UPDATE orders SET
    customer_email = 'anon_' || id || '@deleted.invalid',
    customer_name = 'Anonymous',
    shipping_street = NULL
  WHERE created_at < NOW() - INTERVAL '7 years'
    AND pii_anonymized_at IS NULL
    AND id IN (SELECT id FROM orders WHERE created_at < NOW() - INTERVAL '7 years' AND pii_anonymized_at IS NULL LIMIT 5000)$$
);
```

### S3 Lifecycle Policy for archived order data

```json
{
  "Rules": [
    {
      "ID": "archive-orders-lifecycle",
      "Status": "Enabled",
      "Filter": {"Prefix": "archive/orders/"},
      "Transitions": [
        {"Days": 0, "StorageClass": "GLACIER"},
        {"Days": 365, "StorageClass": "DEEP_ARCHIVE"}
      ],
      "Expiration": {"Days": 3650}
    },
    {
      "ID": "delete-temp-exports",
      "Status": "Enabled",
      "Filter": {"Prefix": "gdpr-exports/"},
      "Expiration": {"Days": 30}
    }
  ]
}
```

## Best Practices

- **Document your retention schedule before implementing it** — legal, compliance, and engineering teams should agree on the schedule; unilateral engineering decisions can create compliance gaps
- **Never delete what the law requires you to keep** — anonymize financial records rather than deleting them; deleting legally required records is itself a compliance violation
- **Run purge jobs off-peak with row-level locking** — use `SELECT ... LIMIT n` batches to avoid table locks that impact live traffic; schedule during low-traffic windows
- **Keep a separate, append-only retention audit log** — this is your evidence for compliance auditors that data was purged according to policy; store it separately so it cannot be accidentally deleted
- **Test your purge jobs on production-scale data in staging** — purge jobs that work fine on 10,000 rows may time out or lock tables on 10,000,000 rows; benchmark before rolling out
- **Handle cross-service deletion with a saga** — purge jobs that span multiple services (database, email platform, analytics) must be resilient; use a checklist pattern so partially-completed purges can be resumed
- **Set up monitoring alerts for failed retention jobs** — a retention job that silently fails means data is not purged on schedule; alert when jobs fail or when the volume purged is significantly different from expected

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Retention job locks production tables | Use small batch sizes (500–5000 rows), add a `LIMIT` to every DELETE/UPDATE, and run during maintenance windows |
| Purging customers who still have open disputes | Implement a legal hold mechanism; check for pending chargebacks, support tickets, and active subscriptions before any purge |
| Forgetting search indexes and analytics warehouses | Maintain a registry of all systems that store personal data; include each system in every deletion workflow |
| Backup tapes containing data past retention period | Implement a backup exclusion list; flag purged customer IDs so that if a backup is restored for DR purposes, those records are immediately re-purged |
| GDPR deletion request not completed within 30 days | Build an automated workflow with reminders and escalations; track all requests with deadlines in a dedicated table |

## Related Skills

- @gdpr-ecommerce
- @account-security
- @monitoring-alerting-commerce
- @database-optimization-commerce
