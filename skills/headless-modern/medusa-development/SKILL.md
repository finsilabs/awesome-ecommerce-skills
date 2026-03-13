---
name: medusa-development
description: "Extend the open-source Medusa commerce platform with custom services, event subscribers, and API endpoints for unique business requirements"
category: headless-modern
risk: safe
source: curated
date_added: "2026-03-12"
tags: [medusa, headless-commerce, nodejs, api, services, subscribers, modules]
triggers: ["build with medusa", "medusa.js development", "create medusa service", "extend medusa api"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [medusa]
difficulty: intermediate
---

# Medusa.js Development

## Overview

Build and extend headless e-commerce backends with Medusa.js using custom services, subscribers (event handlers), API route extensions, custom entities with migrations, and module architecture. This skill covers Medusa v2 project setup, the dependency injection container, custom workflows, admin UI extensions, and integration patterns for connecting Medusa to storefronts, ERPs, and payment providers.

## When to Use This Skill

- When setting up a new headless e-commerce backend with Medusa
- When building custom business logic as Medusa services and workflows
- When extending the Medusa API with custom endpoints for storefront or admin use
- When implementing event-driven automation via subscribers (e.g., send email on order placed)
- When integrating external systems (ERP, CMS, fulfillment) with Medusa

## Prerequisites & Platform Notes

**This skill is written for custom/headless storefronts** (Node.js, Python, or similar backend). The code examples use TypeScript/Node.js and can be adapted to any stack.

**Shopify**: Shopify Hydrogen is Shopify's headless framework. MACH/composable patterns apply when using Shopify as the commerce backend with a custom frontend, or when mixing Shopify with other best-of-breed services.
**WooCommerce**: WooCommerce can serve as a headless backend via its REST API and WPGraphQL. These patterns apply when decoupling the frontend from WordPress.
**Magento**: Magento's GraphQL API and PWA Studio support headless architectures. These composable patterns apply to Magento as a backend service in a MACH stack.

**You'll need**:
- Node.js 18+ (or adapt to your backend language)
- PostgreSQL (or your preferred relational database)
- Redis for caching/queues
- Stripe account and API keys
- An email sending service (SendGrid, AWS SES, or Postmark)

## Core Instructions

1. **Set up a Medusa project**

   ```bash
   # Create a new Medusa project
   npx create-medusa-app@latest my-store

   # Project structure (Medusa v2)
   # my-store/
   # ├── src/
   # │   ├── api/           # Custom API routes
   # │   ├── jobs/          # Scheduled jobs
   # │   ├── links/         # Module links
   # │   ├── modules/       # Custom modules
   # │   ├── subscribers/   # Event subscribers
   # │   └── workflows/     # Custom workflows
   # ├── medusa-config.ts
   # └── package.json

   # Start the development server
   npx medusa develop
   ```

   Configure `medusa-config.ts`:
   ```typescript
   import { defineConfig, loadEnv } from '@medusajs/framework/utils';

   loadEnv(process.env.NODE_ENV || 'development', process.cwd());

   export default defineConfig({
     projectConfig: {
       databaseUrl: process.env.DATABASE_URL,
       redisUrl: process.env.REDIS_URL,
       http: {
         storeCors: process.env.STORE_CORS || 'http://localhost:8000',
         adminCors: process.env.ADMIN_CORS || 'http://localhost:9000',
         authCors: process.env.AUTH_CORS || 'http://localhost:8000,http://localhost:9000',
       },
     },
     modules: [
       // Register custom modules here
     ],
   });
   ```

2. **Create a custom module with a service**

   ```typescript
   // src/modules/loyalty/service.ts
   import { MedusaService } from '@medusajs/framework/utils';
   import { LoyaltyPoints } from './models/loyalty-points';

   class LoyaltyModuleService extends MedusaService({
     LoyaltyPoints,
   }) {
     async awardPoints(customerId: string, points: number, reason: string) {
       return await this.createLoyaltyPointss({
         customer_id: customerId,
         points,
         reason,
         type: 'earned',
       });
     }

     async redeemPoints(customerId: string, points: number) {
       const balance = await this.getBalance(customerId);
       if (balance < points) {
         throw new Error(`Insufficient points. Balance: ${balance}, requested: ${points}`);
       }

       return await this.createLoyaltyPointss({
         customer_id: customerId,
         points: -points,
         reason: 'redeemed',
         type: 'redeemed',
       });
     }

     async getBalance(customerId: string): Promise<number> {
       const records = await this.listLoyaltyPointss({
         customer_id: customerId,
       });
       return records.reduce((sum, r) => sum + r.points, 0);
     }
   }

   export default LoyaltyModuleService;
   ```

   Define the data model:
   ```typescript
   // src/modules/loyalty/models/loyalty-points.ts
   import { model } from '@medusajs/framework/utils';

   export const LoyaltyPoints = model.define('loyalty_points', {
     id: model.id().primaryKey(),
     customer_id: model.text(),
     points: model.number(),
     reason: model.text(),
     type: model.enum(['earned', 'redeemed', 'adjusted']),
   });
   ```

   Register the module:
   ```typescript
   // src/modules/loyalty/index.ts
   import LoyaltyModuleService from './service';
   import { Module } from '@medusajs/framework/utils';

   export const LOYALTY_MODULE = 'loyaltyModuleService';

   export default Module(LOYALTY_MODULE, {
     service: LoyaltyModuleService,
   });
   ```

3. **Create event subscribers**

   ```typescript
   // src/subscribers/order-placed.ts
   import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework';
   import { Modules } from '@medusajs/framework/utils';
   import { LOYALTY_MODULE } from '../modules/loyalty';

   export default async function orderPlacedHandler({
     event,
     container,
   }: SubscriberArgs<{ id: string }>) {
     const orderId = event.data.id;

     const orderService = container.resolve(Modules.ORDER);
     const loyaltyService = container.resolve(LOYALTY_MODULE);
     const logger = container.resolve('logger');

     try {
       const order = await orderService.retrieveOrder(orderId, {
         relations: ['items'],
       });

       // Award 1 point per dollar spent
       const pointsToAward = Math.floor(order.total / 100);

       if (order.customer_id && pointsToAward > 0) {
         await loyaltyService.awardPoints(
           order.customer_id,
           pointsToAward,
           `Order ${order.display_id}`
         );
         logger.info(`Awarded ${pointsToAward} loyalty points for order ${order.display_id}`);
       }
     } catch (error) {
       logger.error(`Failed to award loyalty points for order ${orderId}: ${error.message}`);
     }
   }

   export const config: SubscriberConfig = {
     event: 'order.placed',
   };
   ```

4. **Add custom API routes**

   ```typescript
   // src/api/store/loyalty/route.ts
   import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
   import { LOYALTY_MODULE } from '../../../modules/loyalty';

   // GET /store/loyalty — get current customer's loyalty balance
   export async function GET(req: MedusaRequest, res: MedusaResponse) {
     const customerId = req.auth_context?.actor_id;

     if (!customerId) {
       return res.status(401).json({ message: 'Authentication required' });
     }

     const loyaltyService = req.scope.resolve(LOYALTY_MODULE);
     const balance = await loyaltyService.getBalance(customerId);
     const history = await loyaltyService.listLoyaltyPointss(
       { customer_id: customerId },
       { order: { created_at: 'DESC' }, take: 20 }
     );

     res.json({ balance, history });
   }

   // POST /store/loyalty/redeem — redeem points for a discount
   export async function POST(req: MedusaRequest, res: MedusaResponse) {
     const customerId = req.auth_context?.actor_id;

     if (!customerId) {
       return res.status(401).json({ message: 'Authentication required' });
     }

     const { points } = req.body as { points: number };

     if (!points || points <= 0) {
       return res.status(400).json({ message: 'Invalid points amount' });
     }

     const loyaltyService = req.scope.resolve(LOYALTY_MODULE);

     try {
       const record = await loyaltyService.redeemPoints(customerId, points);
       const newBalance = await loyaltyService.getBalance(customerId);
       res.json({ redeemed: points, newBalance, record });
     } catch (error) {
       res.status(400).json({ message: error.message });
     }
   }
   ```

5. **Build custom workflows**

   ```typescript
   // src/workflows/award-loyalty-points.ts
   import {
     createWorkflow,
     createStep,
     StepResponse,
   } from '@medusajs/framework/workflows-sdk';
   import { LOYALTY_MODULE } from '../modules/loyalty';

   const validatePointsStep = createStep(
     'validate-points',
     async ({ customerId, points }: { customerId: string; points: number }) => {
       if (!customerId) throw new Error('Customer ID required');
       if (points <= 0) throw new Error('Points must be positive');
       return new StepResponse({ customerId, points });
     }
   );

   const awardPointsStep = createStep(
     'award-points',
     async (
       { customerId, points, reason }: { customerId: string; points: number; reason: string },
       { container }
     ) => {
       const loyaltyService = container.resolve(LOYALTY_MODULE);
       const record = await loyaltyService.awardPoints(customerId, points, reason);
       return new StepResponse(record, { recordId: record.id });
     },
     // Compensation function for rollback
     async ({ recordId }, { container }) => {
       const loyaltyService = container.resolve(LOYALTY_MODULE);
       await loyaltyService.deleteLoyaltyPoints(recordId);
     }
   );

   export const awardLoyaltyPointsWorkflow = createWorkflow(
     'award-loyalty-points',
     (input: { customerId: string; points: number; reason: string }) => {
       const validated = validatePointsStep(input);
       const record = awardPointsStep({
         customerId: validated.customerId,
         points: validated.points,
         reason: input.reason,
       });
       return record;
     }
   );
   ```

6. **Create a scheduled job**

   ```typescript
   // src/jobs/expire-loyalty-points.ts
   import type { MedusaContainer } from '@medusajs/framework/types';
   import { LOYALTY_MODULE } from '../modules/loyalty';

   export default async function expireLoyaltyPointsJob(container: MedusaContainer) {
     const loyaltyService = container.resolve(LOYALTY_MODULE);
     const logger = container.resolve('logger');

     // Find points older than 12 months
     const expirationDate = new Date();
     expirationDate.setFullYear(expirationDate.getFullYear() - 1);

     const expiredRecords = await loyaltyService.listLoyaltyPointss({
       type: 'earned',
       created_at: { $lt: expirationDate },
     });

     let expiredCount = 0;
     for (const record of expiredRecords) {
       if (record.points > 0) {
         await loyaltyService.createLoyaltyPointss({
           customer_id: record.customer_id,
           points: -record.points,
           reason: `Expired: original from ${record.created_at}`,
           type: 'adjusted',
         });
         expiredCount++;
       }
     }

     logger.info(`Expired ${expiredCount} loyalty point records.`);
   }

   export const config = {
     name: 'expire-loyalty-points',
     schedule: '0 2 * * *', // Daily at 2 AM
   };
   ```

## Examples

### Connecting a Next.js storefront

```typescript
// storefront/lib/medusa-client.ts
import Medusa from '@medusajs/js-sdk';

const medusa = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000',
  auth: {
    type: 'session',
  },
});

// Fetch products for a collection page
export async function getProducts(collectionId?: string) {
  const { products, count } = await medusa.store.product.list({
    collection_id: collectionId ? [collectionId] : undefined,
    limit: 24,
    fields: '+variants.calculated_price',
  });
  return { products, count };
}

// Add item to cart
export async function addToCart(cartId: string, variantId: string, quantity: number) {
  const { cart } = await medusa.store.cart.createLineItem(cartId, {
    variant_id: variantId,
    quantity,
  });
  return cart;
}

// Fetch loyalty balance (custom endpoint)
export async function getLoyaltyBalance() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/loyalty`,
    { credentials: 'include' }
  );
  if (!response.ok) throw new Error('Failed to fetch loyalty balance');
  return response.json();
}
```

### Custom payment provider module

```typescript
// src/modules/custom-payment/service.ts
import {
  AbstractPaymentProvider,
} from '@medusajs/framework/utils';
import type {
  CreatePaymentProviderSession,
  UpdatePaymentProviderSession,
  ProviderWebhookPayload,
  WebhookActionResult,
} from '@medusajs/framework/types';

