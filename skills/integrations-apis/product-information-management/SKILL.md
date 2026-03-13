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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Product Information Management

## Overview

A Product Information Management (PIM) system is the single source of truth for product data — names, descriptions, images, attributes, and digital assets — across all channels (website, marketplaces, print catalogs). Akeneo and Salsify are the dominant PIM platforms. This skill covers connecting a PIM as the authoritative source for product enrichment, implementing sync between the PIM and your commerce platform, and building a pipeline that transforms PIM data into channel-specific formats.

## When to Use This Skill

- When product data is inconsistent across your website, marketplace listings, and internal systems
- When the merchandising team manages product content in a PIM and the commerce platform needs to reflect it
- When building a new headless storefront that needs a source of enriched product data
- When adding a new sales channel (marketplace, B2B portal) that needs channel-specific product data
- When auditing product data quality and identifying missing attributes across the catalog

## Core Instructions

### Step 1: Determine your platform and PIM integration approach

| Platform | PIM Integration Option | What It Syncs |
|----------|----------------------|--------------|
| **Shopify** | Akeneo's official **Shopify connector** (free, Akeneo Marketplace) or **Salsify Syndication for Shopify** | Product names, descriptions, images, and attributes → Shopify product metafields; Shopify variants mapped to Akeneo product models |
| **WooCommerce** | **Akeneo WooCommerce Connector** (open-source, GitHub) or custom REST API sync | Product data pushed to WooCommerce via the Products REST API; images uploaded to WordPress media library |
| **BigCommerce** | **Akeneo BigCommerce Connector** (Akeneo Marketplace) or **Salsify for BigCommerce** | Product attributes pushed to BigCommerce custom fields and variants; image syndication to BigCommerce CDN |
| **Custom / Headless** | Direct REST API integration with Akeneo or Salsify | Full control over data mapping; incremental sync via `updated` filter; image upload to your CDN during sync |

### Step 2: Platform-specific PIM integration

---

#### Shopify

**Connect Akeneo to Shopify using the official connector:**

1. In your Akeneo instance, go to **Connect → Marketplace** and install the **Shopify Connector** (free, by Akeneo)
2. Configure a **Connection** in Akeneo (under **Connect → Connections**) with read permissions for Products, Media files, and Attribute options
3. In the connector settings, map your Akeneo channels/locales to your Shopify markets (e.g., Akeneo `en_US` scope → Shopify default language)
4. Map Akeneo attribute codes to Shopify fields:
   - `name` → Shopify product title
   - `description` → Shopify body HTML
   - `price` → Shopify variant price
   - Custom attributes → Shopify product metafields (configure under **Settings → Custom data** in Shopify admin)
5. Run an initial full sync and then schedule incremental syncs — the connector pulls only products with `updated > last_sync_at`

**Verify the sync:**
- Go to a product in your Shopify admin and check that the title, description, and images match what's in Akeneo
- Check metafields in the Shopify product page under **Metafields** section

---

#### WooCommerce

**Sync Akeneo to WooCommerce using the REST API:**

The open-source Akeneo WooCommerce Connector (available at github.com/akeneo/woocommerce-connector) provides a starting point, but many merchants build a custom sync script:

1. Set up a cron job (daily or hourly) that:
   - Fetches products from Akeneo updated since the last sync using `GET /api/rest/v1/products?search={"updated":[{"operator":">","value":"..."}]}`
   - Checks if the product exists in WooCommerce using `GET /wp-json/wc/v3/products?sku={sku}`
   - Creates or updates the WooCommerce product using `POST` or `PUT /wp-json/wc/v3/products/{id}`

2. Map Akeneo fields to WooCommerce fields:
   - Akeneo `name` (en_US) → WooCommerce `name`
   - Akeneo `description` → WooCommerce `description`
   - Akeneo `images` → Download and upload to WordPress media library, then set as WooCommerce product images
   - Akeneo custom attributes → WooCommerce product attributes or ACF custom fields

3. After each sync, clear WooCommerce's transient cache: `wp transient delete-all` via WP-CLI to ensure updated products appear immediately

---

#### BigCommerce

**Connect Akeneo using the BigCommerce connector:**

1. In Akeneo Marketplace, install the **BigCommerce Connector** and configure your BigCommerce API credentials (Client ID, Client Secret, Access Token from **Advanced Settings → API Accounts**)
2. Map Akeneo families to BigCommerce product types in the connector configuration
3. Configure attribute mappings:
   - Akeneo attributes → BigCommerce custom fields or variant option sets
   - Akeneo categories → BigCommerce category tree
4. Schedule regular incremental syncs from the connector settings

---

#### Custom / Headless

**Connect to the Akeneo REST API:**

```typescript
// lib/akeneo/client.ts
export class AkeneoClient {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private config: {
    baseUrl: string; clientId: string; clientSecret: string;
    username: string; password: string;
  }) {}

  async getToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry > Date.now() + 60000) return this.accessToken;

    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
    const res = await fetch(`${this.config.baseUrl}/api/oauth/v1/token`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant_type: 'password', username: this.config.username, password: this.config.password }),
    });

    const data = await res.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;
    return this.accessToken!;
  }

  async getAll(path: string): Promise<any[]> {
    const items: any[] = [];
    let nextUrl: string | null = path;

    while (nextUrl) {
      const token = await this.getToken();
      const res = await fetch(`${this.config.baseUrl}${nextUrl}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const page = await res.json();
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

