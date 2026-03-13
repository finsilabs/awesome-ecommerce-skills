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
platforms: [platform-agnostic]
difficulty: intermediate
---

# Image Optimization CDN

## Overview

Product images are typically the largest assets on e-commerce pages and the single biggest contributor to poor Largest Contentful Paint (LCP) scores. An optimized image pipeline resizes images to the required dimensions, converts to modern formats (WebP, AVIF) for 30–50% smaller file sizes, delivers from a CDN close to the user, and applies lazy loading to images below the fold. This skill covers building a Sharp-based image processing pipeline, configuring CDN delivery, and implementing responsive images with correct `srcset` attributes.

## When to Use This Skill

- When product pages fail Core Web Vitals due to large or unoptimized images (LCP > 2.5s)
- When setting up an image pipeline for a new headless storefront
- When migrating from a platform-provided image CDN to a custom solution
- When original product images from vendors are multi-megabyte PSDs or BMPs that need automation
- When adding WebP/AVIF support to an existing storefront that serves only JPEG/PNG

## Core Instructions

1. **Set up Sharp for server-side image processing**

   ```bash
   npm install sharp
   npm install -D @types/sharp
   ```

   Create an image processing pipeline:

   ```typescript
   // lib/image-processor.ts
   import sharp from 'sharp';
   import path from 'node:path';

   interface ImageTransformOptions {
     width?: number;
     height?: number;
     quality?: number;
     format?: 'webp' | 'avif' | 'jpeg' | 'png';
     fit?: 'cover' | 'contain' | 'fill';
   }

   export async function processImage(
     inputBuffer: Buffer,
     options: ImageTransformOptions = {}
   ): Promise<{buffer: Buffer; contentType: string; size: number}> {
     const {
       width,
       height,
       quality = 80,
       format = 'webp',
       fit = 'cover',
     } = options;

     let pipeline = sharp(inputBuffer)
       .rotate() // Auto-rotate based on EXIF data
       .withMetadata({exif: {}}) // Strip all EXIF for privacy & size

     if (width || height) {
       pipeline = pipeline.resize({width, height, fit, withoutEnlargement: true});
     }

     let outputBuffer: Buffer;
     let contentType: string;

     switch (format) {
       case 'avif':
         outputBuffer = await pipeline.avif({quality, effort: 4}).toBuffer();
         contentType = 'image/avif';
         break;
       case 'webp':
         outputBuffer = await pipeline.webp({quality, effort: 4}).toBuffer();
         contentType = 'image/webp';
         break;
       case 'jpeg':
         outputBuffer = await pipeline.jpeg({quality, mozjpeg: true}).toBuffer();
         contentType = 'image/jpeg';
         break;
       default:
         outputBuffer = await pipeline.png({quality, compressionLevel: 9}).toBuffer();
         contentType = 'image/png';
     }

     return {buffer: outputBuffer, contentType, size: outputBuffer.byteLength};
   }

   // Standard product image sizes
   export const PRODUCT_IMAGE_SIZES = {
     thumbnail: {width: 240, height: 240},
     card: {width: 400, height: 400},
     detail: {width: 800, height: 800},
     zoom: {width: 1600, height: 1600},
     og: {width: 1200, height: 630, fit: 'contain' as const}, // Open Graph
   } as const;
   ```

2. **Build an on-demand image transformation API**

   ```typescript
   // app/api/images/[...params]/route.ts
   import {NextRequest, NextResponse} from 'next/server';
   import {processImage, PRODUCT_IMAGE_SIZES} from '@/lib/image-processor';
   import {getProductImage} from '@/lib/storage';

   // URL format: /api/images/products/abc123/400x400.webp
   export async function GET(
     req: NextRequest,
     {params}: {params: {params: string[]}}
   ) {
     const [category, id, sizeAndFormat] = params.params;
     const match = sizeAndFormat?.match(/^(\d+)x(\d+)\.(\w+)$/);

     if (!match) return new NextResponse('Invalid format', {status: 400});

     const [, w, h, fmt] = match;
     const width = parseInt(w);
     const height = parseInt(h);
     const format = fmt as 'webp' | 'avif' | 'jpeg';

     // Allowlist valid sizes to prevent DoS via arbitrary dimensions
     const validSizes = new Set(['120x120', '240x240', '400x400', '800x800', '1600x1600']);
     if (!validSizes.has(`${width}x${height}`)) {
       return new NextResponse('Invalid dimensions', {status: 400});
     }

     const originalBuffer = await getProductImage(category, id);
     if (!originalBuffer) return new NextResponse('Not found', {status: 404});

     const {buffer, contentType} = await processImage(originalBuffer, {width, height, format});

     return new NextResponse(buffer, {
       headers: {
         'Content-Type': contentType,
         'Cache-Control': 'public, s-maxage=31536000, immutable', // Cache for 1 year at CDN
         'Vary': 'Accept',
       },
     });
   }
   ```

