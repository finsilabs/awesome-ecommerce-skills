---
name: woocommerce-rest-api
description: "Integrate or build headless frontends on WooCommerce using its REST API for products, orders, customers, and coupons with key authentication"
category: platform-woocommerce
risk: safe
source: curated
date_added: "2026-03-12"
tags: [woocommerce, rest-api, headless, integration, products, orders, authentication, node]
triggers: ["woocommerce rest api", "woocommerce api integration", "woocommerce headless", "woocommerce external api", "woocommerce nodejs"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [woocommerce]
difficulty: intermediate
---

# WooCommerce REST API

## Overview

WooCommerce ships a versioned REST API (`/wp-json/wc/v3/`) that exposes products, orders, customers, coupons, and store settings over HTTPS. It uses OAuth 1.0a for non-HTTPS environments and Basic Auth (consumer key/secret) over HTTPS. The official `@woocommerce/woocommerce-rest-api` Node.js client handles authentication automatically and supports the full CRUD surface.

## When to Use This Skill

- When building a headless storefront that reads products and categories from WooCommerce
- When integrating WooCommerce with an ERP, CRM, or fulfillment system
- When creating an order management dashboard outside of WordPress Admin
- When syncing inventory between WooCommerce and a warehouse or POS system
- When automating bulk product imports or price updates from an external catalog
- When building a mobile app that needs access to WooCommerce store data

## Core Instructions

1. **Generate API credentials**

   In WordPress Admin → WooCommerce → Settings → Advanced → REST API → Add Key:
   - Description: `My Integration`
   - User: (admin user)
   - Permissions: Read/Write

   This generates a Consumer Key (`ck_xxx`) and Consumer Secret (`cs_xxx`). Store them in environment variables, never in source code.

   ```bash
   WOOCOMMERCE_URL=https://mystore.com
   WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

2. **Set up the Node.js client**

   ```bash
   npm install @woocommerce/woocommerce-rest-api
   ```

   ```typescript
   // lib/woocommerce.ts
   import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

   export const woo = new WooCommerceRestApi({
     url: process.env.WOOCOMMERCE_URL!,
     consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY!,
     consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET!,
     version: "wc/v3",
     axiosConfig: {
       timeout: 15000,
     },
   });
   ```

3. **Query products with filtering and pagination**

   ```typescript
   // lib/products.ts
   interface ProductQuery {
     page?: number;
     perPage?: number;
     category?: number;
     status?: "publish" | "draft" | "private";
     stockStatus?: "instock" | "outofstock" | "onbackorder";
     orderby?: "date" | "popularity" | "price" | "title";
   }

   export async function getProducts(params: ProductQuery = {}) {
     const response = await woo.get("products", {
       page: params.page ?? 1,
       per_page: params.perPage ?? 20,
       status: params.status ?? "publish",
       stock_status: params.stockStatus,
       orderby: params.orderby ?? "date",
       category: params.category,
     });

     return {
       products: response.data,
       totalPages: parseInt(response.headers["x-wp-totalpages"]),
       totalProducts: parseInt(response.headers["x-wp-total"]),
     };
   }

   export async function getProductById(id: number) {
     const response = await woo.get(`products/${id}`);
     return response.data;
   }

   // Get product variations
   export async function getProductVariations(productId: number) {
     const response = await woo.get(`products/${productId}/variations`, {
       per_page: 100,
     });
     return response.data;
   }
   ```

4. **Create and manage orders**

   ```typescript
   // lib/orders.ts
   interface OrderLineItem {
     product_id: number;
     variation_id?: number;
     quantity: number;
   }

   interface CreateOrderParams {
     billing: {
       first_name: string;
       last_name: string;
       email: string;
       address_1: string;
       city: string;
       postcode: string;
       country: string;
     };
     line_items: OrderLineItem[];
     payment_method?: string;
   }

   export async function createOrder(params: CreateOrderParams) {
     const response = await woo.post("orders", {
       ...params,
       status: "pending",
       payment_method: params.payment_method ?? "stripe",
       payment_method_title: "Credit Card",
       set_paid: false,
     });
     return response.data;
   }

   export async function updateOrderStatus(
     orderId: number,
     status: "pending" | "processing" | "on-hold" | "completed" | "cancelled" | "refunded",
     note?: string
   ) {
     const updateData: any = { status };
     if (note) {
       // Add an order note
       await woo.post(`orders/${orderId}/notes`, { note });
     }
     const response = await woo.put(`orders/${orderId}`, updateData);
     return response.data;
   }

   export async function getOrders(params: {
     status?: string;
     after?: string; // ISO 8601 date
     page?: number;
   } = {}) {
     const response = await woo.get("orders", {
       status: params.status ?? "processing",
       after: params.after,
       per_page: 50,
       page: params.page ?? 1,
     });
     return {
       orders: response.data,
       totalPages: parseInt(response.headers["x-wp-totalpages"]),
     };
   }
   ```

5. **Manage inventory and product updates**

   ```typescript
   // Update stock quantity for a product or variation
   export async function updateStock(productId: number, quantity: number, variationId?: number) {
     const endpoint = variationId
       ? `products/${productId}/variations/${variationId}`
       : `products/${productId}`;

     const response = await woo.put(endpoint, {
       stock_quantity: quantity,
       manage_stock: true,
     });
     return response.data;
   }

   // Batch update products (up to 100 per request)
   export async function batchUpdateProducts(
     updates: Array<{ id: number; regular_price?: string; stock_quantity?: number; status?: string }>
   ) {
     const response = await woo.post("products/batch", { update: updates });
     return response.data;
   }
   ```

## Examples

### Full product sync from external catalog

```typescript
import pLimit from "p-limit";

export async function syncProductsFromCatalog(
  externalProducts: Array<{ sku: string; price: number; stock: number }>
) {
  const limit = pLimit(5); // Max 5 concurrent API calls

  const results = await Promise.allSettled(
    externalProducts.map((ext) =>
      limit(async () => {
        // Look up WooCommerce product by SKU
        const searchResponse = await woo.get("products", { sku: ext.sku });
        const existing = searchResponse.data[0];

        if (existing) {
          // Update existing product
          return woo.put(`products/${existing.id}`, {
            regular_price: ext.price.toFixed(2),
            stock_quantity: ext.stock,
            manage_stock: true,
          });
        } else {
          console.warn(`SKU not found in WooCommerce: ${ext.sku}`);
          return null;
        }
      })
    )
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.error(`${failed.length} products failed to sync`);
  }

  return results;
}
```

### Customer management

```typescript
// Create or update customer
export async function upsertCustomer(email: string, data: Record<string, any>) {
  const searchResponse = await woo.get("customers", { email });
  const existing = searchResponse.data[0];

  if (existing) {
    const response = await woo.put(`customers/${existing.id}`, data);
    return response.data;
  } else {
    const response = await woo.post("customers", { email, ...data });
    return response.data;
  }
}

// Get customer order history
export async function getCustomerOrders(customerId: number) {
  const response = await woo.get("orders", {
    customer: customerId,
    per_page: 50,
    orderby: "date",
    order: "desc",
  });
  return response.data;
}
```

## Best Practices

- **Always use HTTPS** — OAuth 1.0a works over HTTP but transmits credentials with every request; HTTPS + Basic Auth is simpler and safer for server-to-server calls
- **Respect rate limits** — WordPress doesn't enforce API rate limits by default, but high request volumes can cause PHP-FPM or MySQL exhaustion; use `p-limit` or a queue for bulk operations
- **Use batch endpoints for bulk updates** — `/products/batch` accepts up to 100 create/update/delete operations in one request vs. 100 individual requests
- **Filter fields with `_fields` parameter** — `?_fields=id,name,price,stock_quantity` reduces response payload significantly for large product lists
- **Handle WooCommerce-specific error codes** — the API returns `rest_invalid_param`, `woocommerce_rest_cannot_create`, etc. in the error body; parse `response.data.code` for specific error handling
- **Use `after` and `before` date filters** for incremental syncs — avoid full catalog re-scans by filtering orders/products modified since last sync using ISO 8601 timestamps
- **Store the API URL without trailing slash** — the WooCommerce client handles URL construction; a trailing slash in the base URL causes double-slash in endpoints

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| `401 Unauthorized` despite correct keys | Verify the site uses HTTPS; over HTTP the client must use OAuth 1.0a, not Basic Auth — set `isHttps: false` in the client config |
| Products endpoint returns empty array | Check the user assigned to the API key has the correct capabilities; the default `woocommerce_manage_products` capability is required |
| Order creation fails with product ID error | Variable products require `variation_id` in `line_items`; passing only `product_id` for a variable product causes `invalid_variation` error |
| Pagination headers missing | The `x-wp-total` and `x-wp-totalpages` headers are only present on list endpoints, not single-resource endpoints |
| Batch operation partially fails | Batch responses include individual errors per item; iterate `response.data.update` array and check each item for `error` property |
| Slow response on product listing | Add `?_fields=id,name,price` to reduce payload; also consider enabling persistent object cache (Redis) on the WordPress server |

## Related Skills

- @woocommerce-plugin-development
- @woocommerce-subscriptions
- @woocommerce-performance
- @headless-commerce-architecture
- @rest-api-design