**Transform Akeneo's locale/scope-scoped attribute format into a flat storefront product:**

```typescript
// lib/akeneo/product-transformer.ts
export function transformAkeneoProduct(akeneoProduct: any, locale = 'en_US', scope = 'ecommerce') {
  const getValue = (attrCode: string, defaultValue: any = null) => {
    const values = akeneoProduct.values[attrCode] ?? [];
    const match = values.find(v => v.locale === locale && v.scope === scope)
      ?? values.find(v => v.locale === locale && v.scope === null)
      ?? values.find(v => v.locale === null && v.scope === scope)
      ?? values.find(v => v.locale === null && v.scope === null);
    return match?.data ?? defaultValue;
  };

  return {
    sku: akeneoProduct.identifier,
    name: getValue('name', '') as string,
    description: getValue('description', '') as string,
    brand: getValue('brand', '') as string,
    categories: akeneoProduct.categories,
    attributes: {
      color: getValue('color'),
      size: getValue('size'),
      material: getValue('material'),
    },
    enabled: akeneoProduct.enabled,
  };
}
```

**Incremental sync job (fetch only updated products):**

```typescript
// jobs/akeneo-sync.ts
export async function syncAkeneoProducts() {
  const lastSyncAt = await db.syncState.getLastSync('akeneo_products');
  const syncStartTime = new Date();
  const updatedAt = lastSyncAt?.toISOString() ?? '2020-01-01T00:00:00+00:00';

  const products = await akeneo.getAll(
    `/api/rest/v1/products?search={"updated":[{"operator":">","value":"${updatedAt}"}]}&limit=100&with_attribute_options=true`
  );

  let synced = 0, errors = 0;

  for (const akeneoProduct of products) {
    try {
      const storefrontProduct = transformAkeneoProduct(akeneoProduct);
      // Validate required fields before upserting
      if (!storefrontProduct.name) {
        console.warn(`Skipping ${akeneoProduct.identifier}: missing name`);
        continue;
      }
      await db.products.upsert(storefrontProduct.sku, {
        ...storefrontProduct,
        akeneoUpdatedAt: new Date(akeneoProduct.updated),
      });
      synced++;
    } catch (err: any) {
      errors++;
      await db.syncErrors.insert({ productId: akeneoProduct.identifier, error: err.message });
    }
  }

  await db.syncState.updateLastSync('akeneo_products', syncStartTime);
  console.log(`Akeneo sync complete: ${synced} synced, ${errors} errors`);
}
```

**Webhook-triggered sync when Akeneo publishes a product** (Akeneo's Event API):

```typescript
// Register the webhook endpoint in Akeneo under: Connect → Webhooks
// POST /api/webhooks/akeneo
export async function POST(req: NextRequest) {
  const event = await req.json();
  if (event.event_type === 'product.updated' || event.event_type === 'product.created') {
    const sku = event.data.resource.identifier;
    const akeneoProduct = await akeneo.getAll(`/api/rest/v1/products/${sku}?with_attribute_options=true`);
    const storefrontProduct = transformAkeneoProduct(akeneoProduct);
    await db.products.upsert(sku, storefrontProduct);
    // Purge CDN cache for this product's page
    await revalidateProductPage(storefrontProduct.slug);
  }
  return NextResponse.json({ received: true });
}
```

## Best Practices

- **Treat the PIM as the source of truth — never write product content back from commerce to PIM** — data flows from PIM to commerce; only push back to PIM for data the PIM explicitly manages (e.g., SEO metadata your platform generates)
- **Use incremental sync, not full sync** — fetching all products every 15 minutes is expensive; use Akeneo's `updated` filter to fetch only changed products
- **Upload images to your own CDN during sync** — Akeneo media file URLs are internal API URLs requiring authentication; never serve them directly to customers; upload to S3/R2/Cloudinary during sync
- **Cache attribute options locally** — color, size, and material option label lookups change rarely; cache them in Redis and refresh hourly to avoid per-product API calls
- **Validate required attributes before syncing to the storefront** — a product without a name or primary image should not be published; add validation before upsert

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Sync fails on products with missing required attributes | Wrap each product sync in try/catch; log the product identifier with the error; skip and continue rather than aborting the entire sync |
| Images not available after sync | Akeneo media URLs require authentication; download and re-upload to your CDN during sync — never serve `akeneo-base-url/api/rest/v1/media-files/...` directly |
| Akeneo API rate limits | Use batched requests and run syncs off-peak; cache attribute options locally to reduce API calls per product |
| Category mapping out of sync after PIM reorganization | Build a category sync job that runs before the product sync; alert when an Akeneo category code has no mapping in your commerce platform |
| Shopify connector not syncing metafields | Ensure the metafield namespace and key in the connector configuration match what's configured in **Shopify admin → Settings → Custom data → Products** |

## Related Skills

- @marketplace-connectors
- @webhook-architecture
- @erp-integration
- @analytics-integration
