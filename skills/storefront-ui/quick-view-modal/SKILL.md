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
platforms: [platform-agnostic]
difficulty: beginner
---

# Quick View Modal

## Overview

Implement a product quick-view overlay that lets shoppers preview key product details — images, variants, description, price — and add items to cart without navigating away from the product listing page. The modal uses the native `<dialog>` element for built-in focus trapping and Escape-to-close behavior, lazily fetches product data, and returns focus to the triggering element on close.

## When to Use This Skill

- When conversion data shows shoppers leave the PLP frequently but bounce from the PDP
- When products have simple variant structures (1-2 variant axes) suitable for quick selection
- When implementing a "quick add" button on product cards in collections or search results
- When the site's PDP is heavy (many images, reviews section) and a lighter preview would reduce friction

## Core Instructions

1. **Trigger quick view from the product card**

   Add a "Quick View" button that appears on card hover (and is always visible on touch devices). Store the product ID in a data attribute.

   ```jsx
   // ProductCard.jsx
   export function ProductCard({ product, onQuickView }) {
     return (
       <article className="product-card">
         <div className="product-card__image-wrapper">
           <a href={product.url} tabIndex={-1} aria-hidden="true">
             <img src={product.image} alt="" loading="lazy" />
           </a>
           <button
             className="quick-view-btn"
             onClick={() => onQuickView(product.id)}
             aria-label={`Quick view ${product.name}`}
           >
             Quick View
           </button>
         </div>
         <div className="product-card__info">
           <a href={product.url} className="product-card__name">{product.name}</a>
           <p className="product-card__price">${product.price}</p>
         </div>
       </article>
     );
   }
   ```

   ```css
   .product-card__image-wrapper { position: relative; }

   .quick-view-btn {
     position: absolute;
     bottom: var(--space-sm);
     left: 50%;
     transform: translateX(-50%) translateY(8px);
     opacity: 0;
     transition: opacity 0.15s, transform 0.15s;
     background: #fff;
     border: 1px solid #e2e8f0;
     border-radius: 4px;
     padding: 8px 16px;
     white-space: nowrap;
     cursor: pointer;
   }

   .product-card:hover .quick-view-btn,
   .product-card:focus-within .quick-view-btn {
     opacity: 1;
     transform: translateX(-50%) translateY(0);
   }

   /* Always visible on touch devices */
   @media (hover: none) {
     .quick-view-btn { opacity: 1; transform: translateX(-50%) translateY(0); }
   }
   ```

2. **Manage modal state and lazy-fetch product details**

   ```javascript
   // useQuickView.js
   import { useState, useCallback } from 'react';

   export function useQuickView() {
     const [state, setState] = useState({ isOpen: false, product: null, loading: false });

     const openQuickView = useCallback(async (productId) => {
       setState({ isOpen: true, product: null, loading: true });
       try {
         const res = await fetch(`/api/products/${productId}/quick-view`);
         const product = await res.json();
         setState({ isOpen: true, product, loading: false });
       } catch {
         setState({ isOpen: false, product: null, loading: false });
       }
     }, []);

     const closeQuickView = useCallback(() => {
       setState({ isOpen: false, product: null, loading: false });
     }, []);

     return { ...state, openQuickView, closeQuickView };
   }
   ```

3. **Build the modal using the native `<dialog>` element**

   `<dialog>` provides built-in focus trapping, Escape-to-close, and the `::backdrop` pseudo-element for the overlay.

   ```jsx
   // QuickViewModal.jsx
   import { useEffect, useRef } from 'react';

   export function QuickViewModal({ isOpen, product, loading, onClose, onAddToCart }) {
     const dialogRef = useRef(null);

     useEffect(() => {
       const dialog = dialogRef.current;
       if (!dialog) return;
       if (isOpen) {
         dialog.showModal();
       } else {
         dialog.close();
       }
     }, [isOpen]);

     // Close on backdrop click
     function handleDialogClick(e) {
       if (e.target === dialogRef.current) onClose();
     }

     return (
       <dialog
         ref={dialogRef}
         className="quick-view-dialog"
         onClose={onClose}
         onClick={handleDialogClick}
         aria-label={product ? `Quick view: ${product.name}` : 'Quick view'}
       >
         <div className="quick-view-content">
           <button className="close-btn" onClick={onClose} aria-label="Close quick view">
             &times;
           </button>

           {loading && (
             <div className="quick-view-skeleton" aria-live="polite" aria-label="Loading product details">
               <div className="skeleton skeleton--image" />
               <div className="skeleton skeleton--title" />
               <div className="skeleton skeleton--price" />
             </div>
           )}

           {!loading && product && (
             <QuickViewBody product={product} onAddToCart={onAddToCart} onClose={onClose} />
           )}
         </div>
       </dialog>
     );
   }
   ```

