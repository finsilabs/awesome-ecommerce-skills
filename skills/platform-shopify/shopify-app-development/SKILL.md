---
name: shopify-app-development
description: "Build embedded Shopify apps using the Remix framework, App Bridge for UI integration, Polaris components, and OAuth authentication flow"
category: platform-shopify
risk: safe
source: curated
date_added: "2026-03-12"
tags: [shopify, app, oauth, app-bridge, polaris, remix, embedded-app, cli]
triggers: ["create shopify app", "build shopify app", "shopify embedded app", "shopify oauth", "shopify app bridge", "shopify polaris"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify]
difficulty: advanced
---

# Shopify App Development

## Overview

Build Shopify apps using the Shopify CLI 3.x Remix template, which handles OAuth token exchange, session storage, and App Bridge initialization automatically. Embedded apps run inside the Shopify Admin iframe and use Polaris for a native-feeling UI. The modern approach uses the Remix-based `@shopify/shopify-app-remix` package rather than the legacy Express template.

## When to Use This Skill

- When building a public or custom Shopify app that extends Admin functionality
- When creating an embedded app that merchants install from the Shopify App Store
- When implementing OAuth for the first time with session persistence across reinstalls
- When needing to access the Admin API on behalf of authenticated merchants
- When building merchant-facing tooling with Shopify's Polaris design system
- When replacing an older Express/koa-based Shopify app with the modern Remix stack

## Core Instructions

1. **Scaffold the app with Shopify CLI**

   ```bash
   npm install -g @shopify/cli @shopify/theme
   shopify app init my-shopify-app
   # Choose: Remix template
   cd my-shopify-app
   shopify app dev
   ```

   This scaffolds a Remix app with OAuth, session storage (SQLite by default), and App Bridge already wired up. The dev command tunnels your local server via Cloudflare and installs the app on your Partner development store.

2. **Understand the OAuth flow and session handling**

   The scaffold uses `@shopify/shopify-app-remix` which handles the OAuth dance. In `app/shopify.server.ts`:

   ```typescript
   import "@shopify/shopify-app-remix/adapters/node";
   import {
     AppDistribution,
     DeliveryMethod,
     shopifyApp,
     LATEST_API_VERSION,
   } from "@shopify/shopify-app-remix/server";
   import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
   import { PrismaClient } from "@prisma/client";

   const prisma = new PrismaClient();

   const shopify = shopifyApp({
     apiKey: process.env.SHOPIFY_API_KEY,
     apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
     apiVersion: LATEST_API_VERSION,
     scopes: process.env.SCOPES?.split(","),
     appUrl: process.env.SHOPIFY_APP_URL || "",
     authPathPrefix: "/auth",
     sessionStorage: new PrismaSessionStorage(prisma),
     distribution: AppDistribution.AppStore,
     webhooks: {
       APP_UNINSTALLED: {
         deliveryMethod: DeliveryMethod.Http,
         callbackUrl: "/webhooks",
       },
     },
     hooks: {
       afterAuth: async ({ session }) => {
         shopify.registerWebhooks({ session });
       },
     },
   });

   export default shopify;
   export const authenticate = shopify.authenticate;
   ```

3. **Protect routes and call the Admin API**

   Any loader or action that needs Admin API access calls `authenticate.admin`:

   ```typescript
   // app/routes/app._index.tsx
   import { json } from "@remix-run/node";
   import { useLoaderData } from "@remix-run/react";
   import { authenticate } from "../shopify.server";

   export const loader = async ({ request }: LoaderFunctionArgs) => {
     const { admin, session } = await authenticate.admin(request);

     // GraphQL Admin API call
     const response = await admin.graphql(`
       query {
         shop {
           name
           email
           primaryDomain { url }
         }
       }
     `);
     const { data } = await response.json();
     return json({ shop: data.shop });
   };

   export default function Index() {
     const { shop } = useLoaderData<typeof loader>();
     return <Page title={`Hello, ${shop.name}`} />;
   }
   ```

4. **Build UI with Polaris components**

   ```typescript
   // app/routes/app.products.tsx
   import {
     Page,
     Layout,
     Card,
     DataTable,
     Button,
     Banner,
   } from "@shopify/polaris";
   import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";

   export default function ProductsPage() {
     const shopify = useAppBridge();

     const handleSave = async () => {
       // Use App Bridge Toast for notifications inside the iframe
       shopify.toast.show("Products updated successfully");
     };

     return (
       <Page>
         <TitleBar title="Products" primaryAction={{ content: "Save", onAction: handleSave }} />
         <Layout>
           <Layout.Section>
             <Card>
               <DataTable
                 columnContentTypes={["text", "numeric", "numeric"]}
                 headings={["Product", "Price", "Inventory"]}
                 rows={[["Widget A", "$19.99", 42]]}
               />
             </Card>
           </Layout.Section>
         </Layout>
       </Page>
     );
   }
   ```

