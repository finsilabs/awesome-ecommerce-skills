---
name: cart-recovery-sms
description: "Recover abandoned carts with targeted SMS sequences including urgency messaging, product reminders, discount incentives, and TCPA-compliant opt-in flows"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [sms, cart-recovery, abandonment]
triggers: ["set up SMS cart recovery", "reduce cart abandonment with SMS"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Cart Recovery SMS

## Overview

SMS cart abandonment recovery consistently achieves 20–35% recovery rates — typically 3–5× higher than email — because text messages are read within 3 minutes of delivery for 90% of recipients. The key is a properly timed sequence (not spam), deep personalization using cart contents, and bulletproof compliance with TCPA in North America and GDPR/PECR in Europe. This skill covers the full implementation: opt-in capture, compliance infrastructure, message sequencing, cart data personalization, link shortening with UTM tracking, and performance measurement.

## When to Use This Skill

- When email-only cart recovery sequences plateau below a 10% recovery rate
- When launching SMS as a new marketing channel and cart recovery is the highest-ROI starting point
- When re-platforming to a new SMS provider and need to rebuild flows
- When expanding to markets where SMS has higher deliverability than email
- When A/B testing recovery channels to find the optimal message mix
- When a high-value cart threshold warrants more aggressive recovery (carts > $100)

## Core Instructions

### 1. Compliance infrastructure — build this first

TCPA (US) requires express written consent before sending marketing SMS. GDPR (EU) requires a lawful basis (typically consent) and easy opt-out. Build this before any send logic.

```typescript
// schema: sms_consents table
interface SmsConsent {
  id: string;
  phone: string;           // E.164 format: +12125551234
  email?: string;
  consentMethod: 'checkout' | 'popup' | 'keyword' | 'api';
  consentText: string;     // exact disclosure text shown at opt-in
  ipAddress: string;
  userAgent: string;
  consentedAt: Date;
  optedOutAt?: Date;
  jurisdiction: 'US' | 'CA' | 'EU' | 'OTHER';
  source: string;          // e.g. 'checkout-step-2', 'popup-homepage'
}
```

Checkout opt-in widget (React):

```tsx
function SmsOptIn({ phone, onConsent }: { phone: string; onConsent: (agreed: boolean) => void }) {
  const [checked, setChecked] = useState(false);

  const disclosureText = `By checking this box, you agree to receive recurring automated marketing text messages
  (e.g. cart reminders) at the phone number provided. Consent is not a condition of purchase.
  Message & data rates may apply. Message frequency varies. Reply STOP to unsubscribe.
  View our Privacy Policy and Terms.`;

  return (
    <label className="flex items-start gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          setChecked(e.target.checked);
          onConsent(e.target.checked);
        }}
      />
      <span>{disclosureText}</span>
    </label>
  );
}
```

Opt-out handler (critical — must process immediately):

```typescript
// POST /webhooks/sms/inbound  — handle STOP, UNSUBSCRIBE, CANCEL, QUIT, END, HELP
async function handleInboundSms(body: string, from: string) {
  const normalized = body.trim().toUpperCase();
  const optOutKeywords = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'QUIT', 'END'];
  const helpKeywords   = ['HELP', 'INFO'];

  if (optOutKeywords.includes(normalized)) {
    await db.smsConsents.update(
      { optedOutAt: new Date() },
      { where: { phone: from, optedOutAt: null } }
    );
    // Reply is mandatory under TCPA
    return 'You have been unsubscribed and will receive no further messages. Reply START to resubscribe.';
  }

  if (helpKeywords.includes(normalized)) {
    return `${process.env.STORE_NAME} alerts. Msg&data rates may apply. Reply STOP to cancel. Support: ${process.env.SUPPORT_EMAIL}`;
  }
}
```

### 2. Capture cart state at abandonment

Define "abandoned" as: cart created + checkout started, no purchase within N minutes.

```typescript
interface AbandonedCart {
  sessionId: string;
  customerId?: string;
  phone?: string;
  email?: string;
  cartValue: number;
  currency: string;
  items: CartItem[];
  checkoutUrl: string;    // recoverable link with session token
  abandonedAt: Date;
  recoveryState: 'pending' | 'sms1_sent' | 'sms2_sent' | 'sms3_sent' | 'recovered' | 'expired';
}

// Run every 5 minutes via cron
async function detectAbandonedCarts() {
  const cutoff = new Date(Date.now() - 20 * 60 * 1000); // 20 min threshold

  const candidates = await db.carts.findAll({
    where: {
      status: 'checkout_started',
      updatedAt: { lt: cutoff },
      convertedAt: null,
      recoveryState: 'pending',
    },
    include: ['items', 'customer'],
  });

  for (const cart of candidates) {
    // Only schedule if we have phone + consent
    if (cart.phone && await hasActiveConsent(cart.phone)) {
      await scheduleRecoverySequence(cart);
    }
  }
}
```

### 3. Build the timing sequence

Industry-tested timing for a 3-message sequence:

```typescript
const SMS_RECOVERY_SCHEDULE = [
  { step: 1, delayMinutes: 20,  type: 'reminder',   includeDiscount: false },
  { step: 2, delayMinutes: 60,  type: 'social_proof', includeDiscount: false },
  { step: 3, delayMinutes: 1440, type: 'last_chance', includeDiscount: true  }, // 24h
];

async function scheduleRecoverySequence(cart: AbandonedCart) {
  for (const step of SMS_RECOVERY_SCHEDULE) {
    await jobQueue.add(
      'sms-recovery',
      { cartId: cart.sessionId, step: step.step },
      { delay: step.delayMinutes * 60 * 1000, attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
    );
  }
}
```

### 4. Personalize and send each message

```typescript
async function sendRecoverySms(cartId: string, step: number) {
  const cart = await db.carts.findOne({ where: { sessionId: cartId }, include: ['items'] });
  if (!cart || cart.recoveryState === 'recovered' || cart.recoveryState === 'expired') return;

  // Check consent is still active
  if (!(await hasActiveConsent(cart.phone))) return;

  // Check quiet hours (8am–9pm local time)
  if (!isWithinSendWindow(cart.phone)) {
    await jobQueue.add('sms-recovery', { cartId, step }, { delay: getNextSendWindowMs(cart.phone) });
    return;
  }

  const recoveryLink = await generateRecoveryLink(cart);
  const message = await buildMessage(cart, step, recoveryLink);

  const result = await twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: cart.phone,
    statusCallback: `${process.env.BASE_URL}/webhooks/sms/status`,
  });

  await db.smsMessages.create({
    cartId, step, sid: result.sid, sentAt: new Date(), message,
  });
  await cart.update({ recoveryState: `sms${step}_sent` });
}

function buildMessage(cart: AbandonedCart, step: number, link: string): string {
  const firstName = cart.customer?.firstName ?? 'there';
  const topItem   = cart.items[0];
  const itemCount = cart.items.length;
  const value     = formatCurrency(cart.cartValue, cart.currency);

  const templates: Record<number, string> = {
    1: `Hi ${firstName}, you left ${itemCount === 1 ? topItem.name : `${itemCount} items`} in your cart (${ value}). Complete your order: ${link}\nReply STOP to opt out.`,
    2: `${firstName}, ${topItem.name} is popular — ${topItem.recentViewers ?? '12'} people viewed it today. Your cart is saved: ${link}\nReply STOP to opt out.`,
    3: `Last chance, ${firstName}! Your cart expires soon. ${cart.discountCode ? `Use ${cart.discountCode} for 10% off.` : ''} Checkout: ${link}\nReply STOP to opt out.`,
  };

  return templates[step];
}
```

### 5. Generate trackable recovery links

```typescript
import { nanoid } from 'nanoid';

async function generateRecoveryLink(cart: AbandonedCart): Promise<string> {
  const token = nanoid(16);
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h TTL

  await db.recoveryTokens.create({ token, cartId: cart.sessionId, expiresAt });

  const longUrl = `${process.env.STORE_URL}/cart/recover?token=${token}&utm_source=sms&utm_medium=cart_recovery&utm_campaign=abandoned_cart`;

  // Optionally shorten with Bitly or your own shortener
  return longUrl;
}

// GET /cart/recover?token=...
async function handleRecoveryClick(req: Request, res: Response) {
  const { token } = req.query;
  const record = await db.recoveryTokens.findOne({ where: { token, usedAt: null } });

  if (!record || record.expiresAt < new Date()) {
    return res.redirect('/cart');
  }

  const cart = await db.carts.findOne({ where: { sessionId: record.cartId } });
  await record.update({ usedAt: new Date() });
  await cart?.update({ recoveryState: 'recovered', recoveredVia: 'sms' });

  // Restore cart session and redirect to checkout
  req.session.cartId = cart?.sessionId;
  res.redirect('/checkout');
}
```

### 6. Discount generation for step 3

```typescript
async function generateRecoveryDiscount(cart: AbandonedCart): Promise<string | null> {
  if (cart.cartValue < parseFloat(process.env.SMS_DISCOUNT_MIN_VALUE ?? '50')) return null;

  const code = `SAVE10-${cart.sessionId.slice(-6).toUpperCase()}`;

  // Create in your platform (example: Shopify Admin API)
  await shopifyClient.post('/admin/api/2024-01/price_rules.json', {
    price_rule: {
      title: code,
      value_type: 'percentage',
      value: '-10.0',
      customer_selection: 'all',
      target_type: 'line_item',
      target_selection: 'all',
      allocation_method: 'across',
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      usage_limit: 1,
      once_per_customer: true,
    },
  });

  return code;
}
```

### 7. Quiet hours and send-window enforcement

```typescript
import { getTimezone } from 'countries-and-timezones';
import { parsePhoneNumber } from 'libphonenumber-js';
import { DateTime } from 'luxon';

function isWithinSendWindow(phone: string): boolean {
  try {
    const parsed   = parsePhoneNumber(phone);
    const country  = parsed.country ?? 'US';
    const tzInfo   = getTimezone(country);
    const tz       = tzInfo?.timezones[0] ?? 'America/New_York';
    const now      = DateTime.now().setZone(tz);
    return now.hour >= 8 && now.hour < 21; // 8am–9pm local
  } catch {
    // Default to EST if parse fails
    const now = DateTime.now().setZone('America/New_York');
    return now.hour >= 8 && now.hour < 21;
  }
}
```

## Best Practices

- **Sequence length**: 2–3 messages maximum. More than 3 messages per abandonment event triggers spam complaints and opt-outs
- **Message length**: Keep under 160 characters to avoid multi-part SMS charges; test on real devices before deploying
- **First-name personalization**: Always include first name when available — it increases reply rate by ~15% vs. generic openers
- **Cart value threshold**: Only trigger SMS recovery for carts above a minimum value (suggest $30–$50) to keep ROI positive
- **Discount strategy**: Reserve discounts for the final message only; giving discounts too early trains customers to abandon intentionally
- **Consent recency**: If a customer opted in more than 18 months ago with no activity, treat as expired for EU contacts
- **Quiet hours enforcement**: Never send between 9pm–8am in the recipient's local timezone — this is legally required in many US states
- **Status callbacks**: Process delivery receipts; suppress future messages to numbers that return hard errors (`undelivered`, `failed`)
- **Phone normalization**: Always store and send in E.164 format. Validate with `libphonenumber-js` at collection time
- **A/B test send times**: The 20-minute first message works well for most verticals, but fashion and impulse categories often do better at 15 minutes
- **Link click tracking**: Track link clicks separately from recoveries — a 30% click rate with 10% recovery indicates checkout friction, not message quality

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Sending to unsubscribed numbers | Check consent table before every send, not just at sequence creation time |
| Double-sending after platform restart | Use idempotency keys in your job queue; check `recoveryState` before each send |
| Messages arriving at 2am | Always enforce quiet hours per recipient timezone, not sender timezone |
| Recovery link expired before customer clicks | Use 48-hour TTL minimum; 72 hours for higher-value carts |
| Discount code used by wrong customer | Generate unique single-use codes tied to the specific cart session ID |
| Carrier filtering (message not delivered) | Avoid all-caps, excessive punctuation, and URL shorteners from free services; use verified short codes |
| TCPA lawsuit exposure | Store consent records with full audit trail (IP, timestamp, exact disclosure text) for minimum 5 years |
| Low opt-in rate at checkout | Test placement — pre-payment is better than post-payment; also test inline vs. modal |
| High opt-out rate after first message | Message is too aggressive or cart value is too low; raise threshold and soften copy |
| Abandoned cart detected too early | 20-minute threshold reduces false positives; don't trigger on carts under 5 minutes old |

## Testing and Validation

### Unit tests

```typescript
describe('SMS Recovery', () => {
  it('does not send to opted-out phone numbers', async () => {
    await db.smsConsents.create({ phone: '+15555555555', optedOutAt: new Date() });
    const result = await sendRecoverySms('cart-123', 1);
    expect(twilioClient.messages.create).not.toHaveBeenCalled();
  });

  it('respects quiet hours', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T03:00:00Z')); // 10pm EST
    const shouldSend = isWithinSendWindow('+12125551234');
    expect(shouldSend).toBe(false);
  });

  it('generates unique recovery tokens per cart', async () => {
    const link1 = await generateRecoveryLink(mockCart('cart-1'));
    const link2 = await generateRecoveryLink(mockCart('cart-2'));
    expect(link1).not.toEqual(link2);
  });
});
```

### Integration checklist

- [ ] Opt-in checkbox renders at checkout with complete TCPA disclosure text
- [ ] STOP keyword processed within 60 seconds of receipt
- [ ] Recovery link redirects to pre-filled cart correctly
- [ ] Quiet hours enforced for recipient timezone (test with +1, +5:30, -8 offsets)
- [ ] No duplicate messages for the same cart (idempotency test)
- [ ] Twilio status callbacks updating `deliveryStatus` in DB
- [ ] Discount codes are single-use and expire after 48 hours
- [ ] Consent records include IP address, timestamp, and disclosure text verbatim

### KPIs to monitor

- **Recovery rate**: orders recovered / abandonment events with valid SMS consent (target: 15–25%)
- **Click-through rate**: recovery link clicks / messages delivered (target: 25–40%)
- **Opt-out rate**: STOP replies / messages sent per step (healthy: under 3%)
- **Deliverability rate**: delivered / sent (target: 95%+; below 90% triggers carrier review)
- **Revenue per recovery SMS**: total recovered GMV / total SMS sent (compare to email equivalent)

## Related Skills

- @cart-abandonment-recovery
- @sms-marketing
- @email-marketing-automation
- @lifecycle-marketing-automation
- @win-back-reactivation
