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
platforms: [platform-agnostic]
difficulty: beginner
---

# Email Service Integration

## Overview

Transactional emails — order confirmations, shipping notifications, password resets, and account alerts — are critical customer touchpoints that must arrive instantly and reliably. Integrating a transactional email service (SendGrid, Amazon SES, Postmark) requires setting up API authentication, configuring SPF/DKIM/DMARC DNS records for deliverability, building reusable email templates, and handling bounces and delivery events via webhooks. This skill covers setup for all three providers and common patterns for React-based email rendering.

## When to Use This Skill

- When setting up transactional email for a new e-commerce application
- When emails are landing in spam due to missing SPF, DKIM, or DMARC records
- When migrating from a platform's built-in email to a dedicated transactional service
- When building custom email templates that match your brand identity
- When tracking email delivery, open rates, and bounces for transactional emails

## Prerequisites & Platform Notes

**Shopify**: Shopify supports webhooks, the Admin API, and app extensions for integrations. Use Shopify Flow or custom apps to connect third-party services.
**WooCommerce**: Use WooCommerce REST API and WordPress hooks for integrations. Connect via plugins or custom PHP code.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: API credentials for both your store and the external service

## Core Instructions

1. **Configure DNS records for email deliverability**

   SPF, DKIM, and DMARC are mandatory for inbox delivery. Configure them in your DNS provider before sending any emails:

   ```dns
   ; SPF — authorize your sending domain and email service
   mystore.com.  IN TXT  "v=spf1 include:sendgrid.net include:amazonses.com ~all"

   ; DKIM — add the keys provided by your email service
   ; SendGrid provides 2 CNAME records:
   s1._domainkey.mystore.com  IN CNAME  s1.domainkey.u12345.wl.sendgrid.net.
   s2._domainkey.mystore.com  IN CNAME  s2.domainkey.u12345.wl.sendgrid.net.

   ; DMARC — tell receivers what to do with unauthenticated emails
   _dmarc.mystore.com  IN TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@mystore.com; pct=100"
   ; Start with p=none, monitor reports, then escalate to p=quarantine and p=reject
   ```

   Verify setup:
   ```bash
   dig TXT mystore.com | grep spf
   dig CNAME s1._domainkey.mystore.com
   # Use https://mxtoolbox.com/SuperTool.aspx for visual verification
   ```

2. **Set up SendGrid with the Node.js SDK**

   ```bash
   npm install @sendgrid/mail
   ```

   ```typescript
   // lib/email/sendgrid.ts
   import sgMail from '@sendgrid/mail';

   sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

   export interface EmailMessage {
     to: string | string[];
     subject: string;
     templateId?: string;
     dynamicTemplateData?: Record<string, any>;
     html?: string;
     text?: string;
     from?: {email: string; name: string};
     replyTo?: string;
     attachments?: Array<{content: string; filename: string; type: string}>;
   }

   export async function sendEmail(message: EmailMessage): Promise<void> {
     await sgMail.send({
       to: message.to,
       from: message.from ?? {email: 'noreply@mystore.com', name: 'My Store'},
       subject: message.subject,
       templateId: message.templateId,
       dynamicTemplateData: message.dynamicTemplateData,
       html: message.html,
       text: message.text,
       replyTo: message.replyTo,
       attachments: message.attachments,
       trackingSettings: {
         clickTracking: {enable: false, enableText: false}, // Disable for transactional
         openTracking: {enable: true},
       },
     });
   }
   ```

3. **Set up Amazon SES**

   ```bash
   npm install @aws-sdk/client-sesv2
   ```

   ```typescript
   // lib/email/ses.ts
   import {SESv2Client, SendEmailCommand} from '@aws-sdk/client-sesv2';

   const ses = new SESv2Client({region: process.env.AWS_REGION ?? 'us-east-1'});

   export async function sendEmailSES(message: EmailMessage): Promise<string> {
     const command = new SendEmailCommand({
       FromEmailAddress: message.from?.email ?? 'noreply@mystore.com',
       Destination: {ToAddresses: Array.isArray(message.to) ? message.to : [message.to]},
       Content: {
         Simple: {
           Subject: {Data: message.subject, Charset: 'UTF-8'},
           Body: {
             Html: {Data: message.html ?? '', Charset: 'UTF-8'},
             Text: {Data: message.text ?? '', Charset: 'UTF-8'},
           },
         },
       },
       ConfigurationSetName: 'commerce-transactional', // For event tracking
     });

     const result = await ses.send(command);
     return result.MessageId ?? '';
   }

   // Verify a sending domain in SES
   export async function verifyDomain(domain: string) {
     const {SESv2Client, CreateEmailIdentityCommand} = await import('@aws-sdk/client-sesv2');
     const command = new CreateEmailIdentityCommand({EmailIdentity: domain});
     const result = await ses.send(command);
     console.log('Add these DNS records:', result.DkimAttributes);
   }
   ```

