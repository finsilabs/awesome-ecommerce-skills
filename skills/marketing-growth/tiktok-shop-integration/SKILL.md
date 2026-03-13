---
name: tiktok-shop-integration
description: "Sync your product catalog to TikTok Shop, manage orders and inventory, and enable shoppable content with live shopping and affiliate creator programs"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [tiktok-shop, social-commerce, live-shopping]
triggers: ["set up TikTok Shop", "enable live shopping"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: advanced
---

# TikTok Shop Integration

## Overview

TikTok Shop transforms TikTok from a discovery channel into a direct commerce platform where users can purchase without leaving the app. It combines shoppable video posts, LIVE shopping events, product showcase tabs, and an affiliate creator marketplace. For ecommerce brands, integrating TikTok Shop means syncing your product catalog, handling orders through the TikTok Shop API, managing inventory across channels, and enabling creators to tag and sell your products.

## When to Use This Skill

- When launching TikTok as a native commerce channel (not just a traffic referral)
- When your products are well-suited to impulse purchase via short-form video
- When enabling creators to tag and earn commissions on your products
- When running LIVE shopping events for product launches or flash sales
- When needing to sync inventory and orders between TikTok Shop and your primary platform

## Core Instructions

### 1. Register on TikTok Shop Seller Center

1. Go to `seller.tiktokshop.com` and register a seller account
2. Complete identity verification (government ID + business registration)
3. Connect your TikTok Business Account to the Seller Center
4. Generate API credentials: App ID, App Secret, and Shop ID from Developer Portal

### 2. Product catalog sync via TikTok Shop API

```typescript
const TIKTOK_SHOP_BASE = 'https://open-api.tiktokglobalshop.com';

async function tiktokShopRequest(path: string, body: object) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const appKey    = process.env.TIKTOK_SHOP_APP_KEY!;
  const appSecret = process.env.TIKTOK_SHOP_APP_SECRET!;
  const shopId    = process.env.TIKTOK_SHOP_SHOP_ID!;

  // Build signature
  const { createHmac } = await import('crypto');
  const paramString = `${appKey}${timestamp}${JSON.stringify(body)}`;
  const sign = createHmac('sha256', appSecret).update(paramString).digest('hex');

  const url = `${TIKTOK_SHOP_BASE}${path}?app_key=${appKey}&timestamp=${timestamp}&sign=${sign}&shop_id=${shopId}`;

  const response = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tts-access-token': await getAccessToken(),
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();
  if (result.code !== 0) throw new Error(`TikTok Shop API error ${result.code}: ${result.message}`);
  return result.data;
}

async function syncProductToTikTokShop(product: Product) {
  return tiktokShopRequest('/api/products', {
    description:    product.description,
    category_id:    product.tikTokCategoryId,
    brand_id:       product.tikTokBrandId ?? undefined,
    images:         product.images.map(img => ({ url: img.url })),
    package_weight: { unit: 'KILOGRAM', value: product.weightKg },
    package_dimension: {
      height: product.heightCm, length: product.lengthCm, width: product.widthCm, unit: 'CENTIMETER',
    },
    skus: product.variants.map(v => ({
      sales_attributes: v.options.map(opt => ({ attribute_name: opt.name, sku_img: { url: v.images?.[0]?.url }, value_name: opt.value })),
      stock_infos: [{ available_stock: v.stockQuantity, warehouse_id: process.env.TIKTOK_WAREHOUSE_ID }],
      seller_sku:  v.sku,
      original_price: v.price.toFixed(2),
    })),
    title: product.name.substring(0, 255),
    is_cod_open: false,
    delivery_service_ids: [process.env.TIKTOK_DELIVERY_SERVICE_ID],
  });
}
```

### 3. Inventory sync (real-time updates)

Update TikTok Shop inventory after every order across all channels:

```typescript
async function updateTikTokInventory(tikTokSkuId: string, newQuantity: number) {
  return tiktokShopRequest('/api/products/stocks', {
    skus: [{
      id:          tikTokSkuId,
      stock_infos: [{ available_stock: newQuantity, warehouse_id: process.env.TIKTOK_WAREHOUSE_ID }],
    }],
  });
}

// Hook this into your inventory management system
async function onInventoryUpdated(variantId: string) {
  const variant = await db.productVariants.findById(variantId);
  const tikTokSkuId = variant.tikTokSkuId;
  if (!tikTokSkuId) return;

  await updateTikTokInventory(tikTokSkuId, variant.stockQuantity);
}
```

### 4. Order management — webhook handler

TikTok Shop pushes order events to your webhook endpoint:

```typescript
// POST /webhooks/tiktok-shop
export async function handleTikTokShopWebhook(req: Request, res: Response) {
  // Verify signature
  const signature = req.headers['x-tts-signature'] as string;
  const isValid   = verifyTikTokSignature(req.rawBody, signature);
  if (!isValid) return res.status(401).send('Invalid signature');

  const { type, data } = req.body;

  switch (type) {
    case 'ORDER_STATUS_CHANGE': {
      const { order_id, order_status } = data;
      await syncTikTokOrder(order_id, order_status);
      break;
    }
    case 'PRODUCT_STATUS_CHANGE': {
      // Product approved/rejected by TikTok
      await handleProductStatusUpdate(data);
      break;
    }
    case 'SETTLEMENT': {
      await recordSettlement(data);
      break;
    }
  }

  res.json({ code: 0 });
}

async function syncTikTokOrder(tikTokOrderId: string, status: string) {
  const orderData = await tiktokShopRequest('/api/orders/detail/query', {
    order_id_list: [tikTokOrderId],
  });

  const ttOrder = orderData.order_list[0];

  // Create or update in your OMS
  await db.orders.upsert(
    { externalId: tikTokOrderId, externalSource: 'tiktok-shop' },
    {
      status:         mapTikTokStatus(status),
      customerEmail:  ttOrder.buyer_email,
      lineItems:      ttOrder.item_list.map(i => ({ sku: i.seller_sku, quantity: i.quantity, price: parseFloat(i.sale_price) })),
      shippingAddress: {
        name:     ttOrder.recipient_address.name,
        line1:    ttOrder.recipient_address.address_line1,
        city:     ttOrder.recipient_address.district_info[0]?.address_name,
        zip:      ttOrder.recipient_address.zipcode,
        country:  ttOrder.recipient_address.region_code,
        phone:    ttOrder.recipient_address.phone_number,
      },
    }
  );
}
```

### 5. Affiliate creator program setup

TikTok Shop's Open Collaboration model lets creators discover and tag your products without a prior relationship:

```typescript
// Set commission rates via API
async function setAffiliateCommission(params: {
  productId: string;
  commissionRate: number;  // e.g., 0.15 for 15%
  collaborationType: 'OPEN' | 'TARGETED';
}) {
  return tiktokShopRequest('/api/affiliate/product/commission/set', {
    product_id:       params.productId,
    commission_rate:  params.commissionRate,
    collaboration_type: params.collaborationType,
  });
}
```

For targeted campaigns, invite specific creators:

```typescript
async function inviteCreatorToAffiliate(creatorUniqueId: string, productIds: string[]) {
  return tiktokShopRequest('/api/affiliate/program/invitation', {
    creator_unique_id: creatorUniqueId,
    product_ids:       productIds,
    commission_rate:   0.20,  // 20% for targeted invitations
    invitation_message: `Hi! We'd love for you to feature our products. You'll earn 20% commission on every sale through your content.`,
  });
}
```

### 6. LIVE Shopping event setup

Before going live, tag products in TikTok Studio:

1. Open TikTok LIVE Studio (desktop app or mobile)
2. In Shopping tab, select products from your TikTok Shop catalog
3. Pin featured products to the LIVE screen during broadcast
4. Viewers tap the pinned product card to add directly to cart

Automate post-LIVE analysis:

```typescript
async function analyzeLiveShoppingEvent(liveId: string) {
  const metrics = await tiktokShopRequest('/api/live/analytics', {
    live_id: liveId,
  });

  return {
    peakViewers:       metrics.peak_viewer_count,
    totalRevenue:      metrics.total_revenue,
    ordersPlaced:      metrics.order_count,
    conversionRate:    metrics.order_count / metrics.total_viewers,
    topProducts:       metrics.product_performance.sort((a, b) => b.revenue - a.revenue).slice(0, 5),
  };
}
```

## Best Practices

- **Keep TikTok Shop inventory in sync within 5 minutes** — overselling on TikTok damages your seller rating and can result in account suspension
- **Use Open Collaboration for discovery** — set a 10-15% commission rate on all products to attract micro-creators who discover your brand organically
- **Fulfill TikTok Shop orders within 48 hours** — late shipment rate above 2% triggers seller account warnings
- **Include dedicated TikTok Shop images** — square or 9:16 product images outperform landscape images on the platform's product pages
- **Run LIVE events for new product launches** — LIVE Shopping has significantly lower CPM for new buyer acquisition vs. standard video ads
- **Monitor affiliate content for brand safety** — creators in Open Collaboration post without approval; review UGC regularly and have a content reporting process
- **Set a minimum cart value for free shipping** — TikTok Shop displays shipping costs prominently; high fees are a top abandonment driver

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Products stuck in "Under Review" | Ensure all images are on white or clean backgrounds; avoid text overlays banned by TikTok's catalog guidelines |
| Orders not appearing in webhook | Register the webhook in Seller Center; verify the endpoint is publicly accessible and returns `{"code":0}` |
| Affiliate creators posting incorrect prices | Lock product prices; any sale price changes require creator content to be re-tagged automatically |
| LIVE Shopping products not showing on stream | Ensure products are "Active" status in TikTok Shop before going live; product review takes 24-48 hours |
| Inventory sync delay causing oversells | Build an immediate inventory lock on TikTok Shop order creation, before fulfillment confirmation |
| High return rate on TikTok Shop orders | TikTok buyers expect products to match the video exactly; ensure LIVE demos are accurate and avoid over-editing product images |

## Related Skills

- @tiktok-ads-integration
- @ugc-campaign-management
- @influencer-marketplace-integration
- @video-commerce-integration
- @social-commerce
