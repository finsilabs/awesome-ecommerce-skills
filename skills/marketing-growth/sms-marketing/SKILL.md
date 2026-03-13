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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# SMS Marketing

## Overview

SMS marketing achieves 98% open rates and click-through rates 5–10× higher than email, making it one of the highest-performing direct channels for ecommerce. However, SMS is heavily regulated — TCPA in the US requires explicit written consent, and violations carry fines up to $1,500 per message. Dedicated SMS apps (Postscript, Attentive, Klaviyo SMS) handle compliance, opt-in flows, and 10DLC registration automatically. Custom Twilio implementation is only needed for headless stores.

## When to Use This Skill

- When launching an SMS marketing channel alongside existing email automation
- When needing TCPA-compliant opt-in flows at checkout and via pop-ups
- When wanting to segment SMS campaigns by purchase history, lifecycle stage, or location
- When sending transactional SMS (shipping updates) vs. marketing SMS to different opt-in lists
- When auditing an existing SMS program for compliance issues

## Core Instructions

### Step 1: Choose the right SMS platform

| Platform | Best For | Shopify | WooCommerce | BigCommerce | Price |
|----------|---------|---------|-------------|-------------|-------|
| **Postscript** | Shopify-native, segmentation + flows | App Store | — | — | Free tier; $100+/mo |
| **Attentive** | Mid-market, advanced A/B testing | App Store | Via integration | Via integration | $400+/mo |
| **Klaviyo SMS** | Already using Klaviyo for email | App Store | Plugin | App Marketplace | Adds to Klaviyo plan |
| **SMSBump (Yotpo SMS)** | WooCommerce + Shopify | App Store | Plugin | — | Free tier; $19+/mo |
| **Twilio** | Custom/headless, developer-controlled | Via API | Via API | Via API | Pay-per-message |

**Recommendation:** Use **Postscript** for Shopify and **SMSBump** for WooCommerce. If already using Klaviyo, add Klaviyo SMS to keep campaigns and flows in one platform. Use Twilio only for headless stores where you need full programmatic control.

### Step 2: Set up SMS opt-in

---

#### Shopify with Postscript

1. Install **Postscript** from the Shopify App Store
2. Go to **Postscript → Keywords** and set up your opt-in keyword (e.g., "JOIN") — customers text this to your Postscript number to subscribe
3. Go to **Postscript → Sign-up Units** to add opt-in forms:
   - **Checkout opt-in**: Postscript adds a checkbox at checkout automatically — configure the consent language under **Settings → Checkout**
   - **Pop-up**: create a timed pop-up offering a discount (e.g., "Get 10% off — text JOIN to [number]")
4. Important compliance settings under **Postscript → Settings → Compliance**:
   - Confirm the consent language is displayed: "By subscribing, you agree to receive marketing texts. Reply STOP to unsubscribe."
   - Never pre-check the SMS opt-in box at checkout — TCPA requires un-checked by default
5. Go to **Postscript → Flows** to build automated sequences:
   - **Welcome series**: triggered on opt-in — immediate welcome message + discount code
   - **Cart abandonment**: triggered when Shopify detects an abandoned checkout (different from email; can send even without email)
   - **Browse abandonment**: triggered by high-intent browsing + no purchase within 4 hours

---

#### WooCommerce with SMSBump