3. **Configure Cloudinary for managed image CDN**

   For most stores, using a dedicated image CDN (Cloudinary, Imgix, Fastly IO) is preferable to self-hosting Sharp:

   ```typescript
   // lib/cloudinary.ts
   import {v2 as cloudinary} from 'cloudinary';

   cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET,
     secure: true,
   });

   export function getProductImageUrl(
     publicId: string,
     options: {width: number; height: number; format?: 'auto' | 'webp' | 'avif'} = {width: 400, height: 400}
   ): string {
     return cloudinary.url(publicId, {
       transformation: [
         {
           width: options.width,
           height: options.height,
           crop: 'fill',
           gravity: 'auto',         // Smart crop around subject
           quality: 'auto:good',    // Cloudinary's perceptual quality
           fetch_format: options.format ?? 'auto', // Auto-serve WebP/AVIF based on Accept header
         },
         {dpr: 'auto'},             // Serve 2x on Retina displays
       ],
       sign_url: true,
     });
   }

   // Upload a product image with automatic optimization
   export async function uploadProductImage(file: Buffer, productId: string): Promise<string> {
     const result = await cloudinary.uploader.upload(
       `data:image/jpeg;base64,${file.toString('base64')}`,
       {
         public_id: `products/${productId}`,
         overwrite: true,
         tags: ['product'],
         eager: [
           {width: 240, height: 240, crop: 'fill', gravity: 'auto'},
           {width: 400, height: 400, crop: 'fill', gravity: 'auto'},
           {width: 800, height: 800, crop: 'fill', gravity: 'auto'},
         ],
         eager_async: true,
       }
     );
     return result.public_id;
   }
   ```

4. **Implement responsive images with `srcset`**

   ```tsx
   // components/product-image.tsx
   interface ProductImageProps {
     src: string;        // Base Cloudinary public ID or URL
     alt: string;
     sizes?: string;
     priority?: boolean; // true for above-the-fold images (hero, first product in grid)
     className?: string;
   }

   export function ProductImage({src, alt, sizes, priority = false, className}: ProductImageProps) {
     // Generate srcset for common breakpoints
     const widths = [240, 400, 600, 800, 1200, 1600];
     const srcSet = widths
       .map(w => `${getProductImageUrl(src, {width: w, height: w})} ${w}w`)
       .join(', ');

     return (
       <img
         src={getProductImageUrl(src, {width: 400, height: 400})}
         srcSet={srcSet}
         sizes={sizes ?? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'}
         alt={alt}
         loading={priority ? 'eager' : 'lazy'}
         fetchPriority={priority ? 'high' : 'auto'}
         decoding="async"
         className={className}
         width={400}
         height={400}
       />
     );
   }
   ```

5. **Preload hero and LCP images**

   ```tsx
   // app/layout.tsx — preload the first product image for faster LCP
   import {headers} from 'next/headers';

   export default async function Layout({children}: {children: React.ReactNode}) {
     const heroImageUrl = await getHeroImageUrl();

     return (
       <html>
         <head>
           {/* Preload the LCP image — tell the browser about it immediately */}
           <link
             rel="preload"
             as="image"
             href={heroImageUrl}
             imageSrcSet={generateSrcSet(heroImageUrl)}
             imageSizes="100vw"
           />
         </head>
         <body>{children}</body>
       </html>
     );
   }
   ```

