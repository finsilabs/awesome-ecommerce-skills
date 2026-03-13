---
name: shopify-admin-api
description: "Automate Shopify store operations — products, orders, inventory, and customers — using the GraphQL Admin API with bulk operation support"
category: platform-shopify
risk: safe
source: curated
date_added: "2026-03-12"
tags: [shopify, admin-api, graphql, rest, products, orders, customers, bulk-operations]
triggers: ["shopify admin api", "shopify graphql admin", "shopify rest api", "shopify orders api", "shopify products api", "shopify customers api"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify]
difficulty: intermediate
---

# Shopify Admin API

## Overview

The Shopify Admin API gives apps full access to a merchant's store data — products, variants, orders, customers, inventory, metafields, and more. It is available in both GraphQL (recommended) and REST flavors, with GraphQL offering precise field selection, bulk operations, and better rate limiting via the calculated cost system. Use the `@shopify/shopify-api` Node.js library or direct HTTP calls with an Admin API access token.

## When to Use This Skill

- When reading or writing product catalog data (titles, variants, pricing, images, inventory)
- When fulfilling or updating orders programmatically from an external system
- When syncing customer records between Shopify and a CRM or ERP
- When running bulk data exports or imports using Bulk Operations
- When building an internal tool that needs merchant store access via a Custom App token
- When automating inventory adjustments from a warehouse management system

## Core Instructions

1. **Obtain an Admin API access token**

   For a custom app (single store), create it in Admin → Settings → Apps and Sales Channels → Develop apps. For a public/partner app, the token is obtained after OAuth (see `@shopify-app-development`).

   ```bash
   # .env
   SHOPIFY_ADMIN_API_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   SHOPIFY_SHOP=mystore.myshopify.com
   SHOPIFY_API_VERSION=2025-01
   ```

2. **Initialize the Admin API client**

   ```typescript
   // lib/shopify-admin.ts
   import { shopifyApi, ApiVersion, Session } from "@shopify/shopify-api";
   import "@shopify/shopify-api/adapters/node";

   const shopify = shopifyApi({
     apiKey: process.env.SHOPIFY_API_KEY!,
     apiSecretKey: process.env.SHOPIFY_API_SECRET!,
     scopes: ["read_products", "write_products", "read_orders", "write_orders"],
     hostName: process.env.SHOPIFY_APP_URL!,
     apiVersion: ApiVersion.January25,
     isEmbeddedApp: false, // true for merchant-facing embedded apps
   });

   // For custom apps with a static token
   const session = new Session({
     id: `offline_${process.env.SHOPIFY_SHOP}`,
     shop: process.env.SHOPIFY_SHOP!,
     state: "",
     isOnline: false,
     accessToken: process.env.SHOPIFY_ADMIN_API_TOKEN,
   });

   export const adminClient = new shopify.clients.Graphql({ session });
   export const restClient = new shopify.clients.Rest({ session });
   ```

3. **Query products with GraphQL**

   ```typescript
   // Fetch products with variants and inventory
   export async function getProducts(cursor?: string) {
     const response = await adminClient.request(`
       query GetProducts($cursor: String) {
         products(first: 50, after: $cursor) {
           pageInfo { hasNextPage endCursor }
           edges {
             node {
               id
               title
               status
               variants(first: 100) {
                 edges {
                   node {
                     id
                     sku
                     price
                     inventoryQuantity
                     inventoryItem { id }
                   }
                 }
               }
             }
           }
         }
       }
     `, { variables: { cursor } });
     return response.data.products;
   }

   // Update a product's price via mutation
   export async function updateVariantPrice(variantId: string, price: string) {
     const response = await adminClient.request(`
       mutation UpdateVariantPrice($id: ID!, $price: Money!) {
         productVariantUpdate(input: { id: $id, price: $price }) {
           productVariant { id price }
           userErrors { field message }
         }
       }
     `, { variables: { id: variantId, price } });

     const { userErrors } = response.data.productVariantUpdate;
     if (userErrors.length > 0) throw new Error(userErrors[0].message);
     return response.data.productVariantUpdate.productVariant;
   }
   ```

4. **Fetch and update orders**

   ```typescript
   // Query unfulfilled orders
   export async function getUnfulfilledOrders() {
     const response = await adminClient.request(`
       query {
         orders(first: 50, query: "fulfillment_status:unfulfilled financial_status:paid") {
           edges {
             node {
               id
               name
               email
               createdAt
               lineItems(first: 50) {
                 edges {
                   node {
                     title
                     quantity
                     variant { id sku }
                   }
                 }
               }
               shippingAddress {
                 firstName lastName address1 city province zip country
               }
             }
           }
         }
       }
     `);
     return response.data.orders.edges.map(({ node }: any) => node);
   }

   // Mark an order as fulfilled
   export async function fulfillOrder(orderId: string, trackingNumber: string, trackingCompany: string) {
     // First get fulfillment order ID
     const orderResponse = await adminClient.request(`
       query GetFulfillmentOrders($id: ID!) {
         order(id: $id) {
           fulfillmentOrders(first: 5) {
             edges {
               node { id status lineItems(first: 20) { edges { node { id remainingQuantity } } } }
             }
           }
         }
       }
     `, { variables: { id: orderId } });

     const fulfillmentOrder = orderResponse.data.order.fulfillmentOrders.edges[0]?.node;
     if (!fulfillmentOrder) throw new Error("No fulfillment order found");

     const response = await adminClient.request(`
       mutation FulfillOrder($fulfillment: FulfillmentInput!) {
         fulfillmentCreate(fulfillment: $fulfillment) {
           fulfillment { id status }
           userErrors { field message }
         }
       }
     `, {
       variables: {
         fulfillment: {
           lineItemsByFulfillmentOrder: [{ fulfillmentOrderId: fulfillmentOrder.id }],
           trackingInfo: { number: trackingNumber, company: trackingCompany },
           notifyCustomer: true,
         },
       },
     });
     return response.data.fulfillmentCreate;
   }
   ```

