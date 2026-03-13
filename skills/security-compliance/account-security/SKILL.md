---
name: account-security
description: "Protect customer accounts with brute-force lockouts, multi-factor authentication, secure session handling, and credential-stuffing defenses"
category: security-compliance
risk: critical
source: curated
date_added: "2026-03-12"
tags: [account-security, mfa, totp, brute-force, session-management, password-security, oauth, credential-stuffing]
triggers: ["account security", "customer account security", "brute force protection", "mfa ecommerce", "totp", "session management", "credential stuffing", "login security"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Account Security

## Overview

Customer accounts hold saved payment methods, loyalty points, purchase history, and shipping addresses — making them high-value targets for credential-stuffing attacks and account takeovers. Effective account security layers brute-force protection on the login page, breach-exposed password detection, optional multi-factor authentication (MFA), and anomaly detection for account takeover patterns. The right approach depends heavily on your platform — Shopify manages most security controls at the platform level, while WooCommerce requires additional plugins.

## When to Use This Skill

- When building a customer account system from scratch
- When auditing an existing account system for security weaknesses
- When observing credential stuffing attacks (high login failure rates from distributed IPs)
- When adding MFA as an optional or required layer for high-value customers
- When implementing "Sign in with Google/Apple" as a more secure alternative to passwords

## Core Instructions

### Step 1: Understand your platform's security model

| Platform | What the Platform Handles | What You Need to Configure |
|----------|--------------------------|---------------------------|
| **Shopify** | SSL/TLS, brute-force protection on login, PCI compliance, server-side security | Customer account settings, whether to require phone verification, Social login apps for Google/Apple sign-in |
| **WooCommerce** | Basic login form only | Install Wordfence (free) for brute-force protection, limit login attempts, 2FA, and login security monitoring |
| **BigCommerce** | SSL/TLS, platform-managed account security, basic brute-force protection | Two-factor authentication for admin users; customer-facing 2FA requires an app |
| **Custom / Headless** | Nothing — you build all security controls | Rate limiting, password hashing, MFA, session management, ATO detection |

### Step 2: Platform-specific account security setup

---

#### Shopify

Shopify handles the majority of customer account security at the platform level — you do not manage SSL, brute-force detection, or password hashing yourself.

**Enable new customer accounts (passwordless login):**
Shopify offers two account experiences:
1. Go to **Settings → Customer accounts**
2. **New customer accounts** (recommended): customers log in with a one-time 6-digit code sent to their email or phone; no password to steal or brute-force
3. **Classic customer accounts**: traditional email/password accounts

Switching to new customer accounts (passwordless) eliminates the most common attack vectors: credential stuffing and brute force.

**Two-step verification for admin accounts:**
1. Go to **Settings → Users and permissions**
2. Click on a user → enable **Two-step authentication required**
3. Shopify supports authenticator apps (TOTP) and SMS for admin 2FA

**Social login (Google/Facebook/Apple):**
Install a social login app from the Shopify App Store:
- **Oxi Social Login** — supports Google, Facebook, Apple, LinkedIn
- **NDNAPPS Social Login** — supports Google, Facebook, Apple
These apps add social login buttons to the account creation and login pages.

**Detecting suspicious customer activity:**
Shopify does not expose customer login events for programmatic monitoring. For advanced monitoring, use Shopify's **Fraud analysis** in orders to detect account takeovers combined with fraudulent purchases.

---

#### WooCommerce

WooCommerce's built-in login form has no rate limiting, MFA, or advanced security. You must add these via plugins.

**Install Wordfence Security (free, recommended):**
1. Install and activate **Wordfence Security** from the WordPress plugin directory
2. Go to **Wordfence → Login Security**
3. Enable **Brute Force Protection**:
   - Lock out after X failed attempts (default: 20)
   - Lock out duration (default: 4 hours)
   - Count failures over X minutes (default: 5 minutes)
4. Enable **Two-Factor Authentication** for admin users (Wordfence supports authenticator app TOTP)

**Limit Login Attempts Reloaded (free alternative for just rate limiting):**
1. Install **Limit Login Attempts Reloaded**
2. Configure: lockout after 4 failures, lock for 20 minutes, notify by email after 4 lockouts

**Customer-facing 2FA:**
1. Install **miniOrange 2 Factor Authentication** or **WP 2FA** plugin
2. Configure to allow (or require) 2FA for customers
3. WP 2FA supports TOTP (Google Authenticator, Authy), email codes, and backup codes

**Social login for WooCommerce:**
Install **Nextend Social Login** (free/premium) — supports Google, Facebook, Apple, and Twitter/X sign-in on WooCommerce login and registration pages.

**Compromised password detection:**
Install **WPassword** or implement a custom check against the HaveIBeenPwned API during registration and password changes.

---

#### BigCommerce

**Admin two-factor authentication:**
1. Go to **Settings → Account Settings → Security**
2. Enable **Two-Step Verification**; BigCommerce supports authenticator apps and SMS

**Customer account security:**
BigCommerce does not expose customer-facing 2FA natively. Options:
- Use **Stencil** (BigCommerce's storefront framework) to add a custom verification step on the customer login page
- Use an identity provider (Auth0, Okta) for customer authentication — this provides full MFA support and credential monitoring

**Google/Social sign-in for BigCommerce:**
Integrate via BigCommerce's customer login API with a social identity provider. Auth0 provides a turnkey solution with a BigCommerce integration.

---

#### Custom / Headless

For custom storefronts, implement security controls at each layer.

**Rate limiting on the login endpoint:**

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const ipLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '15 m'), prefix: 'rl_login_ip' });
const accountLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '15 m'), prefix: 'rl_login_email' });

