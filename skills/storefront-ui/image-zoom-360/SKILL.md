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
platforms: [platform-agnostic]
difficulty: intermediate
---

# Image Zoom & 360-Degree Views

## Overview

Implement a rich product media experience that includes CSS-powered lens zoom on hover, touch-native pinch-to-zoom on mobile, 360-degree spin views from a sequence of images, and inline video playback. All media is lazy-loaded and served via a CDN image optimization pipeline to maintain Core Web Vitals scores.

## When to Use This Skill

- When product return rates are high and additional visual detail could reduce them
- When implementing a product detail page for fashion, jewelry, electronics, or other detail-sensitive categories
- When upgrading from a static single image to a full media gallery
- When integrating with a product photography workflow that includes 360-degree spin assets
- When product videos exist and need to be surfaced inline on the PDP

## Prerequisites & Platform Notes

**Shopify**: Build with Shopify themes (Liquid), Shopify Hydrogen (React), or headless with the Storefront API. These component patterns work in any React-based Shopify setup.
**WooCommerce**: Build with WooCommerce Blocks (React), classic PHP themes, or headless with WooCommerce REST API. These patterns apply to block-based or headless storefronts.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A storefront codebase (theme, Hydrogen app, or headless frontend)

## Core Instructions

1. **Build a media gallery with thumbnail strip**

   ```jsx
   // ProductGallery.jsx
   import { useState } from 'react';

   export function ProductGallery({ media }) {
     // media: Array<{ type: 'image'|'video'|'360', src, thumbnail, alt }>
     const [activeIndex, setActiveIndex] = useState(0);
     const activeMedia = media[activeIndex];

     return (
       <div className="product-gallery">
         {/* Main display */}
         <div className="gallery-main">
           {activeMedia.type === 'image' && (
             <ZoomImage src={activeMedia.src} alt={activeMedia.alt} />
           )}
           {activeMedia.type === 'video' && (
             <ProductVideo src={activeMedia.src} poster={activeMedia.thumbnail} />
           )}
           {activeMedia.type === '360' && (
             <SpinViewer frames={activeMedia.frames} />
           )}
         </div>

         {/* Thumbnail strip */}
         <div className="gallery-thumbnails" role="list" aria-label="Product images">
           {media.map((item, i) => (
             <button
               key={i}
               role="listitem"
               className={`thumbnail-btn ${activeIndex === i ? 'active' : ''}`}
               onClick={() => setActiveIndex(i)}
               aria-label={`View ${item.alt ?? `image ${i + 1}`}`}
               aria-pressed={activeIndex === i}
             >
               <img src={item.thumbnail} alt="" loading="lazy" width="60" height="60" />
               {item.type === 'video' && <span className="play-icon" aria-hidden="true" />}
               {item.type === '360' && <span className="spin-icon" aria-hidden="true">360</span>}
             </button>
           ))}
         </div>
       </div>
     );
   }
   ```

2. **CSS lens zoom on hover (desktop)**

   Implement a magnifier lens effect that shows a zoomed section of the image following the cursor. No JavaScript image loading — uses CSS `transform: scale` on the full-resolution image.

   ```jsx
   // ZoomImage.jsx
   import { useState, useRef } from 'react';

   export function ZoomImage({ src, alt, zoomSrc }) {
     const [zoom, setZoom] = useState(null); // { x, y } percentages
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
         aria-label={`${alt} — hover to zoom`}
       >
         <img
           src={src}
           alt={alt}
           className={`zoom-image ${zoom ? 'zooming' : ''}`}
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
   .zoom-container {
     overflow: hidden;
     cursor: crosshair;
     aspect-ratio: 1/1;
     border-radius: 4px;
   }

   .zoom-image {
     width: 100%;
     height: 100%;
     object-fit: cover;
     transition: transform 0.05s linear;
     will-change: transform;
   }
   ```

