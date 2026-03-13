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
platforms: [platform-agnostic]
difficulty: intermediate
---

# Account Security

## Overview

Customer accounts are a high-value target for attackers because they hold saved payment methods, loyalty points, purchase history, and shipping addresses. Securing customer accounts requires layered defenses: rate-limited login with progressive backoff, breach-exposed password detection, optional TOTP/WebAuthn MFA, short-lived sessions with refresh token rotation, and anomaly detection for account takeover patterns. This skill covers implementing these controls in a Node.js/Next.js e-commerce application.

## When to Use This Skill

- When building a customer account system from scratch
- When auditing an existing account system for security weaknesses
- When observing credential stuffing attacks (high login failure rates from distributed IPs)
- When adding MFA as an optional or required layer for high-value customers
- When implementing "Sign in with Google/Apple" as a more secure alternative to passwords

## Core Instructions

1. **Implement brute-force protection on login**

   ```typescript
   // lib/auth/login-protection.ts
   import {Ratelimit} from '@upstash/ratelimit';
   import {Redis} from '@upstash/redis';

   const redis = Redis.fromEnv();

   // Per-IP rate limiter: 20 attempts per 15 minutes
   const ipLimiter = new Ratelimit({
     redis,
     limiter: Ratelimit.slidingWindow(20, '15 m'),
     prefix: 'rl_login_ip',
   });

   // Per-account rate limiter: 5 attempts per 15 minutes
   const accountLimiter = new Ratelimit({
     redis,
     limiter: Ratelimit.slidingWindow(5, '15 m'),
     prefix: 'rl_login_email',
   });

   export async function checkLoginRateLimit(ip: string, email: string) {
     const [ipResult, accountResult] = await Promise.all([
       ipLimiter.limit(ip),
       accountLimiter.limit(email.toLowerCase()),
     ]);

     if (!ipResult.success) {
       throw new AuthError('TOO_MANY_REQUESTS', 'Too many login attempts from this IP. Try again later.');
     }
     if (!accountResult.success) {
       throw new AuthError('ACCOUNT_LOCKED', 'Too many login attempts for this account. Try again in 15 minutes.');
     }
   }

   // Progressive delays after repeated failures
   export async function getLoginDelay(email: string): Promise<number> {
     const key = `login_failures:${email.toLowerCase()}`;
     const failures = parseInt(await redis.get(key) ?? '0');
     if (failures === 0) return 0;
     if (failures < 3) return 1000;  // 1 second
     if (failures < 5) return 3000;  // 3 seconds
     return 5000;                     // 5 seconds
   }

   export async function recordLoginFailure(email: string) {
     const key = `login_failures:${email.toLowerCase()}`;
     await redis.incr(key);
     await redis.expire(key, 900); // Reset after 15 minutes
   }
   ```

2. **Hash passwords securely with Argon2**

   ```typescript
   import {hash, verify, argon2id} from 'argon2';

   export async function hashPassword(password: string): Promise<string> {
     return hash(password, {
       type: argon2id,       // argon2id is the recommended variant
       memoryCost: 65536,    // 64 MB memory
       timeCost: 3,          // 3 iterations
       parallelism: 4,       // 4 parallel threads
     });
   }

   export async function verifyPassword(hash: string, password: string): Promise<boolean> {
     return verify(hash, password);
   }

   // Check if password appears in known breaches via Have I Been Pwned API
   export async function isPasswordBreached(password: string): Promise<boolean> {
     const crypto = await import('node:crypto');
     const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
     const prefix = sha1.substring(0, 5);
     const suffix = sha1.substring(5);

     const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
       headers: {'Add-Padding': 'true'},
     });
     const text = await res.text();
     return text.split('\n').some(line => line.startsWith(suffix));
   }
   ```

