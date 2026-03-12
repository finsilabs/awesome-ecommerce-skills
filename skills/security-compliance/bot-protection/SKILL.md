---
name: bot-protection
description: "Anti-scraping, anti-scalping, and CAPTCHA strategies for commerce"
category: security-compliance
risk: critical
source: curated
date_added: "2026-03-12"
tags: [bot-protection, captcha, scraping, scalping, rate-limiting, cloudflare, turnstile, honeypot]
triggers: ["bot protection", "anti-scraping", "anti-scalping", "captcha commerce", "bot detection", "checkout bots", "inventory scraping"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Bot Protection

## Overview

Commerce sites face three major bot threats: scrapers that harvest pricing and inventory data for competitors, scalper bots that buy high-demand items instantly, and credential-stuffing bots that test stolen username/password combinations. Effective bot protection layers rate limiting, CAPTCHA challenges, behavioral analysis, and platform-level bot management to stop automated abuse while keeping the checkout friction-free for legitimate shoppers.

## When to Use This Skill

- When launching limited-edition products prone to scalping (sneakers, concert tickets, gaming consoles)
- When competitors are systematically scraping your product prices or inventory levels
- When account login pages show signs of credential stuffing (high failure rates from distributed IPs)
- When checkout funnel analytics show suspiciously fast completion times (sub-5-second checkout)
- When your infrastructure is overwhelmed by bot traffic consuming catalog API resources

## Core Instructions

1. **Implement rate limiting at the edge**

   The most effective first layer is rate limiting before requests reach your application:

   ```typescript
   // middleware.ts (Next.js Edge Middleware)
   import {NextRequest, NextResponse} from 'next/server';
   import {Ratelimit} from '@upstash/ratelimit';
   import {Redis} from '@upstash/redis';

   const redis = Redis.fromEnv();

   // Different limits for different route types
   const limiters = {
     catalog: new Ratelimit({
       redis,
       limiter: Ratelimit.slidingWindow(100, '1 m'),
       prefix: 'rl_catalog',
     }),
     checkout: new Ratelimit({
       redis,
       limiter: Ratelimit.slidingWindow(10, '1 m'),
       prefix: 'rl_checkout',
     }),
     search: new Ratelimit({
       redis,
       limiter: Ratelimit.slidingWindow(30, '1 m'),
       prefix: 'rl_search',
     }),
   };

   export async function middleware(request: NextRequest) {
     const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
     const pathname = request.nextUrl.pathname;

     let limiter: Ratelimit | undefined;
     if (pathname.startsWith('/api/products') || pathname.startsWith('/products')) {
       limiter = limiters.catalog;
     } else if (pathname.startsWith('/api/checkout') || pathname.startsWith('/checkout')) {
       limiter = limiters.checkout;
     } else if (pathname.startsWith('/api/search') || pathname.startsWith('/search')) {
       limiter = limiters.search;
     }

     if (limiter) {
       const {success, limit, remaining, reset} = await limiter.limit(ip);
       if (!success) {
         return new NextResponse('Too Many Requests', {
           status: 429,
           headers: {
             'X-RateLimit-Limit': limit.toString(),
             'X-RateLimit-Remaining': remaining.toString(),
             'X-RateLimit-Reset': reset.toString(),
             'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
           },
         });
       }
     }

     return NextResponse.next();
   }
   ```

2. **Add Cloudflare Turnstile CAPTCHA (invisible-first)**

   Turnstile is Cloudflare's CAPTCHA alternative that uses passive signals before showing a challenge:

   ```html
   <!-- In your checkout or login form -->
   <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
   <form id="checkout-form">
     <!-- ... form fields ... -->
     <div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY" data-theme="light"></div>
     <button type="submit">Place Order</button>
   </form>
   ```

   ```typescript
   // Server-side: verify the Turnstile token before processing
   export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
     const formData = new URLSearchParams({
       secret: process.env.TURNSTILE_SECRET_KEY!,
       response: token,
       remoteip: ip,
     });

     const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
       method: 'POST',
       body: formData,
       headers: {'Content-Type': 'application/x-www-form-urlencoded'},
     });

     const data = await res.json();
     return data.success === true;
   }

   // In your checkout API route
   export async function POST(req: NextRequest) {
     const body = await req.json();
     const ip = req.ip ?? '127.0.0.1';

     const cfToken = body.cfTurnstileToken;
     if (!cfToken || !(await verifyTurnstile(cfToken, ip))) {
       return NextResponse.json({error: 'Bot check failed'}, {status: 403});
     }
     // Continue with checkout processing
   }
   ```

3. **Implement honeypot fields to trap basic bots**

   Honeypot fields are invisible to humans but filled by bots that auto-populate all form fields:

   ```tsx
   // components/checkout-form.tsx
   export function CheckoutForm() {
     const [honeypot, setHoneypot] = useState('');

     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       // If honeypot is filled, silently discard the submission
       if (honeypot) {
         console.warn('Bot detected via honeypot');
         // Optionally show a fake "success" to not tip off the bot
         return;
       }
       // Process legitimate submission
     };

     return (
       <form onSubmit={handleSubmit}>
         {/* Real fields */}
         <input name="email" type="email" required />

         {/* Honeypot field — hidden from real users via CSS */}
         <div style={{position: 'absolute', left: '-9999px', top: '-9999px'}} aria-hidden="true">
           <label htmlFor="website">Website (leave blank)</label>
           <input
             id="website"
             name="website"
             type="text"
             tabIndex={-1}
             autoComplete="off"
             value={honeypot}
             onChange={e => setHoneypot(e.target.value)}
           />
         </div>

         <button type="submit">Place Order</button>
       </form>
     );
   }
   ```

4. **Detect scalper bots with behavioral analysis**

   Legitimate users take time to browse; scalper bots complete checkout in seconds:

   ```typescript
   // Track page timing to detect superhuman checkout speed
   // Client-side: record page load time
   if (typeof window !== 'undefined') {
     window.__pageLoadTime = Date.now();
   }

   // On checkout submission, send elapsed time
   const elapsedSeconds = (Date.now() - window.__pageLoadTime) / 1000;

   // Server-side: validate timing
   export async function validateCheckoutTiming(elapsedSeconds: number, sessionId: string): Promise<boolean> {
     // Flag if checkout was completed in under 5 seconds (human minimum is ~15-20s)
     if (elapsedSeconds < 5) {
       await db.suspiciousActivity.log({sessionId, reason: 'superhuman_checkout_speed', elapsed: elapsedSeconds});
       return false;
     }
     return true;
   }
   ```

   Additional behavioral signals:
   ```typescript
   interface BehavioralSignals {
     mouseMovements: number;     // No mouse movement = likely bot
     keystrokes: number;         // Pre-filled forms skip keystrokes
     timeOnPage: number;         // In milliseconds
     focusEvents: number;        // Tabs through fields vs skipping
     scrollDepth: number;        // 0-100%
   }

   function calculateBotProbability(signals: BehavioralSignals): number {
     let botScore = 0;
     if (signals.mouseMovements < 10) botScore += 30;
     if (signals.keystrokes < 5) botScore += 20;
     if (signals.timeOnPage < 5000) botScore += 25;
     if (signals.focusEvents === 0) botScore += 15;
     if (signals.scrollDepth === 0) botScore += 10;
     return botScore; // > 70 = likely bot
   }
   ```

5. **Protect high-demand product launches with a waiting room**

   Virtual waiting rooms queue customers fairly and prevent scalper bots from monopolizing stock:

   ```typescript
   // Use Cloudflare Waiting Room or implement custom queuing
   // Custom implementation with Redis sorted sets:

   export async function joinWaitingRoom(sessionId: string, productSlug: string): Promise<{position: number; estimatedWait: number}> {
     const key = `waiting_room:${productSlug}`;
     const score = Date.now(); // Unix timestamp as score for FIFO ordering

     await redis.zadd(key, score, sessionId);
     const position = await redis.zrank(key, sessionId);

     // Drain rate: allow N customers per minute into checkout
     const drainRate = 50; // 50 customers/min
     const estimatedWait = Math.ceil((position ?? 0) / drainRate); // minutes

     return {position: (position ?? 0) + 1, estimatedWait};
   }

   // Periodically grant access to customers at the front of the queue
   export async function processWaitingRoom(productSlug: string) {
     const key = `waiting_room:${productSlug}`;
     const batchSize = 50;

     // Get the first 50 in queue
     const admitted = await redis.zrange(key, 0, batchSize - 1);
     await redis.zremrangebyrank(key, 0, batchSize - 1);

     // Grant each a time-limited checkout token
     for (const sessionId of admitted) {
       const token = crypto.randomUUID();
       await redis.setex(`checkout_token:${token}`, 600, sessionId); // 10-minute window
       await notifyCustomerAdmitted(sessionId, token);
     }
   }
   ```

6. **Monitor bot traffic patterns**

   ```typescript
   // Log and alert on suspicious patterns
   export async function trackBotSignals(req: NextRequest, outcome: 'blocked' | 'challenged' | 'allowed') {
     const ip = req.ip ?? 'unknown';
     const userAgent = req.headers.get('user-agent') ?? '';
     const isSuspiciousUA = !userAgent || userAgent.includes('python-requests') || userAgent.includes('curl') || userAgent.includes('Go-http-client');

     if (outcome === 'blocked' || isSuspiciousUA) {
       await metrics.increment('bot_protection.blocked', {ip, userAgent: userAgent.substring(0, 50)});
     }
   }

   // Alert when block rate exceeds threshold
   // Datadog / Grafana alert: bot_protection.blocked.rate > 20% of total requests
   ```

## Examples

### Cloudflare Workers bot protection rule

```javascript
// Cloudflare Workers script or WAF rule
// Block known bot user agents from accessing catalog API
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent') ?? '';

  const knownBotPatterns = [
    /python-requests/i, /scrapy/i, /beautifulsoup/i,
    /selenium/i, /puppeteer/i, /playwright/i, /phantom/i,
  ];

  const isKnownBot = knownBotPatterns.some(p => p.test(userAgent));

  if (isKnownBot && url.pathname.startsWith('/api/')) {
    return new Response('Forbidden', {status: 403});
  }

  return fetch(request);
}
```

### Purchase limit enforcement for high-demand items

```typescript
export async function enforcePurchaseLimit(customerId: string, productId: string, limitPerCustomer = 1) {
  const existingPurchases = await db.orders.countByCustomerAndProduct(customerId, productId);

  if (existingPurchases >= limitPerCustomer) {
    throw new Error(`Purchase limit of ${limitPerCustomer} per customer reached for this product`);
  }

  // Use a Redis lock to prevent race conditions at high concurrency
  const lockKey = `purchase_lock:${customerId}:${productId}`;
  const acquired = await redis.set(lockKey, '1', 'EX', 30, 'NX');
  if (!acquired) {
    throw new Error('A purchase for this item is already in progress');
  }
}
```

## Best Practices

- **Layer multiple defenses** — no single technique stops all bots; combine edge rate limiting, CAPTCHA, honeypots, and behavioral analysis for defense in depth
- **Use invisible CAPTCHAs first** — Cloudflare Turnstile and hCaptcha's passive mode challenge only suspicious requests; visible CAPTCHAs on every checkout hurt conversion rates
- **Fingerprint sessions, not just IPs** — bots rotate IPs via residential proxies; supplement IP-based rules with device fingerprinting and behavioral signals
- **Implement per-product purchase limits in the database** — enforce limits server-side with a unique constraint or atomic counter; client-side limits are trivially bypassed
- **Set up a waiting room for product drops** — virtual queues are fairer than first-come-first-served, which bots always win; Cloudflare Waiting Room is a managed solution
- **Monitor your bot/human ratio continuously** — set up a Datadog or Grafana dashboard showing the ratio of blocked requests to total requests; sudden spikes indicate new bot campaigns
- **Test your defenses regularly** — run a headless browser (Playwright) against your own checkout to see what bots experience; update rules when common evasion techniques bypass them

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Rate limits blocking legitimate flash sale traffic | Set higher rate limits for authenticated customers with purchase history; apply strict limits only to unauthenticated requests |
| CAPTCHA causing checkout abandonment | Use passive CAPTCHA solutions (Turnstile, hCaptcha); only escalate to visible challenges when passive scoring detects bot signals |
| Honeypot field detected by sophisticated bots | Randomize the honeypot field name per session; some bots specifically skip fields named "website" or "email2" |
| Purchase limit bypass via multiple accounts | Require phone verification for high-demand product purchases; link purchase limits to verified identities, not just accounts |
| Bot fingerprint evasion via real browsers | Browser-based bots (Puppeteer Stealth) mimic real browsers; add server-side behavioral analysis (timing, event patterns) that pure fingerprinting misses |

## Related Skills

- @fraud-detection
- @account-security
- @secure-checkout
- @flash-sale-scaling
- @monitoring-alerting-commerce
