---
name: composable-commerce
description: "Architect a modern store using MACH principles — independent microservices, API-first integrations, cloud-native hosting, and headless frontend"
category: headless-modern
risk: safe
source: curated
date_added: "2026-03-12"
tags: [mach, composable, microservices, api-first, headless, cloud-native, architecture, commercetools, contentful]
triggers: ["composable commerce", "mach architecture", "microservices ecommerce", "api-first commerce", "headless architecture", "decouple commerce platform"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Composable Commerce

## Overview

Composable commerce is an architectural approach based on MACH principles — Microservices, API-first, Cloud-native, Headless — where each commerce capability (cart, catalog, search, CMS, checkout, loyalty) is provided by a best-of-breed service rather than a monolithic platform. Services communicate via APIs and events, enabling teams to replace or upgrade individual capabilities without touching the rest of the system. This skill covers MACH architecture patterns, service integration, event-driven coordination, and the operational considerations of running a composable stack in production.

## When to Use This Skill

- When a monolithic platform (Magento, Salesforce CC) can no longer scale with your team or traffic patterns
- When different domains (catalog, checkout, loyalty) have divergent release cadences and ownership
- When you need to mix best-of-breed vendors — e.g., Algolia for search, Contentful for CMS, commercetools for commerce
- When entering new markets requiring different fulfillment, pricing, or tax providers per region
- When building a platform that must support multiple storefronts (web, mobile, in-store, B2B portal) from a single backend

## Prerequisites & Platform Notes

**This skill is written for custom/headless storefronts** (Node.js, Python, or similar backend). The code examples use TypeScript/Node.js and can be adapted to any stack.

**Shopify**: Shopify Hydrogen is Shopify's headless framework. MACH/composable patterns apply when using Shopify as the commerce backend with a custom frontend, or when mixing Shopify with other best-of-breed services.
**WooCommerce**: WooCommerce can serve as a headless backend via its REST API and WPGraphQL. These patterns apply when decoupling the frontend from WordPress.
**Magento**: Magento's GraphQL API and PWA Studio support headless architectures. These composable patterns apply to Magento as a backend service in a MACH stack.

**You'll need**:
- Node.js 18+ (or adapt to your backend language)
- PostgreSQL (or your preferred relational database)
- A search service (Algolia, Elasticsearch, or Typesense)
- Stripe account and API keys
- An email sending service (SendGrid, AWS SES, or Postmark)

## Core Instructions

1. **Design service boundaries around commerce capabilities**

   A typical composable commerce stack separates capabilities into discrete services:

   | Capability | Example Services |
   |-----------|-----------------|
   | Product Catalog | commercetools, Akeneo PIM, Salsify |
   | Search & Discovery | Algolia, Elasticsearch, Constructor.io |
   | CMS / Content | Contentful, Sanity, Storyblok |
   | Cart & Checkout | commercetools, Elastic Path, Medusa |
   | Payments | Stripe, Adyen, Braintree |
   | Tax | Avalara, TaxJar |
   | Shipping & Fulfillment | EasyPost, ShipBob, custom OMS |
   | Customer Identity | Auth0, Okta, Cognito |
   | Loyalty & Promotions | Talon.One, Voucherify |
   | Email / Notifications | SendGrid, Customer.io |

   Define bounded contexts: each service owns its data and exposes it only via APIs. Never share databases between services.

2. **Implement an API composition layer (BFF)**

   A Backend-for-Frontend (BFF) aggregates multiple upstream APIs into a single request, tailored to what the frontend needs:

   ```typescript
   // bff/src/routes/product-page.ts
   import {getProduct} from '../services/catalog';
   import {getSearchReviews} from '../services/reviews';
   import {getRecommendations} from '../services/recommendations';
   import {getInventory} from '../services/inventory';

   export async function productPageData(productId: string, customerId?: string) {
     // Parallel fetch from independent services
     const [product, inventory, recommendations] = await Promise.all([
       getProduct(productId),
       getInventory(productId),
       getRecommendations(productId, customerId),
     ]);

     // Sequential: reviews needs product.sku
     const reviews = await getSearchReviews(product.sku);

     return {
       product,
       inventory,
       recommendations,
       reviews,
     };
   }
   ```

   Expose the BFF as a GraphQL API using schema stitching or federation:

   ```typescript
   import {buildHTTPExecutor} from '@graphql-tools/executor-http';
   import {stitchSchemas} from '@graphql-tools/stitch';

   const gatewaySchema = await stitchSchemas({
     subschemas: [
       { schema: await introspectSchema(catalogExecutor), executor: catalogExecutor },
       { schema: await introspectSchema(inventoryExecutor), executor: inventoryExecutor },
       { schema: await introspectSchema(reviewsExecutor), executor: reviewsExecutor },
     ],
   });
   ```

3. **Use event-driven architecture for cross-service coordination**

   Services should communicate asynchronously for workflows that span multiple capabilities (order placed → inventory reserved → fulfillment triggered → email sent):

   ```typescript
   // Order service publishes an event after checkout
   import {EventBridge} from '@aws-sdk/client-eventbridge';

   const eventBridge = new EventBridge({region: 'us-east-1'});

   async function publishOrderPlaced(order: Order) {
     await eventBridge.putEvents({
       Entries: [
         {
           Source: 'commerce.orders',
           DetailType: 'OrderPlaced',
           Detail: JSON.stringify({
             orderId: order.id,
             customerId: order.customerId,
             lineItems: order.lineItems,
             totalAmount: order.totalAmount,
             currency: order.currency,
           }),
           EventBusName: 'commerce-events',
         },
       ],
     });
   }

   // Inventory service subscribes and reserves stock
   // EventBridge rule routes OrderPlaced → Lambda → inventory-service
   export async function handler(event: EventBridgeEvent<'OrderPlaced', OrderPayload>) {
     const {orderId, lineItems} = event.detail;
     await reserveInventory(lineItems);
     await publishInventoryReserved(orderId);
   }
   ```

4. **Implement the Saga pattern for distributed transactions**

   When a multi-step workflow must be atomic across services, use orchestrated sagas with compensating transactions:

   ```typescript
   // Choreography-based saga for order fulfillment
   // Each service publishes events and reacts to others

   // Order Service
   on('CheckoutCompleted', async ({orderId, paymentIntentId}) => {
     await orders.create({orderId, status: 'pending_payment'});
     await publish('OrderCreated', {orderId, paymentIntentId});
   });

   // Payment Service
   on('OrderCreated', async ({orderId, paymentIntentId}) => {
     try {
       await capturePayment(paymentIntentId);
       await publish('PaymentCaptured', {orderId});
     } catch (err) {
       await publish('PaymentFailed', {orderId, reason: err.message});
     }
   });

   // Fulfillment Service
   on('PaymentCaptured', async ({orderId}) => {
     await fulfillment.schedule(orderId);
   });

   // Order Service — compensate on failure
   on('PaymentFailed', async ({orderId}) => {
     await orders.update(orderId, {status: 'payment_failed'});
     await releaseInventory(orderId);
     await notifyCustomer(orderId, 'payment_failed');
   });
   ```

5. **Manage API versioning and backward compatibility**

   In a composable stack, services evolve independently. Use additive versioning strategies:

   ```typescript
   // Use content negotiation or URL versioning
   // GET /api/v2/products/:id
   // Accept: application/vnd.commerce.product.v2+json

   // Apply the Tolerant Reader pattern — ignore unknown fields
   interface ProductV1 {
     id: string;
     name: string;
     price: number;
   }

   // V2 adds fields — existing consumers still work
   interface ProductV2 extends ProductV1 {
     categories?: string[];
     attributes?: Record<string, string>;
     brand?: string;
   }

   // Use feature flags to roll out breaking changes
   async function getProduct(id: string, apiVersion: '1' | '2' = '1') {
     const product = await catalog.findById(id);
     return apiVersion === '2' ? toProductV2(product) : toProductV1(product);
   }
   ```

6. **Implement circuit breakers for resilience**

   When one service degrades, prevent cascading failures across the entire stack:

   ```typescript
   import CircuitBreaker from 'opossum';

   const inventoryCircuit = new CircuitBreaker(checkInventory, {
     timeout: 3000,          // Request timeout in ms
     errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
     resetTimeout: 30000,    // Try again after 30 seconds
   });

   inventoryCircuit.fallback(() => ({
     available: true,        // Optimistic fallback — show as available
     quantity: null,         // Don't show exact quantity
   }));

   inventoryCircuit.on('open', () => {
     logger.warn('Inventory service circuit OPEN — using fallback');
     metrics.increment('circuit_breaker.inventory.open');
   });

   // Usage
   const stock = await inventoryCircuit.fire(productId);
   ```

## Examples

### commercetools SDK integration for catalog

```typescript
import {createApiBuilderFromCtpClient} from '@commercetools/platform-sdk';
import {ClientBuilder} from '@commercetools/sdk-client-v2';

const ctpClient = new ClientBuilder()
  .withProjectKey(process.env.CTP_PROJECT_KEY!)
  .withClientCredentialsFlow({
    host: 'https://auth.us-central1.gcp.commercetools.com',
    projectKey: process.env.CTP_PROJECT_KEY!,
    credentials: {
      clientId: process.env.CTP_CLIENT_ID!,
      clientSecret: process.env.CTP_CLIENT_SECRET!,
    },
    scopes: ['manage_project:' + process.env.CTP_PROJECT_KEY],
    fetch,
  })
  .withHttpMiddleware({host: 'https://api.us-central1.gcp.commercetools.com', fetch})
  .build();

const apiRoot = createApiBuilderFromCtpClient(ctpClient).withProjectKey({
  projectKey: process.env.CTP_PROJECT_KEY!,
});

// Fetch product by slug
const product = await apiRoot
  .products()
  .get({queryArgs: {where: `slug(en="${slug}")`, expand: ['productType']}})
  .execute();
```

### Algolia search with Contentful CMS enrichment

```typescript
import algoliasearch from 'algoliasearch';
import {createClient as createContentfulClient} from 'contentful';

const algolia = algoliasearch(process.env.ALGOLIA_APP_ID!, process.env.ALGOLIA_SEARCH_KEY!);
const contentful = createContentfulClient({space: process.env.CONTENTFUL_SPACE_ID!, accessToken: process.env.CONTENTFUL_TOKEN!});

async function searchProducts(query: string, filters?: string) {
  // Search in Algolia for product IDs and structured data
  const {hits} = await algolia.initIndex('products').search<AlgoliaProduct>(query, {
    filters,
    attributesToRetrieve: ['objectID', 'name', 'price', 'contentfulEntryId'],
  });

  // Enrich with rich content from Contentful
  const contentEntryIds = hits.map(h => h.contentfulEntryId).filter(Boolean);
  const contentEntries = await contentful.getEntries({
    content_type: 'productPage',
    'sys.id[in]': contentEntryIds.join(','),
  });

  const contentMap = new Map(contentEntries.items.map(e => [e.sys.id, e]));

  return hits.map(hit => ({
    ...hit,
    content: contentMap.get(hit.contentfulEntryId),
  }));
}
```

## Best Practices

- **Define a clear data ownership model** — each piece of data has exactly one system of record; other services read from it via API, never write to it directly
- **Design for eventual consistency** — cross-service data will be temporarily inconsistent after an event; build UIs and workflows that tolerate this (e.g., optimistic inventory, compensating transactions)
- **Use an API gateway for cross-cutting concerns** — authentication, rate limiting, request logging, and SSL termination belong at the gateway, not in every service
- **Implement distributed tracing** — use OpenTelemetry with a trace ID propagated across all service calls; this is essential for debugging multi-service request failures
- **Version your events** — event schemas change over time; include a `schemaVersion` field in every event payload and maintain backward-compatible consumers
- **Use a service mesh for service-to-service traffic** — tools like Istio or AWS App Mesh handle mutual TLS, load balancing, and retries at the infrastructure layer
- **Start with a modular monolith** — decompose into microservices only when you have clear team ownership boundaries and operational maturity; premature decomposition creates accidental complexity

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Distributed transaction failures leave data inconsistent | Implement sagas with compensating transactions; use outbox pattern to guarantee event publication after DB write |
| Service latency compounds in the critical path | Move non-critical services off the critical path using async events; set aggressive timeouts and circuit breakers on all external calls |
| API contract breaks downstream consumers | Use consumer-driven contract testing (Pact) so breaking changes are caught before deployment |
| Shared database creates hidden coupling | Enforce the rule: one service, one schema; use event sourcing or change data capture for cross-service data propagation |
| Debugging failures across 10 services | Implement distributed tracing with OpenTelemetry from day one; correlate logs with a single trace ID per user request |

## Related Skills

- @commerce-api-gateway
- @saleor-development
- @shopify-hydrogen
- @webhook-architecture
- @flash-sale-scaling
- @edge-commerce
