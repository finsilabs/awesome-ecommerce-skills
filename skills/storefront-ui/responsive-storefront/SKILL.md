---
name: responsive-storefront
description: "Mobile-first responsive patterns for commerce (thumb-friendly cart, sticky buy bar)"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [responsive, mobile-first, css, ux, cart, buy-button, touch, layout]
triggers: ["mobile responsive storefront", "thumb-friendly design", "sticky add to cart", "mobile commerce layout", "responsive product page"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: beginner
---

# Responsive Storefront

## Overview

Apply mobile-first responsive design patterns to a commerce storefront so that the shopping experience is fast and usable on phones, where the majority of commerce traffic originates. Key patterns include thumb-zone aware layouts, a sticky buy bar that appears on scroll, tap-target sizing, and responsive product grids that reflow without horizontal scrolling.

## When to Use This Skill

- When more than 50% of storefront traffic comes from mobile devices (check your analytics)
- When building a new storefront from scratch and laying out the CSS architecture
- When auditing an existing storefront for mobile usability issues
- When implementing a product detail page and need a sticky buy button pattern
- When optimizing mobile conversion rate and cart abandonment

## Core Instructions

1. **Establish mobile-first CSS custom properties and breakpoints**

   Write all base styles for small screens first, then use `min-width` media queries to progressively enhance for larger screens.

   ```css
   /* tokens.css */
   :root {
     /* Spacing */
     --space-xs: 0.25rem;
     --space-sm: 0.5rem;
     --space-md: 1rem;
     --space-lg: 1.5rem;
     --space-xl: 2rem;

     /* Touch targets — 44px minimum per WCAG 2.5.5 */
     --touch-target: 44px;

     /* Type */
     --font-size-base: 1rem;
     --font-size-lg: 1.125rem;

     /* Layout */
     --content-max-width: 1200px;
     --sidebar-width: 280px;
   }

   /* Breakpoints */
   /* sm: 640px  — large phones, small tablets */
   /* md: 768px  — tablets                     */
   /* lg: 1024px — small desktops              */
   /* xl: 1280px — wide desktops               */
   ```

2. **Build a responsive product grid**

   Use CSS Grid with `auto-fill` so the number of columns adjusts automatically to the available width.

   ```css
   /* ProductGrid.css */
   .product-grid {
     display: grid;
     /* 2 columns on phone, auto-fill up to 4 on desktop */
     grid-template-columns: repeat(auto-fill, minmax(min(160px, 100%), 1fr));
     gap: var(--space-md);
     padding: var(--space-md);
   }

   @media (min-width: 640px) {
     .product-grid {
       grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
     }
   }

   @media (min-width: 1024px) {
     .product-grid {
       grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
       gap: var(--space-lg);
     }
   }

   .product-card {
     display: flex;
     flex-direction: column;
   }

   .product-card__image {
     aspect-ratio: 4/5;
     object-fit: cover;
     width: 100%;
   }

   .product-card__cta {
     /* Ensure tap target meets 44px minimum */
     min-height: var(--touch-target);
     display: flex;
     align-items: center;
     justify-content: center;
     margin-top: auto;
   }
   ```

3. **Implement a sticky buy bar on the product detail page**

   The sticky buy bar appears after the user scrolls past the main Add to Cart button and stays visible until they reach the footer.

   ```jsx
   // StickyBuyBar.jsx
   import { useState, useEffect, useRef } from 'react';

   export function StickyBuyBar({ product, onAddToCart }) {
     const [visible, setVisible] = useState(false);
     const primaryBtnRef = useRef(null); // ref to the primary Add to Cart button

     useEffect(() => {
       function onScroll() {
         if (!primaryBtnRef.current) return;
         const rect = primaryBtnRef.current.getBoundingClientRect();
         // Show sticky bar when primary button scrolls out of view
         setVisible(rect.bottom < 0);
       }
       window.addEventListener('scroll', onScroll, { passive: true });
       return () => window.removeEventListener('scroll', onScroll);
     }, []);

     return (
       <>
         {/* Primary buy button — pass ref down */}
         <button ref={primaryBtnRef} className="btn-primary" onClick={onAddToCart}>
           Add to Cart
         </button>

         {/* Sticky bar */}
         <div
           className={`sticky-buy-bar ${visible ? 'visible' : ''}`}
           aria-hidden={!visible}
         >
           <div className="sticky-buy-bar__inner">
             <img src={product.image} alt="" width="40" height="40" />
             <span className="sticky-buy-bar__name">{product.name}</span>
             <span className="sticky-buy-bar__price">${product.price}</span>
             <button
               className="btn-primary"
               onClick={onAddToCart}
               tabIndex={visible ? 0 : -1}
             >
               Add to Cart
             </button>
           </div>
         </div>
       </>
     );
   }
   ```

   ```css
   .sticky-buy-bar {
     position: fixed;
     bottom: 0;
     left: 0;
     right: 0;
     background: #fff;
     border-top: 1px solid #e2e8f0;
     transform: translateY(100%);
     transition: transform 0.2s ease;
     z-index: 50;
     /* Safe area for iPhone home indicator */
     padding-bottom: env(safe-area-inset-bottom);
   }

   .sticky-buy-bar.visible {
     transform: translateY(0);
   }

   .sticky-buy-bar__inner {
     display: flex;
     align-items: center;
     gap: var(--space-sm);
     padding: var(--space-sm) var(--space-md);
     max-width: var(--content-max-width);
     margin: 0 auto;
   }
   ```

4. **Design a thumb-friendly mobile cart drawer**

   Place interactive elements in the bottom 60% of the screen (the thumb zone). Use a bottom sheet pattern rather than a sidebar on mobile.

   ```css
   /* Cart drawer — sidebar on desktop, bottom sheet on mobile */
   .cart-drawer {
     position: fixed;
     right: 0;
     top: 0;
     bottom: 0;
     width: min(400px, 100vw);
     background: #fff;
     transform: translateX(100%);
     transition: transform 0.3s ease;
     z-index: 200;
     overflow-y: auto;
     overscroll-behavior: contain;
   }

   @media (max-width: 640px) {
     .cart-drawer {
       top: auto;        /* Anchor to bottom */
       width: 100vw;
       height: 85vh;     /* Peek mode — user can see page content above */
       transform: translateY(100%);
       border-radius: 16px 16px 0 0;
     }
   }

   .cart-drawer.open {
     transform: translateX(0);
   }

   @media (max-width: 640px) {
     .cart-drawer.open {
       transform: translateY(0);
     }
   }

   /* Checkout button — always at bottom of drawer, within thumb reach */
   .cart-checkout-btn {
     position: sticky;
     bottom: 0;
     background: #fff;
     padding: var(--space-md);
     padding-bottom: calc(var(--space-md) + env(safe-area-inset-bottom));
   }
   ```

5. **Ensure all touch targets are adequately sized**

   ```css
   /* Global tap target enforcement */
   button,
   a,
   input[type="checkbox"],
   input[type="radio"],
   select,
   [role="button"] {
     min-height: var(--touch-target);    /* 44px */
     min-width: var(--touch-target);     /* 44px */
   }

   /* Variant swatches — often too small */
   .variant-swatch {
     width: 44px;
     height: 44px;
     border-radius: 50%;
     cursor: pointer;
     /* Visual indicator is smaller, hit area is 44px */
   }

   .variant-swatch::before {
     content: '';
     display: block;
     width: 28px;
     height: 28px;
     border-radius: 50%;
     background: var(--swatch-color);
     margin: 8px auto;
   }
   ```

## Examples

### Responsive product detail page layout

```css
/* PDP layout — single column on mobile, 2-up on desktop */
.pdp-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-lg);
  padding: var(--space-md);
}

@media (min-width: 768px) {
  .pdp-layout {
    grid-template-columns: 1fr 1fr;
    align-items: start;
    padding: var(--space-xl);
  }

  .pdp-images { position: sticky; top: var(--space-xl); }
}
```

### Responsive image with art direction

Use `<picture>` to serve different crops for mobile vs. desktop — a portrait crop on phone, landscape on desktop:

```html
<picture>
  <source
    media="(min-width: 768px)"
    srcset="/images/hero-desktop.webp 1200w, /images/hero-desktop@2x.webp 2400w"
  />
  <source
    media="(max-width: 767px)"
    srcset="/images/hero-mobile.webp 600w, /images/hero-mobile@2x.webp 1200w"
  />
  <img src="/images/hero-desktop.webp" alt="Summer collection" loading="eager" fetchpriority="high" />
</picture>
```

## Best Practices

- **Write mobile-first CSS** — start with the smallest screen styles and add `min-width` media queries to enlarge; the reverse approach leads to specificity wars
- **Use `env(safe-area-inset-bottom)`** — required for the iPhone notch/home indicator; without it, buttons at the bottom edge are obscured
- **Test with real devices** — browser DevTools mobile emulation does not replicate touch event behavior, scrolling inertia, or iOS Safari's dynamic viewport height
- **Use `overscroll-behavior: contain`** on scroll containers** — prevents body scroll from leaking when users swipe in the cart drawer or a modal
- **Prefer CSS Grid and Flexbox over fixed widths** — elastic layouts handle unexpected content lengths without overflow
- **Size images correctly** — serve WebP at the rendered size (not 2x the container); use `srcset` and `sizes` for responsive images
- **Avoid hover-only states for primary CTAs** — hover does not exist on touch devices; use `:focus-visible` and `:active` for interactive feedback

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Sticky buy bar obscures footer or checkout button | Track scroll position relative to both the primary CTA and the footer; hide the bar when either is visible |
| iOS Safari's dynamic toolbar causes layout jumps | Use `100dvh` (dynamic viewport height) instead of `100vh`; fall back to `100vh` with `@supports` |
| Font too small to read without pinch-zooming | Set `font-size` to at least 16px on body to prevent iOS auto-zoom on input focus |
| Cart drawer body scroll on mobile | Apply `touch-action: none` and `overflow: hidden` on the body when drawer is open |
| Product images load slowly on mobile | Specify `width` and `height` attributes to prevent layout shift; use `loading="lazy"` for below-fold images |

## Related Skills

- @mega-menu-builder
- @quick-view-modal
- @accessibility-commerce
- @storefront-theming
