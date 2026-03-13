---
name: social-commerce
description: "Sync your catalog to Instagram, TikTok, and Facebook to enable shoppable posts and in-app checkout directly from your social content"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [social-commerce, instagram, tiktok, facebook, catalog, shoppable-posts, meta, product-tagging]
triggers: ["social commerce", "instagram shopping", "tiktok shop", "shoppable posts", "social checkout", "facebook catalog", "instagram product tagging"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Social Commerce

## Overview

Social commerce integrates your product catalog with Instagram, TikTok, and Facebook so customers can discover, tag, and purchase products without leaving those platforms. This skill covers catalog feed generation in Meta's required format, Instagram Shopping setup via the Meta Commerce API, TikTok catalog sync, and event tracking to measure social-driven revenue.

## When to Use This Skill

- When adding Instagram or TikTok Shopping to an existing store
- When syncing a product catalog to Meta Commerce Manager for the first time
- When product tags in Instagram posts are returning "product not found" errors
- When building a custom headless storefront that is not covered by native Shopify/WooCommerce social integrations
- When tracking conversions from social checkout back to your internal order system
- When needing real-time catalog sync (price/inventory changes reflected in <1 hour)

## Core Instructions

1. **Generate a Meta-compatible product catalog feed**

   Meta requires a structured XML or CSV feed at a public URL. For best control, generate it dynamically:

   ```typescript
   import { XMLBuilder } from 'fast-xml-parser';

   export async function generateMetaCatalogFeed(req: Request, res: Response) {
     const products = await db.products.findAll({
       where: { status: 'active', availableForSale: true },
       include: ['variants', 'images', 'categories'],
     });

     const items = products.flatMap((p) =>
       p.variants.map((v) => ({
         id: v.sku,                          // Must be unique; SKU is ideal
         title: p.name,
         description: p.description.slice(0, 9999),
         availability: v.inventory > 0 ? 'in stock' : 'out of stock',
         condition: 'new',
         price: `${(v.priceInCents / 100).toFixed(2)} USD`,
         link: `${process.env.STORE_URL}/products/${p.slug}?variant=${v.id}`,
         image_link: p.images[0]?.url,
         additional_image_link: p.images.slice(1, 10).map((i) => i.url).join(','),
         brand: p.brand ?? process.env.STORE_NAME,
         google_product_category: p.googleProductCategory,
         item_group_id: p.id,              // Groups variants together
         color: v.color,
         size: v.size,
         gender: p.gender,
         age_group: p.ageGroup,
       }))
     );

     const builder = new XMLBuilder({ arrayNodeName: 'item', ignoreAttributes: false });
     const xml = builder.build({ rss: { channel: { item: items } } });

     res.setHeader('Content-Type', 'application/xml');
     res.setHeader('Cache-Control', 'public, max-age=3600');
     res.send(xml);
   }
   ```

2. **Register and schedule catalog sync with Meta Commerce API**

   ```typescript
   async function createMetaCatalog() {
     const response = await fetch(
       `https://graph.facebook.com/v18.0/${process.env.META_BUSINESS_ID}/owned_product_catalogs`,
       {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           access_token: process.env.META_ACCESS_TOKEN,
           name: 'My Store Catalog',
         }),
       }
     );
     const { id: catalogId } = await response.json();
     return catalogId;
   }

   async function addFeedToCatalog(catalogId: string, feedUrl: string) {
     await fetch(`https://graph.facebook.com/v18.0/${catalogId}/product_feeds`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         access_token: process.env.META_ACCESS_TOKEN,
         name: 'Main Product Feed',
         schedule: {
           interval: 'HOURLY',    // DAILY, HOURLY, or WEEKLY
           url: feedUrl,
           hour: 0,
         },
       }),
     });
   }
   ```

3. **Trigger real-time product updates via the Catalog Batch API**

   For price or inventory changes, don't wait for the hourly feed crawl — push updates immediately:

   ```typescript
   async function pushProductUpdateToMeta(variantId: string) {
     const variant = await db.variants.findById(variantId, { include: ['product'] });

     await fetch(`https://graph.facebook.com/v18.0/${process.env.META_CATALOG_ID}/items_batch`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         access_token: process.env.META_ACCESS_TOKEN,
         item_type: 'PRODUCT_ITEM',
         requests: [
           {
             method: 'UPDATE',
             retailer_id: variant.sku,
             data: {
               availability: variant.inventory > 0 ? 'in stock' : 'out of stock',
               price: `${(variant.priceInCents / 100).toFixed(2)} USD`,
             },
           },
         ],
       }),
     });
   }
   ```

4. **Set up TikTok catalog sync**

   TikTok uses a similar feed format but has slightly different required fields:

   ```typescript
   export async function generateTikTokCatalogFeed(req: Request, res: Response) {
     const products = await db.products.findAll({ where: { status: 'active' }, include: ['variants', 'images'] });

     const rows = [
       'sku_id,title,description,availability,condition,price,link,image_link,brand',
       ...products.flatMap((p) =>
         p.variants.map((v) =>
           [
             v.sku,
             `"${p.name.replace(/"/g, '""')}"`,
             `"${p.description.slice(0, 999).replace(/"/g, '""')}"`,
             v.inventory > 0 ? 'in stock' : 'out of stock',
             'new',
             `${(v.priceInCents / 100).toFixed(2)} USD`,
             `${process.env.STORE_URL}/products/${p.slug}`,
             p.images[0]?.url,
             p.brand,
           ].join(',')
         )
       ),
     ];

     res.setHeader('Content-Type', 'text/csv');
     res.send(rows.join('\n'));
   }
   ```

5. **Track social checkout conversions with Meta Pixel and CAPI**

   Send purchase events from the server (Conversions API) to deduplicate against browser Pixel events:

   ```typescript
   import { ServerEvent, EventRequest, UserData, CustomData } from 'facebook-nodejs-business-sdk';

   async function sendMetaPurchaseEvent(order: Order) {
     const userData = new UserData()
       .setEmail(order.customerEmail)
       .setPhone(order.customerPhone)
       .setFirstName(order.customerFirstName)
       .setLastName(order.customerLastName);

     const customData = new CustomData()
       .setValue(order.totalValue)
       .setCurrency('USD')
       .setOrderId(order.id)
       .setContentIds(order.lineItems.map((i) => i.sku))
       .setContentType('product');

     const serverEvent = new ServerEvent()
       .setEventName('Purchase')
       .setEventTime(Math.floor(Date.now() / 1000))
       .setUserData(userData)
       .setCustomData(customData)
       .setEventSourceUrl(`${process.env.STORE_URL}/checkout/confirmation`)
       .setActionSource('website');

     const eventRequest = new EventRequest(process.env.META_ACCESS_TOKEN, process.env.META_PIXEL_ID)
       .setEvents([serverEvent]);

     await eventRequest.execute();
   }
   ```

## Examples

### Validate catalog health via API

Check how many products are approved, rejected, or pending in the Meta catalog:

```typescript
async function getCatalogDiagnostics(catalogId: string) {
  const url = new URL(`https://graph.facebook.com/v18.0/${catalogId}/diagnostics`);
  url.searchParams.set('access_token', process.env.META_ACCESS_TOKEN!);
  url.searchParams.set('fields', 'affected_features,severity,description,sample_affected_items');

  const res = await fetch(url.toString());
  const data = await res.json();

  for (const issue of data.data) {
    console.error(`[${issue.severity}] ${issue.description}`);
    console.error('Affected items:', issue.sample_affected_items);
  }
}
```

### Auto-tag new products in Meta catalog with category mapping

```typescript
const CATEGORY_MAP: Record<string, string> = {
  'apparel/tops': '212',      // Google Product Category ID for Tops
  'apparel/bottoms': '214',
  'footwear': '187',
  'accessories': '166',
};