4. **Build email templates with React Email**

   React Email lets you build email templates as React components with full TypeScript support:

   ```bash
   npm install @react-email/components react react-dom
   npm install -D @react-email/render
   ```

   ```tsx
   // emails/order-confirmation.tsx
   import {
     Body, Container, Head, Heading, Html, Img,
     Link, Preview, Section, Text, Row, Column,
   } from '@react-email/components';

   interface OrderConfirmationProps {
     orderNumber: string;
     customerName: string;
     items: Array<{name: string; quantity: number; price: string; imageUrl: string}>;
     subtotal: string;
     shipping: string;
     total: string;
     trackingUrl?: string;
     shippingAddress: {name: string; street: string; city: string; country: string};
   }

   export function OrderConfirmationEmail({
     orderNumber, customerName, items, subtotal, shipping, total, shippingAddress, trackingUrl,
   }: OrderConfirmationProps) {
     return (
       <Html>
         <Head />
         <Preview>Your order #{orderNumber} is confirmed</Preview>
         <Body style={{backgroundColor: '#f4f4f4', fontFamily: 'Arial, sans-serif'}}>
           <Container style={{maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', padding: '20px'}}>
             <Heading style={{color: '#1a1a1a'}}>Order Confirmed</Heading>
             <Text>Hi {customerName}, your order #{orderNumber} has been received.</Text>

             {items.map((item, i) => (
               <Row key={i} style={{borderBottom: '1px solid #eee', padding: '10px 0'}}>
                 <Column style={{width: '60px'}}>
                   <Img src={item.imageUrl} width={50} height={50} alt={item.name} />
                 </Column>
                 <Column>
                   <Text style={{margin: 0, fontWeight: 'bold'}}>{item.name}</Text>
                   <Text style={{margin: 0, color: '#666'}}>Qty: {item.quantity}</Text>
                 </Column>
                 <Column style={{textAlign: 'right'}}>
                   <Text style={{margin: 0}}>{item.price}</Text>
                 </Column>
               </Row>
             ))}

             <Section style={{marginTop: '20px'}}>
               <Text>Subtotal: {subtotal}</Text>
               <Text>Shipping: {shipping}</Text>
               <Text style={{fontWeight: 'bold', fontSize: '18px'}}>Total: {total}</Text>
             </Section>

             {trackingUrl && (
               <Section>
                 <Link href={trackingUrl} style={{backgroundColor: '#1a1a1a', color: '#fff', padding: '12px 24px', borderRadius: '4px', textDecoration: 'none'}}>
                   Track Your Order
                 </Link>
               </Section>
             )}
           </Container>
         </Body>
       </Html>
     );
   }
   ```

