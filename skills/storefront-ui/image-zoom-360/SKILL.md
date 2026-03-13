---
name: image-zoom-360
description: "Boost product confidence with high-res image zoom, 360-degree spin views, and inline video so shoppers can examine products closely before buying"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [images, zoom, 360-view, video, product-gallery, media, performance]
triggers: ["product image zoom", "360 degree product view", "product gallery", "image magnifier", "product video", "spin view"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Image Zoom & 360-Degree Views

## Overview

Implement a rich product media experience that includes high-resolution zoom on hover, touch-native pinch-to-zoom on mobile, 360-degree spin views from a sequence of images, and inline video playback. Richer media is associated with lower return rates and higher conversion for fashion, jewelry, electronics, and other detail-sensitive categories.

## When to Use This Skill

- When product return rates are high and additional visual detail could reduce them
- When implementing a product detail page for fashion, jewelry, electronics, or other detail-sensitive categories
- When upgrading from a static single image to a full media gallery
- When integrating with a product photography workflow that includes 360-degree spin assets
- When product videos exist and need to be surfaced inline on the PDP

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right approach

| Platform | Recommended Approach | Why |
|----------|---------------------|-----|
| **Shopify** | Use built-in media support in OS2.0 themes (Dawn, Sense) + **Magic Zoom Plus** app or **Swiper Gallery** for 360 | Dawn natively supports product images, video, and 3D models in the media gallery; Magic Zoom Plus ($69 one-time) adds hover zoom and 360 spin without theme edits |
| **WooCommerce** | Install **WooCommerce Product Gallery Slider** or **YITH WooCommerce Zoom Magnifier** (free/premium) | WooCommerce includes a basic gallery; YITH Zoom Magnifier adds hover zoom and lightbox; Product Gallery Slider adds swipe, thumbnails, and video support |
| **BigCommerce** | Use the Cornerstone theme's built-in zoom (hover zoom is enabled by default) + install **Magic 360** or **Sirv** app for spin views | Cornerstone has native zoom; Sirv ($20+/mo) provides hosted 360 spin and zoom CDN with a Stencil widget |
| **Custom / Headless** | Build a custom gallery component with CSS transform zoom, Pointer Events API for pinch-to-zoom, and frame-based spin viewer | Full control over performance and UX; see implementation below |

### Step 2: Set up the product gallery

---

#### Shopify

**Built-in media gallery (no app required):**

1. In your product admin (**Products → [product] → Media**), upload images, add YouTube/Vimeo video URLs, and upload `.glb` files for 3D models
2. Shopify OS2.0 themes (Dawn, Sense, Craft) display all media types in the gallery automatically — images, video, and 3D
3. In **Online Store → Themes → Customize**, navigate to your product page template and find the **Product media** section:
   - Enable **Image zoom** (magnifier on hover)
   - Set **Media size** to Large or Extra Large for better zoom quality
   - Enable **Video looping** for product videos
4. For variant-specific images: assign images to variants in **Products → [product] → Variants → [variant] → Image** — the gallery automatically switches to the variant image when a shopper selects that variant

**For 360-degree spin views — Magic Zoom Plus ($69 one-time):**
1. Install from the Shopify App Store
2. Upload your spin sequence images as numbered files (e.g., `product-001.jpg` through `product-036.jpg`)
3. The app creates a spin viewer widget that embeds in your product page without theme code changes

---

#### WooCommerce

**Built-in zoom (no plugin required):**

WooCommerce includes basic image zoom (powered by Zoom.js) by default on product pages. To configure it:
1. Go to **WooCommerce → Settings → Products → Display**
2. Under **Product Images**, set **Zoom** behavior: Enabled, Disabled, or Inner
3. Upload high-resolution images (at least 1000×1000px) — the zoom uses the full uploaded image

**YITH WooCommerce Zoom Magnifier (free + premium):**
1. Install from WordPress.org
2. Go to **YITH → Zoom Magnifier → Settings**
3. Configure zoom type: **Inner** (magnifies within the image container), **Outer** (shows magnified panel beside the image), or **Lens** (circular magnifier follows cursor)
4. Enable lightbox for full-screen zoom on click

**Product Gallery Slider (free — WooCommerce.com):**
1. Install and activate
2. Adds swipe support, thumbnail strip, and fullscreen lightbox to the built-in WooCommerce gallery
3. Supports video thumbnails (YouTube/Vimeo) in the gallery

**For 360 views:** Use **WooCommerce 360° Image** plugin (free, wordpress.org) — upload numbered spin frames as product images prefixed with `360_` and the plugin creates a drag-to-spin viewer.

---

#### BigCommerce

**Built-in zoom (Cornerstone theme):**
1. Go to **Storefront → My Themes → Customize**
2. Under **Product Page → Image**, enable **Image zoom** (hover zoom is on by default)
3. Set **Image size** to Large for better zoom quality — BigCommerce serves images at multiple sizes automatically

**Sirv (hosted 360 spin + zoom CDN):**
1. Install **Sirv** from the BigCommerce App Marketplace
2. Upload your spin sequence images to Sirv's CDN — it auto-detects numbered sequences
3. Paste the Sirv embed code into your product description or use the Sirv BigCommerce widget
4. Sirv also serves all your product images via its CDN with automatic WebP conversion

**Product videos:**
1. In your BigCommerce product admin, click **Add Video** in the media section and paste a YouTube or Vimeo URL
2. Videos appear as thumbnail items in the product gallery automatically

---

#### Custom / Headless

**CSS hover zoom (no JavaScript image loading):**
```jsx
// ZoomImage.jsx
import { useState, useRef } from 'react';

export function ZoomImage({ src, alt }) {
  const [zoom, setZoom] = useState(null);
  const containerRef = useRef(null);

  function handleMouseMove(e) {
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ x, y });
  }

  return (
    <div
      ref={containerRef}
      className="zoom-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setZoom(null)}
    >
      <img
        src={src}
        alt={alt}
        className="zoom-image"
        style={zoom ? {
          transformOrigin: `${zoom.x}% ${zoom.y}%`,
          transform: 'scale(2.5)',
        } : {}}
        draggable={false}
      />
    </div>
  );
}
```

```css
.zoom-container { overflow: hidden; cursor: crosshair; aspect-ratio: 1/1; }
.zoom-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.05s linear; will-change: transform; }
```

**360-degree spin viewer:**
```jsx
// SpinViewer.jsx — preloads all frames, switches on drag
export function SpinViewer({ frames, productName = 'Product' }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const dragStart = useRef(null);

  useEffect(() => {
    let count = 0;
    frames.forEach(src => {
      const img = new Image();
      img.src = src;
      img.onload = () => { if (++count === frames.length) setLoaded(true); };
    });
  }, [frames]);

  function handleDragStart(e) { dragStart.current = e.clientX ?? e.touches?.[0]?.clientX; }
  function handleDragMove(e) {
    if (dragStart.current === null) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const delta = Math.round((clientX - dragStart.current) / 8);
    if (delta !== 0) {
      setFrameIndex(i => ((i + delta) % frames.length + frames.length) % frames.length);
      dragStart.current = clientX;
    }
  }
  function handleDragEnd() { dragStart.current = null; }

  if (!loaded) return <div aria-label="Loading 360 view">Loading...</div>;
  return (
    <div
      onMouseDown={handleDragStart} onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}
      onTouchStart={handleDragStart} onTouchMove={handleDragMove} onTouchEnd={handleDragEnd}
      aria-label="360 degree product view — drag to rotate"
      role="img" style={{ cursor: 'ew-resize' }}
    >
      <img src={frames[frameIndex]} alt={`${productName}, frame ${frameIndex + 1} of ${frames.length}`} draggable={false} />
      <span aria-hidden="true" style={{ fontSize: '0.75rem', color: '#666' }}>Drag to rotate</span>
    </div>
  );
}
```

### Step 3: Optimize media for performance

Regardless of platform, follow these media guidelines:

1. **Hero image**: Upload at minimum 2000px on the longest side for zoom quality; platforms resize down automatically for thumbnails
2. **Format**: Upload WebP images where your platform supports it — Shopify, BigCommerce, and Sirv convert automatically; for WooCommerce use the **Imagify** or **ShortPixel** plugin
3. **360 spin frames**: 24-36 frames is the sweet spot; at 30 KB per frame (optimized JPEG) that is under 1 MB total for the full sequence
4. **Video**: Upload MP4 directly to Shopify/BigCommerce, or embed YouTube/Vimeo to offload hosting costs; always include a poster image
5. **LCP (Largest Contentful Paint)**: The main product image is almost always the LCP element — ensure it loads with high priority

## Best Practices

- **Serve images at 2x the rendered size** for retina screens but no larger — a 400px container needs an 800px image, not 2000px
- **Use WebP or AVIF format** — 30-50% smaller than JPEG at equivalent quality
- **Pre-load the hero image** — add `fetchpriority="high"` and `loading="eager"` to the first product image
- **Lazy-load non-hero media** — thumbnails, 360 frames 2–N, and video should load after first interaction
- **Show a loading state for 360 views** — preloading 36 frames can take several seconds on mobile; show a progress indicator
- **Provide keyboard alternatives for drag interactions** — 360 spin should support left/right arrow keys in addition to mouse drag
- **Avoid autoplay with sound** — muted autoplay is acceptable; audio autoplay is blocked by most browsers

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Zoom CSS transform causes layout shift | Use `will-change: transform` and `overflow: hidden` on the container so the scaled image does not reflow siblings |
| 360 spin is jittery on mobile | Throttle frame updates to one per `requestAnimationFrame`; do not call setState on every `touchmove` event |
| Video does not autoplay on iOS | Add `playsInline` and `muted` attributes; iOS requires both for autoplay without user gesture |
| LCP score poor due to large hero image | Add `fetchpriority="high"` and `loading="eager"` to the main product image; verify with Lighthouse |
| 360 assets too large (36 × 500 KB) | Target 20–40 KB per frame at 800px wide using JPEG quality 75 through your CDN |

## Related Skills

- @product-page-design
- @responsive-storefront
- @accessibility-commerce
- @image-optimization-cdn