function mapCategoryToGPC(internalCategory: string): string {
  return CATEGORY_MAP[internalCategory] ?? '5181'; // 5181 = Apparel & Accessories (generic)
}
```

## Best Practices

- **Use SKU as the catalog item ID**, not internal database IDs — SKUs are stable across systems and match your warehouse records
- **Keep descriptions under 500 characters** for TikTok — longer descriptions are truncated in the product detail overlay
- **Always include `item_group_id`** for products with variants — Meta uses this to group color/size options into a single product display
- **Use HTTPS-only image URLs** — Meta will reject HTTP image links; also ensure images are at least 500x500px
- **Enable the Conversions API alongside the Pixel** — browser ad blockers can suppress 20–40% of Pixel events; server-side CAPI fills this gap
- **Refresh the access token before it expires** — Meta long-lived tokens expire after 60 days; set up a cron job to refresh them automatically
- **Test catalog feeds with the Meta Commerce Manager debugger** before going live to catch field formatting errors
- **Segment catalog by market/locale** if selling internationally — create separate catalog feeds per currency to avoid currency conversion issues

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Products stuck "under review" after catalog submission | Ensure product images show the item clearly without overlaid text, watermarks, or collages — Meta's policy is strict |
| Price mismatch error in Meta Commerce Manager | The price in your feed must exactly match the price on the landing page URL; dynamic pricing breaks this |
| TikTok catalog items not appearing in TikTok Shop | TikTok requires a separate seller account approval and shop connection; catalog sync alone is insufficient |
| Duplicate purchase events in Meta Events Manager | Send a `event_id` in both the Pixel and CAPI calls with the same value — Meta uses it for deduplication |
| Feed URL returning 403 after deployment | Add the Meta crawler's IP range to your CDN allowlist, or use a signed public URL with a long TTL |

## Related Skills

- @google-shopping-feed
- @influencer-tracking
- @content-commerce
- @attribution-modeling
- @email-marketing-automation