3. **Implement TOTP-based MFA**

   ```typescript
   import {authenticator} from 'otplib';
   import QRCode from 'qrcode';

   // Generate a TOTP secret when user enables MFA
   export async function setupMFA(customerId: string): Promise<{secret: string; qrCodeUrl: string; backupCodes: string[]}> {
     const secret = authenticator.generateSecret(32); // 32 bytes = 160-bit secret
     const customer = await db.customers.findById(customerId);

     const otpAuthUrl = authenticator.keyuri(
       customer.email,
       'MyStore', // Issuer name shown in authenticator app
       secret,
     );

     const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

     // Generate 8 single-use backup codes
     const backupCodes = Array.from({length: 8}, () =>
       Array.from({length: 4}, () => Math.random().toString(36).substring(2, 4)).join('-').toUpperCase()
     );

     // Store secret encrypted at rest — do not store plain text
     await db.mfa.upsert({
       customerId,
       secret: await encrypt(secret),   // AES-256-GCM encrypted
       backupCodes: await Promise.all(backupCodes.map(code => hashPassword(code))),
       enabled: false, // Not enabled until first successful verification
     });

     return {secret, qrCodeUrl, backupCodes};
   }

   // Verify TOTP code during login
   export async function verifyTOTP(customerId: string, token: string): Promise<boolean> {
     const mfa = await db.mfa.findByCustomer(customerId);
     if (!mfa?.enabled) return true; // MFA not enabled for this user

     const secret = await decrypt(mfa.secret);

     // Check TOTP token (allows 1 step drift = ±30 seconds)
     authenticator.options = {window: 1};
     return authenticator.verify({token, secret});
   }

   // Verify backup code (one-time use)
   export async function verifyBackupCode(customerId: string, code: string): Promise<boolean> {
     const mfa = await db.mfa.findByCustomer(customerId);
     if (!mfa) return false;

     for (let i = 0; i < mfa.backupCodes.length; i++) {
       const isValid = await verifyPassword(mfa.backupCodes[i], code.replace(/-/g, '').toUpperCase());
       if (isValid) {
         // Mark code as used
         await db.mfa.deleteBackupCode(customerId, i);
         return true;
       }
     }
     return false;
   }
   ```

4. **Implement secure session management**

   ```typescript
   import {SignJWT, jwtVerify} from 'jose';

   const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

   export async function createSession(customerId: string, ip: string, userAgent: string) {
     const sessionId = crypto.randomUUID();

     // Short-lived access token (15 minutes)
     const accessToken = await new SignJWT({sub: customerId, sessionId, type: 'access'})
       .setProtectedHeader({alg: 'HS256'})
       .setIssuedAt()
       .setExpirationTime('15m')
       .sign(secret);

     // Long-lived refresh token (30 days)
     const refreshToken = crypto.randomUUID();

     // Store refresh token in database for rotation and revocation
     await db.sessions.create({
       id: sessionId,
       customerId,
       refreshTokenHash: await hashPassword(refreshToken),
       ip,
       userAgent,
       expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
       lastUsedAt: new Date(),
     });

     return {accessToken, refreshToken};
   }

   export async function rotateSession(refreshToken: string, ip: string): Promise<{accessToken: string; refreshToken: string} | null> {
     // Find session by refresh token hash
     const sessions = await db.sessions.findActive();
     let matchedSession = null;
     for (const session of sessions) {
       if (await verifyPassword(session.refreshTokenHash, refreshToken)) {
         matchedSession = session;
         break;
       }
     }

     if (!matchedSession) return null;

     // Detect refresh token reuse (possible session hijack)
     if (matchedSession.used) {
       // Revoke the entire session family
       await db.sessions.revokeAll(matchedSession.customerId);
       await alertSecurityTeam('Refresh token reuse detected', {customerId: matchedSession.customerId, ip});
       return null;
     }

     // Rotate: invalidate old refresh token, issue new ones
     await db.sessions.markUsed(matchedSession.id);
     return createSession(matchedSession.customerId, ip, matchedSession.userAgent);
   }
   ```

5. **Detect and block account takeover patterns**

   ```typescript
   export async function detectATO(customerId: string, event: 'login' | 'password_change' | 'email_change' | 'address_add', ip: string) {
     const customer = await db.customers.findById(customerId);
     const previousLogins = await db.loginHistory.findRecent(customerId, 10);

     // New country login
     const currentCountry = await getCountryFromIp(ip);
     const previousCountries = new Set(previousLogins.map(l => l.country));
     const isNewCountry = previousCountries.size > 0 && !previousCountries.has(currentCountry);

     // Multiple account changes in short time
     const recentChanges = await db.accountEvents.countRecent(customerId, 'change', 3600); // 1 hour

     if (isNewCountry && event !== 'login') {
       // Require re-authentication for account changes from new countries
       throw new AuthError('REVERIFICATION_REQUIRED', 'Please verify your identity to continue');
     }

     if (recentChanges >= 3) {
       await db.customers.tempLock(customerId, 3600);
       await sendSecurityAlert(customer.email, 'Unusual activity detected', {ip, event});
     }

     // Log the event for audit
     await db.loginHistory.insert({customerId, ip, country: currentCountry, event, createdAt: new Date()});
   }
   ```

