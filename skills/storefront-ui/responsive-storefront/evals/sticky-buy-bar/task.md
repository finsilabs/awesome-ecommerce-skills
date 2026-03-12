# Product Detail Page with Persistent Buy Button

## Problem/Feature Description

Trove Goods, an outdoor gear e-commerce company, has identified that mobile shoppers frequently scroll past the primary "Add to Cart" button on their product detail pages and then lose it — they have to scroll back up to buy. Analytics show that 35% of users who scroll to the reviews section never return to complete a purchase. The product manager wants a persistent buy button that becomes visible only after the original Add to Cart button has scrolled off-screen, allowing customers to purchase at any point during their browsing.

Additionally, the PDP layout itself needs to work on phones (a single column view where the product details stack below the images) and scale up to a two-panel layout on larger screens where the image gallery stays anchored while the user scrolls through descriptions, specs, and reviews.

The solution must handle the iPhone home indicator safely — previous attempts had buttons hidden behind it — and the layout must not jump around when iOS Safari's dynamic toolbar appears and disappears.

## Output Specification

Produce the following files:
- `StickyBuyBar.jsx` — a React component implementing the persistent buy bar behavior
- `StickyBuyBar.css` — the CSS for the sticky bar
- `pdp-layout.css` — CSS for the product detail page layout (single column mobile, two-panel desktop)
- `implementation-notes.md` — a short explanation of how the scroll detection works and how iOS edge cases are handled