5. **Run Bulk Operations for large datasets**

   For exporting thousands of products or orders, use Bulk Operations (GraphQL only) — they run asynchronously and return a JSONL file URL:

   ```typescript
   // Start a bulk operation
   export async function startBulkProductExport() {
     const response = await adminClient.request(`
       mutation {
         bulkOperationRunQuery(
           query: """
           {
             products {
               edges {
                 node {
                   id title status
                   variants {
                     edges {
                       node { id sku price inventoryQuantity }
                     }
                   }
                 }
               }
             }
           }
           """
         ) {
           bulkOperation { id status }
           userErrors { field message }
         }
       }
     `);
     return response.data.bulkOperationRunQuery.bulkOperation;
   }

   // Poll for completion and download URL
   export async function getBulkOperationStatus() {
     const response = await adminClient.request(`
       query {
         currentBulkOperation {
           id status errorCode
           objectCount
           url  # JSONL download URL — available when status is COMPLETED
         }
       }
     `);
     return response.data.currentBulkOperation;
   }
   ```

## Examples

### Customer search and update via REST API

```typescript
// REST is still valid for simple lookups where GraphQL overhead isn't worth it
export async function searchCustomers(email: string) {
  const response = await restClient.get({
    path: "customers/search",
    query: { query: `email:${email}` },
  });
  return response.body.customers;
}

export async function tagCustomer(customerId: number, tags: string[]) {
  const response = await restClient.put({
    path: `customers/${customerId}`,
    data: { customer: { id: customerId, tags: tags.join(",") } },
  });
  return response.body.customer;
}
```

### Inventory adjustment

```typescript
export async function adjustInventory(inventoryItemId: string, locationId: string, delta: number) {
  const response = await adminClient.request(`
    mutation AdjustInventory($input: InventoryAdjustQuantitiesInput!) {
      inventoryAdjustQuantities(input: $input) {
        inventoryAdjustmentGroup {
          changes {
            name
            delta
            item { id }
            location { name }
          }
        }
        userErrors { field message }
      }
    }
  `, {
    variables: {
      input: {
        name: "available",
        reason: "correction",
        changes: [
          {
            inventoryItemId,
            locationId,
            delta,
          },
        ],
      },
    },
  });
  return response.data.inventoryAdjustQuantities;
}
```

## Best Practices

- **Prefer GraphQL over REST** — GraphQL has a cost-based rate limit (1000 cost units/second) that's more forgiving than REST's 40 requests/second; it also avoids over-fetching
- **Use Bulk Operations for exports above 250 records** — never page through thousands of records manually; Bulk Operations handle up to millions of records in a single async job
- **Always handle `userErrors` on mutations** — a 200 HTTP response does not mean success; check `userErrors` array before treating a mutation as successful
- **Use `gid://shopify/Product/123` format for IDs** — Admin API GraphQL uses global IDs; never send numeric IDs without the GID prefix
- **Implement exponential backoff** — respect `Retry-After` headers and implement backoff on 429 and 503 responses
- **Cache immutable product data** — product titles and handles rarely change; cache them with a reasonable TTL to reduce API calls
- **Scope to minimum required permissions** — requesting fewer scopes reduces merchant trust friction at install time

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| `Cost exceeds bucket size` GraphQL error | Reduce the `first:` argument on connections (use 50 instead of 250) or restructure the query to avoid deeply nested connections |
| Numeric vs GID ID format mismatch | Always convert REST numeric IDs to GID format: `gid://shopify/Product/${numericId}` |
| Bulk operation URL returns 403 | The JSONL URL is a time-limited signed S3 URL — download it immediately after polling `COMPLETED` status |
| Order fulfillment fails with `FULFILLMENT_ORDER_NOT_FOUND` | Orders must be fulfilled via Fulfillment Orders API (not legacy Fulfillments API) since API version 2022-07 |
| Webhook events trigger duplicate processing | Use the `admin_graphql_api_id` in webhook payloads and implement idempotency keying |
| Customer update clears existing tags | When updating tags, always fetch current tags first and append — the API replaces, not merges |

## Related Skills

- @shopify-app-development
- @shopify-webhooks
- @shopify-metafields
- @shopify-storefront-api
- @bulk-data-operations