6. **Configure CDN cache headers and cache invalidation**

   ```typescript
   // Cache immutably at CDN — include content hash in URL for cache busting
   // When the image changes, upload with a new version suffix

   // Example URL with version: /products/abc123_v2.webp
   // CDN serves from cache for 1 year; new URL = instant global update

   // For Cloudflare R2 + CDN:
   async function uploadWithVersioning(buffer: Buffer, productId: string): Promise<string> {
     const hash = createHash('sha256').update(buffer).digest('hex').substring(0, 8);
     const key = `products/${productId}_${hash}.jpg`;

     await r2.send(new PutObjectCommand({
       Bucket: process.env.R2_BUCKET,
       Key: key,
       Body: buffer,
       ContentType: 'image/jpeg',
       CacheControl: 'public, max-age=31536000, immutable',
     }));

     return `https://images.mystore.com/${key}`;
   }
   ```

## Examples

### Batch processing existing product images

```typescript
import sharp from 'sharp';
import {readdir, readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';

async function batchProcessImages(inputDir: string, outputDir: string) {
  const files = await readdir(inputDir);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|bmp|tiff)$/i.test(f));

  await mkdir(outputDir, {recursive: true});

  const sizes = [240, 400, 800];
  let processed = 0;

  for (const file of imageFiles) {
    const inputBuffer = await readFile(path.join(inputDir, file));
    const basename = path.parse(file).name;

    for (const size of sizes) {
      const {buffer} = await processImage(inputBuffer, {width: size, height: size, format: 'webp'});
      await writeFile(path.join(outputDir, `${basename}_${size}w.webp`), buffer);
    }

    processed++;
    if (processed % 100 === 0) console.log(`Processed ${processed}/${imageFiles.length} images`);
  }

  console.log(`Done: ${processed} images converted to WebP at ${sizes.join(', ')}px`);
}
```

### Next.js Image component with Cloudinary loader

```typescript
// lib/cloudinary-loader.ts
import type {ImageLoader} from 'next/image';

export const cloudinaryLoader: ImageLoader = ({src, width, quality}) => {
  const params = [
    'f_auto',
    'c_fill',
    'g_auto',
    `w_${width}`,
    `q_${quality ?? 80}`,
  ].join(',');
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${params}/${src}`;
};

// next.config.ts
export default {
  images: {
    loader: 'custom',
    loaderFile: './lib/cloudinary-loader.ts',
  },
};
```

## Best Practices

- **Serve AVIF to browsers that support it, WebP to others** — use `<picture>` element with `<source type="image/avif">` first, then `<source type="image/webp">`, then `<img>` as fallback; the browser picks the first supported format
- **Set explicit `width` and `height` on all images** — this prevents layout shift (CLS) by reserving space before the image loads; use the aspect ratio even if the display size differs
- **Use `loading="eager"` and `fetchpriority="high"` only on the LCP image** — applying `eager` to all images defeats lazy loading and increases initial page weight
- **Never enlarge images beyond their natural resolution** — use `withoutEnlargement: true` in Sharp to avoid artificial upscaling that increases file size without quality gain
- **Purge CDN cache after product image updates** — use URL versioning (content hash in filename) so CDN cache never needs manual purging; changing the URL is the most reliable cache invalidation
- **Compress SVG product icons with SVGO** — SVG files used for brand logos and product icons can be 50–80% smaller after SVGO optimization without visual change
- **Monitor LCP with Real User Monitoring (RUM)** — lab tests (Lighthouse) measure LCP on a clean cache; RUM captures the actual experience including cached and primed pages

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Largest image in viewport not LCP target | Use Chrome DevTools → Performance → LCP to identify the actual LCP element; preload and prioritize that specific image |
| AVIF encoding too slow for on-demand transformation | Pre-generate AVIF at upload time for the top sizes; use WebP for on-demand transforms (50× faster than AVIF) |
| Sharp native binaries missing after deployment | Add `sharp` to `dependencies` (not `devDependencies`); for Docker builds, run `npm install --arch=x64 --platform=linux sharp` on the build machine for the target architecture |
| Images not loading on first request due to cold processing | Pre-warm your image transformation service by generating the top sizes at product upload time rather than on first request |
| CSS `background-image` not lazy loaded | Use `<img>` for product images (browser lazy-loads them natively); background-image does not support lazy loading without Intersection Observer |

## Related Skills

- @jamstack-storefront
- @pwa-storefront
- @edge-commerce
- @monitoring-alerting-commerce
