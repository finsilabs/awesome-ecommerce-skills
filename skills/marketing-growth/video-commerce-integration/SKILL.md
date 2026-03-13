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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Video Commerce Integration

## Overview

Video commerce transforms passive video content into direct purchase experiences by embedding product links, interactive hotspots, and one-click checkout into video players and live streams. Shoppable video on-site increases product page conversion by up to 40% compared to static image PDPs. Live shopping events — popularized by TikTok and Instagram LIVE — create urgency and interactivity that no static page can replicate. Dedicated video commerce platforms (Tolstoy, Videowise, Firework) handle the embedding, hotspot authoring, and analytics without custom development for most stores.

## When to Use This Skill

- When wanting to add shoppable product hotspots to existing on-site video content
- When planning live shopping events for product launches or flash sales
- When TikTok Shop or Instagram Shopping LIVE is too limiting and you need a native on-site experience
- When UGC video content needs to be shoppable on product pages
- When measuring the contribution of video content to purchase conversion rates

## Core Instructions

### Step 1: Choose the right video commerce platform

| Platform | Best For | Shopify | WooCommerce | BigCommerce | Price |
|----------|---------|---------|-------------|-------------|-------|
| **Tolstoy** | Shoppable video stories and feeds, Shopify-native | App Store | Via JS embed | Via JS embed | Free tier; $19+/mo |
| **Videowise** | High-performance shoppable video with LCP optimization | App Store | — | — | $99+/mo |
| **Firework** | Enterprise live shopping + shoppable short video | Via JS | Via JS | Via JS | Custom pricing |
| **YouTube Shopping** | Link YouTube videos to product catalog | Google & YouTube channel | Via Google Listings & Ads plugin | Via Channel Manager | Free |
| **TikTok Shop** | Native TikTok LIVE shopping + video product tags | TikTok channel | TikTok plugin | Via TikTok channel | Free (commission-based) |

**Recommendation:** Use **Tolstoy** for Shopify if your goal is shoppable video stories and product page embeds — it requires no code and integrates with your Shopify catalog automatically. Use **YouTube Shopping** if you already have a YouTube channel with product review or tutorial content. For enterprise live shopping experiences, use **Firework**.

### Step 2: Set up shoppable video on your store

---

#### Shopify with Tolstoy

1. Install **Tolstoy** from the Shopify App Store
2. Go to **Tolstoy → Videos → Upload** and upload your product videos or import from TikTok/Instagram
3. In the video editor, click **Tag Products** → search your Shopify catalog → click the point in the video where the product appears to set the hotspot timestamp
4. Go to **Tolstoy → Widgets → Floating Button** to add a shoppable video bubble to product pages (appears in the lower corner, auto-plays)
5. Go to **Tolstoy → Widgets → Video Carousel** to add a horizontal scroll of shoppable videos above the product description
6. In Shopify Theme Editor: search for "Tolstoy" in the app sections list and drag the widget to the desired position
7. Go to **Tolstoy → Analytics** to track play rate, add-to-cart rate, and revenue attributed to each video

---

#### Shopify with YouTube Shopping

1. Go to **Shopify Admin → Sales Channels → + → Google & YouTube**
2. Connect your Google Merchant Center and YouTube channel
3. Under **YouTube Shopping**, enable product tagging for your videos
4. In YouTube Studio, go to **Shopping** and link your Merchant Center account
5. Edit any YouTube video → click **Products** → search your catalog → tag the product
6. Tagged products appear as a product shelf below your YouTube video and as clickable overlays during playback

---

#### WooCommerce

1. For shoppable video carousels: install **VideoSuite** or **WP Video Popup** from the WordPress plugin directory, then use shortcodes to embed videos on product pages
2. For YouTube Shopping integration: install **Google Listings & Ads** plugin (official Google plugin) → connect your Google Merchant Center → enable product tagging in YouTube Studio (same process as above)
3. For native live shopping: use **TikTok for WooCommerce** plugin and run TikTok LIVE events (see @tiktok-shop-integration for setup)
4. For a full shoppable video experience without custom code: use **Firework** via their JavaScript embed — add the embed script to your WooCommerce theme's `functions.php` via `wp_enqueue_script()`

---

#### BigCommerce

1. For YouTube Shopping: go to **BigCommerce Admin → Channel Manager → Google & Meta** and connect Google Merchant Center; then enable YouTube Shopping in YouTube Studio
2. For shoppable video widgets: add the **Tolstoy** or **Firework** JavaScript snippet via **BigCommerce → Storefront → Script Manager** (Scripts section → Create Script → All pages or specific page)
3. Configure product tagging from within the Tolstoy or Firework dashboard — both platforms connect to your BigCommerce catalog via API credentials generated in **BigCommerce → Advanced Settings → API Accounts**

---

#### Custom / Headless

For headless stores, build shoppable video with a custom player component and product hotspot overlay:

```typescript
interface VideoHotspot {
  id:              string;
  productId:       string;
  timestamp:       number;     // seconds into video when hotspot appears
  displayDuration: number;     // how long it stays visible (seconds)
  position:        { x: number; y: number };  // % from top-left (0–100)
}

interface ShoppableVideo {
  id:           string;
  videoUrl:     string;        // HLS (.m3u8) or MP4 URL from CDN
  thumbnailUrl: string;
  hotspots:     VideoHotspot[];
  type:         'recorded' | 'live';
}
```

