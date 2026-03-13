---
name: gdpr-ecommerce
description: "Make your store GDPR-compliant with cookie consent, customer data export on request, right-to-deletion workflows, and data processing agreements"
category: security-compliance
risk: critical
source: curated
date_added: "2026-03-12"
tags: [gdpr, privacy, consent, data-export, right-to-deletion, dpa, cookie-consent, personal-data]
triggers: ["gdpr compliance", "gdpr ecommerce", "data privacy", "right to deletion", "data export gdpr", "consent management", "cookie consent", "personal data ecommerce"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# GDPR E-commerce

## Overview

GDPR (General Data Protection Regulation) requires e-commerce stores serving EU customers to obtain informed consent for data processing, provide data portability (Article 20), support the right to erasure (Article 17), and maintain a lawful basis for every category of personal data processing. Non-compliance carries fines up to €20M or 4% of global annual turnover. This skill covers implementing consent management, building data export and deletion APIs, and auditing your data processing activities.

## When to Use This Skill

- When your store serves customers in the EU, EEA, or UK (UK GDPR)
- When adding analytics, marketing, or personalization tools that process personal data
- When a customer submits a Subject Access Request (SAR) or deletion request
- When reviewing third-party integrations for GDPR compliance
- When preparing for a data protection audit or DPA (Data Processing Agreement) review

## Core Instructions

1. **Map your data processing activities**

   Before writing code, document every category of personal data and its lawful basis. This Register of Processing Activities (RoPA) is required under Article 30 for businesses with 250+ employees, but recommended for all:

   | Data Category | Examples | Lawful Basis | Retention Period |
   |--------------|---------|--------------|-----------------|
   | Order data | Name, address, items, payment method last 4 | Contract (Art. 6(1)(b)) | 7 years (tax law) |
   | Account data | Email, password hash, preferences | Contract | Until account deletion + 30 days |
   | Analytics | Page views, session duration | Legitimate interest / Consent | 13 months (GA4 default) |
   | Marketing emails | Email, purchase history | Consent (Art. 6(1)(a)) | Until unsubscribe |
   | Fraud prevention | IP address, device fingerprint | Legitimate interest | 90 days |

2. **Implement a cookie consent banner**

   Use a Consent Management Platform (CMP) or build your own using the Consent API:

   ```typescript
   // lib/consent.ts
   export type ConsentCategory = 'necessary' | 'analytics' | 'marketing' | 'personalization';

   export interface ConsentState {
     necessary: true;      // Always true — cannot be rejected
     analytics: boolean;
     marketing: boolean;
     personalization: boolean;
     timestamp: number;
     version: string;      // Increment when consent text changes to re-prompt
   }

   const CONSENT_KEY = 'gdpr_consent_v1';
   const CURRENT_VERSION = '1.2';

   export function getConsent(): ConsentState | null {
     if (typeof window === 'undefined') return null;
     const stored = localStorage.getItem(CONSENT_KEY);
     if (!stored) return null;
     const parsed = JSON.parse(stored) as ConsentState;
     // Re-prompt if consent version changed
     if (parsed.version !== CURRENT_VERSION) return null;
     return parsed;
   }

   export function saveConsent(choices: Omit<ConsentState, 'necessary' | 'timestamp' | 'version'>) {
     const consent: ConsentState = {
       ...choices,
       necessary: true,
       timestamp: Date.now(),
       version: CURRENT_VERSION,
     };
     localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
     // Also persist server-side for logged-in users
     fetch('/api/consent', {method: 'POST', body: JSON.stringify(consent)});
     // Apply consent decisions to loaded tools
     applyConsent(consent);
   }

   function applyConsent(consent: ConsentState) {
     if (consent.analytics) {
       window.gtag?.('consent', 'update', {analytics_storage: 'granted'});
     }
     if (consent.marketing) {
       window.gtag?.('consent', 'update', {ad_storage: 'granted', ad_user_data: 'granted'});
     }
   }
   ```

   Initialize GA4 in consent-denied mode by default:
   ```html
   <!-- Always load gtag.js but default consent to denied -->
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('consent', 'default', {
       analytics_storage: 'denied',
       ad_storage: 'denied',
       ad_user_data: 'denied',
       ad_personalization: 'denied',
       wait_for_update: 500,
     });
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX');
   </script>
   ```

3. **Build a Subject Access Request (SAR) data export API**

   Under GDPR Article 20, customers have the right to receive all their personal data in a machine-readable format within 30 days:

   ```typescript
   // pages/api/gdpr/export.ts
   import {NextApiRequest, NextApiResponse} from 'next';
   import {requireAuth} from '@/lib/auth';

   export default async function handler(req: NextApiRequest, res: NextApiResponse) {
     if (req.method !== 'POST') return res.status(405).end();

     const customer = await requireAuth(req);
     if (!customer) return res.status(401).end();

     // Collect all personal data for this customer
     const [profile, orders, addresses, reviews, consent, sessions] = await Promise.all([
       db.customers.findById(customer.id),
       db.orders.findByCustomer(customer.id),
       db.addresses.findByCustomer(customer.id),
       db.reviews.findByCustomer(customer.id),
       db.consent.findByCustomer(customer.id),
       db.sessions.findByCustomer(customer.id),
     ]);

     const exportData = {
       exportedAt: new Date().toISOString(),
       customer: {
         id: profile.id,
         email: profile.email,
         name: profile.name,
         phone: profile.phone,
         createdAt: profile.createdAt,
       },
       orders: orders.map(o => ({
         id: o.id,
         number: o.number,
         status: o.status,
         totalAmount: o.totalAmount,
         currency: o.currency,
         placedAt: o.createdAt,
         lineItems: o.lineItems.map(li => ({product: li.productName, quantity: li.quantity, price: li.price})),
         shippingAddress: o.shippingAddress,
       })),
       addresses,
       reviews: reviews.map(r => ({id: r.id, productId: r.productId, rating: r.rating, body: r.body, createdAt: r.createdAt})),
       consentHistory: consent,
       loginSessions: sessions.map(s => ({ip: s.ip, userAgent: s.userAgent, createdAt: s.createdAt})),
     };

     // Log the export request for audit trail
     await db.gdprRequests.insert({customerId: customer.id, type: 'export', requestedAt: new Date()});

     res.setHeader('Content-Type', 'application/json');
     res.setHeader('Content-Disposition', `attachment; filename="my-data-${Date.now()}.json"`);
     return res.json(exportData);
   }
   ```

4. **Implement the right to erasure (Article 17)**

   Erasure must balance the right to deletion with legal retention obligations (e.g., tax records must be kept 7 years):

   ```typescript
   // lib/gdpr-deletion.ts
   export async function processErasureRequest(customerId: string) {
     // Verify there are no legal holds preventing deletion
     const pendingOrders = await db.orders.findPendingByCustomer(customerId);
     if (pendingOrders.length > 0) {
       throw new Error('Cannot delete account with pending orders');
     }

     // 1. Anonymize orders — retain for tax compliance but remove PII
     await db.orders.anonymizeByCustomer(customerId);
     // Replaces name, email, phone with "[DELETED]" and address with city/country only

     // 2. Delete marketing data
     await emailMarketing.unsubscribeAndDelete(customerId);

     // 3. Delete analytics identifiers
     await analytics.deleteUser(customerId);

     // 4. Delete account and profile
     await db.addresses.deleteByCustomer(customerId);
     await db.reviews.anonymizeByCustomer(customerId); // Keep review text, remove author
     await db.sessions.deleteByCustomer(customerId);
     await db.consent.deleteByCustomer(customerId);
     await db.customers.anonymize(customerId); // Replace email/name with UUID-based placeholders

     // 5. Log the deletion for compliance audit
     await db.gdprRequests.insert({
       customerId,
       type: 'erasure',
       requestedAt: new Date(),
       completedAt: new Date(),
     });

     // 6. Notify third-party processors
     await notifyThirdPartyProcessors(customerId);
   }

   async function notifyThirdPartyProcessors(customerId: string) {
     const customer = await db.customers.findById(customerId); // Get email before anonymization
     // Notify all sub-processors to delete their copy
     await Promise.allSettled([
       klaviyo.deleteProfile(customer.email),
       zendesk.deleteUser(customer.email),
       loyaltyPlatform.deleteAccount(customerId),
     ]);
   }
   ```

5. **Handle consent for email marketing**

   ```typescript
   // Only send marketing emails to customers who have explicitly opted in
   export async function sendMarketingEmail(email: string, template: string, variables: Record<string, string>) {
     const customer = await db.customers.findByEmail(email);
     if (!customer) return;

     const consent = await db.consent.findByCustomer(customer.id);
     const hasMarketingConsent = consent?.marketing === true;

     if (!hasMarketingConsent) {
       logger.info(`Skipping marketing email for ${email} — no consent`);
       return;
     }

     // Include unsubscribe link in every marketing email
     await sendGrid.send({
       to: email,
       templateId: template,
       dynamicTemplateData: {
         ...variables,
         unsubscribeUrl: `${BASE_URL}/unsubscribe?token=${generateUnsubscribeToken(customer.id)}`,
       },
     });
   }

   // One-click unsubscribe endpoint
   export async function handleUnsubscribe(req: NextApiRequest, res: NextApiResponse) {
     const {token} = req.query;
     const customerId = verifyUnsubscribeToken(token as string);
     if (!customerId) return res.status(400).send('Invalid token');

     await db.consent.update(customerId, {marketing: false, unsubscribedAt: new Date()});
     await emailMarketing.unsubscribe(customerId);

     return res.redirect('/unsubscribed');
   }
   ```

6. **Set up a GDPR request intake form and workflow**

   ```typescript
   // Self-service GDPR request portal
   // POST /api/gdpr/request
   export async function submitGdprRequest(req: NextApiRequest, res: NextApiResponse) {
     const {type, email} = req.body; // type: 'export' | 'erasure' | 'correction' | 'objection'

     // Verify identity before processing
     const verificationToken = crypto.randomUUID();
     await db.gdprRequests.create({
       email,
       type,
       verificationToken,
       status: 'pending_verification',
       requestedAt: new Date(),
       deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days per GDPR
     });

     await sendVerificationEmail(email, verificationToken);

     return res.json({message: 'Verification email sent. Please confirm your identity to proceed.'});
   }
   ```

## Examples

### GDPR-compliant cookie banner React component

```tsx
import {useState} from 'react';
import {getConsent, saveConsent} from '@/lib/consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(() => getConsent() === null);
  const [expanded, setExpanded] = useState(false);
  const [choices, setChoices] = useState({analytics: false, marketing: false, personalization: false});

  if (!visible) return null;

  const acceptAll = () => {
    saveConsent({analytics: true, marketing: true, personalization: true});
    setVisible(false);
  };

  const rejectAll = () => {
    saveConsent({analytics: false, marketing: false, personalization: false});
    setVisible(false);
  };

  const saveCustom = () => {
    saveConsent(choices);
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
      <p className="text-sm">We use cookies to improve your shopping experience. <button onClick={() => setExpanded(!expanded)} className="underline">Manage preferences</button></p>
      {expanded && (
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2"><input type="checkbox" checked disabled /> Necessary (always active)</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={choices.analytics} onChange={e => setChoices(c => ({...c, analytics: e.target.checked}))} /> Analytics</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={choices.marketing} onChange={e => setChoices(c => ({...c, marketing: e.target.checked}))} /> Marketing</label>
        </div>
      )}
      <div className="flex gap-2 mt-3">
        <button onClick={acceptAll} className="bg-black text-white px-4 py-2 rounded text-sm">Accept all</button>
        {expanded && <button onClick={saveCustom} className="border px-4 py-2 rounded text-sm">Save preferences</button>}
        <button onClick={rejectAll} className="border px-4 py-2 rounded text-sm">Reject all</button>
      </div>
    </div>
  );
}
```

### Database anonymization migration

```sql
-- Anonymize customer PII while preserving order records for tax compliance
UPDATE orders SET
  customer_name = 'Deleted User',
  customer_email = CONCAT('deleted_', id, '@deleted.invalid'),
  shipping_street = NULL,
  shipping_city = shipping_city,    -- Keep city for analytics
  shipping_country = shipping_country,
  customer_phone = NULL
WHERE customer_id = $1
  AND status IN ('completed', 'cancelled', 'refunded');

-- Anonymize the customer record itself
UPDATE customers SET
  email = CONCAT('deleted_', id, '@deleted.invalid'),
  first_name = 'Deleted',
  last_name = 'User',
  phone = NULL,
  date_of_birth = NULL,
  deleted_at = NOW()
WHERE id = $1;
```

## Best Practices

- **Default all consent to denied/false** — under GDPR, consent must be freely given, specific, informed, and unambiguous; pre-ticked boxes are not valid consent
- **Keep a consent audit trail** — log every consent grant, withdrawal, and change with a timestamp and the exact consent text version shown to the user
- **Respond to SARs within 30 days** — automate data exports so they are available instantly via a self-service portal; manual exports are slow and error-prone at scale
- **Conduct a Data Protection Impact Assessment (DPIA) for high-risk processing** — required for large-scale processing of special category data (health, finance) or systematic profiling
- **Sign Data Processing Agreements with all vendors** — Stripe, Klaviyo, Google Analytics, and any tool processing customer data on your behalf must have a DPA in place
- **Separate consent from account creation** — do not bundle marketing consent with T&C acceptance; each processing purpose needs a separate, granular consent
- **Test your deletion pipeline regularly** — run erasure requests on test accounts quarterly to verify that all data is deleted from the database, search indexes, analytics tools, and third-party processors

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Consent banner pre-ticking analytics boxes | GDPR requires opt-in consent; pre-ticked boxes are explicitly prohibited under Recital 32 |
| Deleting orders for tax compliance purposes | Orders must be retained for the statutory tax period (typically 5–7 years); anonymize PII within orders rather than deleting the order record |
| Forgetting to delete from search indexes | When you delete customer data from the database, also delete from Elasticsearch, Algolia, and any analytics warehouses |
| Email marketing without consent documentation | Store the IP address, timestamp, consent text version, and method (checkbox, sign-up form) for every marketing opt-in |
| Cookie banner blocking server-side rendering | Implement consent client-side only; the banner cannot use cookies itself before consent; use CSS to prevent layout shift |

## Related Skills

- @data-retention-policies
- @account-security
- @analytics-integration
- @fraud-detection
