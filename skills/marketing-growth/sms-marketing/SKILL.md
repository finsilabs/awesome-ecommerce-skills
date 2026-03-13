---
name: sms-marketing
description: "Launch SMS marketing campaigns with opt-in flows, audience segmentation, and full TCPA/GDPR compliance to drive revenue through text messaging"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [sms, twilio, tcpa, gdpr, compliance, opt-in, segmentation, mobile-marketing, text-marketing]
triggers: ["sms marketing", "text message marketing", "sms campaigns", "TCPA compliance", "sms opt-in", "twilio sms", "SMS segmentation"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# SMS Marketing

## Overview

SMS marketing achieves 98% open rates and click-through rates 5–10x higher than email, making it one of the highest-performing direct marketing channels for e-commerce. However, SMS is heavily regulated by TCPA in the US and GDPR in Europe — sending to non-opted-in subscribers carries fines up to $1,500 per message. This skill covers compliant opt-in collection, double opt-in flows, message segmentation, campaign sending via Twilio, and opt-out handling.

## When to Use This Skill

- When launching an SMS marketing channel alongside existing email automation
- When building a TCPA-compliant opt-in flow for checkout and marketing SMS
- When needing to segment SMS campaigns by purchase history or location
- When implementing transactional SMS (shipping updates, OTP) versus marketing SMS
- When auditing an existing SMS program for compliance issues
- When handling STOP/HELP/UNSUBSCRIBE keywords as required by carriers

## Core Instructions

1. **Collect compliant opt-in consent at checkout**

   TCPA requires explicit written consent for marketing SMS that is separate from transactional consent. Never pre-check the opt-in box:

   ```tsx
   // Checkout SMS opt-in component
   export function SmsOptIn({ phone, onChange }: { phone: string; onChange: (v: boolean) => void }) {
     return (
       <div className="sms-opt-in">
         <label>
           <input
             type="checkbox"
             defaultChecked={false}  // NEVER pre-checked
             onChange={(e) => onChange(e.target.checked)}
           />
           <span>
             Text me order updates and exclusive offers. Message and data rates may apply.
             Reply STOP to unsubscribe at any time.{' '}
             <a href="/privacy">Privacy Policy</a>
           </span>
         </label>
       </div>
     );
   }
   ```

   Persist consent with a full audit trail:

   ```typescript
   async function recordSmsConsent(params: {
     customerId: string;
     phone: string;
     consentType: 'marketing' | 'transactional';
     consentSource: 'checkout' | 'popup' | 'keyword';
     ipAddress: string;
     userAgent: string;
   }) {
     await db.smsConsent.create({
       ...params,
       phone: normalizePhone(params.phone), // E.164 format: +12125551234
       consentGivenAt: new Date(),
       active: true,
     });
   }

   function normalizePhone(phone: string): string {
     const digits = phone.replace(/\D/g, '');
     if (digits.length === 10) return `+1${digits}`;
     if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
     return `+${digits}`;
   }
   ```

2. **Send via Twilio with opt-out enforcement**

   ```bash
   npm install twilio
   ```

   ```typescript
   import twilio from 'twilio';

   const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

   async function sendMarketingSMS(phone: string, body: string, customerId: string): Promise<boolean> {
     // Always check opt-in status before sending
     const consent = await db.smsConsent.findActive(phone, 'marketing');
     if (!consent) {
       console.warn(`SMS suppressed for ${phone} — no active marketing consent`);
       return false;
     }

     // Check quiet hours: no marketing SMS between 9pm–9am local time
     if (isQuietHours(phone)) {
       // Queue for next morning instead
       await smsQueue.add('send', { phone, body, customerId }, { delay: msUntilMorning(phone) });
       return false;
     }

     const message = await client.messages.create({
       from: process.env.TWILIO_PHONE_NUMBER,
       to: phone,
       body: `${body}\n\nReply STOP to unsubscribe`,
     });

     await db.smsLog.create({ customerId, phone, body, twilioSid: message.sid, sentAt: new Date() });
     return true;
   }
   ```

3. **Handle STOP, HELP, and UNSTOP keywords automatically**

   Carriers require you to honor STOP/HELP/UNSTOP. Twilio can forward inbound messages to your webhook:

   ```typescript
   // POST /api/sms/inbound — Twilio webhook
   import { twiml } from 'twilio';

   export async function handleInboundSMS(req: Request, res: Response) {
     const { From: from, Body: body } = req.body;
     const keyword = body.trim().toUpperCase();

     if (['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'].includes(keyword)) {
       await db.smsConsent.deactivateAll(from);
       const response = new twiml.MessagingResponse();
       response.message('You have been unsubscribed from marketing messages. Reply START to resubscribe.');
       res.type('text/xml').send(response.toString());

     } else if (keyword === 'HELP') {
       const response = new twiml.MessagingResponse();
       response.message(`${process.env.STORE_NAME} marketing alerts. Msg&Data rates may apply. Reply STOP to unsubscribe or visit ${process.env.STORE_URL}/sms-help`);
       res.type('text/xml').send(response.toString());

     } else if (['START', 'UNSTOP', 'YES'].includes(keyword)) {
       await db.smsConsent.reactivate(from, 'marketing');
       const response = new twiml.MessagingResponse();
       response.message('You have been re-subscribed to marketing messages. Reply STOP at any time to unsubscribe.');
       res.type('text/xml').send(response.toString());

     } else {
       // Customer-initiated conversation — route to support
       await supportQueue.add('sms', { from, body });
       res.sendStatus(200);
     }
   }
   ```

4. **Segment subscribers for targeted campaigns**

   ```typescript
   interface SMSSegment {
     name: string;
     query: (db: DB) => Promise<string[]>; // Returns array of phone numbers
   }

   const SEGMENTS: SMSSegment[] = [
     {
       name: 'high_value_customers',
       query: (db) => db.customers.findPhonesWhere({
         lifetimeSpend: { gte: 500 },
         smsMarketingOptIn: true,
       }),
     },
     {
       name: 'lapsed_30_60_days',
       query: (db) => db.customers.findPhonesWhere({
         lastOrderAt: { lt: subDays(new Date(), 30), gte: subDays(new Date(), 60) },
         smsMarketingOptIn: true,
       }),
     },
     {
       name: 'browse_abandoners_no_cart',
       query: (db) => db.sessions.findPhonesForBrowseAbandon({ withinHours: 4 }),
     },
   ];

   async function sendCampaignToSegment(segmentName: string, message: string) {
     const segment = SEGMENTS.find((s) => s.name === segmentName);
     if (!segment) throw new Error(`Unknown segment: ${segmentName}`);

     const phones = await segment.query(db);
     console.log(`Sending to ${phones.length} subscribers in segment "${segmentName}"`);

     // Rate limit: Twilio allows ~1 msg/sec on standard numbers; use short codes for bulk
     for (const phone of phones) {
       await sendMarketingSMS(phone, message, await getCustomerIdByPhone(phone));
       await delay(100); // 10 msgs/sec to stay within Twilio limits
     }
   }
   ```

5. **Implement quiet hours based on recipient timezone**

   ```typescript
   import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
   import { lookup as lookupTimezone } from 'zipcode-to-timezone';

   function isQuietHours(phone: string): boolean {
     // TCPA quiet hours: before 8am and after 9pm in recipient's local time
     const customer = customerCache.get(phone);
     if (!customer?.zipCode) return false;

     const tz = lookupTimezone(customer.zipCode) ?? 'America/New_York';
     const localHour = utcToZonedTime(new Date(), tz).getHours();
     return localHour < 8 || localHour >= 21;
   }

   function msUntilMorning(phone: string): number {
     const customer = customerCache.get(phone);
     const tz = customer?.zipCode ? (lookupTimezone(customer.zipCode) ?? 'America/New_York') : 'America/New_York';
     const localNow = utcToZonedTime(new Date(), tz);
     const morning = new Date(localNow);
     morning.setHours(9, 0, 0, 0);
     if (localNow.getHours() >= 21) morning.setDate(morning.getDate() + 1);
     return zonedTimeToUtc(morning, tz).getTime() - Date.now();
   }
   ```

## Examples

### Transactional SMS for order shipped

Transactional SMS (not marketing) does not require opt-in but should still allow opt-out:

```typescript
async function sendShippingNotificationSMS(order: Order) {
  // Transactional — only check transactional opt-out (different from marketing)
  const optedOut = await db.smsConsent.isOptedOut(order.customerPhone, 'transactional');
  if (optedOut) return;

  await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to: normalizePhone(order.customerPhone),
    body: `Your ${process.env.STORE_NAME} order #${order.number} shipped! Track it: ${order.trackingUrl}\n\nReply STOP to opt out of order texts.`,
  });
}
```

### GDPR-compliant data export for SMS consent

For EU customers, provide a consent audit trail on request:

```typescript
async function exportSMSConsentForCustomer(customerId: string) {
  const records = await db.smsConsent.findByCustomer(customerId);
  return records.map((r) => ({
    phone: r.phone,
    consentType: r.consentType,
    consentSource: r.consentSource,
    consentGivenAt: r.consentGivenAt.toISOString(),
    revokedAt: r.revokedAt?.toISOString() ?? null,
    ipAddress: r.ipAddress,
  }));
}
```

## Best Practices

- **Store consent with full audit trail** — TCPA requires you to prove consent if challenged; store timestamp, IP, source, and the exact consent language shown
- **Never send marketing SMS before 8am or after 9pm** in the recipient's local timezone — this is a TCPA requirement, not just a best practice
- **Keep messages under 160 characters** to avoid carrier segmentation into multi-part messages that cost more and may arrive out of order
- **Always include STOP instructions** in every marketing message — many carriers require it, and it's best practice regardless
- **Use a dedicated short code** for volume over 1,000 messages/day — 10DLC registration is required in the US for all application-to-person messaging on long codes
- **Register 10DLC before sending** — US carriers block unregistered traffic; register your brand and campaign at the Campaign Registry before going live
- **Separate marketing and transactional consent** — customers who opt out of marketing SMS should still receive order confirmation and shipping texts

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Messages blocked by carriers | Complete 10DLC brand and campaign registration; ensure message content matches the registered use case |
| STOP messages not being honored | Configure a Twilio inbound webhook and process STOP keywords; Twilio also auto-handles STOP at the carrier level for registered numbers |
| Quiet hours violation — messages sent at 6am local time | Store recipient timezone at opt-in time and check it before every send; use a job queue with scheduled send times |
| Consent record lost after customer data migration | Export and import the `smsConsent` table as part of any migration; never regenerate consent records |
| Multi-part SMS sent for 161-character message | Preview and count characters server-side before sending; emoji count as 2 characters and trigger UCS-2 encoding which halves the 160-char limit |

## Related Skills

- @email-marketing-automation
- @cart-abandonment-recovery
- @push-notifications
- @customer-segmentation
- @affiliate-program
