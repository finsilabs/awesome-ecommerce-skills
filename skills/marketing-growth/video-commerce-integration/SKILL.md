---
name: video-commerce-integration
description: "Enable shoppable video experiences with live shopping events, interactive product hotspots, and one-click checkout directly from video and livestream content"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [video-commerce, live-shopping, shoppable-video]
triggers: ["add shoppable video", "set up live shopping"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli]
platforms: [platform-agnostic]
difficulty: advanced
---

# Video Commerce Integration

## Overview

Video commerce transforms passive video content into direct purchase experiences by embedding product links, interactive hotspots, and one-click checkout into video players and live streams. Shoppable video on-site can increase video engagement by 3x and product page conversion by 40% compared to static image PDPs. Live shopping events — popularized by TikTok and Instagram LIVE — create urgency and interactivity that no static page can replicate. This skill covers embedding shoppable video on product pages, building a live shopping event player, integrating real-time inventory with video, and measuring video-to-purchase conversion.

## When to Use This Skill

- When wanting to add shoppable product hotspots to existing on-site video content
- When planning live shopping events for product launches or flash sales
- When TikTok Shop or Instagram Shopping LIVE is too limiting and you need a native on-site experience
- When UGC video content needs to be shoppable on product pages
- When measuring the contribution of video content to purchase conversion rates

## Prerequisites & Platform Notes

**Shopify**: Most marketing features are handled by apps from the Shopify App Store (Klaviyo for email, Postscript for SMS, Stamped for reviews, etc.). Use the Shopify Admin API and webhooks to build custom integrations. Shopify's marketing_event API tracks campaign attribution.
**WooCommerce**: Install dedicated plugins (AutomateWoo, WooCommerce Points and Rewards, YITH plugins). Use WooCommerce hooks (woocommerce_order_status_completed, etc.) for custom automation.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store, video commerce platform (YouTube Shopping, TikTok Shop, or Firework), product catalog API access

## Core Instructions

### 1. Shoppable video data model

```typescript
interface ShoppableVideo {
  id:         string;
  title:      string;
  videoUrl:   string;        // HLS or MP4 URL served from CDN
  thumbnailUrl: string;
  duration:   number;        // seconds
  type:       'recorded' | 'live';
  products:   VideoProduct[];
  hotspots:   VideoHotspot[];
  status:     'draft' | 'published' | 'live' | 'archived';
  createdAt:  Date;
}

interface VideoHotspot {
  id:          string;
  videoId:     string;
  productId:   string;
  timestamp:   number;    // seconds into video when hotspot appears
  displayDuration: number; // how long it stays visible (seconds)
  position:    { x: number; y: number };  // % from top-left (0-100 each)
}

interface VideoProduct {
  productId:   string;
  variantId?:  string;
  featuredAt:  number;  // timestamp in video when product is featured
}
```

### 2. Video player with product hotspots

```typescript
// React shoppable video player component
import React, { useRef, useState, useEffect } from 'react';

function ShoppableVideoPlayer({ video }: { video: ShoppableVideo }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<VideoHotspot | null>(null);
  const [hotspotProduct, setHotspotProduct] = useState<Product | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onTimeUpdate = () => {
      const t = el.currentTime;
      setCurrentTime(t);

      // Find active hotspot at current timestamp
      const active = video.hotspots.find(h =>
        t >= h.timestamp && t <= h.timestamp + h.displayDuration
      ) ?? null;

      if (active?.id !== activeHotspot?.id) {
        setActiveHotspot(active);
        if (active) {
          fetch(`/api/products/${active.productId}`)
            .then(r => r.json())
            .then(setHotspotProduct);
        } else {
          setHotspotProduct(null);
        }
      }
    };

    el.addEventListener('timeupdate', onTimeUpdate);
    return () => el.removeEventListener('timeupdate', onTimeUpdate);
  }, [video.hotspots, activeHotspot]);

  return (
    <div className="shoppable-video" style={{ position: 'relative' }}>
      <video
        ref={videoRef}
        src={video.videoUrl}
        poster={video.thumbnailUrl}
        controls
        playsInline
        style={{ width: '100%' }}
      />

      {activeHotspot && hotspotProduct && (
        <ProductHotspotCard
          product={hotspotProduct}
          position={activeHotspot.position}
          onAddToCart={(productId, variantId) => addToCart(productId, variantId)}
        />
      )}
    </div>
  );
}

function ProductHotspotCard({
  product,
  position,
  onAddToCart,
}: {
  product: Product;
  position: { x: number; y: number };
  onAddToCart: (productId: string, variantId?: string) => void;
}) {
  return (
    <div
      className="hotspot-card"
      style={{
        position: 'absolute',
        left:     `${position.x}%`,
        top:      `${position.y}%`,
        transform: 'translate(-50%, -100%)',
        background: 'white',
        padding:  '12px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex:   10,
        minWidth: '200px',
      }}
    >
      <img src={product.images[0]?.url} alt={product.name} width={60} height={60}
           style={{ objectFit: 'cover', borderRadius: '4px' }} />
      <p style={{ margin: '4px 0', fontWeight: 600 }}>{product.name}</p>
      <p style={{ margin: '2px 0', color: '#666' }}>${product.price.toFixed(2)}</p>
      <button
        onClick={() => onAddToCart(product.id)}
        style={{ width: '100%', marginTop: '8px', padding: '8px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Add to cart
      </button>
    </div>
  );
}
```

### 3. Live shopping event infrastructure

