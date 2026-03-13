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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# GDPR E-commerce

## Overview

GDPR (General Data Protection Regulation) requires e-commerce stores serving EU/UK customers to obtain informed consent for data processing, provide data portability (Article 20), support the right to erasure (Article 17), and maintain a lawful basis for every category of personal data processing. Non-compliance carries fines up to €20M or 4% of global annual turnover. All major platforms have GDPR tools built in; the main gaps are cookie consent management and handling Subject Access Requests (SARs).

## When to Use This Skill

- When your store serves customers in the EU, EEA, or UK (UK GDPR)
- When adding analytics, marketing, or personalization tools that process personal data
- When a customer submits a Subject Access Request (SAR) or deletion request
- When reviewing third-party integrations for GDPR compliance
- When preparing for a data protection audit or DPA (Data Processing Agreement) review

## Core Instructions

### Step 1: Map your data processing activities

Before configuring any tool, document every category of personal data and its lawful basis. This Register of Processing Activities (RoPA) is required under Article 30 for large processors and recommended for all:

| Data Category | Lawful Basis | Retention Period |
|--------------|--------------|-----------------|
| Order data (name, address, items) | Contract (Art. 6(1)(b)) | 7 years (tax law) |
| Account data (email, password hash) | Contract | Until account deletion + 30 days |
| Analytics (page views, session duration) | Legitimate interest / Consent | 13 months |
| Marketing emails | Consent (Art. 6(1)(a)) | Until unsubscribe |
| Fraud prevention (IP, device fingerprint) | Legitimate interest | 90 days |

### Step 2: Implement cookie consent

---

#### Shopify

Shopify includes a built-in cookie consent banner via the **Privacy & Compliance** app (free):

1. Go to **Apps → Shopify Privacy & Compliance** (or search in the App Store)
2. Configure the banner text, position, and which cookie categories to ask about
3. The app integrates with Shopify's Consent API so that analytics and marketing pixels respect customer choices
4. Alternatively, install a dedicated CMP (Consent Management Platform) like **CookieYes** or **Cookiebot** — both have Shopify app integrations

**Enabling consent-aware analytics:**
- For Google Analytics / GA4: use Shopify's Customer Events (Settings → Customer events) which respects consent automatically
- For custom Pixel tracking: use the Shopify Customer Privacy API to check consent before loading tracking code

---

#### WooCommerce

WooCommerce includes basic GDPR features since version 3.4, but cookie consent requires a dedicated plugin.

**Install GDPR Cookie Consent (by WebToffee) — free/premium:**
1. Install from the WordPress plugin directory
2. Go to **Cookie Law Info → Settings**:
   - Configure the banner text, colors, and button labels
   - Set up cookie categories: Necessary (always on), Analytics, Marketing
   - Map your installed plugins/scripts to categories (Google Analytics → Analytics, Facebook Pixel → Marketing)
3. The plugin blocks third-party scripts until consent is given

**WordPress native GDPR tools:**
- Go to **Settings → Privacy** to configure your privacy policy page
- Go to **Settings → Privacy → Data Erasure Requests** — customers can submit erasure requests from My Account; WordPress generates a confirmation email and you process it manually

---

#### BigCommerce

Install **CookieYes** or **Cookiebot** from the BigCommerce App Marketplace. Both provide:
- A GDPR-compliant consent banner
- Script blocking until consent is given
- Consent logging for audit purposes

BigCommerce also supports custom cookie consent via the **Script Manager** (Storefront → Script Manager) — you can add a Cookiebot or CookieYes script globally.

### Step 3: Handle Subject Access Requests (SARs)

Under GDPR Article 20, customers have the right to receive all their personal data in a machine-readable format within 30 days.

---

#### Shopify

1. When a customer requests their data, go to their **Customer profile** in Shopify admin
2. Click **Request data** — Shopify generates a data export file containing:
   - Customer profile data
   - Order history
   - Addresses
3. Shopify emails the download link directly to the customer

**Customer privacy settings:**
1. Go to **Settings → Customer privacy**
2. Configure data request webhooks — Shopify sends `customers/data_request` webhooks to all installed apps when a customer requests their data, so apps can also provide their data

---

#### WooCommerce

WordPress includes a built-in personal data export tool:
1. Go to **Tools → Export Personal Data**
2. Enter the customer's email address and click **Send Request**
3. The customer receives a confirmation email; once they confirm, you see the request in the admin
4. Click **Generate export file** — WordPress collects data from WooCommerce and all plugins with data exporters
5. The customer receives a zip file with their data in a machine-readable format

