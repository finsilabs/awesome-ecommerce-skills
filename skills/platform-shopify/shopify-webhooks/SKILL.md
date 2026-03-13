---
name: shopify-webhooks
description: "Register, verify, and reliably process Shopify webhook events for orders, inventory, and customers with HMAC validation and idempotency handling"
category: platform-shopify
risk: safe
source: curated
date_added: "2026-03-12"
tags: [shopify, webhooks, hmac, event-processing, idempotency, gdpr, pub-sub]
triggers: ["shopify webhooks", "shopify webhook verification", "shopify webhook handler", "shopify event processing", "shopify gdpr webhooks"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify]
difficulty: intermediate
---

# Shopify Webhooks

## Overview

Shopify webhooks deliver real-time event notifications to your app's HTTP endpoints when store events occur — orders placed, products updated, customers created, apps uninstalled. Every webhook payload includes an HMAC-SHA256 signature in the `X-Shopify-Hmac-SHA256` header that must be verified before processing. Shopify guarantees at-least-once delivery, so handlers must be idempotent.

## When to Use This Skill

- When triggering fulfillment workflows the moment an order is paid
- When syncing product or inventory changes to an external system in near real time
- When sending customer data to a marketing automation platform upon registration
- When cleaning up app data after a merchant uninstalls the app (`app/uninstalled`)
- When implementing required GDPR webhooks for App Store compliance
- When replacing polling loops that constantly query the Admin API for changes

## Core Instructions

1. **Register webhooks via the Admin API**

   Prefer registering webhooks programmatically in the `afterAuth` hook of your Shopify app. This ensures re-registration after reinstall:

   ```typescript
   // Webhook registration helper
   export async function registerWebhooks(adminClient: GraphqlClient, appUrl: string) {
     const webhooksToRegister = [
       { topic: "ORDERS_CREATE", callbackUrl: `${appUrl}/webhooks/orders-create` },
       { topic: "ORDERS_UPDATED", callbackUrl: `${appUrl}/webhooks/orders-updated` },
       { topic: "PRODUCTS_UPDATE", callbackUrl: `${appUrl}/webhooks/products-update` },
       { topic: "APP_UNINSTALLED", callbackUrl: `${appUrl}/webhooks/app-uninstalled` },
       // Mandatory GDPR webhooks
       { topic: "CUSTOMERS_DATA_REQUEST", callbackUrl: `${appUrl}/webhooks/gdpr/customers-data-request` },
       { topic: "CUSTOMERS_REDACT", callbackUrl: `${appUrl}/webhooks/gdpr/customers-redact` },
       { topic: "SHOP_REDACT", callbackUrl: `${appUrl}/webhooks/gdpr/shop-redact` },
     ];

     for (const { topic, callbackUrl } of webhooksToRegister) {
       const response = await adminClient.request(`
         mutation WebhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
           webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
             webhookSubscription { id topic }
             userErrors { field message }
           }
         }
       `, {
         variables: {
           topic,
           webhookSubscription: {
             callbackUrl,
             format: "JSON",
           },
         },
       });

       const { userErrors } = response.data.webhookSubscriptionCreate;
       if (userErrors.length > 0) {
         // ALREADY_EXISTS is expected on reinstall — not a real error
         const realErrors = userErrors.filter((e: any) => e.message !== "Address for this topic has already been taken");
         if (realErrors.length > 0) throw new Error(`Webhook registration failed: ${realErrors[0].message}`);
       }
     }
   }
   ```

2. **Verify the HMAC signature**

   The most critical step — never process a webhook without verifying its signature:

   ```typescript
   // middleware/verify-shopify-webhook.ts
   import crypto from "crypto";

   export function verifyShopifyWebhook(
     rawBody: Buffer,
     hmacHeader: string,
     secret: string
   ): boolean {
     const digest = crypto
       .createHmac("sha256", secret)
       .update(rawBody)
       .digest("base64");

     // Use timingSafeEqual to prevent timing attacks
     try {
       return crypto.timingSafeEqual(
         Buffer.from(digest),
         Buffer.from(hmacHeader)
       );
     } catch {
       return false;
     }
   }
   ```

   Express middleware example:

   ```typescript
   // routes/webhooks.ts (Express)
   import express from "express";
   import { verifyShopifyWebhook } from "../middleware/verify-shopify-webhook";

   const router = express.Router();

   // CRITICAL: Use raw body parser BEFORE json parser for webhook routes
   router.use(
     "/webhooks",
     express.raw({ type: "application/json" }),
     (req, res, next) => {
       const hmac = req.headers["x-shopify-hmac-sha256"] as string;
       if (!verifyShopifyWebhook(req.body, hmac, process.env.SHOPIFY_API_SECRET!)) {
         return res.status(401).send("Unauthorized");
       }
       req.body = JSON.parse(req.body.toString());
       next();
     }
   );
   ```

3. **Handle webhook events with idempotency**

   Shopify may deliver the same event multiple times. Use the `X-Shopify-Webhook-Id` header as an idempotency key:

   ```typescript
   router.post("/webhooks/orders-create", async (req, res) => {
     // Respond 200 quickly — Shopify retries if response takes > 5 seconds
     res.status(200).json({ received: true });

     const webhookId = req.headers["x-shopify-webhook-id"] as string;
     const shop = req.headers["x-shopify-shop-domain"] as string;
     const order = req.body;

     // Idempotency check — skip if already processed
     const alreadyProcessed = await db.processedWebhooks.findFirst({
       where: { webhookId, shop },
     });
     if (alreadyProcessed) return;

     // Record processing attempt
     await db.processedWebhooks.create({
       data: { webhookId, shop, topic: "orders/create", processedAt: new Date() },
     });

     // Process the order asynchronously
     await processNewOrder(order, shop);
   });
   ```

