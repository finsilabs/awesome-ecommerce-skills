# Storefront Product Grid with Optimized Image Loading

## Problem/Feature Description

A direct-to-consumer apparel brand is launching a new storefront and their engineering team has flagged poor Core Web Vitals scores as a blocker for launch. Lighthouse reports that the product listing page has a high LCP (3.8s) because the hero product image is not prioritized, and the page accumulates significant Cumulative Layout Shift because images load without reserved dimensions.

The team needs a self-contained product listing page that correctly implements modern responsive image loading. The first product in the grid is always the hero/LCP image (it is above the fold on desktop and mobile). The remaining products are below the fold and should load lazily.

The page must support both AVIF and WebP with fallback to JPEG for browsers that support neither. Images are served from Cloudinary using the public ID format `products/{id}` and the base URL `https://res.cloudinary.com/demo/image/upload/`.

## Output Specification

Produce the following files:

- `index.html` — a complete, self-contained HTML page with a product grid of at least 4 products
- `components/product-image.js` (or `.ts`) — a reusable module or web component that encapsulates the image rendering logic; OR inline equivalent logic in index.html with clear comments

The page should render a 4-column product grid. Each product card has a product image, product name, and price. Use the following sample product data:

| ID | Name | Price |
|----|------|-------|
| shirt-001 | Classic Oxford Shirt | $89 |
| jacket-002 | Field Jacket | $245 |
| trousers-003 | Slim Chino | $120 |
| boots-004 | Chelsea Boot | $310 |

The first product (shirt-001) is the LCP candidate. The remaining three are below the fold.
