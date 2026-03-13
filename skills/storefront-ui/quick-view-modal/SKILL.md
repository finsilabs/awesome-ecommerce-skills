---
name: quick-view-modal
description: "Let shoppers preview product details and add items to cart from the listing page without navigating away, reducing friction in the shopping flow"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [quick-view, modal, overlay, product-listing, add-to-cart, dialog, focus-trap]
triggers: ["quick view product", "product preview modal", "add to cart from listing", "product overlay", "quick buy"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: beginner
---

# Quick View Modal

## Overview

Implement a product quick-view overlay that lets shoppers preview key product details — images, variants, description, price — and add items to cart without navigating away from the product listing page. Quick view reduces friction for shoppers browsing multiple products and works best for products with simple variant structures (1–2 variant axes).

## When to Use This Skill

- When conversion data shows shoppers leave the PLP frequently but bounce from the PDP
- When products have simple variant structures (1-2 variant axes) suitable for quick selection
- When implementing a "quick add" button on product cards in collections or search results
- When the site's PDP is heavy (many images, reviews section) and a lighter preview would reduce friction

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right approach

| Platform | Recommended Approach | Why |
|----------|---------------------|-----|
| **Shopify** | Enable Quick View in your theme (Dawn, Sense, Craft all include it) or install **Quick View – Instant Preview** app | Dawn's built-in Quick Add button adds items directly to cart from collection pages; the Quick View app adds a full product preview with variant selection |
| **WooCommerce** | Install **YITH WooCommerce Quick View** (free) or **WooCommerce Quick View Pro** | YITH Quick View is the most widely used option — adds a "Quick View" button on hover, opens a modal with gallery, variants, and Add to Cart, and requires no custom code |
| **BigCommerce** | Enable **Quick View** in **Storefront → My Themes → Customize → Product Cards** (Cornerstone theme) | Cornerstone includes a built-in quick view popup — toggle it in the Theme Editor with no coding required |
| **Custom / Headless** | Build a modal using the native `<dialog>` element with lazy product fetch, variant selection, and focus management | `<dialog>` provides built-in focus trapping and Escape-to-close; lazy fetching keeps initial page weight low |

### Step 2: Enable and configure Quick View

---

#### Shopify

**Built-in Quick Add (Dawn, Sense, Craft):**

Dawn's collection pages include a "Quick Add" button by default that adds a product directly to cart without opening a modal. To enable/configure it:
1. Go to **Online Store → Themes → Customize**
2. Navigate to a collection page template
3. In the **Product card** section, enable **Quick add button**
4. Set button style: **Standard** (shows "Quick Add") or **Icon** (+ icon)

Note: Dawn's Quick Add only works for products with no variants or a single variant axis. For products with multiple option types (Color + Size), it opens the product page instead.

**Full Quick View modal (Quick View – Instant Preview app):**
1. Install from the Shopify App Store (free tier available)
2. The app adds a "Quick View" button on hover over product cards across all collection pages
3. In app settings, configure which product sections appear in the modal: images, description, reviews, size guides
4. Shoppers can select all variant options and add to cart without leaving the collection page
5. No theme code editing required — the app injects via App Block

---

#### WooCommerce

**YITH WooCommerce Quick View (free):**
1. Install and activate from WordPress.org
2. Go to **YITH → Quick View → General Settings**
3. Set **Trigger**: "Quick View button on hover" (recommended) or click on product image
4. Configure **Modal content**: choose which sections to show — Gallery, Price, Short Description, Variants (Add to Cart), Reviews summary
5. Set **Modal width** and whether to show a "View full product" link inside the modal (recommended)
6. Under **Style**, adjust button text, colors, and positioning to match your theme

The plugin adds a "Quick View" button to `.product` elements across shop, archive, and search results pages automatically.

---

#### BigCommerce

**Built-in Quick View (Cornerstone theme):**
1. Go to **Storefront → My Themes → Customize**
2. Find **Product Cards** section (in Global or Category Page settings depending on your theme version)
3. Toggle **Enable Quick View** to On
4. Configure which elements appear: gallery, options/variants, Add to Cart button, price
5. BigCommerce's Quick View pulls the product's full variant options and images

For non-Cornerstone themes, check your theme documentation — Quick View support varies. If not included, install the **Quick View** app from the BigCommerce App Marketplace.

---

#### Custom / Headless

**Quick View button on product cards:**
```jsx
// ProductCard.jsx
export function ProductCard({ product, onQuickView }) {
  return (
    <article className="product-card">
      <div className="product-card__image-wrapper">
        <a href={product.url}>
          <img src={product.image} alt={product.name} loading="lazy" />
        </a>
        <button className="quick-view-btn"
          onClick={() => onQuickView(product.id)}
          aria-label={`Quick view ${product.name}`}>
          Quick View
        </button>
      </div>
      <a href={product.url} className="product-card__name">{product.name}</a>
      <p className="product-card__price">${product.price}</p>
    </article>
  );
}
```

```css
/* Always visible on touch; appears on hover for mouse users */
.quick-view-btn { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
  opacity: 0; transition: opacity 0.15s; }
.product-card:hover .quick-view-btn, .product-card:focus-within .quick-view-btn { opacity: 1; }
@media (hover: none) { .quick-view-btn { opacity: 1; } }
```

**Modal using native `<dialog>` (built-in focus trapping + Escape-to-close):**
```jsx
// QuickViewModal.jsx
import { useEffect, useRef } from 'react';

export function QuickViewModal({ isOpen, product, loading, onClose, onAddToCart }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) dialog.showModal();
    else dialog.close();
  }, [isOpen]);

  return (
    <dialog ref={dialogRef} className="quick-view-dialog"
      onClose={onClose}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
      aria-label={product ? `Quick view: ${product.name}` : 'Quick view'}>
      <button className="close-btn" onClick={onClose} aria-label="Close quick view">&times;</button>

      {loading && (
        <div aria-live="polite" aria-label="Loading product details">
          {/* Skeleton loaders */}
          <div className="skeleton skeleton--image" />
          <div className="skeleton skeleton--title" />
        </div>
      )}

      {!loading && product && (
        <QuickViewBody product={product} onAddToCart={onAddToCart} onClose={onClose} />
      )}
    </dialog>
  );
}
```

**Quick view body with variant selection:**
```jsx
function QuickViewBody({ product, onAddToCart, onClose }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0] ?? null);

  return (
    <div className="quick-view-body">
      <img src={selectedVariant?.image ?? product.images[0]} alt={product.name} />
      <div className="quick-view-details">
        <h2>{product.name}</h2>
        <p>${selectedVariant?.price ?? product.price}</p>

        {product.options.map(option => (
          <fieldset key={option.name}>
            <legend>{option.name}</legend>
            {option.values.map(value => {
              const variant = product.variants.find(v => v.options[option.name] === value);
              return (
                <label key={value}>
                  <input type="radio" name={option.name} value={value}
                    checked={selectedVariant?.options[option.name] === value}
                    disabled={!variant || variant.inventory === 0}
                    onChange={() => setSelectedVariant(variant)} />
                  {value}{variant?.inventory === 0 ? ' (sold out)' : ''}
                </label>
              );
            })}
          </fieldset>
        ))}

        <button className="btn-primary"
          disabled={!selectedVariant || selectedVariant.inventory === 0}
          onClick={() => onAddToCart({ variantId: selectedVariant.id, quantity: 1 }).then(onClose)}>
          Add to Cart
        </button>
        <a href={product.url}>View Full Details</a>
      </div>
    </div>
  );
}
```

**Return focus to the trigger button when modal closes:**
```javascript
const triggerRef = useRef(null);

function handleOpenQuickView(productId, triggerElement) {
  triggerRef.current = triggerElement; // store the button that was clicked
  openQuickView(productId);
}

function handleCloseQuickView() {
  closeQuickView();
  requestAnimationFrame(() => triggerRef.current?.focus());
}
```

## Best Practices

- **Always provide a "View full details" link** — quick view is a shortcut, not a replacement; complex products (many images, reviews) need the full PDP
- **Lazy-fetch product data on open** — do not embed full product data in the card HTML; fetch it on demand to keep page weight low
- **Show a loading skeleton** — the fetch takes 100–300 ms; a skeleton prevents perceived layout shift
- **Close on backdrop click** — clicking outside the modal content area should close it
- **Prevent body scroll when open** — on mobile, `overscroll-behavior: contain` on the dialog prevents the underlying page from scrolling
- **Use Quick View only for simple products** — products with 3+ variant axes, size guides, or detailed spec tables should go to the full PDP

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Focus lost after modal closes | Store the trigger element reference before opening; call `.focus()` inside `requestAnimationFrame` after close |
| Quick view button not visible on touch devices | Use `@media (hover: none)` to always show the button on touch screens; do not rely on hover alone |
| Body scrolls behind open modal | Set `overflow: hidden` on `body` when modal is open; restore on close |
| Variant selection resets when images change | Keep `selectedVariant` in state indexed by variant ID, not position in the array |
| Quick view opens for products that need full PDP | Detect products with 3+ options or requiring size guide and navigate to PDP directly instead |

## Related Skills

- @product-page-design
- @accessibility-commerce
- @responsive-storefront
- @faceted-navigation
