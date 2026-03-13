---
name: pci-dss-compliance
description: "Meet PCI-DSS payment security requirements by scoping your environment correctly, selecting the right SAQ, and implementing required controls"
category: security-compliance
risk: critical
source: curated
date_added: "2026-03-12"
tags: [pci-dss, security, compliance, payments, encryption, tokenization, saq]
triggers: ["implement PCI compliance", "PCI-DSS requirements", "secure payment data", "PCI SAQ selection"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# PCI-DSS Compliance

## Overview

PCI-DSS (Payment Card Industry Data Security Standard) applies to any merchant that accepts card payments. The scope and complexity of your compliance obligations depend almost entirely on how card data flows through your systems. Merchants who use hosted payment forms (Shopify Payments, Stripe Checkout, PayPal hosted) can qualify for the simplest assessment (SAQ A, ~22 controls). Merchants who run custom payment pages face the most complex assessment (SAQ D, ~330 controls). The single most important PCI decision is: choose a payment method that minimizes your scope.

## When to Use This Skill

- When accepting credit card payments and need to determine your PCI compliance scope
- When selecting between SAQ A, SAQ A-EP, SAQ D, or other questionnaire types
- When implementing tokenization to reduce PCI scope
- When setting up logging, monitoring, and alerting infrastructure for PCI audit readiness
- When preparing for a QSA (Qualified Security Assessor) audit or completing an SAQ

## Core Instructions

### Step 1: Determine your PCI scope based on payment method

The most important decision in PCI compliance is how card data flows through your environment:

| Integration Method | SAQ Type | Approx. Controls | Who This Applies To |
|-------------------|----------|-----------------|---------------------|
| Fully hosted checkout (Shopify Payments, Stripe Checkout, PayPal hosted) | **SAQ A** | ~22 | Card data never touches your server; customer is redirected to the processor's payment page |
| JavaScript tokenization on your page (Stripe Elements, Braintree Drop-in) | **SAQ A-EP** | ~191 | Card data is entered in an iframe on your page; your server never sees raw card numbers |
| Your server touches card data | **SAQ D** | ~330 | Card data passes through your application server |

**Recommendation: Always choose SAQ A when possible.** Use Shopify Payments, Stripe Checkout, or a PayPal-hosted checkout. Moving from SAQ D to SAQ A reduces your annual compliance effort by ~85%.

### Step 2: Platform-specific PCI setup

---

#### Shopify

Shopify is a PCI-DSS Level 1 Service Provider. When you use Shopify Payments or any payment gateway through Shopify's checkout, Shopify handles PCI compliance for the payment processing environment.

**Your PCI scope as a Shopify merchant:**
- Using Shopify's hosted checkout and Shopify Payments: **SAQ A** — Shopify handles everything
- You are responsible only for: ensuring your Shopify admin access is secured (strong passwords, 2FA), not storing cardholder data in apps or spreadsheets, and vetting third-party apps for security

**Completing your SAQ A on Shopify:**
1. Download the SAQ A from the PCI Security Standards Council (pcisecuritystandards.org)
2. Shopify's merchant PCI compliance documentation is at help.shopify.com/en/manual/payments/pci-compliance
3. Shopify provides an Attestation of Compliance (AoC) for their platform — use this as evidence for your acquirer

**Key controls you still own:**
- Admin account security: 2FA for all Shopify staff accounts (Settings → Users → require 2FA)
- Not storing card numbers anywhere outside Shopify (no spreadsheets, no third-party databases)
- Vetting installed apps for data security practices

---

#### WooCommerce

WooCommerce itself is not PCI-compliant — compliance depends on your hosting, payment gateway, and implementation choices.

**Minimize scope: use a hosted payment gateway:**

Option A — **Stripe Checkout (hosted redirect)** → SAQ A
```php
// Use WooCommerce Stripe Gateway in "Stripe Checkout" mode
// In WooCommerce → Settings → Payments → Stripe → Stripe Checkout: enable
// Customer is redirected to stripe.com for payment; SAQ A applies
```

Option B — **Stripe Elements in WooCommerce** → SAQ A-EP
- The official WooCommerce Stripe plugin uses Stripe Elements by default
- Card data is captured in a Stripe iframe; your server receives only a payment token
- This is SAQ A-EP (more controls than SAQ A but far fewer than SAQ D)

**WooCommerce hosting requirements for SAQ A-EP:**
Your web hosting must meet minimum PCI requirements:
1. **SSL/TLS**: Ensure your hosting provider uses TLS 1.2+ and an up-to-date certificate
2. **Patching**: Keep WordPress, WooCommerce, plugins, and PHP up to date
3. **Managed hosting**: WP Engine, Nexcess, and Kinsta are PCI-aware managed hosts with relevant controls
4. **Wordfence**: Install Wordfence Security for malware scanning and WAF protection (Requirement 5, 6)

**What to verify for WooCommerce PCI:**
- No credit card numbers logged in WooCommerce order notes or custom fields
- WooCommerce debug logging does not capture payment data (disable debug logging in production)
- All admin accounts have strong, unique passwords and 2FA
- All plugins updated within 30 days of available security patches

---

#### BigCommerce

BigCommerce is a PCI-DSS Level 1 certified platform. Using BigCommerce's hosted checkout and supported payment gateways puts you in SAQ A territory.

**Completing compliance on BigCommerce:**
- BigCommerce provides an AoC for their platform infrastructure
- For merchants using BigCommerce Payments or a supported payment gateway through BigCommerce checkout: SAQ A applies
- For custom payment integrations or custom checkout pages: the scope increases; consult a QSA

**Key BigCommerce settings:**
1. Go to **Store Settings → Security** — ensure HTTPS is enforced on all pages
2. Go to **Account Settings → Users** — ensure all admin accounts have unique IDs and strong passwords
3. Enable 2FA for admin accounts under account security settings
4. Review installed apps — only grant apps the minimum permissions they need

---

#### Custom / Headless

For custom storefronts, your PCI scope is determined by how you integrate payment processing. Use Stripe Elements or Braintree Drop-in UI to stay in SAQ A-EP territory.

**SAQ A-EP implementation with Stripe Elements:**

```typescript
// Client-side: Stripe handles card data in an iframe — your code never sees card numbers
const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const elements = stripe.elements({ clientSecret });
const paymentElement = elements.create('payment');
paymentElement.mount('#payment-element');

// On submit — Stripe creates a PaymentMethod on their servers
const { error, paymentIntent } = await stripe.confirmPayment({
  elements,
  confirmParams: { return_url: `${window.location.origin}/order-confirmation` },
});
// Your server never receives a card number — only a paymentMethodId or paymentIntentId
```

**Key controls for SAQ A-EP (custom storefronts):**

```nginx
# Requirement 4: TLS 1.2+ only, strong cipher suites
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

**Content Security Policy for payment pages (Requirement 6.4.3 in PCI-DSS v4.0):**

```typescript
// Strict CSP on checkout pages — only authorized scripts allowed
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'nonce-${nonce}' https://js.stripe.com`,
  `frame-src https://js.stripe.com https://hooks.stripe.com`,
  `connect-src 'self' https://api.stripe.com`,
  `object-src 'none'`,
].join('; ');
response.headers.set('Content-Security-Policy', csp);
```

**Audit logging (Requirement 10):**

```typescript
// Log every authentication event, admin action, and access to payment data
interface AuditEntry {
  timestamp: string;
  userId: string;
  userIp: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure';
}
// Ship logs to an immutable store: CloudWatch Logs, Datadog, or S3 with Object Lock
// Requirement 10.7: Retain logs for 12 months; 3 months immediately available
```

**PCI-DSS controls checklist:**

| Requirement | Key Engineering Task |
|-------------|---------------------|
| Req 3: Protect stored data | No raw card numbers stored; use Stripe/Braintree tokens only |
| Req 4: Encrypt transmissions | TLS 1.2+; HSTS headers; no mixed content |
| Req 6: Secure development | Dependency scanning (npm audit, Snyk) in CI; SAST; script inventory on payment pages |
| Req 7–8: Access control | Role-based access; unique IDs; MFA for admin; password policy |
| Req 10: Logging | All auth events, admin actions, and CDE access logged with user ID, timestamp, IP |
| Req 11: Vulnerability management | Quarterly external scans by ASV; annual penetration test |

## Best Practices

- **Minimize your Cardholder Data Environment (CDE)** — use hosted payment forms to qualify for SAQ A and reduce from ~330 controls to ~22; this is the highest-leverage PCI decision
- **Never store raw card numbers** — always use tokenization; if you never see card data, most PCI requirements don't apply to your servers
- **Ship logs to immutable storage** — use append-only log destinations (S3 with Object Lock, CloudWatch Logs) so attackers cannot tamper with audit trails
- **Enforce MFA for all admin access** — PCI-DSS v4.0 Requirement 8.4.2 mandates MFA for all access to the CDE
- **Automate vulnerability scanning** — run dependency audits in CI/CD and schedule quarterly ASV scans; manual processes are consistently missed
- **Document your script inventory** — PCI-DSS v4.0 Requirement 6.4.3 requires a documented inventory of all scripts on payment pages with business justification

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Selected SAQ A but using Stripe Elements | Stripe Elements (JavaScript on your page) is SAQ A-EP, not SAQ A; only a fully hosted redirect (Stripe Checkout) qualifies for SAQ A |
| Debug logging enabled in production captures payment data | Disable WordPress/WooCommerce debug logging in production; WC_DEBUG and WP_DEBUG must be false |
| TLS 1.0/1.1 still enabled on load balancer | Verify with `nmap --script ssl-enum-ciphers -p 443 yourstore.com`; disable TLS 1.0/1.1 in your load balancer and CDN |
| Third-party scripts on checkout page not inventoried | PCI v4.0 requires a documented inventory; audit with browser dev tools; remove non-essential scripts from payment pages |
| No incident response plan | PCI Requirement 12.10.1 requires a documented IR plan tested annually; create a basic one even if you've never had an incident |

## Related Skills

- @secure-checkout
- @fraud-detection
- @account-security
- @financial-audit-trail
