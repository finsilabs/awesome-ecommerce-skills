---
name: bot-protection
description: "Block automated bots from scraping your catalog, scalping limited inventory, and abusing checkout flows using CAPTCHA and behavioral detection"
category: security-compliance
risk: critical
source: curated
date_added: "2026-03-12"
tags: [bot-protection, captcha, scraping, scalping, rate-limiting, cloudflare, turnstile, honeypot]
triggers: ["bot protection", "anti-scraping", "anti-scalping", "captcha commerce", "bot detection", "checkout bots", "inventory scraping"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Bot Protection

## Overview

Commerce stores face three major bot threats: scrapers that harvest pricing and inventory data for competitors, scalper bots that buy limited-inventory items instantly, and credential-stuffing bots that test stolen usernames and passwords. Effective bot protection layers platform-level defenses, a WAF (Web Application Firewall), CAPTCHA for high-risk actions, and optional behavioral analysis. For most merchants, Cloudflare provides the most effective and lowest-friction protection — it sits in front of your store regardless of platform.

## When to Use This Skill

- When launching limited-edition products prone to scalping (sneakers, concert tickets, gaming consoles)
- When competitors are systematically scraping your product prices or inventory levels
- When account login pages show signs of credential stuffing (high failure rates from distributed IPs)
- When checkout funnel analytics show suspiciously fast completion times (sub-5-second checkout)
- When your infrastructure is overwhelmed by bot traffic consuming catalog API resources

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right tool

| Platform | Built-in Bot Protection | Recommended Additional Layer |
|----------|------------------------|------------------------------|
| **Shopify** | Shopify includes basic bot detection and rate limiting | Enable Cloudflare (free plan) in front of your Shopify store for WAF rules and bot management |
| **WooCommerce** | None built in — the login and checkout forms are fully exposed | Wordfence (free) for login protection; Cloudflare for WAF and rate limiting |
| **BigCommerce** | Basic DDoS protection included | Cloudflare for advanced bot management; BigCommerce supports custom scripts for CAPTCHA |
| **High-traffic drops (any platform)** | None | Cloudflare Waiting Room (Business/Enterprise) or Queue-it for managed queue |
| **Custom / Headless** | Must build | Cloudflare + custom rate limiting + behavioral analysis |

### Step 2: Set up foundational bot protection

---

#### Step 2a: Enable Cloudflare (works for all platforms)

Cloudflare's free plan provides significant bot protection at the DNS level without touching your application code.

1. **Add your domain to Cloudflare** at cloudflare.com (free plan works for most stores)
2. Update your domain's nameservers to the Cloudflare nameservers provided
3. In Cloudflare dashboard:
   - **SSL/TLS → Overview**: set to "Full (Strict)"
   - **Security → WAF → Managed rules**: enable **Cloudflare Managed Ruleset** (free) and **OWASP Core Ruleset**
   - **Security → Bots → Bot Fight Mode**: enable (free) — blocks known bot user agents
4. For additional protection, create custom **WAF Rules** (Security → WAF → Custom Rules):
   ```
   # Block requests with no User-Agent header
   (not http.user_agent contains " " and not cf.client.bot)

   # Rate limit catalog API scraping
   # Under Security → WAF → Rate Limiting Rules:
   # Path: /products/* or /api/products/*
   # Rate: 100 requests per minute per IP
   # Action: Block for 1 hour
   ```

**Cloudflare Bot Management (Business plan, ~$200/month):**
For stores with serious scalping or scraping problems, Cloudflare Bot Management uses machine learning to score every request and challenge or block suspicious traffic without impacting legitimate shoppers.

---

#### Step 2b: Add CAPTCHA to high-risk forms

Use **Cloudflare Turnstile** (free, privacy-preserving, invisible-first) on login and checkout forms. Turnstile uses passive signals before showing a visible challenge — most legitimate users never see a CAPTCHA.

**Adding Turnstile to a Shopify store:**
1. Sign up for Cloudflare Turnstile at cloudflare.com/products/turnstile (free)
2. Create a new site, select "Managed" mode, note your site key and secret key
3. In Shopify, customize your theme to add the Turnstile widget to the login and checkout forms:
   - Use a Shopify theme app extension or edit the theme directly
   - Add `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>` and a `<div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY">` to the login form
4. Verify the token server-side in your custom app or use a Shopify Function

**Adding Turnstile to WooCommerce:**
1. Install the **Cloudflare Turnstile** WordPress plugin (search "Cloudflare Turnstile" in the plugin directory)
2. Enter your site key and secret key
3. Configure which forms to protect: login, registration, checkout, comment forms

**Server-side token verification:**
```typescript
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY!,
      response: token,
      remoteip: ip,
    }),
  });
  const data = await res.json();
  return data.success === true;
}
```

---

#### Step 2c: Set up a Waiting Room for product drops (high-demand launches)

For limited-inventory launches where you expect traffic spikes and scalpers:

**Cloudflare Waiting Room (Business/Enterprise plan):**
1. In Cloudflare dashboard, go to **Traffic → Waiting Room**
2. Click **Create**
3. Configure:
   - **Hostname**: your store domain
   - **Path**: the product URL pattern (e.g., `/products/limited-*` or `/collections/drop`)
   - **Total active users**: maximum concurrent users allowed through (e.g., 500)
   - **New users per minute**: admission rate (e.g., 100 per minute)
4. Customize the waiting room page with your branding
5. Cloudflare queues excess traffic fairly; bot traffic is filtered by Cloudflare's bot detection before entering the queue

---

#### Step 2d: Platform-specific protections

**Shopify — Per-customer purchase limits:**
Shopify does not enforce per-customer purchase limits natively for limited products. Options:
- Use a **Shopify app** like Locksmith or Order Limits by MLveda to restrict purchase quantity per customer
- On Shopify Plus: use **Shopify Functions** to enforce limits at checkout

**WooCommerce — Login brute-force protection:**
1. Install **Wordfence Security** (free)
2. Enable brute-force protection under **Wordfence → Login Security**
3. Enable two-factor authentication for admin accounts

**WooCommerce — CAPTCHA on checkout:**
1. Install **Google Recaptcha for WooCommerce** (free) or the Cloudflare Turnstile plugin
2. Configure to protect: login, registration, checkout, and lost password forms

---

#### Custom / Headless — Application-layer rate limiting

For custom storefronts, add rate limiting at the middleware or edge layer:

```typescript
// Next.js Edge Middleware — rate limiting per IP per route
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const limiters = {
  checkout: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 m'), prefix: 'rl_checkout' }),
  catalog:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, '1 m'), prefix: 'rl_catalog' }),
};

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const pathname = request.nextUrl.pathname;

  const limiter = pathname.startsWith('/checkout') ? limiters.checkout
    : pathname.startsWith('/products') ? limiters.catalog
    : null;

  if (limiter) {
    const { success } = await limiter.limit(ip);
    if (!success) return new NextResponse('Too Many Requests', { status: 429 });
  }

  return NextResponse.next();
}
```

**Per-customer purchase limits (custom):**

```typescript
async function enforcePurchaseLimit(customerId: string, productId: string, limit = 1) {
  const count = await db.orders.countByCustomerAndProduct(customerId, productId);
  if (count >= limit) throw new Error(`Purchase limit of ${limit} per customer reached`);

  // Atomic lock to prevent race conditions at high concurrency
  const lockKey = `purchase_lock:${customerId}:${productId}`;
  const acquired = await redis.set(lockKey, '1', 'EX', 30, 'NX');
  if (!acquired) throw new Error('Purchase already in progress');
}
```

## Best Practices

- **Layer multiple defenses** — no single technique stops all bots; combine Cloudflare WAF, Turnstile CAPTCHA, and application-level rate limiting
- **Use invisible CAPTCHAs first** — Cloudflare Turnstile and hCaptcha passive mode challenge only suspicious requests; visible CAPTCHAs on every checkout hurt conversion
- **Fingerprint sessions, not just IPs** — bots rotate IPs via residential proxies; supplement IP-based rules with behavioral signals and session characteristics
- **Enforce per-product purchase limits at the database level** — client-side limits are trivially bypassed; enforce with a server-side check or database constraint
- **Monitor your bot-to-human ratio** — set up a Cloudflare Analytics or Datadog dashboard tracking the ratio of blocked requests to total requests; spikes indicate new bot campaigns
- **Pre-announce high-demand drops with a waitlist** — collecting emails in advance lets you give waitlist members priority access, making the queue fairer and reducing demand at the moment of launch

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Rate limits blocking legitimate flash sale traffic | Set higher rate limits for authenticated customers with purchase history; apply strict limits only to unauthenticated requests |
| Turnstile CAPTCHA breaking checkout | Test Turnstile in "Always passes" mode during setup; ensure your server-side verification endpoint is working before enabling in production |
| Waiting room not activating for a product drop | Configure Cloudflare Waiting Room 24 hours before the drop and test with a staging URL; ensure the path pattern matches the product URL |
| Purchase limit bypass via multiple accounts | Require phone verification for high-demand product purchases; link purchase limits to verified phone numbers or identity, not just accounts |
| Wordfence blocking legitimate WooCommerce customers | Review blocked IP logs in Wordfence; allowlist legitimate customers and adjust sensitivity settings |

## Related Skills

- @fraud-detection
- @account-security
- @secure-checkout
- @flash-sale-engine
- @monitoring-alerting-commerce
