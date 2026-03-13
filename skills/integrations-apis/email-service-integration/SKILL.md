---
name: email-service-integration
description: "Send reliable transactional emails (order confirmations, shipping updates) via SendGrid, SES, or Postmark with templates and deliverability best practices"
category: integrations-apis
risk: safe
source: curated
date_added: "2026-03-12"
tags: [email, sendgrid, ses, postmark, transactional-email, templates, deliverability, spf, dkim, dmarc]
triggers: ["transactional email", "sendgrid integration", "ses email", "postmark email", "email templates", "order confirmation email", "email deliverability"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: beginner
---

# Email Service Integration

## Overview

Transactional emails — order confirmations, shipping notifications, password resets, and account alerts — are critical customer touchpoints that must arrive instantly and reliably. This skill covers setting up email delivery on each platform and integrating dedicated transactional services (SendGrid, Amazon SES, Postmark) with SPF/DKIM/DMARC DNS records for deliverability, reusable templates, and bounce/complaint handling.

## When to Use This Skill

- When setting up transactional email for a new e-commerce store
- When emails are landing in spam due to missing SPF, DKIM, or DMARC records
- When migrating from a platform's built-in email to a dedicated transactional service
- When building custom email templates that match your brand identity
- When tracking email delivery, open rates, and bounces for transactional emails

## Core Instructions

### Step 1: Determine your platform and recommended approach

| Platform | Default Email | Recommended Upgrade |
|----------|--------------|-------------------|
| **Shopify** | Shopify Email (built-in, branded templates, free up to 10K/month) | Customize templates in **Settings → Notifications**; for high volume or advanced flows use **Klaviyo** or **Omnisend** |
| **WooCommerce** | WordPress sends via your hosting server (poor deliverability) | Install **FluentSMTP** (free) to route via SendGrid/SES/Postmark; use **WooCommerce Email Customizer** ($49) for branded templates |
| **BigCommerce** | BigCommerce built-in transactional email (basic templates) | Customize templates in **Marketing → Transactional Emails**; for advanced templates use **Klaviyo BigCommerce integration** |
| **Custom / Headless** | None — you build it | Integrate SendGrid, Postmark, or Amazon SES directly; build templates with React Email; see implementation below |

### Step 2: Platform-specific email setup

---

#### Shopify

**Customize built-in transactional emails:**

1. Go to **Settings → Notifications** in your Shopify admin
2. Click any notification type (Order Confirmation, Shipping Notification, etc.) to open the editor
3. Edit the HTML/Liquid template directly — Shopify provides liquid variables for order data
4. Upload your logo in **Online Store → Themes → Customize → Theme settings → Logo** — it appears automatically in notification emails
5. In **Settings → General**, set your sender email — Shopify authenticates it automatically via SPF/DKIM

**Set up Shopify Email for marketing flows:**

1. Go to **Apps → Shopify Email** (free, included with all plans up to 10,000 emails/month)
2. Build order confirmation, shipping, and post-purchase flows with the drag-and-drop editor
3. For advanced automations (abandoned cart sequences, win-back flows) upgrade to **Klaviyo** (free up to 500 contacts) which has a pre-built Shopify integration

---

#### WooCommerce

**Fix email deliverability with FluentSMTP:**

1. Install **FluentSMTP** (free, wordpress.org) — this replaces WordPress's built-in PHP mail with a dedicated SMTP or API provider
2. Go to **FluentSMTP → Settings → Add New Connection**
3. Choose your provider: **SendGrid** (free tier: 100 emails/day), **Mailgun** (free tier: 1,000 emails/month), or **Amazon SES** ($0.10/1,000 emails)
4. Enter your API key and set **From Name** and **From Email** to match your domain
5. Send a test email from FluentSMTP to verify delivery

**Set up SPF and DKIM for your sending domain:**

Most providers give you specific DNS records to add. For SendGrid:
- Add the two CNAME records SendGrid provides to your DNS (usually in your domain registrar or Cloudflare)
- In SendGrid, verify the domain — this takes up to 48 hours to propagate
- After verification, emails show "via yourdomain.com" in Gmail, not "via sendgrid.net"

**Customize WooCommerce email templates:**

1. Install **Email Customizer for WooCommerce** by ThemeHigh (free tier; Pro from $49)
2. Go to **WooCommerce → Email Customizer** to drag-and-drop your logo, colors, and footer into each email type
3. Or install **Kadence WooCommerce Email Designer** (free) for a live preview editor

---

#### BigCommerce

**Customize transactional email templates:**

1. Go to **Marketing → Transactional Emails** in your BigCommerce admin
2. Click any email type (Order Confirmation, Shipment Notification, etc.) and click **Edit Template**
3. Edit the HTML template using BigCommerce's template variables (e.g., `%%ORDER_NUMBER%%`, `%%TOTAL_COST%%`)
4. In **Store Setup → Store Profile**, set your sending name and reply-to address

**Connect Klaviyo for advanced flows:**

1. Install the **Klaviyo** app from the BigCommerce App Marketplace (free to install)
2. Klaviyo syncs your BigCommerce order and customer data automatically
3. Use Klaviyo's pre-built BigCommerce flows for order confirmation, shipping, and abandoned cart emails

---

#### Custom / Headless

**Configure DNS for deliverability first** — SPF, DKIM, and DMARC are mandatory before any emails reach inboxes:

```dns
; SPF — authorize SendGrid to send on behalf of your domain
mystore.com.  IN TXT  "v=spf1 include:sendgrid.net ~all"

; DKIM — SendGrid provides two CNAME records:
s1._domainkey.mystore.com  IN CNAME  s1.domainkey.u12345.wl.sendgrid.net.
s2._domainkey.mystore.com  IN CNAME  s2.domainkey.u12345.wl.sendgrid.net.

; DMARC — start with p=none to monitor, then escalate to p=quarantine
_dmarc.mystore.com  IN TXT  "v=DMARC1; p=none; rua=mailto:dmarc@mystore.com"
```

Verify with [mxtoolbox.com/SuperTool.aspx](https://mxtoolbox.com/SuperTool.aspx) before sending.

**SendGrid API integration:**

```typescript
// lib/email/sendgrid.ts
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  await sgMail.send({
    to: params.to,
    from: { email: 'orders@mystore.com', name: 'My Store' },
    subject: params.subject,
    html: params.html,
    text: params.text,
    trackingSettings: {
      clickTracking: { enable: false },  // Don't wrap links in transactional emails
      openTracking: { enable: true },
    },
  });
}
```

**Build templates with React Email** (`npm install @react-email/components`):

```tsx
// emails/order-confirmation.tsx
import { Body, Container, Heading, Html, Img, Preview, Section, Text, Row, Column } from '@react-email/components';

export function OrderConfirmationEmail({ orderNumber, customerName, items, total, trackingUrl }) {
  return (
    <Html>
      <Preview>Your order #{orderNumber} is confirmed</Preview>
      <Body style={{ backgroundColor: '#f4f4f4', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#fff', padding: '20px' }}>
          <Heading>Order Confirmed</Heading>
          <Text>Hi {customerName}, your order #{orderNumber} has been received.</Text>
          {items.map((item, i) => (
            <Row key={i} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
              <Column style={{ width: '60px' }}>
                <Img src={item.imageUrl} width={50} height={50} alt={item.name} />
              </Column>
              <Column>
                <Text style={{ margin: 0, fontWeight: 'bold' }}>{item.name}</Text>
                <Text style={{ margin: 0, color: '#666' }}>Qty: {item.quantity}</Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ margin: 0 }}>{item.price}</Text>
              </Column>
            </Row>
          ))}
          <Section style={{ marginTop: '20px' }}>
            <Text style={{ fontWeight: 'bold', fontSize: '18px' }}>Total: {total}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

**Render and send:**

```typescript
import { render } from '@react-email/render';
import { OrderConfirmationEmail } from '../../emails/order-confirmation';
import { sendEmail } from './sendgrid';

export async function sendOrderConfirmation(order: Order) {
  const html = await render(OrderConfirmationEmail({ ...orderData }));
  const text = await render(OrderConfirmationEmail({ ...orderData }), { plainText: true });

  await sendEmail({
    to: order.customer.email,
    subject: `Your order #${order.number} is confirmed`,
    html,
    text,
  });
}
```

**Handle bounces and complaints via webhook:**

```typescript
// POST /api/webhooks/sendgrid
export async function POST(req: NextRequest) {
  const events = await req.json();
  for (const event of events) {
    if (event.event === 'bounce') {
      await db.emailSuppressions.upsert({ email: event.email, type: 'hard_bounce' });
    }
    if (event.event === 'spamreport') {
      await db.emailSuppressions.upsert({ email: event.email, type: 'spam_complaint' });
    }
  }
  return NextResponse.json({ received: true });
}

// Check suppression list before every send
export async function canSendEmail(email: string): Promise<boolean> {
  const suppression = await db.emailSuppressions.findByEmail(email.toLowerCase());
  return !suppression; // Never send to hard bounced or spam-complaint addresses
}
```

## Best Practices

- **Use separate sending domains for transactional and marketing emails** — bounces and spam complaints from marketing campaigns should not affect your transactional domain reputation
- **Always include a plain-text version** — missing plain text can trigger spam filters; React Email renders it automatically with `{ plainText: true }`
- **Suppress hard bounced addresses immediately** — sending to non-existent addresses harms your sender reputation; store and check suppressions before every send
- **Never track clicks in transactional emails** — link tracking wraps URLs in redirects, which can look suspicious in password reset and order confirmation emails
- **Test rendering across email clients** — Outlook, Gmail, and Apple Mail render HTML very differently; use **Litmus** or **Email on Acid** to validate before deploying templates

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| WooCommerce emails going to spam | Install FluentSMTP to send via SendGrid or SES; WordPress's default PHP mail has no SPF/DKIM and almost always gets marked as spam |
| SES sandbox blocking delivery | New AWS accounts start in SES sandbox mode — request production access via AWS Support before going live |
| Duplicate order confirmation emails | Implement idempotent sending: `emailId = hash(orderId + 'order-confirmation')` and check before sending |
| Emails landing in spam despite SPF/DKIM | Check DMARC alignment; your `From:` domain must match the domain in the DKIM `d=` tag |
| React Email CSS broken in Outlook | Use inline styles for everything; Outlook ignores `<style>` blocks; `@react-email/components` handles this for built-in components |

## Related Skills

- @gdpr-ecommerce
- @webhook-architecture
- @analytics-integration
