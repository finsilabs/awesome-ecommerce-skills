---
name: commerce-api-gateway
description: "Aggregate multiple commerce microservices behind a single API gateway with GraphQL federation, rate limiting, and unified authentication"
category: headless-modern
risk: safe
source: curated
date_added: "2026-03-12"
tags: [api-gateway, graphql-federation, bff, microservices, kong, apollo-router, rate-limiting, authentication]
triggers: ["api gateway commerce", "graphql federation", "bff pattern", "aggregate commerce apis", "commerce api gateway", "api orchestration"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Commerce API Gateway

## Overview

An API gateway sits between storefront clients and the set of backend commerce services, providing a single entry point for authentication, rate limiting, caching, and request routing. In composable commerce architectures, the gateway aggregates APIs from disparate services (catalog, cart, search, CMS) so the frontend makes one or a few calls rather than dozens. This skill covers building a GraphQL Federation gateway with Apollo Router, a REST aggregation BFF, and applying cross-cutting concerns (auth, rate limiting, observability) at the gateway layer.

## When to Use This Skill

- When your storefront makes 10+ API calls per page load from different services
- When you need to enforce authentication and authorization consistently across all commerce APIs
- When different teams own different services and you need a contract between the frontend and backend
- When you want to apply rate limiting, circuit breakers, or caching without modifying each service
- When you need a single GraphQL schema that spans catalog, inventory, CMS, and personalization data

## Prerequisites & Platform Notes

**This skill is written for custom/headless storefronts** (Node.js, Python, or similar backend). The code examples use TypeScript/Node.js and can be adapted to any stack.

**Shopify**: Shopify Hydrogen is Shopify's headless framework. MACH/composable patterns apply when using Shopify as the commerce backend with a custom frontend, or when mixing Shopify with other best-of-breed services.
**WooCommerce**: WooCommerce can serve as a headless backend via its REST API and WPGraphQL. These patterns apply when decoupling the frontend from WordPress.
**Magento**: Magento's GraphQL API and PWA Studio support headless architectures. These composable patterns apply to Magento as a backend service in a MACH stack.

**You'll need**:
- Node.js 18+ (or adapt to your backend language)
- Redis for caching/queues

## Core Instructions

1. **Set up Apollo Router for GraphQL Federation**

   Apollo Federation composes multiple GraphQL subgraphs into a unified supergraph. Each service owns a slice of the schema.

   ```bash
   # Install Apollo Router (the high-performance Rust gateway)
   curl -sSL https://router.apollo.dev/download/nix/latest | sh

   # Install Rover CLI for schema management
   npm install -g @apollo/rover
   ```

   Define the supergraph config:
   ```yaml
   # supergraph.yaml
   federation_version: =2.5.0
   subgraphs:
     catalog:
       routing_url: http://catalog-service:4001/graphql
       schema:
         subgraph_url: http://catalog-service:4001/graphql
     inventory:
       routing_url: http://inventory-service:4002/graphql
       schema:
         subgraph_url: http://inventory-service:4002/graphql
     cart:
       routing_url: http://cart-service:4003/graphql
       schema:
         subgraph_url: http://cart-service:4003/graphql
   ```

   Compose and run:
   ```bash
   rover supergraph compose --config supergraph.yaml > supergraph.graphql
   ./router --supergraph supergraph.graphql --config router.yaml
   ```

2. **Define federated subgraph schemas**

   Each service defines its slice of the schema and can extend types owned by other services:

   ```graphql
   # catalog-service/schema.graphql
   type Query {
     product(id: ID!): Product
     products(first: Int, after: String): ProductConnection
   }

   type Product @key(fields: "id") {
     id: ID!
     name: String!
     slug: String!
     description: String
     price: Money!
     images: [Image!]!
   }

   # inventory-service/schema.graphql — extends Product from catalog
   type Product @key(fields: "id") @extends {
     id: ID! @external
     inventory: InventoryStatus!
   }

   type InventoryStatus {
     available: Boolean!
     quantity: Int
     warehouseLocations: [String!]!
   }
   ```

   The gateway resolves the `Product.inventory` field by calling the inventory service with the product IDs gathered from the catalog response — automatically, without any client-side orchestration.

3. **Build a REST BFF (Backend-for-Frontend) with Fastify**

   For storefronts that prefer REST over GraphQL:

   ```typescript
   import Fastify from 'fastify';
   import {catalogClient} from './services/catalog';
   import {inventoryClient} from './services/inventory';
   import {cmsClient} from './services/cms';

   const app = Fastify({logger: true});

   // Composite endpoint for Product Detail Page
   app.get<{Params: {id: string}}>('/api/pdp/:id', async (request, reply) => {
     const {id} = request.params;
     const customerId = request.headers['x-customer-id'] as string | undefined;

     const [product, inventory, content] = await Promise.allSettled([
       catalogClient.getProduct(id),
       inventoryClient.getStock(id),
       cmsClient.getProductContent(id),
     ]);

     if (product.status === 'rejected') {
       return reply.status(404).send({error: 'Product not found'});
     }

     return {
       product: product.value,
       inventory: inventory.status === 'fulfilled' ? inventory.value : {available: true, quantity: null},
       content: content.status === 'fulfilled' ? content.value : null,
     };
   });

   // Composite endpoint for Cart Page
   app.get<{Params: {cartId: string}}>('/api/cart/:cartId', {
     preHandler: [requireAuth],
   }, async (request, reply) => {
     const cart = await cartClient.getCart(request.params.cartId);
     const productIds = cart.lines.map((l: any) => l.productId);
     const inventoryMap = await inventoryClient.getBulkStock(productIds);

     return {
       ...cart,
       lines: cart.lines.map((line: any) => ({
         ...line,
         inventory: inventoryMap[line.productId] ?? {available: true},
       })),
     };
   });

   await app.listen({port: 3000, host: '0.0.0.0'});
   ```

4. **Apply authentication at the gateway**

   The gateway validates JWTs and forwards the decoded identity to subgraphs:

   ```typescript
   // middleware/auth.ts
   import {FastifyRequest, FastifyReply} from 'fastify';
   import {verify, JwtPayload} from 'jsonwebtoken';

   export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
     const token = request.headers.authorization?.replace('Bearer ', '');
     if (!token) return reply.status(401).send({error: 'Authentication required'});

     try {
       const payload = verify(token, process.env.JWT_PUBLIC_KEY!, {algorithms: ['RS256']}) as JwtPayload;
       request.user = {id: payload.sub!, email: payload.email, roles: payload.roles ?? []};
     } catch {
       return reply.status(401).send({error: 'Invalid token'});
     }
   }

   // Apollo Router auth via coprocessor (Rust plugin alternative)
   // router.yaml
   ```

   ```yaml
   # router.yaml
   authentication:
     router:
       jwt:
         jwks:
           - url: https://your-auth-provider/.well-known/jwks.json

   authorization:
     require_authentication: false  # Allow public queries; subgraphs enforce per-field auth
   ```

5. **Implement rate limiting and response caching**

   ```typescript
   // Rate limiting with Redis token bucket
   import {RateLimiterRedis} from 'rate-limiter-flexible';
   import Redis from 'ioredis';

   const redis = new Redis(process.env.REDIS_URL!);

   const rateLimiter = new RateLimiterRedis({
     storeClient: redis,
     keyPrefix: 'rl_gateway',
     points: 100,       // 100 requests
     duration: 60,      // per 60 seconds
     blockDuration: 60, // block for 60s when exceeded
   });

   app.addHook('preHandler', async (request, reply) => {
     const key = request.user?.id ?? request.ip;
     try {
       await rateLimiter.consume(key);
     } catch {
       reply.header('Retry-After', '60');
       return reply.status(429).send({error: 'Too many requests'});
     }
   });

   // Response caching with stale-while-revalidate
   import {fastifyCaching} from '@fastify/caching';
   app.register(fastifyCaching, {privacy: fastifyCaching.privacy.PUBLIC, expiresIn: 60});
   ```

6. **Add distributed tracing with OpenTelemetry**

   ```typescript
   // tracing.ts — initialize before importing app modules
   import {NodeSDK} from '@opentelemetry/sdk-node';
   import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-http';
   import {HttpInstrumentation} from '@opentelemetry/instrumentation-http';

   const sdk = new NodeSDK({
     serviceName: 'commerce-gateway',
     traceExporter: new OTLPTraceExporter({url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT}),
     instrumentations: [new HttpInstrumentation()],
   });
   sdk.start();

   // Propagate trace context to downstream services
   // OpenTelemetry auto-injects W3C traceparent headers into all outgoing HTTP requests
   ```

## Examples

### Apollo Router configuration with caching and CORS

```yaml
# router.yaml
server:
  listen: 0.0.0.0:4000
  cors:
    origins:
      - https://www.mystore.com
      - https://staging.mystore.com

supergraph:
  listen: 0.0.0.0:4000

traffic_shaping:
  router:
    timeout: 30s
  all:
    timeout: 10s
    retry:
      enabled: true
      min_per_sec: 10
      ttl: 10s
      retry_on_http_statuses: [500, 502, 503]

telemetry:
  tracing:
    otlp:
      endpoint: http://otel-collector:4317
      protocol: grpc
```

### Schema stitching for legacy REST services

```typescript
import {wrapSchema, RenameTypes, FilterTypes} from '@graphql-tools/wrap';
import {fetch} from 'undici';

// Wrap a legacy REST API as a virtual GraphQL subgraph
const legacyProductSchema = buildSchema(`
  type Query {
    legacyProduct(sku: String!): LegacyProduct
  }
  type LegacyProduct {
    sku: String!
    name: String!
    wholesalePrice: Float!
  }
`);

const legacyProductSubschema = {
  schema: legacyProductSchema,
  executor: async ({document, variables}: any) => {
    const sku = variables.sku;
    const res = await fetch(`${process.env.LEGACY_API_URL}/products/${sku}`);
    const product = await res.json();
    return {data: {legacyProduct: product}};
  },
};
```

## Best Practices

- **Keep the gateway thin** — the gateway handles cross-cutting concerns (auth, rate limiting, caching, tracing); business logic belongs in the services
- **Use Apollo Federation for GraphQL** — schema stitching works but federation is the standard; it enforces clear ownership and enables schema registry checks in CI
- **Set per-service timeouts** — a slow inventory service should not hold up a product page; set independent timeouts for each subgraph and use `@defer` for non-critical data
- **Cache at the gateway, not the client** — use `Cache-Control` and Fastify/Apollo caching plugins to serve repeated queries from memory; this reduces load on all downstream services
- **Version the gateway API, not the subgraphs** — expose `/api/v1` and `/api/v2` prefixes at the gateway level; individual subgraph schemas evolve independently under federation
- **Use health check endpoints for each subgraph** — configure the router to poll `/health` on each service and remove unhealthy subgraphs from routing automatically
- **Monitor gateway latency as a system-level SLO** — the gateway p99 latency is the ceiling on every user interaction; alert when it exceeds your page performance budget

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| N+1 queries when resolving entity references | Use Apollo Federation's `@key` and batch-resolving (DataLoader pattern) to fetch all referenced entities in one call per service |
| Auth token not forwarded to subgraphs | Configure Apollo Router's `headers.all` propagation to forward `Authorization` and `x-customer-id` headers to all subgraphs |
| Gateway becomes a bottleneck under load | Deploy Apollo Router as a horizontally scaled stateless service behind a load balancer; it has a Rust core and handles thousands of RPS per instance |
| Subgraph schema conflict blocks deployment | Use `rover subgraph check` in CI to validate schema changes against the registry before merging |
| Cross-origin requests blocked from the SPA | Set `CORS` origins explicitly to your storefront domains; never use wildcard `*` on an authenticated gateway |

## Related Skills

- @composable-commerce
- @webhook-architecture
- @monitoring-alerting-commerce
- @edge-commerce
- @load-testing-commerce
