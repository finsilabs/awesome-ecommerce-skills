# Product Page Media Overhaul

## Problem/Feature Description

An outdoor gear brand is revamping their product detail pages after Lighthouse audits revealed a poor LCP (Largest Contentful Paint) score and slow mobile load times. Their pages currently display a static JPEG hero image and a separate embedded video player (an iframe from a third-party host). The new requirements are: serve the hero image in a modern format for better compression, replace the iframe video with an inline HTML5 player, and ensure the hero image is prioritized by the browser for fast paint.

The engineering team has a Cloudinary account and wants a reusable utility for constructing optimized image URLs. They also want the video player component to work reliably on all mobile browsers, including iOS Safari, where autoplay can be tricky. The solution should follow performance best practices so that hero images load at the right resolution for high-DPI screens without being excessively large.

## Output Specification

Produce the following files:

1. `src/ProductVideo.jsx` — A React component that renders an inline HTML5 video player. It should accept `src` (an MP4 URL) and `poster` (a thumbnail image URL) as props.

2. `src/lib/imageUrl.js` — A utility function `buildImageUrl(publicId, options)` that constructs Cloudinary-compatible image URLs supporting width, height, quality, and format parameters.

3. `src/HeroImage.jsx` — A React component that renders the primary product hero image with correct loading priority attributes. Accepts `src`, `alt`, `width`, and `height` as props.

4. `MEDIA_GUIDE.md` — A short guide covering:
   - Why the video attributes chosen are necessary for cross-browser/iOS support
   - What image format should be used and how fallback is handled
   - How to size images correctly for retina displays