5. **Render and send React email templates**

   ```typescript
   // lib/email/send-order-confirmation.ts
   import {render} from '@react-email/render';
   import {OrderConfirmationEmail} from '../../emails/order-confirmation';
   import {sendEmail} from './sendgrid';

   export async function sendOrderConfirmation(order: Order) {
     const html = await render(
       OrderConfirmationEmail({
         orderNumber: order.number.toString(),
         customerName: order.customer.firstName,
         items: order.lineItems.map(item => ({
           name: item.productName,
           quantity: item.quantity,
           price: formatCurrency(item.totalCents, order.currency),
           imageUrl: item.imageUrl ?? 'https://mystore.com/placeholder.png',
         })),
         subtotal: formatCurrency(order.subtotalCents, order.currency),
         shipping: formatCurrency(order.shippingCents, order.currency),
         total: formatCurrency(order.totalCents, order.currency),
         shippingAddress: order.shippingAddress,
         trackingUrl: order.trackingUrl,
       })
     );

     const text = await render(OrderConfirmationEmail({...}), {plainText: true});

     await sendEmail({
       to: order.customer.email,
       subject: `Your order #${order.number} is confirmed`,
       html,
       text,
     });
   }
   ```

6. **Handle bounce and complaint webhooks**

   Failed deliveries and spam complaints must be tracked to maintain sender reputation:

   ```typescript
   // app/api/webhooks/sendgrid/route.ts
   export async function POST(req: NextRequest) {
     const events: any[] = await req.json();

     for (const event of events) {
       switch (event.event) {
         case 'bounce':
           await db.emailSuppressions.upsert({
             email: event.email.toLowerCase(),
             type: 'hard_bounce',
             reason: event.reason,
             suppressedAt: new Date(event.timestamp * 1000),
           });
           await db.customers.updateEmailStatus(event.email, 'bounced');
           break;

         case 'spamreport':
           await db.emailSuppressions.upsert({
             email: event.email.toLowerCase(),
             type: 'spam_complaint',
             suppressedAt: new Date(event.timestamp * 1000),
           });
           await db.customers.updateEmailStatus(event.email, 'spam_complaint');
           break;

         case 'unsubscribe':
           await db.customers.updateEmailConsent(event.email, {marketing: false});
           break;

         case 'delivered':
           await db.emailDeliveries.update(event.sg_message_id, {status: 'delivered', deliveredAt: new Date(event.timestamp * 1000)});
           break;
       }
     }

     return NextResponse.json({received: true});
   }

   // Always check suppression list before sending
   export async function canSendEmail(email: string, type: 'transactional' | 'marketing'): Promise<boolean> {
     const suppression = await db.emailSuppressions.findByEmail(email.toLowerCase());
     if (!suppression) return true;

     // Hard bounces block all emails (mailbox doesn't exist)
     if (suppression.type === 'hard_bounce') return false;

     // Spam complaints and unsubscribes only block marketing
     if (type === 'marketing') return false;

     return true;
   }
   ```

## Examples

### Postmark integration for high-deliverability transactional email

```typescript
// Postmark is optimized for transactional email with dedicated IP pools
import {ServerClient} from 'postmark';

const postmark = new ServerClient(process.env.POSTMARK_API_TOKEN!);

export async function sendViaPostmark(message: EmailMessage) {
  return postmark.sendEmail({
    From: 'noreply@mystore.com',
    To: Array.isArray(message.to) ? message.to.join(', ') : message.to,
    Subject: message.subject,
    HtmlBody: message.html,
    TextBody: message.text,
    MessageStream: 'outbound', // Use 'broadcasts' for marketing emails
    TrackOpens: true,
    TrackLinks: 'None',        // Don't wrap links in transactional emails
  });
}

// Use Postmark's template API for managed templates
export async function sendPostmarkTemplate(to: string, templateAlias: string, templateModel: Record<string, any>) {
  return postmark.sendEmailWithTemplate({
    From: 'noreply@mystore.com',
    To: to,
    TemplateAlias: templateAlias,
    TemplateModel: templateModel,
    MessageStream: 'outbound',
  });
}
```

### Preview emails locally with React Email

```bash
# Start the React Email preview server
npx email dev

# Opens http://localhost:3000 with live preview of all email templates
# Renders across different email clients via preview mode
```

## Best Practices

- **Use separate sending domains for transactional and marketing emails** — bounces and spam complaints from marketing campaigns should not affect your transactional domain reputation
- **Always include a plain-text version** — many email clients prefer plain text; missing it can trigger spam filters
- **Suppress hard bounced addresses immediately** — sending to hard bounced addresses harms your sender reputation; update your database and never send to them again
- **Never track clicks in transactional emails** — link tracking wraps URLs in redirects; in order confirmation and password reset emails this can look suspicious and break security tools
- **Test your templates across email clients** — Outlook, Gmail, and Apple Mail render HTML very differently; use Litmus or Email on Acid to test rendering before deploying
- **Implement rate limiting on email sends** — a bug that triggers thousands of order confirmation emails will exhaust your daily quota; add per-customer and per-order deduplication
- **Use dedicated IPs for high-volume senders** — shared IPs can be affected by other senders' spam; request dedicated IPs from SendGrid or SES when sending more than 100,000 emails/month

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Emails landing in spam despite SPF/DKIM | Check DMARC alignment; ensure your `From:` domain matches the domain in DKIM `d=` tag; also check email content for spam trigger words |
| SES sandbox mode blocking delivery | New SES accounts start in sandbox mode; request production access via AWS Support before going live |
| Duplicate order confirmation emails | Implement idempotent sending: store `email_id = hash(order_id + template_name)` and check before sending |
| React Email CSS not supported in Outlook | Use inline styles for everything; Outlook ignores `<style>` blocks; `@react-email/components` handles this correctly for its built-in components |
| Unsubscribe link missing from marketing emails | Under CAN-SPAM and GDPR, all marketing emails must include a working unsubscribe link; transactional emails are exempt but should still offer preference management |

## Related Skills

- @gdpr-ecommerce
- @webhook-architecture
- @analytics-integration
- @account-security