class CustomPaymentProviderService extends AbstractPaymentProvider<{}> {
  static identifier = 'custom-payment';

  async initiatePayment(
    data: CreatePaymentProviderSession
  ): Promise<Record<string, unknown>> {
    // Call your payment gateway's API to create a payment session
    const response = await fetch('https://api.custompay.com/v1/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CUSTOM_PAYMENT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: data.amount,
        currency: data.currency_code,
        metadata: { medusa_cart_id: data.context.cart_id },
      }),
    });
    const session = await response.json();

    return { session_id: session.id, client_token: session.client_token };
  }

  async authorizePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<{ status: string; data: Record<string, unknown> }> {
    const sessionId = paymentSessionData.session_id as string;

    const response = await fetch(
      `https://api.custompay.com/v1/sessions/${sessionId}`,
      {
        headers: { 'Authorization': `Bearer ${process.env.CUSTOM_PAYMENT_API_KEY}` },
      }
    );
    const session = await response.json();

    return {
      status: session.status === 'paid' ? 'authorized' : 'pending',
      data: { ...paymentSessionData, gateway_status: session.status },
    };
  }

  async capturePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const sessionId = paymentSessionData.session_id as string;

    await fetch(`https://api.custompay.com/v1/sessions/${sessionId}/capture`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.CUSTOM_PAYMENT_API_KEY}` },
    });

    return { ...paymentSessionData, captured: true };
  }

  async refundPayment(
    paymentSessionData: Record<string, unknown>,
    refundAmount: number
  ): Promise<Record<string, unknown>> {
    const sessionId = paymentSessionData.session_id as string;

    await fetch(`https://api.custompay.com/v1/sessions/${sessionId}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CUSTOM_PAYMENT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: refundAmount }),
    });

    return { ...paymentSessionData, refunded_amount: refundAmount };
  }

  async cancelPayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return { ...paymentSessionData, cancelled: true };
  }

  async deletePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return {};
  }

  async getPaymentStatus(
    paymentSessionData: Record<string, unknown>
  ): Promise<string> {
    return (paymentSessionData.gateway_status as string) || 'pending';
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload
  ): Promise<WebhookActionResult> {
    const event = JSON.parse(payload.rawData as string);

    switch (event.type) {
      case 'payment.captured':
        return { action: 'captured', data: { session_id: event.session_id } };
      case 'payment.failed':
        return { action: 'failed', data: { session_id: event.session_id } };
      default:
        return { action: 'not_supported' };
    }
  }
}

