---
name: email-marketing-automation
description: "Triggered email flows — welcome, post-purchase, win-back, browse abandonment"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [email, automation, klaviyo, sendgrid, welcome-series, post-purchase, win-back, browse-abandonment, lifecycle]
triggers: ["email automation", "triggered emails", "welcome email flow", "post-purchase email", "win-back campaign", "browse abandonment email", "email marketing flows"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Email Marketing Automation

## Overview

Triggered email flows automatically send personalized messages based on customer behavior and lifecycle stage, achieving 3–5x higher open rates than broadcast campaigns. This skill covers building four critical flows — welcome series, post-purchase nurture, win-back campaigns, and browse abandonment — using event-driven architecture that integrates with ESP platforms like Klaviyo, SendGrid, or Postmark.

## When to Use This Skill

- When setting up a new store and needing baseline lifecycle email coverage
- When replacing manual one-off campaigns with behavior-triggered sequences
- When recovering revenue from customers who browsed but did not purchase
- When re-engaging lapsed customers who have not ordered in 60–180 days
- When personalizing post-purchase communication to reduce returns and increase LTV
- When an ESP migration requires rebuilding automation logic in custom code

## Core Instructions

1. **Model the email event schema and queue**

   Define a consistent event payload for every triggered email so your sending logic is uniform:

   ```typescript
   interface EmailEvent {
     type: 'welcome' | 'post_purchase' | 'win_back' | 'browse_abandon';
     customerId: string;
     email: string;
     firstName: string;
     payload: Record<string, unknown>; // flow-specific data
     scheduledAt: Date;
     flowStep: number; // 0-indexed step within the flow
   }
   ```

   Use a job queue (BullMQ, SQS, or similar) to schedule delayed sends:

   ```typescript
   import { Queue } from 'bullmq';

   const emailQueue = new Queue('email-flows', {
     connection: { host: process.env.REDIS_HOST, port: 6379 },
   });

   // Schedule a job N milliseconds from now
   async function scheduleEmail(event: EmailEvent, delayMs: number) {
     await emailQueue.add(event.type, event, {
       delay: delayMs,
       jobId: `${event.type}-${event.customerId}-step${event.flowStep}`,
       removeOnComplete: true,
     });
   }
   ```

2. **Build the welcome series (3-step flow)**

   Trigger on `customer.created` or newsletter signup:

   ```typescript
   async function triggerWelcomeSeries(customer: Customer) {
     const steps = [
       { delayMs: 0,              subject: 'Welcome to {{storeName}} — here\'s 10% off' },
       { delayMs: 2 * 86400000,  subject: 'Our bestsellers — picked for you' },
       { delayMs: 7 * 86400000,  subject: 'Behind the brand: our story' },
     ];

     for (const [i, step] of steps.entries()) {
       await scheduleEmail(
         {
           type: 'welcome',
           customerId: customer.id,
           email: customer.email,
           firstName: customer.firstName,
           payload: { discountCode: customer.welcomeCode, step: i },
           scheduledAt: new Date(Date.now() + step.delayMs),
           flowStep: i,
         },
         step.delayMs
       );
     }
   }
   ```

3. **Build the post-purchase flow (4-step)**

   Trigger on `order.paid` webhook. Cancel any pending win-back or browse abandon jobs for this customer:

   ```typescript
   async function triggerPostPurchaseFlow(order: Order) {
     // Cancel win-back jobs — customer converted
     await cancelFlowJobs('win_back', order.customerId);

     const steps = [
       { delayMs: 0,               template: 'order-confirmation' },
       { delayMs: 2 * 86400000,   template: 'shipping-update' },
       { delayMs: 7 * 86400000,   template: 'delivery-check-in' },
       { delayMs: 21 * 86400000,  template: 'review-request' },
     ];

     for (const [i, step] of steps.entries()) {
       await scheduleEmail(
         {
           type: 'post_purchase',
           customerId: order.customerId,
           email: order.customerEmail,
           firstName: order.customerFirstName,
           payload: { orderId: order.id, items: order.lineItems, template: step.template },
           scheduledAt: new Date(Date.now() + step.delayMs),
           flowStep: i,
         },
         step.delayMs
       );
     }
   }
   ```

4. **Build browse abandonment (2-step)**

   Fire this when a customer views a product page but does not add to cart within 30 minutes. Use a debounce pattern — reset the timer on each page view:

   ```typescript
   async function onProductViewed(customerId: string, productId: string) {
     const jobId = `browse_abandon-${customerId}`;

     // Remove any previously queued browse-abandon for this customer
     const existing = await emailQueue.getJob(jobId + '-step0');
     await existing?.remove();

     const product = await db.products.findById(productId);

     await scheduleEmail(
       {
         type: 'browse_abandon',
         customerId,
         email: await getCustomerEmail(customerId),
         firstName: await getCustomerFirstName(customerId),
         payload: { product, relatedProducts: await getRelatedProducts(productId, 4) },
         scheduledAt: new Date(Date.now() + 30 * 60000),
         flowStep: 0,
       },
       30 * 60000
     );

     // Step 2: follow-up 24h later with social proof
     await scheduleEmail(
       { ...baseEvent, payload: { ...baseEvent.payload, withReviews: true }, flowStep: 1 },
       25 * 3600000
     );
   }
   ```

5. **Build win-back campaign (3-step with escalating incentive)**

   Run a nightly cron to identify customers who last ordered 60, 90, or 120 days ago and have no pending win-back job:

   ```typescript
   // cron: 0 8 * * *
   async function enqueueWinBackCandidates() {
     const thresholds = [60, 90, 120]; // days since last order

     for (const days of thresholds) {
       const cutoff = subDays(new Date(), days);
       const customers = await db.customers.findLapsedSince(cutoff, days);

       for (const customer of customers) {
         const step = thresholds.indexOf(days);
         const alreadyQueued = await emailQueue.getJob(`win_back-${customer.id}-step${step}`);
         if (alreadyQueued) continue;

         await scheduleEmail(
           {
             type: 'win_back',
             customerId: customer.id,
             email: customer.email,
             firstName: customer.firstName,
             payload: {
               discount: step === 0 ? 10 : step === 1 ? 15 : 20, // escalating %
               expiresInDays: 7,
             },
             scheduledAt: new Date(),
             flowStep: step,
           },
           0
         );
       }
     }
   }
   ```

6. **Send via ESP and track opens/clicks**

   Worker that processes the queue and calls the ESP API:

   ```typescript
   import { Worker } from 'bullmq';
   import sgMail from '@sendgrid/mail';

   sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

   new Worker('email-flows', async (job) => {
     const event: EmailEvent = job.data;
     const html = await renderTemplate(event.type, event.flowStep, event.payload);

     await sgMail.send({
       to: event.email,
       from: 'hello@yourstore.com',
       subject: getSubject(event.type, event.flowStep, event.payload),
       html,
       customArgs: {
         customer_id: event.customerId,
         flow: event.type,
         step: String(event.flowStep),
       },
     });

     await db.emailLog.create({
       customerId: event.customerId,
       flow: event.type,
       step: event.flowStep,
       sentAt: new Date(),
     });
   }, { connection: { host: process.env.REDIS_HOST, port: 6379 } });
   ```

## Examples

### Cancelling downstream flow steps on conversion

When a browse-abandon customer adds to cart, cancel the remaining browse-abandon emails to avoid irrelevant messages:

```typescript
async function onCartItemAdded(customerId: string) {
  for (let step = 0; step < 3; step++) {
    const job = await emailQueue.getJob(`browse_abandon-${customerId}-step${step}`);
    await job?.remove();
  }
}

// Similarly, cancel win-back if customer places an order
async function onOrderPlaced(customerId: string) {
  for (let step = 0; step < 3; step++) {
    const job = await emailQueue.getJob(`win_back-${customerId}-step${step}`);
    await job?.remove();
  }
}
```

### Klaviyo API integration (alternative to custom queue)

If using Klaviyo as the ESP, trigger flows via the Track API instead of a custom queue:

```typescript
import { ApiClient, EventsApi, EventCreateQueryV2 } from 'klaviyo-api';

ApiClient.instance.authentications['Klaviyo-API-Key'].apiKey = process.env.KLAVIYO_PRIVATE_KEY!;

const eventsApi = new EventsApi();

async function trackKlaviyoEvent(email: string, eventName: string, properties: object) {
  const event: EventCreateQueryV2 = {
    data: {
      type: 'event',
      attributes: {
        metric: { data: { type: 'metric', attributes: { name: eventName } } },
        profile: { data: { type: 'profile', attributes: { email } } },
        properties,
        time: new Date().toISOString(),
      },
    },
  };
  await eventsApi.createEvent(event);
}

// Trigger the Klaviyo "Viewed Product" flow
await trackKlaviyoEvent(customer.email, 'Viewed Product', {
  ProductName: product.name,
  ProductID: product.id,
  Categories: product.categories,
  ImageURL: product.imageUrl,
  URL: product.url,
  Price: product.price,
});
```

## Best Practices

- **Suppress unsubscribes globally** — check opt-out status in the worker before every send, not just at trigger time
- **Use job IDs for deduplication** — a deterministic `jobId` (e.g., `win_back-${customerId}-step0`) prevents duplicate sends if the trigger fires twice
- **Cancel competing flows** — when a customer converts, immediately remove all pending abandonment and win-back jobs
- **Respect quiet hours** — delay sends that fall between 22:00–08:00 in the customer's local timezone
- **Cap total emails per customer per day** — implement a daily send-count guard in the worker (max 2–3 per day per customer)
- **Use preview text** — set the email preheader to complement the subject line; it accounts for ~30% of open-rate lift
- **A/B test subject lines** — split the first 20% of recipients before sending the winner to the rest
- **Monitor bounce and spam rates** — pause flows if spam complaint rate exceeds 0.1% to protect sender reputation

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Customers receive win-back email after placing an order | Cancel win-back queue jobs in the `order.paid` webhook handler before they fire |
| Duplicate emails sent when trigger fires twice (e.g., double webhook) | Use deterministic `jobId` in BullMQ — adding a job with the same ID is a no-op |
| Browse-abandon fires for anonymous visitors | Gate the trigger on a session-linked customer ID; require login or email capture first |
| Email renders broken on Outlook | Use table-based layout and inline CSS; test with Litmus or Email on Acid before activating |
| High unsubscribe rate on win-back step 3 | Reduce cadence — 120-day lapsed customers are cold; lead with value, not just a discount |

## Related Skills

- @cart-abandonment-recovery
- @sms-marketing
- @customer-segmentation
- @customer-lifetime-value
- @push-notifications
