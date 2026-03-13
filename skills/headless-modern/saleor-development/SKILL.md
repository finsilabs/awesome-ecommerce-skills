---
name: saleor-development
description: "Build and extend Saleor's GraphQL-based headless commerce platform with custom apps, webhook handlers, and dashboard UI customizations"
category: headless-modern
risk: safe
source: curated
date_added: "2026-03-12"
tags: [saleor, graphql, headless, django, storefront, webhooks, apps, dashboard]
triggers: ["saleor integration", "saleor graphql api", "saleor storefront", "saleor app development", "saleor dashboard customization"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Saleor Development

## Overview

Saleor is a headless, GraphQL-first e-commerce platform built on Django and Python. It exposes a fully typed GraphQL API for storefronts and third-party apps, a React-based dashboard for store management, and an extension system that lets you react to events via webhooks or inject UI into the dashboard. This skill covers querying the Saleor API, building Saleor Apps (plugins hosted outside Saleor), and customizing the dashboard with App Extensions.

## When to Use This Skill

- When building a custom storefront (Next.js, Remix, mobile) against a Saleor backend
- When creating a Saleor App that reacts to order or product lifecycle webhooks
- When injecting custom UI panels into the Saleor Dashboard via App Extensions
- When exploring or extending the Saleor product catalog, checkout, or customer APIs
- When setting up a local Saleor development environment with Docker

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
- Docker and/or Kubernetes for container orchestration
- CDN (Cloudflare, CloudFront, or Fastly)

## Core Instructions

1. **Run Saleor locally with Docker Compose**

   ```bash
   git clone https://github.com/saleor/saleor-platform.git
   cd saleor-platform
   docker compose up --detach
   # API:       http://localhost:8000/graphql/
   # Dashboard: http://localhost:9000
   ```

   Create the first superuser and populate demo data:
   ```bash
   docker compose run --rm api python manage.py createsuperuser
   docker compose run --rm api python manage.py populatedb --createsuperuser
   ```

2. **Query the Storefront GraphQL API**

   Use the Saleor CLI or any GraphQL client (Apollo, urql, graphql-request).

   Install the CLI for code generation:
   ```bash
   npm install -g @saleor/cli
   saleor configure
   ```

   Example — fetch the first 12 products from the default channel:
   ```graphql
   query ProductList($channel: String!) {
     products(first: 12, channel: $channel) {
       edges {
         node {
           id
           name
           slug
           thumbnail { url alt }
           pricing {
             priceRange {
               start { gross { amount currency } }
             }
           }
         }
       }
       pageInfo { hasNextPage endCursor }
     }
   }
   ```

   ```javascript
   import { createClient } from 'urql';

   const client = createClient({
     url: process.env.NEXT_PUBLIC_SALEOR_API_URL,
     fetchOptions: () => ({
       headers: { 'Content-Type': 'application/json' },
     }),
   });

   const { data } = await client.query(PRODUCT_LIST_QUERY, { channel: 'default-channel' }).toPromise();
   ```

3. **Authenticate a customer and start checkout**

   ```graphql
   mutation CustomerLogin($email: String!, $password: String!) {
     tokenCreate(email: $email, password: $password) {
       token
       refreshToken
       errors { field message }
       user { id email }
     }
   }
   ```

   Create a checkout and add lines:
   ```graphql
   mutation CheckoutCreate($channel: String!, $lines: [CheckoutLineInput!]!) {
     checkoutCreate(input: { channel: $channel, lines: $lines }) {
       checkout {
         id
         token
         totalPrice { gross { amount currency } }
       }
       errors { field message }
     }
   }
   ```

   Complete checkout with a payment gateway token (e.g., from Stripe Elements):
   ```graphql
   mutation CheckoutComplete($checkoutId: ID!, $paymentData: JSONString) {
     checkoutComplete(id: $checkoutId, paymentData: $paymentData) {
       order { id number status }
       errors { field message code }
     }
   }
   ```

4. **Bootstrap a Saleor App**

   A Saleor App is a Node.js service that registers itself with Saleor, receives webhooks, and optionally renders UI in the dashboard via iframes.

   ```bash
   npx @saleor/app-sdk@latest create my-saleor-app
   cd my-saleor-app
   npm install
   npm run dev
   # Expose with: npx ngrok http 3000
   ```

   Register the app in the dashboard under **Apps → Install custom app**, entering your ngrok URL. Saleor calls your `/api/manifest` endpoint:

   ```typescript
   // pages/api/manifest.ts
   import { createManifestHandler } from "@saleor/app-sdk/handlers/next";
   import { AppManifest } from "@saleor/app-sdk/types";

   const manifest: AppManifest = {
     id: "my-saleor-app",
     name: "My Saleor App",
     version: "1.0.0",
     about: "Example app",
     permissions: ["MANAGE_ORDERS"],
     appUrl: process.env.APP_URL!,
     tokenTargetUrl: `${process.env.APP_URL}/api/register`,
     webhooks: [
       {
         name: "Order Created",
         asyncEvents: ["ORDER_CREATED"],
         query: `subscription { event { ... on OrderCreated { order { id number } } } }`,
         targetUrl: `${process.env.APP_URL}/api/webhooks/order-created`,
         isActive: true,
       },
     ],
   };

   export default createManifestHandler({ manifestFactory: () => manifest });
   ```

5. **Handle Saleor webhooks securely**

   Saleor signs every webhook with an HMAC-SHA256 signature using your app's secret token.

   ```typescript
   // pages/api/webhooks/order-created.ts
   import { SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";
   import { OrderCreatedDocument } from "@/generated/graphql";

   const orderCreatedWebhook = new SaleorAsyncWebhook<OrderCreatedPayload>({
     name: "Order Created",
     webhookPath: "api/webhooks/order-created",
     asyncEvent: "ORDER_CREATED",
     apl: saleorApp.apl,
     query: OrderCreatedDocument,
   });

   export default orderCreatedWebhook.createHandler((req, res, ctx) => {
     const { order } = ctx.payload;
     console.log(`New order #${order.number} received`);
     // Trigger fulfillment, email, ERP sync, etc.
     return res.status(200).end();
   });

   export const config = { api: { bodyParser: false } }; // required for signature check
   ```

6. **Add a Dashboard Extension (custom UI panel)**

   Extensions render an iframe inside the Saleor Dashboard. Declare them in the manifest:

   ```typescript
   extensions: [
     {
       label: "Sync to ERP",
       mount: "PRODUCT_DETAILS_MORE_ACTIONS",
       target: "POPUP",
       permissions: ["MANAGE_PRODUCTS"],
       url: `${process.env.APP_URL}/extension/product-sync`,
     },
   ],
   ```

   The extension page uses `@saleor/app-sdk` to communicate with the dashboard host:

   ```typescript
   import { actions, useAppBridge } from "@saleor/app-sdk/app-bridge";

   export default function ProductSyncExtension() {
     const { appBridge } = useAppBridge();

     const handleSync = async () => {
       appBridge?.dispatch(actions.Notification({
         status: "success",
         title: "Sync started",
         text: "Product is being synced to ERP.",
       }));
     };

     return <button onClick={handleSync}>Sync to ERP</button>;
   }
   ```

## Examples

### Paginated product catalog with TypeScript and graphql-request

```typescript
import { GraphQLClient, gql } from 'graphql-request';