3. **Touch pinch-to-zoom on mobile**

   Use the Pointer Events API to track multi-touch pinch gestures.

   ```javascript
   // usePinchZoom.js
   import { useState, useRef, useCallback } from 'react';

   export function usePinchZoom({ minScale = 1, maxScale = 4 } = {}) {
     const [scale, setScale] = useState(1);
     const [origin, setOrigin] = useState({ x: 50, y: 50 }); // percent
     const pointers = useRef(new Map());

     function getDistance(p1, p2) {
       return Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
     }

     const onPointerDown = useCallback((e) => {
       pointers.current.set(e.pointerId, e);
     }, []);

     const onPointerMove = useCallback((e) => {
       pointers.current.set(e.pointerId, e);
       const pts = [...pointers.current.values()];
       if (pts.length === 2) {
         const dist = getDistance(pts[0], pts[1]);
         if (!pointers.current.prevDist) {
           pointers.current.prevDist = dist;
           return;
         }
         const delta = dist / pointers.current.prevDist;
         pointers.current.prevDist = dist;
         setScale(s => Math.min(maxScale, Math.max(minScale, s * delta)));

         // Compute midpoint as origin
         const midX = (pts[0].clientX + pts[1].clientX) / 2;
         const midY = (pts[0].clientY + pts[1].clientY) / 2;
         const rect = e.currentTarget.getBoundingClientRect();
         setOrigin({
           x: ((midX - rect.left) / rect.width) * 100,
           y: ((midY - rect.top) / rect.height) * 100,
         });
       }
     }, [minScale, maxScale]);

     const onPointerUp = useCallback((e) => {
       pointers.current.delete(e.pointerId);
       if (pointers.current.size < 2) delete pointers.current.prevDist;
       if (pointers.current.size === 0) {
         // Reset to normal scale on double-tap (implement separately)
       }
     }, []);

     return { scale, origin, handlers: { onPointerDown, onPointerMove, onPointerUp } };
   }
   ```

4. **Implement 360-degree spin viewer**

   Load a sequence of images (e.g., 36 frames = 10 degrees each) and switch frames as the user drags.

   ```jsx
   // SpinViewer.jsx
   import { useState, useRef, useEffect } from 'react';

   export function SpinViewer({ frames, autoSpin = true, productName = 'Product' }) {
     const [frameIndex, setFrameIndex] = useState(0);
     const [imagesLoaded, setImagesLoaded] = useState(false);
     const dragStart = useRef(null);
     const preloadedImages = useRef([]);

     // Preload all frames
     useEffect(() => {
       let loaded = 0;
       preloadedImages.current = frames.map(src => {
         const img = new Image();
         img.src = src;
         img.onload = () => {
           loaded++;
           if (loaded === frames.length) setImagesLoaded(true);
         };
         return img;
       });
     }, [frames]);

     function handleDragStart(e) {
       dragStart.current = e.clientX ?? e.touches?.[0]?.clientX;
     }

     function handleDragMove(e) {
       if (dragStart.current === null) return;
       const clientX = e.clientX ?? e.touches?.[0]?.clientX;
       const delta = clientX - dragStart.current;
       // Move one frame per ~8px of drag
       const frameDelta = Math.round(delta / 8);
       if (frameDelta !== 0) {
         setFrameIndex(i => ((i + frameDelta) % frames.length + frames.length) % frames.length);
         dragStart.current = clientX;
       }
     }

     function handleDragEnd() {
       dragStart.current = null;
     }

     if (!imagesLoaded) {
       return <div className="spin-loading" aria-label="Loading 360 view">Loading...</div>;
     }

     return (
       <div
         className="spin-viewer"
         onMouseDown={handleDragStart}
         onMouseMove={handleDragMove}
         onMouseUp={handleDragEnd}
         onMouseLeave={handleDragEnd}
         onTouchStart={handleDragStart}
         onTouchMove={handleDragMove}
         onTouchEnd={handleDragEnd}
         aria-label="360 degree product view — drag to rotate"
         role="img"
         style={{ cursor: 'ew-resize' }}
       >
         <img
           src={frames[frameIndex]}
           alt={`${productName} - 360 view, frame ${frameIndex + 1}`}
           draggable={false}
           className="spin-frame"
         />
         <span className="spin-hint" aria-hidden="true">Drag to rotate</span>
       </div>
     );
   }
   ```

