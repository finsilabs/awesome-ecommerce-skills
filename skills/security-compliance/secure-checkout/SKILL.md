---
name: secure-checkout
description: "Harden your checkout against attacks with HTTPS enforcement, Content Security Policy headers, input sanitization, and card data tokenization"
category: security-compliance
risk: critical
source: curated
date_added: "2026-03-12"
tags: [security, tls, csp, tokenization, xss, pci-dss, checkout-security, content-security-policy, https]
triggers: ["secure checkout", "checkout security", "csp headers", "tls checkout", "xss prevention payment", "pci dss checkout", "tokenization"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Secure Checkout

## Overview

Payment pages are the highest-value target for attackers — a single XSS vulnerability can lead to Magecart-style card skimming attacks that steal thousands of card numbers. Securing checkout requires enforcing TLS everywhere, implementing strict Content Security Policies (CSP) to prevent script injection, using payment tokenization to minimize PCI scope, and removing non-essential third-party scripts from payment pages. The good news: Shopify and BigCommerce handle most of this infrastructure automatically. WooCommerce merchants need to configure hosting and install security plugins. Custom storefronts require implementing all of these controls from scratch.

## When to Use This Skill

- When building or auditing a checkout flow that accepts payment information
- When a penetration test or security scan surfaces XSS, CSP, or header vulnerabilities on payment pages
- When reviewing third-party script loading on pages that have access to payment form context
- When preparing for PCI DSS SAQ A-EP or SAQ D compliance assessment
- When migrating from a hosted payment page to a custom UI (increases PCI scope)

## Core Instructions

### Step 1: Understand your checkout security responsibility by platform

| Platform | HTTPS / TLS | CSP Headers | Payment Tokenization | Third-Party Script Control |
|----------|-------------|-------------|---------------------|---------------------------|
| **Shopify** | Automatic — Shopify provisions and renews SSL certificates | Shopify manages checkout CSP; your theme pages need review | Shopify Payments and all gateway integrations use tokenization | Use Shopify's Script Manager and Customer Events to control what loads on checkout |
| **WooCommerce** | Your hosting responsibility — install SSL from Let's Encrypt or your host | Your server responsibility — configure via hosting or plugin | Determined by your gateway choice (Stripe Elements = SAQ A-EP) | WordPress plugin and theme scripts load globally; use conditional loading to exclude checkout |
| **BigCommerce** | Automatic — BigCommerce provisions SSL and enforces HTTPS | BigCommerce manages checkout CSP for hosted checkout | Handled by your payment gateway choice through BigCommerce checkout | BigCommerce Script Manager controls third-party script placement |
| **Custom / Headless** | Your infrastructure responsibility | Your application responsibility — implement per-request CSP with nonces | Implement with Stripe Elements or Braintree Drop-in UI | Full control and full responsibility — must implement explicitly |

### Step 2: Platform-specific checkout security setup

---

#### Shopify

Shopify's hosted checkout is one of the most secure available — it runs on Shopify's own domain (`checkout.shopify.com` or your custom domain with SSL), uses Shopify Payments tokenization, and is protected by Shopify's CDN and WAF.

**HTTPS enforcement:**
- Shopify automatically provisions free SSL certificates for all stores and custom domains
- Go to **Online Store → Domains** to verify SSL is active on your custom domain
- Enable **Redirect all traffic to HTTPS** under **Online Store → Preferences → Checkout and accounts**

**Third-party scripts on checkout:**
Shopify's checkout extension model (Checkout Extensibility) limits what can run on the checkout page — this is by design for PCI compliance.

1. Go to **Settings → Customer events** to manage tracking pixels and scripts
2. Scripts added via Customer Events run in a sandboxed context and cannot access payment data
3. **Do not inject JavaScript into the checkout page via theme code or ScriptTag API** — this is prohibited for SAQ A compliance and may be blocked by Shopify

**Theme security review:**
1. Go to **Online Store → Themes → Edit code**
2. Search your theme for any references to `document.cookie`, `localStorage`, or `fetch` on cart/checkout pages — these are red flags if you did not add them intentionally
3. Review installed apps: go to **Settings → Apps and sales channels** and remove apps you no longer use; each installed app can inject scripts into your storefront

**Admin account security (reduces attack surface):**
1. Go to **Settings → Users and permissions**
2. Require 2FA for all staff accounts — a compromised admin account is the most common way attackers modify checkout behavior
3. Limit staff access to only the permissions needed for their role

---

#### WooCommerce

WooCommerce checkout security depends almost entirely on your hosting configuration and payment gateway. Your hosting provider is responsible for TLS, and the gateway you choose determines whether card data ever touches your server.

**Step 1 — Force HTTPS on your store:**
1. In your WordPress hosting control panel (cPanel, Kinsta, WP Engine), enable free SSL via Let's Encrypt or your host's built-in certificate
2. Install **Really Simple SSL** (free plugin) — it forces HTTPS sitewide, updates internal links, and fixes mixed content warnings in one step
3. After activating, verify at **Settings → SSL** that the redirect is active and no mixed content warnings appear

**Step 2 — Choose a payment gateway that keeps card data off your server:**
- **Stripe (WooCommerce Stripe Payment Gateway)** — uses Stripe Elements; card data entered in a Stripe iframe never touches your server (SAQ A-EP)
- **Stripe Checkout (redirect)** — customer is redirected to Stripe's hosted page; even simpler (SAQ A)
- **PayPal Standard** — redirect to PayPal; SAQ A
- Avoid any gateway that requires your server to receive raw card numbers

**Step 3 — Install security plugins:**
1. Install **Wordfence Security** (free): go to **Wordfence → Firewall** and set protection level to "Extended Protection" — this adds a WAF rule at the WordPress application layer
2. Install **WP Activity Log** (~$99/year) or **Simple History** (free): logs all admin actions including order edits, plugin installs, and setting changes
3. Go to **Settings → Discussion** — disable comments on checkout/cart pages if enabled (reduces XSS attack surface)

**Step 4 — Remove scripts from checkout pages:**
WooCommerce loads all active plugins on every page by default. Use **Asset CleanUp Pro** ($25 one-time) or add conditional PHP to prevent non-essential scripts from loading on checkout:

Go to **WooCommerce → Settings → Advanced** and verify:
- Debug logging is **off** (`WP_DEBUG` must be `false` in `wp-config.php` in production)
- No custom code logs order data or payment details

**Step 5 — Configure SSL security headers via hosting or plugin:**
1. If using Nginx hosting (Kinsta, WP Engine, Nexcess), ask your host to add HSTS and X-Frame-Options headers — these are commonly pre-configured on managed WordPress hosts
2. Alternatively, install **HTTP Headers** (free plugin) to add security headers via WordPress without editing server config

---

#### BigCommerce

BigCommerce's hosted checkout is PCI-DSS Level 1 certified and handles TLS, CSP, and payment tokenization automatically when you use a supported gateway.

**HTTPS enforcement:**
- BigCommerce automatically provisions and renews SSL for all stores
- Go to **Store Setup → Store Settings → Security** — verify **Force secure checkout** is enabled
- Go to **Storefront → SSL Certificate** to confirm your custom domain has SSL active

**Controlling third-party scripts:**
1. Go to **Storefront → Script Manager**
2. Review all installed scripts — for each script, check the **Placement** setting
3. For scripts that do not need to run on checkout (analytics, advertising, chat), set **Placement** to exclude checkout pages
4. Scripts in Script Manager run in the storefront context; BigCommerce's checkout itself is protected by a separate, more restrictive CSP

**Checkout payment security:**
- BigCommerce Payments and certified payment gateways (Stripe, Braintree, PayPal) use tokenization — card data never touches BigCommerce's or your application servers
- Go to **Store Setup → Payments** and review your active gateway — ensure you are not using a gateway that uses "direct post" to your server

**Admin account security:**
1. Go to **Account Settings → Users**
2. Review all user accounts — remove former employees and contractors
3. Ensure all active accounts have **2FA enabled** under their individual account security settings
4. Go to **Settings → Advanced Settings → API Accounts** — review OAuth credentials; revoke any unused API tokens

---

#### Custom / Headless

For custom storefronts, you implement all checkout security controls. The three most critical are: payment tokenization (so your server never sees card numbers), strict CSP on payment pages (to prevent Magecart injection), and HTTPS with security headers.

**Payment tokenization with Stripe Elements (SAQ A-EP):**

```typescript
// Client-side: Stripe handles card data in an iframe — your code never sees card numbers
const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const elements = stripe.elements({ clientSecret });
const paymentElement = elements.create('payment');
paymentElement.mount('#payment-element');

// On submit: Stripe handles card capture; your server receives only a paymentIntentId
const { error, paymentIntent } = await stripe.confirmPayment({
  elements,
  confirmParams: { return_url: `${window.location.origin}/order-confirmation` },
});
// Your server confirms via paymentIntentId — never a card number
```

**HTTPS and security headers (Next.js example):**

```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        ],
      },
      {
        // No caching on checkout; no indexing by search engines
        source: '/checkout(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
    ];
  },
};
```

**Content Security Policy with per-request nonces (prevents Magecart):**

```typescript
// middleware.ts — generate a new nonce per request; static nonces can be bypassed
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com`,
    `style-src 'self' 'nonce-${nonce}'`,
    `frame-src https://js.stripe.com https://hooks.stripe.com`,
    `connect-src 'self' https://api.stripe.com`,
    `img-src 'self' data: https:`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `upgrade-insecure-requests`,
    `report-uri /api/csp-report`,
  ].join('; ');

  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('x-nonce', nonce); // Pass to layout for script nonce attributes
  return response;
}
```

**CSP violation monitoring:**

```typescript
// app/api/csp-report/route.ts — log violations; alert on checkout page violations
export async function POST(req: NextRequest) {
  const body = await req.json();
  const violation = body['csp-report'];

  await logger.warn('CSP Violation', {
    documentUri: violation['document-uri'],
    violatedDirective: violation['violated-directive'],
    blockedUri: violation['blocked-uri'],
  });

  // A CSP violation on a payment page may indicate an active Magecart attack
  if (violation['document-uri']?.includes('/checkout')) {
    await alertSecurityTeam('CSP violation on checkout page', violation);
  }

  return new NextResponse(null, { status: 204 });
}
```

**Server-side input validation with Zod:**

```typescript
import { z } from 'zod';

const checkoutSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(200).regex(/^[\p{L}\p{M}\s\-'.]+$/u),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2), // ISO 3166-1 alpha-2
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = checkoutSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ errors: result.error.flatten() }, { status: 400 });
  }
  // Proceed with validated data only
}
```

## Best Practices

- **Treat checkout as a separate security zone** — apply the most restrictive CSP, disable all non-essential third-party scripts, and treat any CSP violation on a payment page as a potential Magecart incident
- **Never inline JavaScript on payment pages** — use nonce-based CSP and external scripts; adding `'unsafe-inline'` to `script-src` defeats the entire purpose of CSP
- **Remove non-essential apps and plugins** — every installed Shopify app, WordPress plugin, or BigCommerce script is a potential attack surface; remove anything your store does not actively use
- **Add Subresource Integrity (SRI) to CDN scripts** — SRI ensures the script content has not been tampered with even if the CDN is compromised; generate with `openssl dgst -sha256 -binary script.js | openssl base64`
- **Enable WAF protection at the edge** — Cloudflare WAF (free plan) or your hosting provider's WAF blocks OWASP Top 10 attacks before they reach your application
- **Scan dependencies for vulnerabilities in CI** — run `npm audit` and use Snyk or Dependabot; a compromised npm package in your checkout bundle is as dangerous as a Magecart injection

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| CSP breaks Stripe Elements iframes | Add `https://js.stripe.com` and `https://hooks.stripe.com` to `frame-src`; check Stripe's CSP documentation for the current complete allowlist |
| `'unsafe-inline'` added to unblock styles | Use nonces for inline styles instead; `'unsafe-inline'` invalidates CSP protection for that directive entirely |
| TLS certificate expired | Use Let's Encrypt with auto-renewal (Certbot) or a managed certificate from your CDN; Shopify and BigCommerce auto-renew — only WooCommerce/custom stores require manual renewal |
| Analytics scripts loading on checkout pages | Add a conditional check in your analytics initialization that skips loading on `/checkout` routes; on Shopify use Customer Events placement settings |
| Third-party chat widget with access to payment fields | Remove chat widgets from checkout pages entirely; no legitimate support use case requires reading payment form values |

## Related Skills

- @fraud-detection
- @account-security
- @bot-protection
- @pci-dss-compliance
- @gdpr-ecommerce