1. Install **SMSBump** (now Yotpo SMS) from the WordPress plugin directory
2. Go to **SMSBump → Settings → Compliance** and configure the checkout opt-in field
3. Go to **SMSBump → Automations** to enable:
   - Cart abandonment SMS
   - Order confirmation and shipping update SMS (transactional)
   - Win-back SMS (customers who haven't purchased in 60+ days)
4. For GDPR compliance: SMSBump includes a double opt-in flow for EU subscribers — enable this under **Settings → Compliance → Double Opt-in**

---

#### BigCommerce with Klaviyo SMS

1. Install **Klaviyo** from the BigCommerce App Marketplace
2. Go to **Klaviyo → SMS → Getting Started** and complete the 10DLC registration (Klaviyo walks you through this)
3. Add an SMS opt-in field to your checkout via **BigCommerce Admin → Store Setup → Checkout**
4. Build SMS flows in **Klaviyo → Flows** — SMS can be added to any existing email flow as an additional channel

---

#### Custom / Headless

For headless stores, use Twilio. Compliance must be built into your application logic:

```typescript
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendMarketingSMS(phone: string, body: string, customerId: string): Promise<boolean> {
  // ALWAYS check consent before sending — never skip this check
  const consent = await db.smsConsent.findActive(phone, 'marketing');
  if (!consent) {
    console.warn(`SMS suppressed for ${phone} — no active marketing consent`);
    return false;
  }

  // TCPA: no marketing SMS before 8am or after 9pm in recipient's local time
  if (isQuietHours(phone, consent.zipCode)) {
    await smsQueue.add('send', { phone, body, customerId }, { delay: msUntilMorning(phone, consent.zipCode) });
    return false;
  }

  await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
    body: `${body}\n\nReply STOP to unsubscribe`,
  });

  return true;
}

// Handle STOP/HELP/UNSTOP via Twilio webhook — required by carriers
export async function handleInboundSMS(req: Request, res: Response) {
  const { From: from, Body: body } = req.body;
  const keyword = body.trim().toUpperCase();

  if (['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'].includes(keyword)) {
    await db.smsConsent.deactivateAll(from);
    // Twilio also auto-handles STOP at the carrier level for registered numbers
  } else if (keyword === 'HELP') {
    // Required: explain how to opt out
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: from,
      body: `${process.env.STORE_NAME} alerts. Msg&Data rates apply. Reply STOP to unsubscribe.`,
    });
  } else if (['START', 'UNSTOP', 'YES'].includes(keyword)) {
    await db.smsConsent.reactivate(from, 'marketing');
  }

  res.sendStatus(200);
}
```

**Important for custom Twilio implementations:** Register your brand and campaign through the **Campaign Registry (TCR)** before sending. US carriers block unregistered 10DLC traffic. Twilio's console guides you through this under **Messaging → Regulatory Compliance → 10DLC**.

### Step 3: Consent compliance requirements

**TCPA (US) requirements — non-negotiable:**
1. Opt-in checkbox must be **unchecked by default** at checkout
2. Consent language must appear **adjacent to the checkbox** (not in fine print)
3. Required consent language: "By checking this box, you agree to receive marketing texts from [Store Name] at the number provided. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe."
4. You must honor STOP within 10 business days (dedicated SMS apps do this automatically)
5. No marketing SMS before 8am or after 9pm in the recipient's local timezone

**GDPR (EU) requirements:**
- Same opt-in standards as TCPA plus explicit consent documentation
- Provide a data export mechanism (consent record with timestamp, IP, exact consent language)
- Double opt-in is required for EU subscribers in many countries

All major SMS apps (Postscript, SMSBump, Klaviyo SMS) handle these compliance requirements automatically. If using Twilio directly, you must build this yourself.

### Step 4: Campaign segmentation

The highest-ROI SMS segments:

| Segment | Message | Expected CTR |
|---------|---------|-------------|
| Cart abandoners (1–4 hours) | "You left something behind: [cart link]" | 15–25% |
| VIP customers (top 20% LTV) | Early access to sales and new arrivals | 20–30% |
| Lapsed customers (60–90 days) | Win-back offer with discount | 8–15% |
| Post-purchase cross-sell (7 days after delivery) | "Other customers who bought X also love Y" | 10–20% |

In Postscript: build segments under **Postscript → Segments** using order history, purchase frequency, and LTV filters.
In Klaviyo SMS: add an SMS step to your existing email segments — the audience targeting is identical.

### Step 5: Measure SMS performance

| Metric | Healthy Target | Where to Find |
|--------|----------------|---------------|
| Opt-in rate at checkout | 5–15% of customers | App analytics |
| Click-through rate (campaigns) | 8–20% | App analytics |
| Opt-out rate per campaign | < 2% | App analytics — pause if above 3% |
| Revenue per subscriber per month | $3–$10 | Calculate: SMS-attributed revenue ÷ subscribers |
| Unsubscribe rate (total) | < 5% per month | App analytics |

## Best Practices

- **Separate marketing and transactional consent** — customers who opt out of marketing SMS should still receive order confirmation and shipping texts; these are different consent types
- **Never send more than 2–3 marketing SMS per week** — SMS is the most intrusive channel; high frequency causes unsubscribes faster than any other channel
- **Keep messages under 160 characters** to avoid multi-part messages — emoji count as 2 characters and trigger UCS-2 encoding, halving the 160-character limit
- **Always include STOP instructions** in every marketing message — most apps do this automatically; verify it is there
- **Register 10DLC before going live** — US carriers block unregistered traffic; registration takes 1–2 weeks through your SMS platform

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Messages blocked by carriers | Complete 10DLC brand and campaign registration through your SMS platform before sending |
| STOP not being honored | Dedicated SMS apps handle this automatically; for custom Twilio, configure the inbound webhook |
| Quiet hours violation | Use your SMS platform's built-in quiet hours setting; for Twilio, implement timezone-based scheduling |
| Checkbox pre-checked at checkout | This violates TCPA — change to unchecked by default immediately; it is a legal requirement, not a preference |
| Multi-part SMS for 161-character message | Count characters server-side before sending; use a URL shortener for cart links |

## Related Skills

- @email-marketing-automation
- @cart-abandonment-recovery
- @cart-recovery-sms
- @push-notifications
- @customer-segmentation