const client = new GraphQLClient(process.env.SALEOR_API_URL!, {
  headers: { Authorization: `Bearer ${process.env.SALEOR_APP_TOKEN}` },
});

const PRODUCTS_QUERY = gql`
  query Products($first: Int!, $after: String, $channel: String!) {
    products(first: $first, after: $after, channel: $channel) {
      edges { node { id name slug description } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

async function fetchAllProducts(channel: string) {
  const products = [];
  let after: string | null = null;

  do {
    const data = await client.request(PRODUCTS_QUERY, { first: 100, after, channel });
    products.push(...data.products.edges.map((e: any) => e.node));
    after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (after);

  return products;
}
```

### Order status update via Admin API

```graphql
mutation FulfillOrder($orderId: ID!, $input: OrderFulfillInput!) {
  orderFulfill(orderId: $orderId, input: $input) {
    fulfillments {
      id
      status
      trackingNumber
    }
    errors { field message code }
  }
}
```

```typescript
await client.request(FULFILL_ORDER_MUTATION, {
  orderId: "T3JkZXI6MTIz",
  input: {
    lines: [{ orderLineId: "T3JkZXJMaW5lOjQ1", stocks: [{ warehouse: "V2FyZWhvdXNlOjE=", quantity: 1 }] }],
    notifyCustomer: true,
    allowStockToBeExceeded: false,
  },
});
```

## Best Practices

- **Use channels for multi-region or B2B/B2C separation** — every product listing, pricing, and checkout is channel-scoped; create separate channels per locale/currency rather than duplicating products
- **Generate TypeScript types from the schema** — run `saleor app generate-types` or use `graphql-codegen` so queries are fully typed
- **Store app tokens in Saleor's APL (Auth Persistence Layer)** — the default file-based APL is fine for development; use Redis or Upstash APL in production
- **Always verify webhook signatures** — use the `SaleorAsyncWebhook` wrapper which handles HMAC verification automatically; never process unauthenticated payloads
- **Use subscription-based webhook queries** — Saleor webhooks use GraphQL subscriptions as the payload definition, giving you control over exactly which fields are included
- **Cache product catalog responses at the CDN layer** — product data rarely changes; set `Cache-Control: s-maxage=300` on catalog API routes
- **Use Saleor Cloud for production** — self-hosting Django + Celery + Redis + PostgreSQL requires operational maturity; Saleor Cloud handles this

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| GraphQL errors for unauthorized operations | Ensure the app has been granted the correct permissions in the manifest AND in the dashboard under App settings |
| Webhook payload is empty / fields missing | The webhook payload is defined by a GraphQL subscription query in the manifest — add the fields you need to the `query` property |
| `tokenCreate` returns null on storefront | The channel must have the storefront API enabled and an assigned country; check channel configuration in the dashboard |
| App works locally but not after deployment | The `APP_URL` env var must match the publicly accessible URL Saleor can reach; update the app URL in the dashboard after deployment |
| Dashboard extension iframe is blank | The extension URL must be served over HTTPS and must include `Access-Control-Allow-Origin` headers for the dashboard origin |

## Related Skills

- @shopify-hydrogen
- @composable-commerce
- @webhook-architecture
- @jamstack-storefront
- @commerce-api-gateway
