---
name: shopify-hydrogen
description: "Build a custom Shopify storefront using the Hydrogen React framework with Remix routing and deploy it to Shopify's Oxygen edge hosting"
category: headless-modern
risk: safe
source: curated
date_added: "2026-03-12"
tags: [shopify, hydrogen, remix, oxygen, storefront-api, headless, react, vite]
triggers: ["shopify hydrogen", "hydrogen storefront", "oxygen deployment", "shopify headless", "remix shopify", "storefront api"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Shopify Hydrogen

## Overview

Hydrogen is Shopify's official React-based framework for building headless storefronts, built on top of Remix and deployed to Oxygen (Shopify's edge hosting). It provides first-class primitives for the Storefront API — product queries, cart management, customer accounts — alongside Shopify-specific components and hooks that handle caching, streaming, and SEO automatically. This skill covers scaffolding a Hydrogen project, querying the Storefront API, implementing cart functionality, and deploying to Oxygen.

## When to Use This Skill

- When building a custom Shopify storefront with full design and UX control
- When the default Shopify Online Store theme is too limiting for your design requirements
- When you need server-side rendering, streaming, and edge-deployed performance
- When integrating third-party services (loyalty, CMS, personalization) directly into the storefront
- When you want a Shopify-managed backend with a completely custom frontend stack

## Prerequisites & Platform Notes

**This skill is written for custom/headless storefronts** (Node.js, Python, or similar backend). The code examples use TypeScript/Node.js and can be adapted to any stack.

**Shopify**: Shopify Hydrogen is Shopify's headless framework. MACH/composable patterns apply when using Shopify as the commerce backend with a custom frontend, or when mixing Shopify with other best-of-breed services.
**WooCommerce**: WooCommerce can serve as a headless backend via its REST API and WPGraphQL. These patterns apply when decoupling the frontend from WordPress.
**Magento**: Magento's GraphQL API and PWA Studio support headless architectures. These composable patterns apply to Magento as a backend service in a MACH stack.

**You'll need**:
- Node.js 18+ (or adapt to your backend language)
- Redis for caching/queues
- An email sending service (SendGrid, AWS SES, or Postmark)
- CDN (Cloudflare, CloudFront, or Fastly)

## Core Instructions

1. **Scaffold a Hydrogen project**

   ```bash
   npm create @shopify/hydrogen@latest -- --quickstart
   # or with options:
   npm create @shopify/hydrogen@latest
   # Follow prompts: project name, language (TypeScript), mock shop or real credentials
   cd my-hydrogen-store
   npm run dev
   # http://localhost:3000
   ```

   The project structure follows Remix file-based routing:
   ```
   app/
     routes/
       _index.tsx         # Homepage
       products.$handle.tsx  # Product detail page
       collections.$handle.tsx
       cart.tsx
     components/
     lib/
       fragments.ts       # Reusable GraphQL fragments
   server.ts              # Hydrogen + Remix entry point
   ```

2. **Configure Storefront API credentials**

   Create a Storefront API token in your Shopify admin under **Apps → Develop apps → Create an app → Storefront API**.

   ```bash
   # .env
   SESSION_SECRET="your-session-secret"
   PUBLIC_STOREFRONT_API_TOKEN="your-public-token"
   PUBLIC_STORE_DOMAIN="your-store.myshopify.com"
   PUBLIC_STOREFRONT_API_VERSION="2025-01"
   ```

   The `server.ts` wires Hydrogen into Remix:
   ```typescript
   import {createHydrogenContext} from '@shopify/hydrogen';

   const hydrogenContext = createHydrogenContext({
     storefront: {
       apiVersion: env.PUBLIC_STOREFRONT_API_VERSION,
       privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
       publicStorefrontToken: env.PUBLIC_STOREFRONT_API_TOKEN,
       storeDomain: env.PUBLIC_STORE_DOMAIN,
     },
     session: HydrogenSession.init(request, [env.SESSION_SECRET]),
   });
   ```

3. **Query the Storefront API**

   Hydrogen provides a `storefront.query` method with built-in caching policies.

   ```typescript
   // app/routes/products.$handle.tsx
   import {useLoaderData} from '@remix-run/react';
   import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

   export async function loader({params, context}: LoaderFunctionArgs) {
     const {storefront} = context;
     const {product} = await storefront.query(PRODUCT_QUERY, {
       variables: {handle: params.handle},
       cache: storefront.CacheLong(), // Cache at CDN for 24h
     });

     if (!product) throw new Response('Not Found', {status: 404});
     return json({product});
   }

   const PRODUCT_QUERY = `#graphql
     query Product($handle: String!) {
       product(handle: $handle) {
         id
         title
         descriptionHtml
         featuredImage { url altText width height }
         variants(first: 20) {
           nodes {
             id
             title
             price { amount currencyCode }
             availableForSale
             selectedOptions { name value }
           }
         }
       }
     }
   ` as const;
   ```

4. **Implement cart with Hydrogen cart utilities**

   Hydrogen provides server-side cart actions via Remix action functions:

   ```typescript
   // app/routes/cart.tsx
   import {CartForm} from '@shopify/hydrogen';
   import type {ActionFunctionArgs} from '@shopify/remix-oxygen';

   export async function action({request, context}: ActionFunctionArgs) {
     const {cart} = context;
     const formData = await request.formData();
     const {action, inputs} = CartForm.getFormInput(formData);

     let result;
     switch (action) {
       case CartForm.ACTIONS.LinesAdd:
         result = await cart.addLines(inputs.lines);
         break;
       case CartForm.ACTIONS.LinesUpdate:
         result = await cart.updateLines(inputs.lines);
         break;
       case CartForm.ACTIONS.LinesRemove:
         result = await cart.removeLines(inputs.lineIds);
         break;
       default:
         throw new Error(`Unhandled cart action: ${action}`);
     }

     const headers = cart.setCartId(result.cart.id);
     return json(result, {headers});
   }

   // Add to cart form component
   export function AddToCartButton({variantId}: {variantId: string}) {
     return (
       <CartForm
         route="/cart"
         action={CartForm.ACTIONS.LinesAdd}
         inputs={{lines: [{merchandiseId: variantId, quantity: 1}]}}
       >
         <button type="submit">Add to Cart</button>
       </CartForm>
     );
   }
   ```