5. **Configure scopes and handle app reinstallation**

   Define required scopes in `shopify.app.toml`:

   ```toml
   name = "my-shopify-app"
   client_id = "your_api_key"
   application_url = "https://your-app.fly.dev"
   embedded = true

   [access_scopes]
   scopes = "read_products,write_products,read_orders"

   [webhooks]
   api_version = "2025-01"

   [[webhooks.subscriptions]]
   topics = ["app/uninstalled"]
   uri = "/webhooks"
   ```

   Handle the GDPR mandatory webhooks (`customers/data_request`, `customers/redact`, `shop/redact`) even if your app does not store personal data — Shopify requires these endpoints.

6. **Deploy to production**

   ```bash
   shopify app deploy
   # Deploys to Shopify (functions/extensions)
   # Deploy the Remix server separately (Fly.io, Railway, Render)
   fly launch
   fly deploy
   ```

## Examples

### Mutation via Admin GraphQL API

```typescript
// Create a product via the Admin API inside a Remix action
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    mutation CreateProduct($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          title
          handle
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        input: {
          title: "New Product",
          vendor: "My Store",
          productType: "Widget",
          tags: ["new", "featured"],
        },
      },
    }
  );

  const { data } = await response.json();
  if (data.productCreate.userErrors.length > 0) {
    return json({ errors: data.productCreate.userErrors }, { status: 422 });
  }
  return json({ product: data.productCreate.product });
};
```

### App Bridge Resource Picker (v4)

```typescript
import { useAppBridge } from "@shopify/app-bridge-react";
import { useState } from "react";
import { Button } from "@shopify/polaris";

export default function ProductSelector() {
  const shopify = useAppBridge();
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelectProducts = async () => {
    const selection = await shopify.resourcePicker({
      type: "product",
      multiple: true,
    });

    if (selection) {
      setSelected(selection.map((p) => p.id));
    }
  };

  return (
    <>
      <Button onClick={handleSelectProducts}>Select Products</Button>
      <p>Selected IDs: {selected.join(", ")}</p>
    </>
  );
}
```

## Best Practices

- **Use the Remix CLI template** — it handles session storage, CSRF, OAuth token refresh, and frame-ancestor CSP headers automatically
- **Store sessions in a persistent database** (Prisma + PostgreSQL in production) — the default SQLite storage is unsuitable for multi-instance deployments
- **Scope creep hurts conversion** — only request the minimum scopes needed; merchants see the scope list during installation
- **Use App Bridge for navigation and modals** — direct `window.location` navigation breaks the embedded iframe context
- **Validate webhook HMAC signatures** — even for mandatory GDPR webhooks that you don't act on
- **Test reinstall flows** — merchants who uninstall and reinstall must receive fresh OAuth tokens without stale session data
- **Use `LATEST_API_VERSION` in development only** — pin to a specific version (e.g., `2025-01`) in production to avoid breaking changes
- **Handle `payment_required` errors** — Apps on the App Store may encounter billing requirement errors if merchants exceed their plan

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| "Refused to display in frame" CSP error | Ensure your Remix server returns `frame-ancestors https://*.myshopify.com https://admin.shopify.com` in Content-Security-Policy |
| OAuth redirect loop after install | Check that your app URL in `shopify.app.toml` matches the URL your server is reachable at — mismatch causes infinite redirects |
| Session not found on subsequent requests | Use a persistent session storage (Prisma/PostgreSQL); SQLite doesn't work across Fly.io or Render instances |
| App Bridge `useAppBridge()` returns null | Wrap your Remix app root with `<AppProvider>` from `@shopify/shopify-app-remix/react` |
| Webhooks registered but not firing | Webhooks registered during `afterAuth` may not persist after app update — call `shopify.registerWebhooks` in a separate route for verification |
| "Invalid HMAC" on webhook endpoint | Ensure raw body is read before any JSON parsing middleware — use `getRawBody` before Express/Remix body parsing |

## Related Skills

- @shopify-admin-api
- @shopify-webhooks
- @shopify-checkout-extensions
- @shopify-storefront-api
- @oauth-implementation