export default CustomPaymentProviderService;
```

## Best Practices

- **Use the module system for encapsulation** -- each domain (loyalty, custom fulfillment, analytics) should be its own module with its own service, models, and migrations
- **Always add compensation functions to workflow steps** -- if a step can fail, the compensation function rolls back the previous step's side effects for clean error recovery
- **Resolve dependencies from the container, not with imports** -- use `container.resolve()` for services to respect the DI configuration and enable testing
- **Use subscribers for side effects, not core logic** -- subscribers should trigger notifications, sync external systems, and log events; keep order processing in workflows
- **Validate API input with Zod** -- define Zod schemas for request bodies and use middleware to validate before the handler runs
- **Write migrations for schema changes** -- never modify the database manually; use Medusa's migration system so changes are reproducible across environments
- **Use the Medusa Admin SDK for admin extensions** -- extend the admin dashboard with custom widgets using the `@medusajs/admin-sdk` package instead of building separate UIs
- **Pin your Medusa version** -- Medusa v2 is evolving rapidly; lock the version in `package.json` and test before upgrading

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Custom module not found at runtime | Register it in `medusa-config.ts` under the `modules` array and run `npx medusa db:migrate` to apply any model changes |
| Subscriber fires but data is stale | Subscribers run asynchronously; re-fetch the entity inside the subscriber handler rather than relying on event payload data |
| API route returns 404 | Ensure the file path matches the URL pattern: `src/api/store/loyalty/route.ts` maps to `/store/loyalty`; check for missing `export` on the handler function |
| Workflow step fails without rollback | Every step that has side effects needs a compensation function as the second argument to `createStep` |
| Database migration conflicts after merge | Run `npx medusa db:migrate` after pulling changes; if migrations conflict, generate a new migration that resolves the diff |
| CORS errors from storefront | Configure `storeCors` in `medusa-config.ts` to include your storefront's origin URL including the port |

## Related Skills

- @product-data-modeling
- @stripe-integration
- @ecommerce-caching
- @ecommerce-seo
- @erp-integration