export async function checkLoginRateLimit(ip: string, email: string) {
  const [ipResult, accountResult] = await Promise.all([
    ipLimiter.limit(ip),
    accountLimiter.limit(email.toLowerCase()),
  ]);
  if (!ipResult.success) throw new Error('TOO_MANY_REQUESTS_IP');
  if (!accountResult.success) throw new Error('ACCOUNT_TEMPORARILY_LOCKED');
}
```

**Secure password hashing (Argon2id):**

```typescript
import { hash, verify } from 'argon2';

export const hashPassword = (password: string) =>
  hash(password, { type: 2 /* argon2id */, memoryCost: 65536, timeCost: 3, parallelism: 4 });

export const verifyPassword = (storedHash: string, password: string) =>
  verify(storedHash, password);
```

**TOTP-based MFA:**

```typescript
import { authenticator } from 'otplib';

export function generateMFASecret(): string {
  return authenticator.generateSecret(32);
}

export function verifyTOTP(secret: string, token: string): boolean {
  authenticator.options = { window: 1 }; // Allow ±30-second drift only
  return authenticator.verify({ token, secret });
}
```

**Secure session cookies:**

```typescript
// Set session cookies with httpOnly, Secure, SameSite=Strict
response.cookies.set('session_token', token, {
  httpOnly: true,    // Not accessible to JavaScript — prevents XSS theft
  secure: true,      // HTTPS only
  sameSite: 'strict', // CSRF protection
  maxAge: 30 * 24 * 60 * 60,
  path: '/',
});
```

**Send security alert emails for sensitive account changes:**
Always notify customers via email when:
- Password is changed
- Email address is changed
- A new device or location logs in
- MFA is disabled

## Best Practices

- **Use passwordless login when possible** — Shopify's new customer accounts use one-time codes, eliminating the credential-stuffing attack surface entirely
- **Return the same error for "user not found" and "wrong password"** — never reveal which was wrong; this prevents user enumeration
- **Offer MFA, but only require it for admin and high-value accounts** — mandatory MFA for all customers increases abandonment; use it for B2B, admin, and customers with saved payment methods
- **Send security alert emails for every sensitive change** — password changes, email changes, new device logins, and MFA changes must trigger immediate notification to the customer's confirmed email
- **Review and rotate admin credentials quarterly** — a compromised admin account can expose all customer data
- **Use Social login (Google/Apple) as a more secure alternative** — these providers handle password security and may prompt for their own MFA

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| WooCommerce login has no rate limiting | Install Wordfence or Limit Login Attempts Reloaded immediately on any live WooCommerce site |
| Admin account compromised via credential stuffing | Enable 2FA for all admin users; use strong, unique passwords for each admin; never reuse admin credentials across services |
| TOTP codes working indefinitely (custom builds) | Use `window: 1` in otplib to accept only ±30-second drift; never accept codes older than 90 seconds |
| Refresh token stored in localStorage | Store refresh tokens in `httpOnly` cookies only; `localStorage` is accessible to JavaScript and vulnerable to XSS |
| Rate limit bypass by rotating email variations | Normalize email addresses (lowercase, strip `+` aliases before the `@`) before applying per-account rate limiting |

## Related Skills

- @secure-checkout
- @fraud-detection
- @gdpr-ecommerce
- @bot-protection
