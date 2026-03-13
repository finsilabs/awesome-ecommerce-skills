---
name: image-optimization-cdn
description: "Speed up your store by automatically resizing and converting product images to WebP/AVIF, adding lazy loading, and serving via CDN"
category: infrastructure-performance
risk: safe
source: curated
date_added: "2026-03-12"
tags: [images, cdn, webp, avif, lazy-loading, sharp, cloudinary, image-optimization, lcp, core-web-vitals]
triggers: ["image optimization", "product images cdn", "webp avif conversion", "lazy loading images", "image pipeline", "cdn images", "product image performance"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Image Optimization CDN

## Overview

Product images are typically the largest assets on e-commerce pages and the single biggest contributor to poor Largest Contentful Paint (LCP) scores. An optimized image pipeline resizes images to the required dimensions, converts to modern formats (WebP, AVIF) for 30–50% smaller file sizes, delivers from a CDN close to the user, and applies lazy loading to images below the fold.

## When to Use This Skill

- When product pages fail Core Web Vitals due to large or unoptimized images (LCP > 2.5s)
- When setting up an image pipeline for a new headless storefront
- When original product images from vendors are multi-megabyte files that need automation
- When adding WebP/AVIF support to an existing storefront that serves only JPEG/PNG
- When measuring Core Web Vitals and images are the primary bottleneck

## Core Instructions

### Step 1: Determine your platform and available image optimization

| Platform | Built-In Image CDN | What You Need to Do |
|----------|-------------------|-------------------|
| **Shopify** | Shopify CDN (Fastly) — automatic WebP conversion, responsive sizing via URL params | Use Liquid `img_url` filter with size params; ensure all `<img>` tags have `width` and `height` attributes; add `loading="lazy"` to below-fold images |
| **WooCommerce** | None by default | Install **Imagify** or **ShortPixel** plugin for automatic WebP conversion; add **Cloudflare** as CDN (free tier) for global delivery |
| **BigCommerce** | BigCommerce CDN — automatic WebP conversion, responsive sizing | BigCommerce serves images via CDN automatically; optimize by specifying image dimensions in the URL and setting proper `<img>` attributes in templates |
| **Custom / Headless** | None — you build it | Use Cloudinary (managed) or Sharp (self-hosted) with a CDN; see implementation below |

### Step 2: Platform-specific image optimization

---

#### Shopify

**Shopify CDN automatically handles WebP conversion and resizing.** Your job is to use it correctly in Liquid templates:

1. **Always use the `image_url` filter with explicit dimensions:**
```liquid
<!-- Good: Shopify CDN serves WebP at the right size -->
<img
  src="{{ product.featured_image | image_url: width: 800 }}"
  srcset="{{ product.featured_image | image_url: width: 400 }} 400w,
          {{ product.featured_image | image_url: width: 800 }} 800w,
          {{ product.featured_image | image_url: width: 1200 }} 1200w"
  sizes="(max-width: 640px) 100vw, 50vw"
  width="800" height="800"
  loading="lazy"
  alt="{{ product.featured_image.alt | escape }}"
/>
```

2. **Use `loading="eager"` only for the hero (LCP) image:**
```liquid
{% if forloop.first %}
  {%- assign loading = 'eager' -%}
  {%- assign fetchpriority = 'high' -%}
{% else %}
  {%- assign loading = 'lazy' -%}
  {%- assign fetchpriority = 'auto' -%}
{% endif %}
<img loading="{{ loading }}" fetchpriority="{{ fetchpriority }}" ... />
```

3. **Check your LCP score:**
   - Go to **Online Store → Themes** in your Shopify admin and click **View report**
   - Or run Google PageSpeed Insights (pagespeed.web.dev) on your product and collection pages
   - A score below 75 on mobile often means the hero image needs `fetchpriority="high"` or is too large

---

#### WooCommerce

WooCommerce serves images from your server without CDN or WebP conversion by default. Two steps are needed:

**Step 1: Add WebP conversion (pick one):**
- **Imagify** (free tier: 25 MB/month): Install from WordPress.org, go to **Media → Imagify**, run the bulk optimization wizard — it converts all existing images to WebP and enables automatic conversion for new uploads
- **ShortPixel** (free tier: 100 credits/month): Similar workflow; installs as a plugin and converts on upload

**Step 2: Add CDN delivery:**
- **Cloudflare** (free): After adding your domain to Cloudflare, all images (and other assets) are served from Cloudflare's 300+ global edge locations automatically
- **BunnyCDN** ($1/TB): More control, better performance than free Cloudflare for high-traffic stores; configure with the **BunnyCDN** WordPress plugin

**Step 3: Configure lazy loading (WordPress 5.5+ handles this automatically):**
WordPress adds `loading="lazy"` to all `<img>` tags automatically since version 5.5. Verify it's working:
1. View source of a product page
2. Confirm non-hero images have `loading="lazy"` attribute
3. The hero/first product image should have `loading="eager"` — configure this in your theme's template

**Step 4: Set correct image dimensions in WooCommerce:**
1. Go to **WooCommerce → Settings → Products → Display**
2. Set your image sizes to match your theme's actual rendered dimensions — oversized images waste bandwidth
3. After changing sizes, use **WP CLI** or the **Regenerate Thumbnails** plugin to resize existing images: `wp media regenerate --only-missing`

---

#### BigCommerce

BigCommerce serves all images via its CDN with automatic WebP conversion for supported browsers. Optimize your theme templates:

1. In **Storefront → My Themes → Edit Theme Files**, open your product page template
2. Use the `getImageSrcset` Handlebars helper to generate responsive `srcset` attributes:
```handlebars
<img
  src="{{getImage image 'product_size'}}"
  srcset="{{getImageSrcset image 1x='product_size' 2x='zoom_size'}}"
  loading="lazy"
  width="800" height="800"
  alt="{{image.alt}}"
/>
```
3. In **Storefront → My Themes → Customize**, configure image sizes to match your design's rendered dimensions
4. Run Google PageSpeed Insights on your store and address any image-specific recommendations

---

#### Custom / Headless

**Option A: Cloudinary (managed — recommended for most stores)**

1. Sign up at cloudinary.com (free tier: 25 GB storage, 25 GB bandwidth/month)
2. Configure your store to upload product images to Cloudinary:
```javascript
// lib/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: ..., api_secret: ... });

export function getProductImageUrl(publicId, { width, height }) {
  return cloudinary.url(publicId, {
    transformation: [{
      width, height, crop: 'fill', gravity: 'auto',
      quality: 'auto:good',
      fetch_format: 'auto', // Auto-serves WebP/AVIF based on Accept header
    }],
    secure: true,
  });
}
```

3. Generate responsive `srcset` in your product image component:
```jsx
export function ProductImage({ publicId, alt, priority = false }) {
  const widths = [240, 400, 600, 800, 1200];
  const srcSet = widths.map(w => `${getProductImageUrl(publicId, { width: w, height: w })} ${w}w`).join(', ');

  return (
    <img
      src={getProductImageUrl(publicId, { width: 400, height: 400 })}
      srcSet={srcSet}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      alt={alt}
      width={400} height={400}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
    />
  );
}
```

**Option B: Sharp (self-hosted image processing)**

Use Sharp for a self-hosted pipeline. Process images at upload time and store variants in object storage (S3, R2, Backblaze):

```javascript
// lib/image-processor.js
import sharp from 'sharp';

const SIZES = {
  thumbnail: { width: 240, height: 240 },
  card: { width: 400, height: 400 },
  detail: { width: 800, height: 800 },
  zoom: { width: 1600, height: 1600 },
};

export async function processAndStoreProductImage(inputBuffer, productId) {
  const urls = {};
  for (const [sizeName, dims] of Object.entries(SIZES)) {
    const webpBuffer = await sharp(inputBuffer)
      .rotate() // auto-rotate from EXIF
      .resize({ ...dims, fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const key = `products/${productId}/${sizeName}.webp`;
    await uploadToStorage(key, webpBuffer, 'image/webp');
    urls[sizeName] = `https://images.yourstore.com/${key}`;
  }
  return urls;
}
```

Serve with immutable CDN headers (include a content hash in the filename for cache busting):
```javascript
// Image URL response headers
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
```

## Best Practices

- **Set explicit `width` and `height` on all `<img>` tags** — this prevents Cumulative Layout Shift (CLS) by reserving space before the image loads
- **Use `loading="eager"` and `fetchpriority="high"` only on the LCP image** — applying `eager` to all images defeats lazy loading and increases initial page weight
- **Never upscale images** — serving a 2000px image for a 400px container wastes bandwidth; use `withoutEnlargement: true` in Sharp or Cloudinary's width/height params
- **Purge CDN cache using URL versioning** — include a content hash or version number in image filenames; changing the URL is more reliable than manual CDN cache purging
- **Monitor LCP in production with Real User Monitoring (RUM)** — lab tests (Lighthouse) measure LCP with a clean cache; RUM captures actual user experience

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| LCP image not the one you expected | Use Chrome DevTools → Performance tab to identify the actual LCP element; it may be a background image or a hero banner, not the product image |
| AVIF encoding too slow for on-demand transforms | Pre-generate AVIF at upload time; use WebP for real-time transforms (50× faster than AVIF encoding) |
| Sharp native binaries missing in production | Add `sharp` to `dependencies` (not `devDependencies`); for Docker builds match the target architecture: `npm install --platform=linux --arch=x64 sharp` |
| Images not loading from CDN on first request | Pre-warm your top product images by fetching their CDN URLs after upload; don't rely on first visitor to warm the cache |
| WooCommerce images not converting to WebP | Verify your host supports the GD or Imagick PHP extension (both required by Imagify/ShortPixel); contact your host if not available |

## Related Skills

- @ecommerce-caching
- @edge-commerce
- @monitoring-alerting-commerce
- @responsive-storefront