6. **Send security notification emails**

   ```typescript
   // Notify customers of security-relevant events
   async function sendSecurityNotification(customerId: string, eventType: string, details: Record<string, string>) {
     const customer = await db.customers.findById(customerId);

     const templates: Record<string, {subject: string; message: string}> = {
       password_changed: {
         subject: 'Your password was changed',
         message: 'Your account password was changed. If you did not make this change, reset your password immediately.',
       },
       email_changed: {
         subject: 'Your email address was updated',
         message: 'Your account email was changed. If you did not make this change, contact support immediately.',
       },
       new_device_login: {
         subject: 'New login from unrecognized device',
         message: `A login was detected from ${details.location} using ${details.device}. If this was not you, reset your password.`,
       },
       mfa_disabled: {
         subject: 'Two-factor authentication was disabled',
         message: 'Two-factor authentication has been disabled on your account. If you did not do this, contact support.',
       },
     };

     const template = templates[eventType];
     if (template) {
       await sendTransactionalEmail({
         to: customer.email,
         subject: template.subject,
         body: template.message,
         details,
         alertLevel: 'high',
       });
     }
   }
   ```

## Examples

### Complete login endpoint with all protections

```typescript
// app/api/auth/login/route.ts
export async function POST(req: NextRequest) {
  const {email, password, totpToken} = await req.json();
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? 'unknown';

  // 1. Rate limiting
  await checkLoginRateLimit(ip, email);

  // 2. Progressive delay
  const delay = await getLoginDelay(email);
  if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));

  // 3. Find customer
  const customer = await db.customers.findByEmail(email.toLowerCase());
  if (!customer) {
    await recordLoginFailure(email);
    // Return same error for unknown email and wrong password (prevents user enumeration)
    return NextResponse.json({error: 'Invalid credentials'}, {status: 401});
  }

  // 4. Verify password
  const isValid = await verifyPassword(customer.passwordHash, password);
  if (!isValid) {
    await recordLoginFailure(email);
    return NextResponse.json({error: 'Invalid credentials'}, {status: 401});
  }

  // 5. Verify MFA if enabled
  if (customer.mfaEnabled) {
    if (!totpToken) return NextResponse.json({mfaRequired: true}, {status: 200});
    const mfaValid = await verifyTOTP(customer.id, totpToken);
    if (!mfaValid) return NextResponse.json({error: 'Invalid MFA code'}, {status: 401});
  }

  // 6. Create session
  const {accessToken, refreshToken} = await createSession(customer.id, ip, req.headers.get('user-agent') ?? '');

  // 7. Detect ATO signals
  await detectATO(customer.id, 'login', ip);

  const response = NextResponse.json({accessToken});
  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60,
    path: '/api/auth',
  });
  return response;
}
```

### WebAuthn (Passkey) registration

```typescript
import {generateRegistrationOptions, verifyRegistrationResponse} from '@simplewebauthn/server';

export async function GET(req: NextRequest) {
  const customer = await requireAuth(req);

  const options = await generateRegistrationOptions({
    rpName: 'My Store',
    rpID: 'mystore.com',
    userID: customer.id,
    userName: customer.email,
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  // Store challenge for verification step
  await redis.setex(`webauthn_challenge:${customer.id}`, 300, options.challenge);
  return NextResponse.json(options);
}
```

## Best Practices

- **Use `constant-time comparison` for token and password verification** — timing attacks can reveal valid vs invalid tokens; use `crypto.timingSafeEqual` or library functions that handle this
- **Store refresh tokens as hashes** — never store raw refresh tokens in the database; if the DB is compromised, hashed tokens prevent immediate session takeover
- **Implement refresh token rotation** — each use of a refresh token issues a new one; reuse of a spent refresh token (replay attack) triggers session revocation for the entire family
- **Offer MFA, but make it optional for low-risk accounts** — mandating MFA for all customers increases abandonment; require it for B2B, admin, and high-value accounts
- **Send security alert emails for every sensitive change** — password changes, email changes, new device logins, and MFA changes must trigger immediate email notifications to the old address
- **Use `SameSite=Strict` cookies for authentication tokens** — this prevents CSRF attacks; access tokens in `httpOnly` cookies are not accessible to JavaScript, preventing XSS theft
- **Purge expired sessions on a schedule** — run a nightly job to delete sessions past their `expiresAt` date to keep the sessions table small and prevent data accumulation

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| User enumeration via different error messages | Return the same error message and take the same time for "user not found" and "wrong password" — never reveal which was wrong |
| TOTP codes working indefinitely | Use `window: 1` in otplib to allow only ±30-second drift; never accept codes older than 90 seconds |
| Session fixation attack | Always regenerate session ID after successful login; invalidate the pre-login session entirely |
| Refresh token stolen from localStorage | Store refresh tokens in `httpOnly` cookies only, never `localStorage` or `sessionStorage` which are accessible to JavaScript |
| Rate limit bypass by rotating email variations | Normalize email addresses (lowercase, strip `+` aliases) before rate limit key generation; apply IP-based limits independently |

## Related Skills

- @secure-checkout
- @fraud-detection
- @gdpr-ecommerce
- @bot-protection