5. **Use Hydrogen caching strategies**

   Hydrogen exposes named caching strategies that map to CDN cache-control headers:

   ```typescript
   // Long cache for static catalog data
   const {collections} = await storefront.query(COLLECTIONS_QUERY, {
     cache: storefront.CacheLong(), // s-maxage=3600, stale-while-revalidate=82800
   });

   // Short cache for inventory-sensitive data
   const {product} = await storefront.query(PRODUCT_WITH_INVENTORY, {
     cache: storefront.CacheShort(), // s-maxage=1, stale-while-revalidate=9
   });

   // No cache for personalized/cart data
   const {customer} = await storefront.query(CUSTOMER_QUERY, {
     cache: storefront.CacheNone(),
   });

   // Custom strategy
   const {data} = await storefront.query(QUERY, {
     cache: storefront.CacheCustom({
       mode: 'public',
       maxAge: 600,
       staleWhileRevalidate: 3000,
     }),
   });
   ```

6. **Deploy to Oxygen**

   ```bash
   npm install -g @shopify/cli
   shopify hydrogen deploy
   # Creates a deployment in your Shopify admin under Online Store → Themes → Headless
   ```

   For CI/CD, use the GitHub Action:
   ```yaml
   # .github/workflows/oxygen.yml
   - uses: Shopify/hydrogen-action@v1
     with:
       shop: ${{ secrets.SHOPIFY_SHOP_DOMAIN }}
       token: ${{ secrets.SHOPIFY_CLI_TOKEN }}
   ```

## Examples

### Collection page with filtering and sorting

```typescript
// app/routes/collections.$handle.tsx
export async function loader({params, request, context}: LoaderFunctionArgs) {
  const {storefront} = context;
  const url = new URL(request.url);
  const sortKey = url.searchParams.get('sort') as ProductCollectionSortKeys | null;

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {
      handle: params.handle,
      first: 24,
      sortKey: sortKey ?? 'BEST_SELLING',
      reverse: sortKey === 'PRICE' ? false : true,
    },
    cache: storefront.CacheShort(),
  });

  return json({collection});
}

const COLLECTION_QUERY = `#graphql
  query Collection(
    $handle: String!
    $first: Int
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) {
    collection(handle: $handle) {
      id
      title
      description
      image { url altText }
      products(first: $first, sortKey: $sortKey, reverse: $reverse) {
        nodes {
          id
          title
          handle
          priceRange { minVariantPrice { amount currencyCode } }
          featuredImage { url altText }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
` as const;
```

### Customer authentication with new Customer Account API

```typescript
// Hydrogen supports the new Customer Account API (OAuth-based)
// app/lib/customer-account.server.ts
export async function loader({context}: LoaderFunctionArgs) {
  const {customerAccount} = context;
  const isLoggedIn = await customerAccount.isLoggedIn();

  if (!isLoggedIn) {
    return redirect('/account/login');
  }

  const {data} = await customerAccount.query(`#graphql
    query Customer {
      customer {
        id
        firstName
        lastName
        emailAddress { emailAddress }
        orders(first: 10) {
          nodes {
            id
            number
            processedAt
            financialStatus
            totalPrice { amount currencyCode }
          }
        }
      }
    }
  `);

  return json({customer: data.customer});
}
```

## Best Practices

- **Use `storefront.CacheLong()` for catalog data** — product and collection data rarely changes; long cache TTLs dramatically improve TTFB on Oxygen's edge network
- **Colocate GraphQL queries with routes** — define `as const` fragment strings in the same file as the loader; this keeps data requirements visible and enables TypeScript inference
- **Use Hydrogen's `<Image>` and `<Money>` components** — they handle Shopify CDN image optimization URLs and currency formatting automatically
- **Leverage Remix defer + Suspense for non-critical data** — render the product immediately and stream recommendations or reviews with `defer()`
- **Keep cart state server-side via cookies** — Hydrogen's cart utilities store the cart ID in a signed cookie; avoid client-only cart state that breaks SSR
- **Use the Storefront API's `@inContext` directive** — pass `language` and `country` context to get localized prices and translated content per request
- **Pin the Storefront API version in `.env`** — Shopify deprecates old API versions; explicit pinning prevents surprise breakage on API updates

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| "Storefront API token not authorized" | Ensure the token has `unauthenticated_read_*` scopes; private tokens are only for server-side requests |
| Cart state lost between page navigations | Store cart ID in the session cookie using `cart.setCartId()`; never store cart ID in component state |
| Images not optimized on Oxygen | Use Hydrogen's `<Image>` component or the `getImageData()` helper to append Shopify CDN transform params |
| TypeScript errors on GraphQL queries | Run `npm run codegen` to regenerate types after changing queries; queries must be tagged `as const` |
| Deployment fails with "missing environment variables" | Oxygen env vars must be added in the Shopify admin under the Hydrogen deployment settings, not just in `.env` |

## Related Skills

- @saleor-development
- @jamstack-storefront
- @composable-commerce
- @pwa-storefront
- @commerce-api-gateway