```typescript
// React shoppable video player with time-based hotspot detection
import { useRef, useState, useEffect } from 'react';

function ShoppableVideoPlayer({ video }: { video: ShoppableVideo }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeHotspot, setActiveHotspot] = useState<VideoHotspot | null>(null);
  const [hotspotProduct, setHotspotProduct] = useState<Product | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onTimeUpdate = () => {
      const t = el.currentTime;
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
    <div style={{ position: 'relative' }}>
      <video ref={videoRef} src={video.videoUrl} poster={video.thumbnailUrl}
             controls playsInline style={{ width: '100%' }} />
      {activeHotspot && hotspotProduct && (
        <div style={{
          position: 'absolute',
          left: `${activeHotspot.position.x}%`,
          top: `${activeHotspot.position.y}%`,
          transform: 'translate(-50%, -100%)',
          background: 'white',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10,
          minWidth: '200px',
        }}>
          <p style={{ fontWeight: 600 }}>{hotspotProduct.name}</p>
          <p style={{ color: '#666' }}>${hotspotProduct.price.toFixed(2)}</p>
          <button onClick={() => addToCart(hotspotProduct.id)}>Add to cart</button>
        </div>
      )}
    </div>
  );
}
```

For LIVE shopping, use Mux for HLS stream creation and WebSockets to push the currently featured product to all viewers:

```typescript
async function createLiveShoppingEvent(title: string, productIds: string[]) {
  const stream = await muxClient.Video.LiveStreams.create({
    playback_policy: 'public',
    new_asset_settings: { playback_policy: 'public' },
  });

  return db.liveShoppingEvents.create({
    title,
    streamKey:        stream.stream_key,   // configure in OBS/Restream
    playbackUrl:      `https://stream.mux.com/${stream.playback_ids[0].id}.m3u8`,
    featuredProducts: productIds,
    status:           'scheduled',
  });
}

// Broadcast the currently featured product to all live viewers
async function featureProductInLive(eventId: string, productId: string) {
  const product = await db.products.findById(productId);
  await wsServer.broadcast(`live:${eventId}`, {
    type:    'feature-product',
    product: { id: product.id, name: product.name, price: product.price,
               imageUrl: product.images[0]?.url },
  });
}
```

### Step 3: Run a live shopping event (platform-native)

For stores already using TikTok Shop or Instagram Shopping, native LIVE is the lowest-friction path:

**TikTok LIVE Shopping:**
1. Ensure all products you plan to feature are in **Active** status in TikTok Seller Center (review takes 24–48 hours)
2. Open the TikTok app → tap + → Go LIVE → tap the shopping cart icon → select products to feature
3. During the LIVE, pin and unpin products in real time — viewers tap the pinned product card to purchase without leaving the app
4. See @tiktok-shop-integration for full TikTok Shop setup

**Instagram Live Shopping:**
1. Connect your Meta product catalog via the Facebook & Instagram channel (see @social-commerce)
2. Open Instagram → create a LIVE → tap the shopping bag icon → add products from your catalog
3. Tag products during the LIVE; they appear as tappable links for viewers

**On-site LIVE with Firework:**
1. Sign up for Firework and install the embed script on your storefront
2. Go to **Firework → Live Events → Schedule** and create a new live event
3. Connect your product catalog in **Firework → Catalog → Import** (supports Shopify, WooCommerce, and custom feeds)
4. During the event, host controls the product spotlight from the Firework producer dashboard — viewers see the featured product card on your site in real time

### Step 4: Measure video commerce performance

| Metric | Where to Find |
|--------|---------------|
| Video play rate | Tolstoy Analytics / Firework Dashboard |
| Hotspot click-through rate | Tolstoy Analytics → Interactions |
| Add-to-cart from video | Tolstoy / Firework → Conversions |
| Revenue attributed to video | Tolstoy → Revenue (uses UTM attribution) |
| LIVE shopping orders | TikTok Seller Center → Analytics / Firework → Live Reports |

## Best Practices

- **Trigger hotspots 1–2 seconds after a product appears on screen** — premature hotspots feel random; delayed ones feel responsive and contextual
- **Keep hotspot cards compact** — a card covering more than 20% of the video frame reduces watch time; use a minimal 200×120px card with product name, price, and add-to-cart
- **Pre-load product data for all hotspots on video load** — avoids API latency mid-playback; fetch all hotspot products in one batch request when the video player initializes
- **Use HLS for all video delivery** — adaptive bitrate streaming ensures smooth playback across all network conditions; upload MP4 source files and transcode to HLS via Mux or Cloudflare Stream
- **Run LIVE events at consistent times** — Tuesday/Thursday evenings at 7pm in your primary timezone builds a returning audience; ad hoc live events get low attendance
- **Keep live shopping events under 60 minutes** — attention drops sharply after 30–45 minutes; plan your product lineup and demo order in advance

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Hotspot position drifts on mobile | Use percentage-based positioning (% from top-left), not pixel coordinates — percentages scale with the video element |
| Live stream delay causes product reveal mismatch | Use low-latency RTMP settings in OBS (5s latency) or enable WHIP for sub-second latency |
| Video not loading on iOS Safari | Ensure videos use H.264 codec and AAC audio; VP9 is not universally supported on iOS |
| Tolstoy video slowing page load | Tolstoy lazy-loads by default — ensure you are using the Tolstoy Shopify app block, not a custom embed that bypasses their performance optimizations |
| LIVE shopping products not showing | Products must be in Active status before the event; for TikTok, review takes 24–48 hours — activate products the day before |

## Related Skills

- @tiktok-shop-integration
- @tiktok-ads-integration
- @ugc-campaign-management
- @product-launch-campaigns
- @social-commerce
