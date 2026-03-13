---
name: jamstack-storefront
description: "Build a blazing-fast storefront with Next.js or Astro that pre-renders product pages as static HTML and fetches live data from commerce APIs"
category: headless-modern
risk: safe
source: curated
date_added: "2026-03-12"
tags: [jamstack, next.js, astro, static-generation, ssg, isr, headless, commerce, vercel, netlify]
triggers: ["jamstack storefront", "static ecommerce", "next.js commerce", "astro storefront", "ssg commerce", "static site ecommerce"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Jamstack Storefront

## Overview

A Jamstack storefront pre-renders catalog pages at build time for maximum performance and CDN cacheability, while using client-side JavaScript and commerce APIs for dynamic functionality (cart, checkout, account). Next.js with Incremental Static Regeneration (ISR) and Astro with on-demand rendering are the two dominant approaches, each offering different tradeoffs between build times, freshness, and interactivity. This skill covers setting up a Jamstack commerce site, managing catalog regeneration, and integrating headless commerce APIs.

## When to Use This Skill

- When SEO and Core Web Vitals scores are top priorities — static HTML scores near-perfect Lighthouse results
- When you have a large catalog that rarely changes and want sub-100ms page loads from CDN
- When you want to decouple the commerce backend (Shopify, Saleor, commercetools) from the storefront deployment cycle
- When your team wants to use modern React/Astro tooling rather than a platform's proprietary theme system
- When you need to combine commerce data with a CMS (Contentful, Sanity) at build time

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

1. **Bootstrap a Next.js commerce storefront**

   ```bash
   npx create-next-app@latest my-store --typescript --tailwind --app
   cd my-store
   npm install @shopify/storefront-api-client graphql
   ```

   Configure the Storefront API client:
   ```typescript
   // lib/shopify.ts
   import {createStorefrontApiClient} from '@shopify/storefront-api-client';

   export const shopify = createStorefrontApiClient({
     storeDomain: process.env.SHOPIFY_STORE_DOMAIN!,
     publicAccessToken: process.env.SHOPIFY_STOREFRONT_TOKEN!,
     apiVersion: '2025-01',
   });
   ```

2. **Statically generate product pages with ISR**

   ```typescript
   // app/products/[handle]/page.tsx (Next.js App Router)
   import {shopify} from '@/lib/shopify';
   import {notFound} from 'next/navigation';

   // ISR: revalidate every 60 seconds
   export const revalidate = 60;

   // Pre-build top products at build time
   export async function generateStaticParams() {
     const {data} = await shopify.request(TOP_PRODUCTS_QUERY, {
       variables: {first: 200},
     });
     return data.products.edges.map(({node}: any) => ({handle: node.handle}));
   }

   export default async function ProductPage({params}: {params: {handle: string}}) {
     const {data} = await shopify.request(PRODUCT_QUERY, {
       variables: {handle: params.handle},
     });

     if (!data.product) notFound();

     return <ProductDetail product={data.product} />;
   }

   const PRODUCT_QUERY = `
     query ProductByHandle($handle: String!) {
       product(handle: $handle) {
         id title descriptionHtml
         images(first: 5) { edges { node { url altText } } }
         variants(first: 20) {
           edges { node { id title price { amount currencyCode } availableForSale } }
         }
       }
     }
   `;
   ```

3. **Build an Astro storefront for minimal JavaScript overhead**

   Astro ships zero JS by default — components are server-rendered to static HTML unless explicitly hydrated:

   ```bash
   npm create astro@latest -- --template minimal
   cd my-astro-store
   npx astro add tailwind
   npm install @astrojs/node graphql-request
   ```

   ```astro
   ---
   // src/pages/products/[handle].astro
   import {GraphQLClient, gql} from 'graphql-request';
   import Layout from '../../layouts/Layout.astro';
   import AddToCartButton from '../../components/AddToCartButton.tsx'; // Island

   export async function getStaticPaths() {
     const client = new GraphQLClient(import.meta.env.SALEOR_API_URL);
     const {products} = await client.request(gql`query { products(first: 200, channel: "default-channel") { edges { node { slug } } } }`);
     return products.edges.map(({node}: any) => ({params: {handle: node.slug}}));
   }

   const {handle} = Astro.params;
   const client = new GraphQLClient(import.meta.env.SALEOR_API_URL);
   const {product} = await client.request(PRODUCT_QUERY, {slug: handle, channel: 'default-channel'});
   ---

   <Layout title={product.name}>
     <h1>{product.name}</h1>
     <img src={product.thumbnail.url} alt={product.thumbnail.alt} />
     <!-- Only this interactive island ships JavaScript -->
     <AddToCartButton client:load variantId={product.variants[0].id} />
   </Layout>
   ```

4. **Implement on-demand ISR webhooks for catalog freshness**

   When a product is updated in your CMS or commerce platform, trigger Next.js to revalidate only that page:

   ```typescript
   // app/api/revalidate/route.ts
   import {NextRequest, NextResponse} from 'next/server';
   import {revalidatePath, revalidateTag} from 'next/cache';

   export async function POST(req: NextRequest) {
     const authHeader = req.headers.get('authorization');
     if (authHeader !== `Bearer ${process.env.REVALIDATION_TOKEN}`) {
       return NextResponse.json({error: 'Unauthorized'}, {status: 401});
     }

     const body = await req.json();
     const {type, handle, collectionHandle} = body;

     switch (type) {
       case 'product':
         revalidatePath(`/products/${handle}`);
         revalidateTag('products');
         break;
       case 'collection':
         revalidatePath(`/collections/${collectionHandle}`);
         revalidateTag('collections');
         break;
       case 'all':
         revalidateTag('products');
         revalidateTag('collections');
         break;
     }

     return NextResponse.json({revalidated: true, timestamp: Date.now()});
   }
   ```

   Configure your commerce platform to POST to this endpoint on product updates.

5. **Implement client-side cart with Zustand**

   Static product pages need client-side cart state. Use lightweight state management with localStorage persistence:

   ```typescript
   // lib/cart-store.ts
   import {create} from 'zustand';
   import {persist} from 'zustand/middleware';

   interface CartItem {
     variantId: string;
     title: string;
     price: number;
     quantity: number;
     image: string;
   }

   interface CartStore {
     items: CartItem[];
     addItem: (item: CartItem) => void;
     removeItem: (variantId: string) => void;
     updateQuantity: (variantId: string, quantity: number) => void;
     clearCart: () => void;
     total: () => number;
   }

   export const useCartStore = create<CartStore>()(
     persist(
       (set, get) => ({
         items: [],
         addItem: (item) => set((state) => {
           const existing = state.items.find(i => i.variantId === item.variantId);
           if (existing) {
             return {items: state.items.map(i => i.variantId === item.variantId ? {...i, quantity: i.quantity + item.quantity} : i)};
           }
           return {items: [...state.items, item]};
         }),
         removeItem: (variantId) => set((state) => ({items: state.items.filter(i => i.variantId !== variantId)})),
         updateQuantity: (variantId, quantity) => set((state) => ({items: state.items.map(i => i.variantId === variantId ? {...i, quantity} : i)})),
         clearCart: () => set({items: []}),
         total: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
       }),
       {name: 'cart-storage'},
     ),
   );
   ```

6. **Configure CDN caching and cache purging**

   ```typescript
   // next.config.ts
   export default {
     async headers() {
       return [
         {
           source: '/products/:path*',
           headers: [
             {key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=600'},
           ],
         },
         {
           source: '/api/:path*',
           headers: [
             {key: 'Cache-Control', value: 'no-store'},
           ],
         },
       ];
     },
     images: {
       remotePatterns: [
         {protocol: 'https', hostname: '**.shopify.com'},
         {protocol: 'https', hostname: '**.saleor.io'},
       ],
     },
   };
   ```

## Examples

### Next.js 15 App Router with fetch caching tags

```typescript
// lib/get-product.ts
export async function getProduct(handle: string) {
  const res = await fetch(`${process.env.SALEOR_API_URL}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query: PRODUCT_QUERY, variables: {slug: handle, channel: 'default-channel'}}),
    next: {
      revalidate: 300,
      tags: [`product-${handle}`, 'products'],
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`);
  const {data} = await res.json();
  return data.product;
}
```

### Astro with on-demand rendering for cart pages

```astro
---
// src/pages/cart.astro
// Opt out of static generation for cart — render on every request
export const prerender = false;

import Layout from '../layouts/Layout.astro';
import CartPage from '../components/CartPage.tsx';
---

<Layout title="Your Cart">
  <!-- Full client hydration for interactive cart UI -->
  <CartPage client:only="react" />
</Layout>
```

## Best Practices

- **Generate static params for only your top N products** — generating 100,000 product pages at build time is slow; generate the top 500 and let ISR handle the long tail on first request
- **Use Next.js fetch cache tags** — tag each fetch with semantic names (`product-${handle}`, `collections`) so revalidation is surgical rather than purging everything
- **Separate dynamic from static concerns** — product details and images should be static HTML; cart, account, and personalization should be client-rendered islands
- **Pre-warm ISR pages after deployment** — run a script that hits your top product URLs immediately after deploy to populate the CDN cache before customers arrive
- **Use a build-time data layer** — fetch all catalog data in a single large batch at build time rather than making N individual API calls for N product pages
- **Set `revalidate` based on update frequency** — flash sale prices need low revalidation (10s); evergreen product descriptions can be 1 hour or more
- **Test with Lighthouse in CI** — add a Lighthouse CI step to enforce performance budgets so regressions are caught before they reach production

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Build times balloon with large catalogs | Use `generateStaticParams` only for top products; set `dynamicParams = true` so the rest are rendered on demand |
| ISR serves stale prices during flash sales | Use `revalidate = 10` for pricing data or fetch price client-side and merge into the static shell |
| Cart state not persisting across page navigations | Use `zustand` with `persist` middleware or a server-side cart stored in a cookie/session |
| Images fail to load in production | Add all commerce CDN hostnames to `next.config.ts` `images.remotePatterns` |
| On-demand revalidation endpoint abused | Always require a secret token in the `Authorization` header; rotate the token if the endpoint is publicly discoverable |

## Related Skills

- @shopify-hydrogen
- @saleor-development
- @pwa-storefront
- @image-optimization-cdn
- @edge-commerce
