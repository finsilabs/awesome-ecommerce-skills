---
name: responsive-storefront
description: "Build a mobile-first storefront with thumb-friendly navigation, sticky add-to-cart buttons, and touch-optimized components for high mobile conversion"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [responsive, mobile-first, css, ux, cart, buy-button, touch, layout]
triggers: ["mobile responsive storefront", "thumb-friendly design", "sticky add to cart", "mobile commerce layout", "responsive product page"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
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

### Step 1: Determine the merchant's platform and choose the right approach

| Platform | Recommended Approach | Why |
|----------|---------------------|-----|
| **Shopify** | Use a mobile-first OS2.0 theme (Dawn, Sense, Craft) — all are responsive by default; configure mobile layout in Theme Editor | Dawn scores 90+ on mobile PageSpeed out of the box; the Theme Editor exposes mobile-specific layout controls |
| **WooCommerce** | Use a mobile-first WooCommerce theme (Astra, Kadence, or Flatsome) — all include responsive breakpoints and mobile cart drawer built in | Astra and Kadence score well on Core Web Vitals; Flatsome has built-in sticky header and mobile menu without plugins |
| **BigCommerce** | Use Cornerstone theme which is mobile-first by design; configure breakpoints in Theme Editor | Cornerstone is BigCommerce's reference theme and passes Google's mobile usability tests |
| **Custom / Headless** | Write mobile-first CSS with `min-width` media queries and build a responsive product grid, sticky buy bar, and bottom-sheet cart drawer | Full control over all breakpoints and touch interactions; see patterns below |

### Step 2: Configure mobile layout on your platform

---

#### Shopify

**Theme Editor mobile configuration:**
1. Go to **Online Store → Themes → Customize**
2. Click the **Mobile** preview icon in the top toolbar to preview on a phone
3. Configure **Header settings**:
   - Set **Mobile menu type**: Drawer (recommended) or Dropdown
   - Enable **Sticky header** so navigation stays visible while scrolling
4. Configure **Collection page**:
   - Set **Products per row (mobile)** to 2 (standard) or 1 (large cards)
   - Enable **Filters** as a drawer on mobile (not sidebar)
5. Configure **Product page**:
   - Enable **Sticky add-to-cart** in the product section settings
   - Set **Media placement** to stack gallery above product info on mobile (this is the default)
6. In **Theme settings → Buttons**, set button height to at least 44px to meet touch target requirements

**Testing mobile performance:**
1. Open Google PageSpeed Insights (pagespeed.web.dev) and enter your store URL
2. Review the Mobile tab — aim for 75+ Performance score
3. The most common fix: compress images via **Settings → Files** and replace large images with WebP versions

---

#### WooCommerce

**Astra theme mobile configuration:**
1. Go to **Appearance → Customize → Header → Mobile Header**
2. Configure hamburger menu style and position
3. Under **Appearance → Customize → WooCommerce → Shop Page**, set **Products per row (mobile)** to 2
4. Under **Appearance → Customize → WooCommerce → Product Page**, enable **Sticky Add to Cart** bar for mobile
5. In **Appearance → Customize → Global → Container**, ensure container width is 100% on mobile (no horizontal padding issues)

**Kadence theme mobile configuration:**
1. Go to **Appearance → Customize → WooCommerce → Product Archive**
2. Set mobile columns to 2 and configure card spacing
3. Under **Appearance → Customize → WooCommerce → Product Page**, enable **Sticky Add to Cart**
4. In **Kadence → Header Builder**, configure the mobile header layout — Kadence lets you drag elements (logo, menu, cart) to separate mobile header rows

**Flatsome theme:**
1. In **Theme Options → WooCommerce → Products**, configure mobile product grid columns
2. Enable **Sticky Add to Cart** in Theme Options → WooCommerce → Product
3. Flatsome's UX Builder has a mobile preview mode — use it to inspect every page's mobile layout

---

#### BigCommerce

**Cornerstone mobile configuration:**
1. Go to **Storefront → My Themes → Customize**
2. Preview on mobile using the device icon in the toolbar
3. Under **Global → Layout**, configure mobile breakpoints and container padding
4. Under **Product Page → Images**, set gallery layout to **Stacked** on mobile (image above product info)
5. Enable **Mobile overlay** for the cart — this converts the cart from a sidebar to a bottom sheet on mobile
6. Under **Category Page → Product Cards**, set mobile columns to 2

---

#### Custom / Headless

**Mobile-first CSS foundations:**
```css
/* tokens.css */
:root {
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --touch-target: 44px;     /* WCAG 2.5.5 minimum tap target */
  --content-max-width: 1200px;
}

/* Breakpoints: sm=640px, md=768px, lg=1024px */
/* Write base styles for mobile, add min-width queries for larger screens */
```

**Responsive product grid (auto-fills columns based on available width):**
```css
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(160px, 100%), 1fr));
  gap: var(--space-md);
  padding: var(--space-md);
}

@media (min-width: 640px) {
  .product-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
}

@media (min-width: 1024px) {
  .product-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-lg); }
}

/* Minimum 44px touch target on product card CTA */
.product-card__cta { min-height: var(--touch-target); display: flex; align-items: center; }
```

**Sticky buy bar — appears when primary Add to Cart scrolls out of view:**
```jsx
export function StickyBuyBar({ product, onAddToCart }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const primaryBtn = document.getElementById('main-add-to-cart');
    if (!primaryBtn) return;
    const obs = new IntersectionObserver(([e]) => setVisible(!e.isIntersecting));
    obs.observe(primaryBtn);
    return () => obs.disconnect();
  }, []);

  return (
    <div className={`sticky-buy-bar ${visible ? 'visible' : ''}`} aria-hidden={!visible}>
      <img src={product.image} alt="" width="40" height="40" />
      <span>{product.name}</span>
      <span>${product.price}</span>
      <button onClick={onAddToCart} tabIndex={visible ? 0 : -1}>Add to Cart</button>
    </div>
  );
}
```

```css
.sticky-buy-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: #fff; border-top: 1px solid #e2e8f0;
  transform: translateY(100%); transition: transform 0.2s ease; z-index: 50;
  padding-bottom: env(safe-area-inset-bottom); /* iPhone home indicator */
  display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem;
}
.sticky-buy-bar.visible { transform: translateY(0); }
```

**Mobile cart drawer (bottom sheet pattern):**
```css
.cart-drawer {
  position: fixed; right: 0; top: 0; bottom: 0;
  width: min(400px, 100vw); background: #fff;
  transform: translateX(100%); transition: transform 0.3s ease;
  overflow-y: auto; overscroll-behavior: contain;
}

@media (max-width: 640px) {
  .cart-drawer {
    top: auto; width: 100vw; height: 85vh;
    transform: translateY(100%); border-radius: 16px 16px 0 0;
  }
  .cart-drawer.open { transform: translateY(0); }
}

.cart-drawer.open { transform: translateX(0); }

/* Checkout button stays within thumb reach */
.cart-checkout-btn {
  position: sticky; bottom: 0; background: #fff;
  padding: var(--space-md);
  padding-bottom: calc(var(--space-md) + env(safe-area-inset-bottom));
}
```

**Global 44px touch targets:**
```css
button, a, input[type="checkbox"], input[type="radio"], select, [role="button"] {
  min-height: var(--touch-target);
  min-width: var(--touch-target);
}
```

## Best Practices

- **Write mobile-first CSS** — start with the smallest screen styles and add `min-width` media queries to enlarge; the reverse approach leads to specificity conflicts
- **Use `env(safe-area-inset-bottom)`** — required for iPhone notch/home indicator; without it, bottom-fixed buttons are obscured
- **Test with real devices** — browser DevTools emulation does not replicate iOS Safari's dynamic viewport height or touch scroll inertia
- **Use `overscroll-behavior: contain`** on scroll containers — prevents body scroll from leaking when users swipe in the cart drawer
- **Use `100dvh` instead of `100vh`** on full-screen elements — iOS Safari's dynamic toolbar causes `100vh` to include the toolbar height, causing overflow
- **Set font-size to at least 16px** on `<body>` — prevents iOS Safari from auto-zooming on input focus

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Sticky buy bar obscures footer or checkout button | Hide the bar when the footer or checkout button enters the viewport using IntersectionObserver |
| iOS Safari layout jumps when toolbar appears | Use `100dvh` (dynamic viewport height) instead of `100vh`; fall back with `@supports (height: 100dvh)` |
| Font too small to read without pinch-zooming | Set `font-size: 1rem` (16px) on body; never set it lower on mobile |
| Cart drawer body scroll | Apply `overflow: hidden` on `<body>` when drawer is open; restore on close |
| Product images load slowly on mobile | Specify `width` and `height` attributes to prevent layout shift; use `loading="lazy"` for below-fold images |

## Related Skills

- @mega-menu-builder
- @quick-view-modal
- @accessibility-commerce
- @storefront-theming