---

#### BigCommerce

BigCommerce does not have a built-in SAR tool. To handle data requests:
1. Use the **BigCommerce Customers API** and **Orders API** to extract all data for a customer
2. Package the data as a JSON or CSV export
3. Deliver to the customer within 30 days of the request

Consider building or using a third-party service like **Transcend** or **Mine** to automate data request handling.

### Step 4: Handle Right to Erasure (Article 17)

The right to erasure must balance deletion with legal retention obligations (tax records must be kept 5–7 years).

---

#### Shopify

1. Open the customer's profile in Shopify admin
2. Click **More actions → Erase personal data**
3. Shopify anonymizes the customer's PII (replaces name, email, phone with anonymized placeholders) while keeping the order records for accounting
4. Shopify sends `customers/redact` webhooks to all installed apps

---

#### WooCommerce

1. Go to **Tools → Erase Personal Data**
2. Enter the customer's email and send them a verification request
3. Once they confirm, WordPress and WooCommerce anonymize:
   - Customer account (email replaced with anonymized placeholder)
   - Orders (customer name, billing/shipping details replaced with "Deleted User" / anonymized)
4. Order financial records are preserved

---

#### BigCommerce

Use the **Customers API** to update the customer record, replacing PII with anonymized placeholders, and delete the customer account. The order records remain (financial data preserved) with the customer references removed.

### Step 5: Ensure lawful marketing consent

Only send marketing emails to customers who have explicitly opted in. Pre-ticked boxes are prohibited under GDPR.

**On all platforms:**
1. Add a clearly labeled, unchecked checkbox to the registration form and checkout: "Yes, I'd like to receive marketing emails"
2. Record the consent timestamp, IP address, and form version in your database (or in your email platform)
3. Include a one-click unsubscribe link in every marketing email
4. Process unsubscribes immediately — within 10 business days is the standard requirement

**Email platforms:**
- **Klaviyo**: tracks consent separately; use Klaviyo's built-in opt-in forms and consent properties
- **Mailchimp**: uses double opt-in by default (recommended for GDPR); configure under audience settings
- **Omnisend**: has GDPR mode with consent recording built in

### Step 6: Sign Data Processing Agreements (DPAs)

Every third-party tool that processes customer data on your behalf must have a DPA in place:
1. **Stripe**: DPA available at stripe.com/legal/dpa
2. **Klaviyo**: DPA available in Klaviyo account settings under **Account → Privacy**
3. **Google Analytics**: accept Google's DPA in the GA4 admin
4. **Shopify**: Shopify is a data processor for your customer data; their DPA is in their legal agreements
5. For each vendor, find the DPA in their privacy/legal documentation and complete it

## Best Practices

- **Default all consent to denied** — under GDPR, consent must be freely given and unambiguous; pre-ticked boxes are explicitly prohibited
- **Keep a consent audit trail** — log every consent grant, withdrawal, and change with timestamp and the exact consent text version shown to the user
- **Respond to SARs within 30 days** — automate data exports so they're available quickly via a self-service portal; manual exports are slow and error-prone at scale
- **Sign DPAs with all vendors before using their service** — Stripe, Klaviyo, Google Analytics — any tool processing customer data must have a DPA
- **Separate consent from account creation** — do not bundle marketing consent with T&Cs acceptance; each processing purpose needs a separate, granular consent
- **Test your deletion pipeline regularly** — run erasure requests on test accounts quarterly to verify all data is deleted from the database, search indexes, analytics tools, and third-party processors

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Cookie banner pre-ticking analytics boxes | GDPR requires opt-in consent; pre-ticked boxes are explicitly prohibited under Recital 32 |
| Deleting orders when customer requests erasure | Orders must be retained for the statutory tax period (5–7 years); anonymize PII within orders rather than deleting the order record |
| Forgetting to delete from email platform and analytics | Shopify's `customers/redact` webhook notifies apps; ensure your Klaviyo, Mailchimp, and analytics tools also receive the deletion request |
| Marketing emails sent without consent documentation | Store the IP address, timestamp, consent text version, and method (checkbox, sign-up form) for every marketing opt-in |
| Missing DPA with a key vendor | Audit your vendor list annually; Google, Stripe, Klaviyo, and your hosting provider all need DPAs if they process EU customer data |

## Related Skills

- @data-retention-policies
- @account-security
- @analytics-integration
- @fraud-detection
