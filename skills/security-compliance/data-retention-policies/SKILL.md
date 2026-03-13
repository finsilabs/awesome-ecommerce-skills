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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Data Retention Policies

## Overview

Data retention policies define how long each category of data is kept, when it is archived, and when it is purged. E-commerce stores must balance legal obligations (tax records must typically be kept 5–7 years) against privacy regulations (GDPR's data minimization principle requires deleting data that is no longer needed). The right approach depends on your platform — Shopify handles some retention automatically, while WooCommerce/custom stores require explicit implementation.

## When to Use This Skill

- When implementing GDPR data minimization requirements for a new or existing e-commerce platform
- When legal or compliance teams request a documented data retention policy
- When preparing for a data protection audit or SOC 2 Type II assessment
- When storage costs are growing due to uncontrolled data accumulation
- When a customer submits a Subject Access Request and you need to know exactly where their data lives

## Core Instructions

### Step 1: Document your retention schedule first

Before configuring any tool, document a retention schedule. Legal, compliance, and engineering must agree before implementation. This Register of Processing Activities (RoPA) is required under GDPR Article 30 for large processors and recommended for all:

| Data Category | Retention Period | Action After Period | Legal Basis |
|--------------|-----------------|---------------------|-------------|
| Orders (financial records) | 7 years | Anonymize PII; keep financial data | Tax law (US IRS, EU VAT) |
| Invoices | 7 years | Archive to cold storage | Tax compliance |
| Customer accounts | 3 years after last activity | Delete | Legitimate interest |
| Sessions / login logs | 90 days | Delete | Legitimate interest |
| Marketing email consent | Until unsubscribe | Delete on unsubscribe | GDPR consent |
| Abandoned cart data | 30 days | Delete | Legitimate interest |
| Fraud/security logs | 90 days | Anonymize | Legitimate interest |
| Analytics events | 13 months | Aggregate then delete | Legitimate interest |

**Key principle**: Never delete what the law requires you to keep. For orders, anonymize the customer's PII (name, email, address) while preserving the financial record (amounts, tax, payment method brand/last 4).

### Step 2: Platform-specific retention configuration

---

#### Shopify

Shopify stores order data indefinitely by default and handles platform-level data retention for infrastructure components.

**Customer data export and deletion (GDPR compliance):**
Shopify provides built-in GDPR webhooks:
1. Go to **Settings → Customers → Customer privacy**
2. Shopify automatically sends `customers/data_request` and `customers/redact` webhooks to any installed apps when a customer requests their data or deletion
3. For your own app or custom code, register webhook handlers for these events

**Manual customer anonymization:**
1. Open a customer record → **More actions → Anonymize this customer**
2. Shopify replaces PII with anonymized placeholders while keeping order records
3. This is irreversible — confirm before proceeding

**Automated email list cleanup:**
Use Klaviyo (or your email provider) to automatically suppress or delete contacts who haven't opened an email in 12+ months. Most email providers have "sunset" automation features built in.

**Data export for archiving:**
1. Go to **Customers → Export** to download customer data as CSV for archival
2. For orders: **Orders → Export**
3. Store exports in encrypted cold storage (e.g., AWS S3 with Glacier lifecycle policy)

---

#### WooCommerce

WooCommerce does not enforce data retention automatically. You need to configure it via plugins and scheduled tasks.

**WooCommerce's built-in cleanup:**
1. Go to **WooCommerce → Status → Tools**
2. Use **Clean up WooCommerce sessions** to delete expired session data
3. Use **WooCommerce tracker cleanup** to clear tracking data

**GDPR / data retention plugin:**
Install **WP GDPR Compliance** or **GDPR Cookie Consent** (by WebToffee):
1. Go to **WP GDPR Compliance → Settings → Data Retention**
2. Configure retention periods per data type
3. The plugin creates scheduled cleanups via WP-Cron

**Manual scheduled cleanup (WP-Cron):**
```php
// Add to your theme's functions.php or a custom plugin
// Schedule a daily cleanup job
if (!wp_next_scheduled('wc_data_retention_cleanup')) {
    wp_schedule_event(time(), 'daily', 'wc_data_retention_cleanup');
}

add_action('wc_data_retention_cleanup', 'run_data_retention');

function run_data_retention() {
    // Delete WooCommerce sessions older than 90 days
    global $wpdb;
    $wpdb->query(
        $wpdb->prepare(
            "DELETE FROM {$wpdb->prefix}woocommerce_sessions WHERE session_expiry < %d",
            time() - (90 * DAY_IN_SECONDS)
        )
    );
    // Log the cleanup
    error_log('WC data retention: cleaned sessions older than 90 days');
}
```

**Order PII anonymization for tax compliance:**
Do not delete orders (required for tax records). Instead, anonymize PII while keeping financial data. Install **WooCommerce GDPR** (WebToffee) which adds an "Anonymize" action to orders.

---

#### BigCommerce

BigCommerce provides customer data management tools in the admin panel.

**Customer data export:**
1. Go to **Customers → Export → All Customers** (CSV)
2. Use for archival before deleting customer accounts

**Customer deletion:**
1. Go to **Customers → find the customer → Delete**
2. BigCommerce retains associated order records when a customer account is deleted

**Automated retention:**
BigCommerce does not have built-in scheduled data retention. Use the BigCommerce **Customers API** and **Orders API** to:
1. Query customers inactive for more than 3 years
2. Archive their data
3. Delete or anonymize their accounts

This requires a custom script or a third-party integration (e.g., via Zapier or a custom app).

---

#### Custom / Headless

For custom storefronts, implement automated purge and anonymization jobs that run on a schedule.

**Key principle: batch small, run off-peak, always log:**

```typescript
// Run nightly at 2 AM UTC
import { CronJob } from 'cron';

new CronJob('0 2 * * *', runRetentionJobs).start();

async function runRetentionJobs() {
  const jobs = [
    { name: 'purge_sessions', fn: purgeSessions },
    { name: 'purge_abandoned_carts', fn: purgeAbandonedCarts },
    { name: 'anonymize_old_orders', fn: anonymizeOldOrders },
    { name: 'purge_inactive_customers', fn: purgeInactiveCustomers },
  ];

  for (const job of jobs) {
    try {
      const result = await job.fn();
      await db.retentionAuditLog.insert({ job: job.name, ...result, runAt: new Date() });
    } catch (err) {
      await alertOps(`Retention job failed: ${job.name}`, err);
    }
  }
}

// Paginated delete — avoids table locks
async function purgeSessions(): Promise<{ deleted: number }> {
  const cutoff = new Date(Date.now() - 90 * 86400_000);
  let deleted = 0;
  while (true) {
    const batch = await db.sessions.findExpired(cutoff, { limit: 1000 });
    if (batch.length === 0) break;
    await db.sessions.deleteBatch(batch.map(s => s.id));
    deleted += batch.length;
    await new Promise(r => setTimeout(r, 100)); // yield between batches
  }
  return { deleted };
}

// Anonymize order PII but keep financial data (7-year tax requirement)
async function anonymizeOldOrders(): Promise<{ anonymized: number }> {
  const cutoff = new Date(Date.now() - 7 * 365 * 86400_000);
  const orders = await db.orders.findWhere({ created_at: { lt: cutoff }, pii_anonymized_at: null }, { limit: 500 });
  for (const order of orders) {
    await db.orders.update(order.id, {
      customer_email:   `anon_${order.id}@deleted.invalid`,
      customer_name:    'Anonymous Customer',
      shipping_name:    'Anonymous',
      shipping_street:  null,
      shipping_city:    order.shipping_city,    // Keep for tax jurisdiction
      shipping_country: order.shipping_country,
      billing_name:     'Anonymous',
      billing_street:   null,
      // Financial data (total_amount, tax_amount, payment_method_last4): UNCHANGED
      pii_anonymized_at: new Date(),
    });
  }
  return { anonymized: orders.length };
}
```

**Cross-service customer deletion:**
When deleting a customer, purge data from every system that holds it:

```typescript
async function purgeCustomer(customerId: string, reason: 'gdpr_request' | 'inactivity') {
  // 1. Anonymize orders (keep for tax, remove PII)
  await anonymizeOrdersForCustomer(customerId);
  // 2. Delete from email platform (Klaviyo, Mailchimp)
  await emailPlatform.deleteContact(customerId);
  // 3. Delete from search index (Algolia, Elasticsearch)
  await searchIndex.deleteCustomer(customerId);
  // 4. Delete analytics identifier
  await analytics.deleteUser(customerId);
  // 5. Delete the customer profile
  await db.customers.anonymize(customerId);
  // 6. Log for compliance evidence
  await db.retentionAuditLog.insert({ action: 'customer_purged', customerId, reason, executedAt: new Date() });
}
```

## Best Practices

- **Document before implementing** — legal, compliance, and engineering must agree on the retention schedule; unilateral engineering decisions create compliance gaps
- **Anonymize financial records, never delete them** — orders must be retained for the tax statutory period; replace PII fields with anonymized placeholders
- **Keep a separate, append-only retention audit log** — this is your evidence for compliance auditors; never delete from this log
- **Run purge jobs in small batches off-peak** — use `SELECT ... LIMIT n` batches to avoid table locks that impact live traffic
- **Handle cross-service deletion as a checklist** — purges spanning multiple services (database, email platform, analytics) must be resilient; log completion for each system separately
- **Respond to GDPR deletion requests within 30 days** — build automated workflows with reminders and escalations; track all requests with deadlines

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Retention job locks production tables | Use small batch sizes (500–5000 rows), add `LIMIT` to every DELETE/UPDATE, run during low-traffic hours |
| Purging customers with open disputes or pending orders | Check for pending chargebacks, open orders, and active subscriptions before any purge; implement a legal hold mechanism |
| Forgetting search indexes and analytics warehouses | Maintain a registry of all systems that store personal data; include each in every deletion workflow |
| GDPR deletion request not completed within 30 days | Build an automated workflow with a 30-day deadline tracker; escalate to a human if not completed 5 days before the deadline |
| Backup systems containing data past retention period | Flag purged customer IDs so that if a backup is restored for disaster recovery, those records are immediately re-purged |

## Related Skills

- @gdpr-ecommerce
- @account-security
- @financial-audit-trail
- @financial-compliance-sox
