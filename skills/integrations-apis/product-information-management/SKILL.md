---
name: product-information-management
description: "Centralize product data in a PIM system like Akeneo or Salsify and syndicate enriched content to all your sales channels automatically"
category: integrations-apis
risk: safe
source: curated
date_added: "2026-03-12"
tags: [pim, akeneo, salsify, product-data, syndication, catalog, data-enrichment, attributes]
triggers: ["pim integration", "akeneo integration", "salsify integration", "product information management", "product data syndication", "centralized catalog", "product enrichment"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Product Information Management

## Overview

A Product Information Management (PIM) system is the single source of truth for product data — names, descriptions, images, attributes, and digital assets — across all channels (website, marketplaces, print catalogs). Akeneo and Salsify are the dominant enterprise PIM platforms. This skill covers integrating a PIM as the authoritative source for product enrichment, implementing bi-directional sync between the PIM and your commerce platform, and building a product data pipeline that transforms PIM data into channel-specific formats.

## When to Use This Skill

- When product data is inconsistent across your website, marketplace listings, and internal systems
- When the merchandising team manages product content in a PIM and the commerce platform needs to reflect it
- When building a new headless storefront that needs a source of enriched product data
- When adding a new sales channel (marketplace, B2B portal) that needs channel-specific product data
- When auditing product data quality and identifying missing attributes across the catalog

## Prerequisites & Platform Notes

**Shopify**: Shopify supports webhooks, the Admin API, and app extensions for integrations. Use Shopify Flow or custom apps to connect third-party services.
**WooCommerce**: Use WooCommerce REST API and WordPress hooks for integrations. Connect via plugins or custom PHP code.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: API credentials for both your store and the external service

## Core Instructions

1. **Connect to the Akeneo REST API**

   Akeneo exposes a REST API using OAuth2 client credentials:

   ```typescript
   // lib/akeneo/client.ts
   interface AkeneoConfig {
     baseUrl: string;
     clientId: string;
     clientSecret: string;
     username: string;
     password: string;
   }

   export class AkeneoClient {
     private config: AkeneoConfig;
     private accessToken: string | null = null;
     private tokenExpiry: number = 0;

     constructor(config: AkeneoConfig) {
       this.config = config;
     }

     async getToken(): Promise<string> {
       if (this.accessToken && this.tokenExpiry > Date.now() + 60000) {
         return this.accessToken;
       }

       const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

       const res = await fetch(`${this.config.baseUrl}/api/oauth/v1/token`, {
         method: 'POST',
         headers: {
           'Authorization': `Basic ${credentials}`,
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           grant_type: 'password',
           username: this.config.username,
           password: this.config.password,
         }),
       });

       const data = await res.json();
       this.accessToken = data.access_token;
       this.tokenExpiry = Date.now() + data.expires_in * 1000;
       return this.accessToken!;
     }

     async get(path: string) {
       const token = await this.getToken();
       const res = await fetch(`${this.config.baseUrl}${path}`, {
         headers: {'Authorization': `Bearer ${token}`},
       });
       if (!res.ok) throw new Error(`Akeneo API error ${res.status}: ${path}`);
       return res.json();
     }

     async getAll(path: string): Promise<any[]> {
       const items: any[] = [];
       let nextUrl: string | null = path;

       while (nextUrl) {
         const page = await this.get(nextUrl);
         items.push(...(page._embedded?.items ?? []));
         nextUrl = page._links?.next?.href?.replace(this.config.baseUrl, '') ?? null;
       }

       return items;
     }
   }

   export const akeneo = new AkeneoClient({
     baseUrl: process.env.AKENEO_BASE_URL!,
     clientId: process.env.AKENEO_CLIENT_ID!,
     clientSecret: process.env.AKENEO_CLIENT_SECRET!,
     username: process.env.AKENEO_USERNAME!,
     password: process.env.AKENEO_PASSWORD!,
   });
   ```

2. **Fetch and transform product data from Akeneo**

   Akeneo stores attribute values as locale-and-scope-scoped arrays. Transform them into a flat structure for your storefront:

   ```typescript
   // lib/akeneo/product-transformer.ts
   interface AkeneoProduct {
     identifier: string;
     family: string;
     enabled: boolean;
     categories: string[];
     values: Record<string, Array<{locale: string | null; scope: string | null; data: any}>>;
     associations: Record<string, {products: string[]}>;
   }

   interface StorefrontProduct {
     sku: string;
     name: string;
     description: string;
     shortDescription: string;
     brand: string;
     categories: string[];
     attributes: Record<string, string | string[] | number | boolean>;
     images: Array<{url: string; label: string; main: boolean}>;
     enabled: boolean;
   }

   export function transformAkeneoProduct(
     akeneoProduct: AkeneoProduct,
     locale = 'en_US',
     scope = 'ecommerce'
   ): StorefrontProduct {
     // Helper to get a scoped/localized value
     const getValue = (attrCode: string, defaultValue: any = null) => {
       const values = akeneoProduct.values[attrCode] ?? [];
       // Try locale+scope, then locale only, then scope only, then no scope/locale
       const match = values.find(v => v.locale === locale && v.scope === scope)
         ?? values.find(v => v.locale === locale && v.scope === null)
         ?? values.find(v => v.locale === null && v.scope === scope)
         ?? values.find(v => v.locale === null && v.scope === null);
       return match?.data ?? defaultValue;
     };

     const images = (getValue('images', []) as Array<any>).map((img: any, i: number) => ({
       url: `${process.env.AKENEO_BASE_URL}/api/rest/v1/media-files/${img._links?.download?.href ?? img}`,
       label: img.originalFilename ?? `Image ${i + 1}`,
       main: i === 0,
     }));

     return {
       sku: akeneoProduct.identifier,
       name: getValue('name', '') as string,
       description: getValue('description', '') as string,
       shortDescription: getValue('short_description', '') as string,
       brand: getValue('brand', '') as string,
       categories: akeneoProduct.categories,
       attributes: {
         color: getValue('color'),
         size: getValue('size'),
         material: getValue('material'),
         weight: getValue('weight'),
         countryOfOrigin: getValue('country_of_origin'),
       },
       images,
       enabled: akeneoProduct.enabled,
     };
   }
   ```

3. **Implement incremental product sync**

   Full catalog syncs are expensive. Use Akeneo's `search_after` filter to sync only updated products:

   ```typescript
   // jobs/akeneo-sync.ts
   export async function syncAkeneoProducts() {
     const lastSyncAt = await db.syncState.getLastSync('akeneo_products');
     const syncStartTime = new Date();

     // Fetch products updated since last sync
     const updatedAt = lastSyncAt?.toISOString() ?? '2020-01-01T00:00:00+00:00';
     const products = await akeneo.getAll(
       `/api/rest/v1/products?search={"updated":[{"operator":">","value":"${updatedAt}"}]}&limit=100&with_attribute_options=true`
     );

     console.log(`Syncing ${products.length} products updated since ${updatedAt}`);

     let synced = 0;
     let errors = 0;

     for (const akeneoProduct of products) {
       try {
         // Fetch media files for this product
         const mediaFiles = await Promise.all(
           (akeneoProduct.values?.images ?? []).map((img: any) =>
             akeneo.get(`/api/rest/v1/media-files/${img.data}`)
               .catch(() => null)
           )
         );

         const storefrontProduct = transformAkeneoProduct(akeneoProduct);

         // Upsert into your commerce platform
         await db.products.upsert(storefrontProduct.sku, {
           ...storefrontProduct,
           updatedAt: new Date(),
           akeneoUpdatedAt: new Date(akeneoProduct.updated),
         });

         synced++;
       } catch (err: any) {
         errors++;
         console.error(`Failed to sync product ${akeneoProduct.identifier}:`, err.message);
         await db.syncErrors.insert({productId: akeneoProduct.identifier, error: err.message, syncAt: new Date()});
       }
     }

     await db.syncState.updateLastSync('akeneo_products', syncStartTime);
     console.log(`Akeneo sync complete: ${synced} synced, ${errors} errors`);
   }
   ```

4. **Push channel-specific exports back to Akeneo**

   Akeneo can store channel feedback (e.g., marketplace listing status, SEO metadata):

   ```typescript
   // Push SEO metadata generated from your storefront back to Akeneo
   export async function pushSEOMetadata(sku: string, seoData: {title: string; metaDescription: string}) {
     const token = await akeneo.getToken();

     await fetch(`${process.env.AKENEO_BASE_URL}/api/rest/v1/products/${sku}`, {
       method: 'PATCH',
       headers: {
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         values: {
           seo_title: [{
             locale: 'en_US',
             scope: 'ecommerce',
             data: seoData.title,
           }],
           seo_meta_description: [{
             locale: 'en_US',
             scope: 'ecommerce',
             data: seoData.metaDescription,
           }],
         },
       }),
     });
   }
   ```

5. **Handle attribute options and reference entities**

   Akeneo uses attribute options for select lists and reference entities for complex linked data (brands, certifications):

   ```typescript
   // Cache attribute options for efficient label lookup
   export async function loadAttributeOptions(): Promise<Map<string, Map<string, string>>> {
     const attributesWithOptions = ['color', 'size', 'material', 'country_of_origin'];
     const optionMap = new Map<string, Map<string, string>>();

     for (const attrCode of attributesWithOptions) {
       const options = await akeneo.getAll(
         `/api/rest/v1/attributes/${attrCode}/options?limit=100`
       );

       const labelMap = new Map<string, string>();
       for (const option of options) {
         const label = option.labels?.en_US ?? option.code;
         labelMap.set(option.code, label);
       }
       optionMap.set(attrCode, labelMap);
     }

     return optionMap;
   }

   // Use labels instead of codes in the storefront
   const optionLabels = await loadAttributeOptions();

   function getAttributeLabel(attrCode: string, optionCode: string): string {
     return optionLabels.get(attrCode)?.get(optionCode) ?? optionCode;
   }
   ```

6. **Build a data quality monitoring dashboard**

   Track attribute completeness across your catalog:

   ```typescript
   export async function generateDataQualityReport(family: string) {
     const products = await akeneo.getAll(
       `/api/rest/v1/products?search={"family":[{"operator":"=","value":"${family}"}]}&limit=100`
     );

     const requiredAttributes = await akeneo.get(`/api/rest/v1/families/${family}`)
       .then(f => f.attributes as string[]);

     const report = requiredAttributes.map(attr => {
       const filled = products.filter(p => {
         const values = p.values[attr] ?? [];
         return values.some((v: any) => v.data !== null && v.data !== '' && v.data !== undefined);
       });

       return {
         attribute: attr,
         filled: filled.length,
         total: products.length,
         completeness: `${((filled.length / products.length) * 100).toFixed(1)}%`,
       };
     });

     return report.sort((a, b) => a.filled - b.filled); // Lowest completeness first
   }
   ```

## Examples

### Salsify REST API product fetch

```typescript
// Salsify uses a different API style — products are returned with property sets
export async function fetchSalsifyProducts(updatedAfter?: Date) {
  const params = new URLSearchParams({
     filter: JSON.stringify({
       ...(updatedAfter ? {'system_updated_at': {'>=': updatedAfter.toISOString()}} : {}),
     }),
     page_size: '100',
  });

  const res = await fetch(`https://app.salsify.com/api/v1/products?${params}`, {
     headers: {
       'Authorization': `Bearer ${process.env.SALSIFY_API_KEY}`,
       'Content-Type': 'application/json',
     },
  });

  const {products} = await res.json();

  return products.map((p: any) => ({
     sku: p['Product ID'] ?? p.id,
     name: p['Product Name'],
     description: p['Long Description'],
     brand: p['Brand'],
     images: (p['Digital Assets'] ?? []).filter((a: any) => a.type === 'Image').map((a: any) => ({url: a.url, label: a.name})),
     attributes: Object.fromEntries(
       Object.entries(p).filter(([key]) => !['Product ID', 'Product Name', 'Long Description', 'Brand', 'Digital Assets'].includes(key))
     ),
  }));
}
```

### Webhook-triggered sync when Akeneo publishes a product

```typescript
// Akeneo can trigger a webhook via its Event API when a product is updated
// Register the endpoint in Akeneo under Connections → Webhooks

