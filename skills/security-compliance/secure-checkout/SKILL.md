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
platforms: [platform-agnostic]
difficulty: intermediate
---

# Secure Checkout

## Overview

Payment pages are the highest-value target for attackers — a single XSS vulnerability can lead to Magecart-style card skimming attacks that steal thousands of card numbers. Securing checkout requires enforcing TLS everywhere, implementing strict Content Security Policies (CSP) to prevent script injection, using payment tokenization to minimize PCI scope, and applying defense-in-depth headers that block the most common web attacks. This skill covers the full security stack for payment pages.

## When to Use This Skill

- When building or auditing a custom checkout flow that accepts payment information
- When a penetration test or security scan surfaces XSS, CSP, or header vulnerabilities on payment pages
- When migrating from a hosted payment page to a custom UI (increases PCI scope)
- When reviewing third-party script loading on pages that have access to payment form context
- When preparing for PCI DSS SAQ A-EP or SAQ D compliance assessment

## Core Instructions

1. **Enforce HTTPS and HSTS**

   Payment pages must only be served over HTTPS. Add HTTP Strict Transport Security (HSTS) to prevent downgrade attacks:

   ```typescript
   // next.config.ts — security headers applied to all routes
   const securityHeaders = [
     // Force HTTPS for 2 years, include subdomains, allow preloading
     {key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload'},
     // Prevent clickjacking
     {key: 'X-Frame-Options', value: 'DENY'},
     // Prevent MIME-type sniffing
     {key: 'X-Content-Type-Options', value: 'nosniff'},
     // Control referrer information
     {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
     // Disable browser features not needed on checkout
     {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()'},
   ];

   export default {
     async headers() {
       return [{source: '/(.*)', headers: securityHeaders}];
     },
   };
   ```

   Submit your domain to the HSTS Preload list at https://hstspreload.org after confirming all subdomains support HTTPS.

2. **Implement a strict Content Security Policy**

   CSP is the most effective defense against Magecart/XSS card skimming. Start with a strict policy on checkout pages:

   ```typescript
   // lib/csp.ts
   export function generateCSP(nonce: string): string {
     const isDev = process.env.NODE_ENV === 'development';

     const directives: Record<string, string[]> = {
       'default-src': ["'self'"],
       'script-src': [
         "'self'",
         `'nonce-${nonce}'`,                    // Only nonce-whitelisted scripts
         'https://js.stripe.com',               // Stripe.js (load from CDN, never bundle)
         'https://challenges.cloudflare.com',   // Cloudflare Turnstile
         ...(isDev ? ["'unsafe-eval'"] : []),   // Next.js hot reload in dev only
       ],
       'style-src': ["'self'", `'nonce-${nonce}'`, 'https://fonts.googleapis.com'],
       'font-src': ["'self'", 'https://fonts.gstatic.com'],
       'img-src': ["'self'", 'data:', 'https:', 'blob:'],
       'connect-src': [
         "'self'",
         'https://api.stripe.com',
         'https://r.stripe.com',
         process.env.NEXT_PUBLIC_API_URL!,
       ],
       'frame-src': [
         'https://js.stripe.com',               // Stripe Elements iframe
         'https://hooks.stripe.com',
         'https://challenges.cloudflare.com',
       ],
       'object-src': ["'none'"],
       'base-uri': ["'self'"],
       'form-action': ["'self'"],
       'upgrade-insecure-requests': [],
     };

     return Object.entries(directives)
       .map(([key, values]) => `${key} ${values.join(' ')}`.trim())
       .join('; ');
   }

   // Apply as a response header per request (nonce must be unique per request)
   // In Next.js middleware:
   export function middleware(request: NextRequest) {
     const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
     const csp = generateCSP(nonce);
     const response = NextResponse.next();
     response.headers.set('Content-Security-Policy', csp);
     response.headers.set('x-nonce', nonce); // Pass nonce to layout for script tags
     return response;
   }
   ```

3. **Use payment tokenization to minimize PCI scope**

   Never handle raw card numbers in your application. Use Stripe Elements, Braintree Drop-in UI, or Adyen Web Components — these iframe the card input fields, keeping raw card data off your domain entirely:

   ```typescript
   // The correct pattern: Stripe handles all card data in an iframe
   // Your server only ever sees a paymentMethodId (opaque token)
   const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
   const elements = stripe.elements({clientSecret});

   const cardElement = elements.create('card', {
     style: {
       base: {
         fontSize: '16px',
         color: '#32325d',
         '::placeholder': {color: '#aab7c4'},
       },
     },
   });
   cardElement.mount('#card-element');

   // On submit: stripe creates a PaymentMethod on their servers
   const {paymentMethod, error} = await stripe.createPaymentMethod({
     type: 'card',
     card: cardElement,
   });
   // paymentMethod.id is the token your server uses — never the card number
   ```

   **What you must NEVER do:**
   ```typescript
   // NEVER collect card data in your own input fields
   // NEVER send card numbers to your server
   // NEVER log payment method details
   // NEVER store CVV under any circumstances (PCI DSS prohibition)
   ```

4. **Implement output encoding and XSS prevention**

   ```typescript
   // Never interpolate user input directly into HTML
   // BAD — vulnerable to XSS
   const html = `<div>Thank you, ${req.query.name}</div>`;

   // GOOD — use framework-provided safe rendering
   // In React, JSX escapes automatically:
   return <div>Thank you, {customerName}</div>; // Safe

   // When you must render HTML (e.g., product descriptions from a CMS),
   // always sanitize first with DOMPurify
   import DOMPurify from 'isomorphic-dompurify';
   const safeHtml = DOMPurify.sanitize(product.descriptionHtml, {
     ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'br'],
     ALLOWED_ATTR: [],
   });
   ```

   Validate and sanitize all user inputs server-side:
   ```typescript
   import {z} from 'zod';

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
       return NextResponse.json({errors: result.error.flatten()}, {status: 400});
     }
     // Process validated data
   }
   ```

