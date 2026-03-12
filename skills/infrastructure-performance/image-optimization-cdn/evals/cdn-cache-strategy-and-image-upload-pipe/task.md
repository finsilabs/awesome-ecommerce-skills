# Product Image CDN Infrastructure Setup

## Problem/Feature Description

A mid-size outdoor gear retailer is moving from a platform-managed image CDN to a self-managed solution using Cloudinary for delivery and a custom upload pipeline. Their current setup has two pain points: when a product image is updated, the CDN continues serving stale versions for up to a week because their ops team must manually request cache purges; and new product pages sometimes show broken images for the first few seconds because images are generated on the first request.

The team needs a TypeScript module that handles both image uploading and URL generation for the new Cloudinary-based pipeline. The solution should eliminate the need for manual CDN cache invalidation and ensure variant images are ready before a product page goes live. Additionally, their image API route needs to properly handle cache headers so the CDN can serve images efficiently and securely.

## Output Specification

Produce the following files:

- `lib/cloudinary.ts` — the Cloudinary configuration and helper module with `uploadProductImage` and `getProductImageUrl` functions
- `lib/image-api.ts` — the image API request handler (framework-agnostic TypeScript function) that returns proper HTTP headers for CDN caching and handles image dimension and format parameters
- `lib/upload-with-versioning.ts` — the versioned upload utility for Cloudflare R2 or similar object storage that enables cache-busting without manual purging
- `ARCHITECTURE.md` — brief notes explaining the cache invalidation strategy chosen and why

Do not call out to real APIs — use environment variable placeholders (e.g. `process.env.CLOUDINARY_CLOUD_NAME`). The files will be reviewed as code artifacts.