5. **Inline video with autoplay and fallback**

   ```jsx
   // ProductVideo.jsx
   export function ProductVideo({ src, poster }) {
     return (
       <video
         className="product-video"
         poster={poster}
         controls
         playsInline        /* Required for iOS autoplay in page */
         muted              /* Required for autoplay without user interaction */
         loop
         preload="metadata" /* Load poster + duration, not full video */
       >
         <source src={src.replace('.mp4', '.webm')} type="video/webm" />
         <source src={src} type="video/mp4" />
         <p>Your browser does not support video. <a href={src}>Download the video</a>.</p>
       </video>
     );
   }
   ```

## Examples

### Serving optimized images via CDN

Use Cloudinary or imgix URL parameters to serve the correct resolution for each use case:

```javascript
// lib/imageUrl.js
export function buildImageUrl(publicId, { width, height, quality = 'auto', format = 'auto' }) {
  // Cloudinary example
  return `https://res.cloudinary.com/your-cloud/image/upload/w_${width},h_${height},c_fill,q_${quality},f_${format}/${publicId}`;
}

// Usage:
const thumbnailUrl = buildImageUrl('products/shirt-blue', { width: 120, height: 120 });
const zoomUrl      = buildImageUrl('products/shirt-blue', { width: 2000, height: 2000 });
```

### Lazy-loading 360 frames

Only load the first frame initially; preload remaining frames in the background using `requestIdleCallback`:

```javascript
function preloadFramesIdle(frames) {
  frames.slice(1).forEach((src, i) => {
    requestIdleCallback(() => {
      const img = new Image();
      img.src = src;
    }, { timeout: 5000 });
  });
}
```

## Best Practices

- **Serve images at 2x the rendered size** for retina screens but no larger — a 400px container needs an 800px image, not 2000px
- **Use WebP or AVIF format** — 30-50% smaller than JPEG at equivalent quality; provide JPEG fallback via `<picture>` or CDN content negotiation
- **Pre-load the hero image** — add `fetchpriority="high"` and `loading="eager"` to the first product image; it is almost always the LCP element
- **Lazy-load non-hero media** — thumbnails, 360 frames 2-N, and video should all use `loading="lazy"` or be fetched after first interaction
- **Show a loading state for 360 views** — preloading 36 frames can take several seconds on mobile; show a spinner and first frame while loading
- **Provide keyboard alternatives for drag interactions** — 360 spin should support left/right arrow keys in addition to mouse drag
- **Avoid autoplay with sound** — muted autoplay is acceptable; audio autoplay is blocked by browsers and is a poor UX

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Zoom CSS transform causes layout shift | Use `will-change: transform` and `overflow: hidden` on the container so the scaled image does not reflow siblings |
| 360 spin is jittery on mobile | Use `requestAnimationFrame` to throttle frame updates; do not update `frameIndex` on every `touchmove` event |
| Video does not autoplay on iOS | Add `playsInline` and `muted` attributes; iOS requires both for autoplay without user gesture |
| LCP score poor due to large hero image | Add `fetchpriority="high"` and `loading="eager"` to the main product image; verify with Lighthouse that it is recognized as the LCP element |
| 360 assets too large to load (36 x 500 KB) | Target 20-40 KB per frame at 800px wide using optimized JPEG quality 75 through CDN; that is 720 KB total — acceptable |

## Related Skills

- @product-page-design
- @responsive-storefront
- @accessibility-commerce
- @storefront-theming