```typescript
interface LiveShoppingEvent {
  id:            string;
  title:         string;
  hostId:        string;
  startTime:     Date;
  endTime?:      Date;
  streamKey:     string;      // for RTMP ingest (OBS, Restream, etc.)
  playbackUrl:   string;      // HLS playback URL for viewers
  featuredProducts: string[]; // product IDs to feature during the live
  peakViewers:   number;
  totalOrders:   number;
  totalRevenue:  number;
  status:        'scheduled' | 'live' | 'ended';
}

// Create a live shopping event
async function createLiveShoppingEvent(params: {
  title:       string;
  hostId:      string;
  startTime:   Date;
  productIds:  string[];
}) {
  // Create stream in your video infrastructure (Mux, Cloudflare Stream, etc.)
  const stream = await muxClient.Video.LiveStreams.create({
    playback_policy: 'public',
    new_asset_settings: { playback_policy: 'public' },
  });

  const event = await db.liveShoppingEvents.create({
    title:            params.title,
    hostId:           params.hostId,
    startTime:        params.startTime,
    streamKey:        stream.stream_key,
    playbackUrl:      `https://stream.mux.com/${stream.playback_ids[0].id}.m3u8`,
    featuredProducts: params.productIds,
    status:           'scheduled',
  });

  // Send notifications to subscribers
  await notifyLiveEventSubscribers(event.id);

  return event;
}

// Real-time product featuring during live (host interface)
async function featureProductInLive(eventId: string, productId: string) {
  const event   = await db.liveShoppingEvents.findById(eventId);
  const product = await db.products.findById(productId);

  // Broadcast to all viewers via WebSocket
  await wsServer.broadcast(`live:${eventId}`, {
    type:    'feature-product',
    product: {
      id:       product.id,
      name:     product.name,
      price:    product.price,
      imageUrl: product.images[0]?.url,
      url:      `/products/${product.slug}`,
      stockLevel: product.stockQuantity,
    },
  });

  // Track the featuring
  await db.liveProductFeaturing.create({ eventId, productId, featuredAt: new Date() });
}
```

### 4. Live shopping viewer client

```typescript
// React live shopping viewer
function LiveShoppingViewer({ eventId }: { eventId: string }) {
  const [featuredProduct, setFeaturedProduct] = useState<Product | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${process.env.WS_URL}/live/${eventId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'feature-product':
          setFeaturedProduct(msg.product);
          break;
        case 'viewer-count':
          setViewerCount(msg.count);
          break;
        case 'event-ended':
          setFeaturedProduct(null);
          break;
      }
    };

    return () => ws.close();
  }, [eventId]);

  return (
    <div className="live-player">
      {/* HLS video player (use hls.js for broad browser support) */}
      <HlsPlayer src={`/api/live/${eventId}/stream`} />

      <div className="live-stats">
        <span className="live-badge">LIVE</span>
        <span>{viewerCount.toLocaleString()} watching</span>
      </div>

      {featuredProduct && (
        <div className="featured-product-banner">
          <img src={featuredProduct.imageUrl} alt={featuredProduct.name} width={80} height={80} />
          <div>
            <strong>{featuredProduct.name}</strong>
            <span>${featuredProduct.price.toFixed(2)}</span>
          </div>
          <button onClick={() => addToCart(featuredProduct.id)}>
            Add to Cart
          </button>
        </div>
      )}
    </div>
  );
}
```

### 5. Video commerce analytics

```typescript
async function getVideoCommerceMetrics(videoId: string) {
  const [views, completionRate, hotspotClicks, addToCarts, purchases] = await Promise.all([
    db.videoViews.count({ where: { videoId } }),
    db.videoViews.avgCompletion({ videoId }),
    db.hotspotClicks.count({ where: { videoId } }),
    db.cartEvents.count({ where: { videoId, type: 'add-to-cart' } }),
    db.orders.count({ where: { sourceVideoId: videoId } }),
  ]);

  return {
    views,
    completionRate,
    hotspotCTR:      hotspotClicks / views,
    addToCartRate:   addToCarts / views,
    purchaseRate:    purchases / views,
    videoCVR:        purchases / views,
  };
}
```

## Best Practices

- **Keep hotspot cards small and dismissible** — product cards that cover too much of the video reduce watch time; a compact 200x150px card is less intrusive
- **Trigger hotspots 1–2 seconds after a product appears on screen** — premature hotspots feel random; delayed ones feel responsive and contextual
- **Use HLS for all video delivery** — adaptive bitrate streaming with HLS ensures smooth playback across all network conditions
- **Pre-load product data for all hotspots in the video** — fetch all hotspot products on video load to avoid API latency during playback
- **Host live events at consistent times** — Tuesday/Thursday evenings at 7pm EST builds a recurring audience; ad hoc live events get low attendance
- **Keep live shopping events under 60 minutes** — attention drops sharply after 30–45 minutes; plan your product lineup accordingly

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Hotspot position drifts on mobile (different video aspect ratio) | Use percentage-based positioning (% from top-left) rather than pixel coordinates |
| Live stream delay causing product reveal mismatch | Use low-latency RTMP settings (5s latency) or WHIP for sub-second latency live shopping |
| Video not loading on iOS Safari | Ensure videos use H.264 codec and AAC audio; VP9 is not universally supported on iOS |
| Add-to-cart button not working in embedded players | Ensure the cart API endpoint allows cross-origin requests from the video embed domain |
| Live event WebSocket scaling | Use a Redis pub/sub backend for WebSocket broadcasting; a single Node process cannot handle 1000+ concurrent connections |

## Related Skills

- @tiktok-shop-integration
- @tiktok-ads-integration
- @ugc-campaign-management
- @product-launch-campaigns
- @conversion-rate-optimization