4. **Handle the mandatory GDPR webhooks**

   Shopify requires these three endpoints for all App Store apps. They must respond 200 even if your app doesn't store personal data:

   ```typescript
   router.post("/webhooks/gdpr/customers-data-request", async (req, res) => {
     const { shop_id, shop_domain, customer, orders_requested } = req.body;
     // Return customer data your app has stored for this customer
     await sendCustomerDataReport(shop_domain, customer.id);
     res.status(200).json({ received: true });
   });

   router.post("/webhooks/gdpr/customers-redact", async (req, res) => {
     const { shop_domain, customer } = req.body;
     // Delete all personal data for this customer
     await deleteCustomerData(shop_domain, customer.id);
     res.status(200).json({ received: true });
   });

   router.post("/webhooks/gdpr/shop-redact", async (req, res) => {
     const { shop_domain } = req.body;
     // Delete all store data 48 hours after APP_UNINSTALLED
     await deleteShopData(shop_domain);
     res.status(200).json({ received: true });
   });
   ```

5. **Monitor delivery failures and set up retry awareness**

   Shopify retries failed webhooks (non-2xx response or timeout) up to 19 times over 48 hours using exponential backoff. Check delivery health via Admin API:

   ```typescript
   export async function getWebhookFailures(adminClient: GraphqlClient) {
     const response = await adminClient.request(`
       query {
         webhookSubscriptions(first: 20) {
           edges {
             node {
               id
               topic
               callbackUrl
               endpoint {
                 ... on WebhookHttpEndpoint {
                   callbackUrl
                 }
               }
             }
           }
         }
       }
     `);
     return response.data.webhookSubscriptions.edges;
   }
   ```

## Examples

### Full order creation handler with error handling and queue

```typescript
import { Queue, Worker } from "bullmq";

const connection = { host: "localhost", port: 6379 };

const orderQueue = new Queue("order-processing", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  },
});

router.post("/webhooks/orders-create", async (req, res) => {
  // Must respond within 5 seconds
  res.status(200).json({ received: true });

  const webhookId = req.headers["x-shopify-webhook-id"] as string;
  const shop = req.headers["x-shopify-shop-domain"] as string;

  // Push to queue for reliable async processing
  await orderQueue.add(
    "process-order",
    { order: req.body, shop, webhookId },
    {
      jobId: webhookId, // Prevents duplicate jobs for same webhook
    }
  );
});

const worker = new Worker("order-processing", async (job) => {
  const { order, shop, webhookId } = job.data;
  await syncOrderToERP(order, shop);
  await updateInventoryInWarehouse(order.line_items);
  await sendConfirmationNotification(order);
}, { connection });
```

### List and delete stale webhook subscriptions

```typescript
export async function cleanupWebhooks(adminClient: GraphqlClient, appUrl: string) {
  const response = await adminClient.request(`
    query {
      webhookSubscriptions(first: 100) {
        edges { node { id callbackUrl topic } }
      }
    }
  `);

  const stale = response.data.webhookSubscriptions.edges.filter(
    ({ node }: any) => !node.callbackUrl.startsWith(appUrl)
  );

  for (const { node } of stale) {
    await adminClient.request(`
      mutation DeleteWebhook($id: ID!) {
        webhookSubscriptionDelete(id: $id) {
          deletedWebhookSubscriptionId
          userErrors { field message }
        }
      }
    `, { variables: { id: node.id } });
  }
}
```

## Best Practices

- **Respond 200 within 5 seconds** — offload heavy processing to a background queue (Bull, BullMQ, SQS); Shopify marks slow responses as failures and starts retry cycle
- **Never trust without verifying HMAC** — reject any request that fails signature validation with 401
- **Use raw body for HMAC computation** — any body parsing before HMAC check corrupts the byte representation and causes false signature failures
- **Store `X-Shopify-Webhook-Id` for idempotency** — keep a table of processed webhook IDs to prevent double-processing on retries
- **Re-register webhooks on every OAuth completion** — merchants who reinstall the app get a new session; without re-registration, webhooks point to deleted subscriptions
- **Use `EventBridge` or `Pub/Sub` delivery for high volume** — Shopify supports delivering webhooks to AWS EventBridge and Google Pub/Sub; these provide built-in retry and ordering guarantees

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| HMAC verification always fails | Ensure raw body (`Buffer`) is used — Express's JSON body parser converts Buffer to object; configure raw parser before the JSON parser on webhook routes |
| Webhook events processed twice | Implement idempotency using `X-Shopify-Webhook-Id` as a unique key; Bull `jobId` option prevents duplicate queue entries |
| `APP_UNINSTALLED` not received | Ensure this topic is registered — without it, app cleanup (session deletion, data purge) won't fire and merchant data leaks |
| Shopify stops retrying after 48 hours | Add monitoring to detect gaps in event processing; implement a reconciliation job that queries Admin API for events missed during downtime |
| GDPR webhooks fail Shopify review | All three GDPR endpoints must return `200` within the timeout — even if your app stores no data, acknowledge receipt and log the request |
| Webhook registrations duplicated | Use `webhookSubscriptionUpdate` instead of `webhookSubscriptionCreate` for existing topics, or check for `ALREADY_EXISTS` user errors and skip |

## Related Skills

- @shopify-app-development
- @shopify-admin-api
- @webhook-architecture
- @event-driven-architecture
- @gdpr-compliance