// POST /api/webhooks/akeneo
export async function POST(req: NextRequest) {
  const event = await req.json();

  if (event.event_type === 'product.updated' || event.event_type === 'product.created') {
    const sku = event.data.resource.identifier;

    // Fetch the updated product from Akeneo and sync
    const akeneoProduct = await akeneo.get(`/api/rest/v1/products/${sku}?with_attribute_options=true`);
    const storefrontProduct = transformAkeneoProduct(akeneoProduct);

    await db.products.upsert(sku, storefrontProduct);

    // Revalidate CDN cache for this product's page
    await fetch(`${process.env.SITE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {'Authorization': `Bearer ${process.env.REVALIDATION_TOKEN}`},
      body: JSON.stringify({type: 'product', handle: storefrontProduct.slug}),
    });
  }

  return NextResponse.json({received: true});
}
```

## Best Practices

- **Treat the PIM as the source of truth, commerce platform as the destination** — data flows from PIM to commerce, not the other way around; only push back to PIM for data the PIM explicitly manages (e.g., marketing copies generated by your platform)
- **Use incremental sync over full sync** — fetching all products every 15 minutes is expensive; use Akeneo's `updated` filter to fetch only changed products
- **Cache attribute options and families locally** — option label lookups and family attribute lists rarely change; cache them in Redis or a local DB and refresh hourly
- **Map PIM category codes to your commerce platform's category IDs** — maintain a mapping table between Akeneo category codes and your commerce platform's category IDs; this decouples the two systems
- **Log every sync operation with the source timestamp** — store the Akeneo `updated` timestamp on each synced product so you can identify which version of the data is current
- **Validate required attributes before syncing to the storefront** — a product without a name or primary image should not be published; add validation that checks required fields before upsert
- **Use Akeneo completeness scores as a quality gate** — Akeneo calculates completeness per channel; only sync products with 100% completeness for the ecommerce channel

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Attribute values overwritten by bi-directional sync | Designate clear write ownership per attribute; if the PIM owns `description`, never write it from the commerce platform |
| Sync fails on products with missing required attributes | Wrap each product's transformation and upsert in try/catch; log failures with the product identifier; don't let one bad product block the entire sync |
| Images not available after sync | Akeneo media file URLs are internal API URLs that require authentication; upload images to your own CDN during sync rather than serving Akeneo URLs to customers |
| Akeneo API rate limits | Akeneo imposes rate limits per connection; use batched requests (`/api/rest/v1/products-models`), cache responses, and run syncs off-peak |
| Category mapping out of sync after PIM reorganization | Build a category sync job that runs before the product sync; alert when a PIM category code has no mapping in your commerce platform |

## Related Skills

- @marketplace-connectors
- @jamstack-storefront
- @webhook-architecture
- @analytics-integration