5. **Audit and control third-party scripts**

   Third-party scripts (analytics, chat, advertising) are the most common vector for Magecart attacks on checkout pages. Remove or isolate all non-essential third parties from payment pages:

   ```typescript
   // Detect which page we're on and conditionally load third-party scripts
   // app/checkout/layout.tsx — no third-party scripts allowed
   export default function CheckoutLayout({children}: {children: React.ReactNode}) {
     // No analytics, no chat, no advertising tags on checkout
     return (
       <html>
         <head>
           {/* Only Stripe.js — loaded from Stripe's CDN with SRI hash */}
           <script
             src="https://js.stripe.com/v3/"
             integrity="sha256-..." // Subresource Integrity hash
             crossOrigin="anonymous"
           />
         </head>
         <body>{children}</body>
       </html>
     );
   }
   ```

   Use Subresource Integrity (SRI) for any script loaded from a CDN:
   ```bash
   # Generate SRI hash for a script
   curl -s https://js.stripe.com/v3/ | openssl dgst -sha256 -binary | openssl base64 -A
   ```

6. **Implement security monitoring and alerting**

   ```typescript
   // Monitor for CSP violations — browsers send reports to your endpoint
   // app/api/csp-report/route.ts
   export async function POST(req: NextRequest) {
     const report = await req.json();
     const violation = report['csp-report'];

     await logger.warn('CSP Violation', {
       documentUri: violation['document-uri'],
       violatedDirective: violation['violated-directive'],
       blockedUri: violation['blocked-uri'],
       sourceFile: violation['source-file'],
       lineNumber: violation['line-number'],
     });

     // Alert on checkout page CSP violations — could indicate active attack
     if (violation['document-uri']?.includes('/checkout')) {
       await alertSecurityTeam('CSP violation on checkout page', violation);
     }

     return new NextResponse(null, {status: 204});
   }
   ```

   Update CSP to send reports:
   ```
   Content-Security-Policy: ...; report-uri /api/csp-report; report-to csp-endpoint
   ```

## Examples

### Complete security headers for an e-commerce Next.js app

```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {key: 'X-DNS-Prefetch-Control', value: 'on'},
          {key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload'},
          {key: 'X-Frame-Options', value: 'SAMEORIGIN'},
          {key: 'X-Content-Type-Options', value: 'nosniff'},
          {key: 'X-XSS-Protection', value: '1; mode=block'},
          {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
          {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'},
        ],
      },
      {
        // Extra restrictive headers on checkout pages
        source: '/checkout(.*)',
        headers: [
          {key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate'},
          {key: 'X-Robots-Tag', value: 'noindex'},
        ],
      },
    ];
  },
};
```

### Audit third-party scripts on payment pages

```bash
# Use the Chrome DevTools Coverage tool or automated audit
# Lighthouse can surface third-party scripts:
lighthouse https://yourstore.com/checkout --only-categories=best-practices --output=json \
  | jq '.audits["third-party-summary"].details.items[] | {entity: .entity, blockingTime: .blockingTime}'
```

## Best Practices

- **Treat checkout pages as a separate security zone** — apply the most restrictive CSP, disable all non-essential third-party scripts, and treat any script violation as a potential Magecart incident
- **Never inline JavaScript on payment pages** — use nonce-based CSP and external scripts; `'unsafe-inline'` in `script-src` defeats the entire purpose of CSP
- **Add Subresource Integrity (SRI) to all CDN scripts** — SRI ensures the script content hasn't been tampered with even if the CDN is compromised
- **Log CSP violations in production** — set `report-uri` and monitor for violations; legitimate violations from browser extensions are rare but injection attempts are distinctive
- **Rotate encryption keys and review PCI DSS scope annually** — PCI scope changes as you add integrations; conduct an annual review with a QSA (Qualified Security Assessor)
- **Use a WAF (Web Application Firewall)** — Cloudflare WAF or AWS WAF with the OWASP managed ruleset blocks SQL injection, XSS, and other OWASP Top 10 attacks at the edge
- **Scan dependencies for vulnerabilities** — run `npm audit` in CI and use Snyk or Dependabot to catch third-party library CVEs before they reach production

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| CSP breaks Stripe Elements iframes | Add `https://js.stripe.com` and `https://hooks.stripe.com` to `frame-src`; Stripe publishes a current list of required CSP allowances in their docs |
| `'unsafe-inline'` added to unblock styles | Use nonces for inline styles instead; `'unsafe-inline'` invalidates the entire CSP protection for that directive |
| TLS certificate expired | Use Let's Encrypt with auto-renewal (Certbot) or a managed certificate from your CDN provider; set calendar alerts 30 days before expiry |
| XSS via URL query parameters in order confirmation | Always encode/escape dynamic data before inserting into HTML; use `encodeURIComponent` in URLs and React's automatic JSX escaping for HTML content |
| Third-party analytics loading on checkout | Add a conditional check in your analytics initialization that skips loading on `/checkout` routes |

## Related Skills

- @fraud-detection
- @account-security
- @bot-protection
- @stripe-integration
- @gdpr-ecommerce
