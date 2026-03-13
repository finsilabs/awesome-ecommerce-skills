---
name: sfcc-ocapi-scapi
description: "Integrate with Salesforce Commerce Cloud's headless APIs (OCAPI and Shopper APIs) to build custom storefronts and mobile commerce experiences"
category: platform-salesforce-cc
risk: safe
source: curated
date_added: "2026-03-12"
tags: [salesforce-commerce-cloud, sfcc, ocapi, scapi, shopper-api, headless, b2c, jwt, composable-storefront]
triggers: ["salesforce commerce api", "sfcc ocapi", "sfcc scapi", "salesforce shopper api", "sfcc headless", "salesforce composable storefront", "sfcc api integration"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [salesforce-commerce-cloud]
difficulty: advanced
---

# SFCC OCAPI and Shopper APIs

## Overview

Salesforce B2C Commerce provides two API families: the legacy Open Commerce API (OCAPI) using Basic Auth or OAuth and the modern Commerce API (SCAPI/Shopper APIs) using SLAS (Shopper Login and API Access Service) tokens. SCAPI is the recommended approach for headless storefronts, PWA Kit, and third-party integrations. OCAPI remains the primary Data API for server-side admin operations (product import, order management, promotion management). The Composable Storefront (formerly PWA Kit) is built entirely on SCAPI.

## When to Use This Skill

- When building a headless B2C storefront using SFCC as the commerce backend
- When implementing the Salesforce PWA Kit (Composable Storefront) with custom API calls
- When integrating a mobile app with SFCC product catalog, cart, and checkout
- When building server-side order management integrations using OCAPI Data API
- When migrating an existing OCAPI integration to the newer SCAPI endpoints
- When implementing SLAS token management for customer authentication flows

## Core Instructions

1. **Understand the API landscape**

   | API | Auth | Use Case |
   |-----|------|----------|
   | SCAPI Shopper APIs | SLAS guest/customer token | Headless storefront, product search, cart, checkout |
   | OCAPI Shop API | Basic/OAuth | Storefront operations from trusted server contexts |
   | OCAPI Data API | Client credentials | Admin operations: product import, order management, promotions |
   | SCAPI Admin APIs | Client credentials | Modern admin operations (gradually replacing OCAPI Data API) |

   Base URL pattern: `https://{shortCode}.api.commercecloud.salesforce.com/`

2. **Authenticate with SLAS (Shopper Login and API Access Service)**

   ```typescript
   // lib/sfcc-auth.ts
   const SLAS_BASE = `https://${process.env.SFCC_SHORT_CODE}.api.commercecloud.salesforce.com/shopper/auth/v1`;
   const ORG_ID = process.env.SFCC_ORG_ID!; // f_ecom_xxx format
   const CLIENT_ID = process.env.SFCC_SLAS_CLIENT_ID!;

   // Step 1: Get PKCE code challenge for guest token
   function generateCodeChallenge(): { verifier: string; challenge: string } {
     const nodeCrypto = require("crypto");
     const verifier = nodeCrypto.randomBytes(32).toString("hex");
     const hash = nodeCrypto.createHash("sha256").update(verifier).digest("base64url");
     return { verifier, challenge: hash };
   }

   // Get a guest access token
   export async function getGuestToken(): Promise<{ access_token: string; refresh_token: string }> {
     const { verifier, challenge } = generateCodeChallenge();

     // Step 1: Authorize (get auth code)
     const authorizeUrl = new URL(`${SLAS_BASE}/organizations/${ORG_ID}/oauth2/authorize`);
     authorizeUrl.searchParams.set("client_id", CLIENT_ID);
     authorizeUrl.searchParams.set("channel_id", process.env.SFCC_SITE_ID!);
     authorizeUrl.searchParams.set("redirect_uri", process.env.SFCC_SLAS_REDIRECT_URI!);
     authorizeUrl.searchParams.set("response_type", "code");
     authorizeUrl.searchParams.set("code_challenge", challenge);
     authorizeUrl.searchParams.set("hint", "guest");

     // SFCC returns a redirect — extract the code from the Location header
     const authResponse = await fetch(authorizeUrl.toString(), { redirect: "manual" });
     const location = authResponse.headers.get("location") ?? "";
     const code = new URL(location).searchParams.get("code") ?? "";

     // Step 2: Exchange code for token
     const tokenResponse = await fetch(
       `${SLAS_BASE}/organizations/${ORG_ID}/oauth2/token`,
       {
         method: "POST",
         headers: { "Content-Type": "application/x-www-form-urlencoded" },
         body: new URLSearchParams({
           grant_type: "authorization_code_pkce",
           code,
           code_verifier: verifier,
           client_id: CLIENT_ID,
           redirect_uri: process.env.SFCC_SLAS_REDIRECT_URI!,
           channel_id: process.env.SFCC_SITE_ID!,
         }),
       }
     );

     return tokenResponse.json();
   }

   // Refresh an access token
   export async function refreshToken(refreshToken: string) {
     const response = await fetch(`${SLAS_BASE}/organizations/${ORG_ID}/oauth2/token`, {
       method: "POST",
       headers: { "Content-Type": "application/x-www-form-urlencoded" },
       body: new URLSearchParams({
         grant_type: "refresh_token",
         refresh_token: refreshToken,
         client_id: CLIENT_ID,
       }),
     });
     return response.json();
   }
   ```

3. **Query the product catalog with Shopper Products API**

   ```typescript
   // lib/sfcc-products.ts
   const API_BASE = `https://${process.env.SFCC_SHORT_CODE}.api.commercecloud.salesforce.com`;
   const ORG_ID = process.env.SFCC_ORG_ID!;
   const SITE_ID = process.env.SFCC_SITE_ID!;

   // Search products
   export async function searchProducts(params: {
     q?: string;
     categoryId?: string;
     start?: number;
     count?: number;
     sortKey?: string;
   }, accessToken: string) {
     const url = new URL(`${API_BASE}/search/shopper-search/v1/organizations/${ORG_ID}/product-search`);
     url.searchParams.set("siteId", SITE_ID);
     if (params.q) url.searchParams.set("q", params.q);
     if (params.categoryId) url.searchParams.set("refine", `cgid=${params.categoryId}`);
     url.searchParams.set("start", (params.start ?? 0).toString());
     url.searchParams.set("count", (params.count ?? 20).toString());
     if (params.sortKey) url.searchParams.set("sort", params.sortKey);
     url.searchParams.set("expand", "images,prices,availability,variations");

     const response = await fetch(url.toString(), {
       headers: { Authorization: `Bearer ${accessToken}` },
     });
     return response.json();
   }

   // Get product by ID
   export async function getProduct(productId: string, accessToken: string) {
     const url = `${API_BASE}/product/shopper-products/v1/organizations/${ORG_ID}/products/${productId}?siteId=${SITE_ID}&expand=images,prices,availability,variations,promotions`;
     const response = await fetch(url, {
       headers: { Authorization: `Bearer ${accessToken}` },
     });
     return response.json();
   }
   ```

4. **Manage cart and checkout with Shopper Baskets API**

   ```typescript
   // lib/sfcc-basket.ts

   // Create a basket
   export async function createBasket(accessToken: string) {
     const response = await fetch(
       `${API_BASE}/checkout/shopper-baskets/v1/organizations/${ORG_ID}/baskets?siteId=${SITE_ID}`,
       {
         method: "POST",
         headers: {
           Authorization: `Bearer ${accessToken}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({ customerInfo: { email: null } }),
       }
     );
     return response.json(); // { basketId: "xxx", ... }
   }

   // Add item to basket
   export async function addItemToBasket(
     basketId: string,
     productId: string,
     quantity: number,
     accessToken: string
   ) {
     const response = await fetch(
       `${API_BASE}/checkout/shopper-baskets/v1/organizations/${ORG_ID}/baskets/${basketId}/items?siteId=${SITE_ID}`,
       {
         method: "POST",
         headers: {
           Authorization: `Bearer ${accessToken}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify([{ productId, quantity }]),
       }
     );
     return response.json();
   }

   // Set shipping address
   export async function setShipmentAddress(
     basketId: string,
     shipmentId = "me",
     address: Record<string, string>,
     accessToken: string
   ) {
     const response = await fetch(
       `${API_BASE}/checkout/shopper-baskets/v1/organizations/${ORG_ID}/baskets/${basketId}/shipments/${shipmentId}/shipping-address?siteId=${SITE_ID}`,
       {
         method: "PUT",
         headers: {
           Authorization: `Bearer ${accessToken}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify(address),
       }
     );
     return response.json();
   }

   // Submit order
   export async function submitOrder(basketId: string, accessToken: string) {
     const response = await fetch(
       `${API_BASE}/checkout/shopper-orders/v1/organizations/${ORG_ID}/orders?siteId=${SITE_ID}`,
       {
         method: "POST",
         headers: {
           Authorization: `Bearer ${accessToken}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({ basketId }),
       }
     );
     return response.json(); // { orderNo: "00001234", status: "created" }
   }
   ```

5. **Use OCAPI Data API for server-side admin operations**

   OCAPI Data API uses a client credentials OAuth2 token:

   ```typescript
   // lib/sfcc-ocapi.ts

   // Get admin token via client credentials
   async function getAdminToken(): Promise<string> {
     const response = await fetch("https://account.demandware.com/dwsso/oauth2/access_token", {
       method: "POST",
       headers: {
         "Content-Type": "application/x-www-form-urlencoded",
         Authorization: `Basic ${Buffer.from(
           `${process.env.SFCC_OCAPI_CLIENT_ID}:${process.env.SFCC_OCAPI_CLIENT_SECRET}`
         ).toString("base64")}`,
       },
       body: new URLSearchParams({ grant_type: "client_credentials" }),
     });
     const { access_token } = await response.json();
     return access_token;
   }

   // Get order via OCAPI Data API
   export async function getOrder(orderNo: string): Promise<Record<string, unknown>> {
     const token = await getAdminToken();
     const instanceUrl = process.env.SFCC_INSTANCE_URL!; // https://xxxx.dx.commercecloud.salesforce.com

     const response = await fetch(
       `${instanceUrl}/s/${process.env.SFCC_SITE_ID}/dw/data/v23_2/orders/${orderNo}`,
       {
         headers: {
           Authorization: `Bearer ${token}`,
           "Content-Type": "application/json",
         },
       }
     );
     return response.json();
   }

   // Update order status
   export async function updateOrderStatus(orderNo: string, status: string): Promise<void> {
     const token = await getAdminToken();
     const instanceUrl = process.env.SFCC_INSTANCE_URL!;

     await fetch(
       `${instanceUrl}/s/${process.env.SFCC_SITE_ID}/dw/data/v23_2/orders/${orderNo}`,
       {
         method: "PATCH",
         headers: {
           Authorization: `Bearer ${token}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({ status }),
       }
     );
   }
   ```

## Examples

### Customer login and cart merge (SCAPI)

```typescript
export async function loginCustomer(
  email: string,
  password: string,
  guestToken: string
): Promise<{ access_token: string; customer_id: string }> {
  // Step 1: Get login token via Trusted Agent SLAS flow
  const response = await fetch(
    `${SLAS_BASE}/organizations/${ORG_ID}/oauth2/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${guestToken}`,
      },
      body: new URLSearchParams({
        type: "credentials",
        username: email,
        password,
        client_id: CLIENT_ID,
      }),
    }
  );

  const { access_token, customer_id } = await response.json();

  // Step 2: Merge guest basket into customer basket
  if (guestBasketId) {
    await fetch(
      `${API_BASE}/checkout/shopper-baskets/v1/organizations/${ORG_ID}/baskets?siteId=${SITE_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ guestBasketId }), // Triggers merge
      }
    );
  }

  return { access_token, customer_id };
}
```

### OCAPI product import via Data API

```typescript
// Import/update products via OCAPI Data API
export async function upsertProduct(product: {
  id: string;
  name: string;
  longDescription?: string;
  price: number;
}) {
  const token = await getAdminToken();
  const instanceUrl = process.env.SFCC_INSTANCE_URL!;

  const ocapiProduct = {
    id: product.id,
    name: { default: product.name },
    long_description: { default: product.longDescription ?? "" },
    price: product.price,
    classification_category: { id: "electronics" },
  };

  const response = await fetch(
    `${instanceUrl}/s/-/dw/data/v23_2/products/${product.id}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ocapiProduct),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OCAPI product upsert failed: ${error.message}`);
  }

  return response.json();
}
```

## Best Practices

- **Use SCAPI/Shopper APIs for all new headless projects** — OCAPI is in maintenance mode; SCAPI has better rate limits, JWT-based auth, and Salesforce's active investment
- **Implement token refresh proactively** — SLAS access tokens expire in 30 minutes; refresh in the background before expiry rather than waiting for 401 errors
- **Store tokens in `httpOnly` cookies** — client-side JavaScript should never access SLAS tokens directly; set cookies server-side and use a server-side proxy for API calls
- **Use the Salesforce Commerce SDK** (`@salesforce/commerce-sdk-react` for React, `commerce-sdk-isomorphic` for Node.js) to get type-safe API clients with automatic token management
- **Never expose OCAPI client credentials** — Data API credentials have admin-level access; use environment variables and server-side-only code paths
- **Use `select` parameter to limit fields** — SFCC API responses are large; `?select=(id,name,price_min)` dramatically reduces response sizes for list endpoints
- **Implement request idempotency for order submission** — SFCC baskets can have race conditions; use the `Idempotency-Key` header when submitting orders

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| SLAS authorization returns 400 | Verify `redirect_uri` is registered in SLAS configuration in Business Manager; the URI must be an exact match |
| Guest token doesn't see published products | Check OCAPI/Shop API permissions for the guest client ID in Business Manager → Site Preferences → OCAPI Settings |
| Basket merge silently fails | The guest basket must be created by the same SLAS client ID as the customer session; cross-client basket merges are not supported |
| OCAPI returns 401 despite valid token | OCAPI Data API requires the client ID to be registered with `data` resource permissions, not just `shop` resources |
| Product search returns 0 results | Check search index status in Business Manager → Site Preferences → Search; also verify `siteId` parameter matches the correct site |
| SCAPI rate limit exceeded (429) | Implement exponential backoff; consider server-side caching of catalog data (product lists rarely change in real time) |

## Related Skills

- @sfcc-cartridge-development
- @sfcc-business-manager
- @headless-commerce-architecture
- @oauth-implementation
- @shopify-storefront-api