4. **Build the quick view body with variant selection**

   ```jsx
   // QuickViewBody.jsx
   import { useState } from 'react';

   export function QuickViewBody({ product, onAddToCart, onClose }) {
     const [selectedVariant, setSelectedVariant] = useState(product.variants[0] ?? null);
     const [quantity, setQuantity] = useState(1);
     const [adding, setAdding] = useState(false);

     async function handleAddToCart() {
       if (!selectedVariant) return;
       setAdding(true);
       await onAddToCart({ variantId: selectedVariant.id, quantity });
       setAdding(false);
       onClose();
     }

     return (
       <div className="quick-view-body">
         {/* Images */}
         <div className="quick-view-images">
           <img
             src={selectedVariant?.image ?? product.images[0]}
             alt={product.name}
             className="quick-view-main-image"
           />
         </div>

         {/* Details */}
         <div className="quick-view-details">
           <h2 className="quick-view-title">{product.name}</h2>
           <p className="quick-view-price">${selectedVariant?.price ?? product.price}</p>

           {/* Variant selector */}
           {product.options.map(option => (
             <fieldset key={option.name} className="variant-fieldset">
               <legend>{option.name}</legend>
               {option.values.map(value => {
                 const variant = product.variants.find(v =>
                   v.options[option.name] === value
                 );
                 return (
                   <label key={value} className={`variant-option ${selectedVariant?.options[option.name] === value ? 'selected' : ''}`}>
                     <input
                       type="radio"
                       name={option.name}
                       value={value}
                       checked={selectedVariant?.options[option.name] === value}
                       disabled={!variant || variant.inventory === 0}
                       onChange={() => setSelectedVariant(variant)}
                     />
                     {value}
                   </label>
                 );
               })}
             </fieldset>
           ))}

           <p className="quick-view-excerpt">{product.shortDescription}</p>

           <div className="quick-view-actions">
             <button
               className="btn-primary"
               onClick={handleAddToCart}
               disabled={!selectedVariant || selectedVariant.inventory === 0 || adding}
             >
               {adding ? 'Adding...' : selectedVariant?.inventory === 0 ? 'Sold Out' : 'Add to Cart'}
             </button>
             <a href={product.url} className="btn-secondary">View Full Details</a>
           </div>
         </div>
       </div>
     );
   }
   ```

5. **Return focus to the trigger element on close**

   ```javascript
   // In the component that manages quick view state
   const triggerRef = useRef(null);

   function handleOpenQuickView(productId, triggerElement) {
     triggerRef.current = triggerElement;
     openQuickView(productId);
   }

   function handleCloseQuickView() {
     closeQuickView();
     // Return focus to the button that opened the modal
     requestAnimationFrame(() => triggerRef.current?.focus());
   }
   ```

## Examples

### Product listing page wiring everything together

```jsx
// ProductListingPage.jsx
export function ProductListingPage({ initialProducts }) {
  const { isOpen, product, loading, openQuickView, closeQuickView } = useQuickView();
  const [cartItems, setCartItems] = useCart();

  async function handleAddToCart({ variantId, quantity }) {
    await addToCart({ variantId, quantity });
  }

  return (
    <>
      <div className="product-grid">
        {initialProducts.map(p => (
          <ProductCard
            key={p.id}
            product={p}
            onQuickView={(id) => openQuickView(id)}
          />
        ))}
      </div>

      <QuickViewModal
        isOpen={isOpen}
        product={product}
        loading={loading}
        onClose={closeQuickView}
        onAddToCart={handleAddToCart}
      />
    </>
  );
}
```

### Quick view API endpoint

```javascript
// api/products/[id]/quick-view.js
export async function GET(req, { params }) {
  const product = await db.products.findById(params.id, {
    include: ['variants', 'options', 'images'],
    fields: ['id', 'name', 'price', 'shortDescription', 'url',
             'images', 'variants', 'options'],
  });
  if (!product) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(product);
}
```

## Best Practices

- **Use `<dialog>` element** — it provides native focus trapping, Escape-to-close, `::backdrop`, and screen reader announcement for free
- **Return focus on close** — WCAG 2.4.3 requires focus to return to the element that opened the modal
- **Always provide a "View full details" link** — quick view is a shortcut, not a replacement; complex products (many images, reviews) need the full PDP
- **Lazy-fetch product data on open** — do not embed full product data in the product card HTML; fetch it on demand to keep initial page weight low
- **Show a loading skeleton** — the fetch takes 100-300 ms; a skeleton prevents perceived layout shift
- **Close on backdrop click** — clicking outside the modal content area should close it; `<dialog>` click handling on the element itself achieves this cleanly
- **Prevent body scroll when open** — on mobile, `overscroll-behavior: contain` on the dialog prevents the underlying page from scrolling

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Focus lost after modal closes | Store the trigger element reference before opening; call `.focus()` on it inside `requestAnimationFrame` after close |
| `<dialog>` not supported in older browsers | `<dialog>` has had >96% support since 2022; for legacy support add the `dialog-polyfill` npm package |
| Body scrolls behind open modal | Set `overflow: hidden` on `body` when modal is open; restore it on close |
| Quick view does not work on mobile (no hover) | Ensure the Quick View button is always visible on `hover: none` media devices using `@media (hover: none)` |
| Variant selection resets when images change | Keep `selectedVariant` in state indexed by variant ID, not by position in the array |

## Related Skills

- @product-page-design
- @cart-logic
- @accessibility-commerce
- @responsive-storefront
