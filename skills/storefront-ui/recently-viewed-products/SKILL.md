---
name: recently-viewed-products
description: "Show shoppers the products they recently browsed using browser storage so they can easily pick up where they left off on your store"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [recently-viewed, browsing-history, sessionStorage, cookies, personalization, recommendations]
triggers: ["recently viewed products", "browsing history", "continue shopping", "viewed items", "product history widget"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: beginner
---

# Recently Viewed Products

## Overview

Track which products a shopper views during their session and display them in a "Recently Viewed" widget on product pages, the cart, and the homepage. Uses `sessionStorage` for within-session history and a `localStorage` or cookie-based strategy for cross-session persistence. Product data is stored by ID only; full details are fetched on demand to avoid serving stale prices or availability.

## When to Use This Skill

- When implementing a "Continue where you left off" experience for returning visitors
- When adding a "Recently Viewed" widget to product detail pages or the cart drawer
- When integrating with a personalization engine that requires client-side behavioral data
- When building a headless storefront and need lightweight browsing history without a backend dependency

## Core Instructions

1. **Define the storage strategy**

   Store an ordered array of product IDs with timestamps. Keep only the last N items. Use `localStorage` for cross-session persistence (up to 30 days) or `sessionStorage` for same-session-only behavior.

   ```javascript
   // lib/recentlyViewed.js
   const STORAGE_KEY = 'rv_products';
   const MAX_ITEMS = 12;
   const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

   export function recordView(productId) {
     const items = getStoredItems();
     // Remove existing entry for this product (avoid duplicates)
     const filtered = items.filter(i => i.id !== productId);
     // Prepend new entry
     const updated = [
       { id: productId, viewedAt: Date.now() },
       ...filtered,
     ].slice(0, MAX_ITEMS);
     saveItems(updated);
   }

   export function getRecentlyViewedIds(excludeId = null) {
     const items = getStoredItems();
     const now = Date.now();
     return items
       .filter(i => now - i.viewedAt < TTL_MS && i.id !== excludeId)
       .map(i => i.id);
   }

   function getStoredItems() {
     try {
       return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
     } catch {
       return [];
     }
   }

   function saveItems(items) {
     try {
       localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
     } catch {
       // localStorage quota exceeded — fail silently
     }
   }

   export function clearHistory() {
     localStorage.removeItem(STORAGE_KEY);
   }
   ```

2. **Record a product view on the PDP**

   Call `recordView` as soon as the product page renders. For server-rendered pages, do this in a `useEffect` to avoid hydration mismatches.

   ```jsx
   // ProductDetailPage.jsx
   import { useEffect } from 'react';
   import { recordView } from '../lib/recentlyViewed';

   export function ProductDetailPage({ product }) {
     useEffect(() => {
       recordView(product.id);
     }, [product.id]);

     return (
       <div>
         {/* Product content */}
         <RecentlyViewedWidget excludeId={product.id} />
       </div>
     );
   }
   ```

3. **Build the RecentlyViewedWidget component**

   Fetch fresh product data by IDs to ensure prices and availability are current.

   ```jsx
   // RecentlyViewedWidget.jsx
   import { useState, useEffect } from 'react';
   import { getRecentlyViewedIds } from '../lib/recentlyViewed';

   export function RecentlyViewedWidget({ excludeId, maxItems = 4 }) {
     const [products, setProducts] = useState([]);

     useEffect(() => {
       const ids = getRecentlyViewedIds(excludeId).slice(0, maxItems);
       if (ids.length === 0) return;

       fetch('/api/products/by-ids', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ ids }),
       })
         .then(r => r.json())
         .then(data => {
           // Preserve the viewed order (API may return in arbitrary order)
           const productMap = new Map(data.products.map(p => [p.id, p]));
           setProducts(ids.map(id => productMap.get(id)).filter(Boolean));
         })
         .catch(() => {}); // Non-critical widget — fail silently
     }, [excludeId, maxItems]);

     if (products.length === 0) return null;

     return (
       <section aria-label="Recently viewed">
         <h2>Recently Viewed</h2>
         <div className="recently-viewed-grid">
           {products.map(product => (
             <article key={product.id} className="rv-card">
               <a href={product.url}>
                 <img src={product.image} alt={product.name} loading="lazy" width="150" height="150" />
                 <p className="rv-card__name">{product.name}</p>
                 <p className="rv-card__price">${product.price}</p>
               </a>
             </article>
           ))}
         </div>
       </section>
     );
   }
   ```

4. **Build the batch products API endpoint**

   ```javascript
   // api/products/by-ids.js
   export async function getProductsByIds(req, res) {
     const { ids } = req.body;
     if (!Array.isArray(ids) || ids.length === 0 || ids.length > 20) {
       return res.status(400).json({ error: 'Invalid ids array' });
     }

     const products = await db.products.findMany({
       where: { id: { in: ids }, published: true },
       select: {
         id: true, name: true, price: true,
         image: true, url: true, inStock: true,
       },
     });

     res.json({ products });
   }
   ```

5. **Cookie-based fallback for privacy-restricted environments**

   When `localStorage` is blocked (some browsers in incognito mode or with strict privacy settings), fall back to a short-lived cookie.

   ```javascript
   // lib/recentlyViewedCookie.js — server-rendered fallback
   export function getRecentlyViewedFromCookie(cookieHeader) {
     const match = cookieHeader?.match(/rv_products=([^;]+)/);
     if (!match) return [];
     try {
       return JSON.parse(decodeURIComponent(match[1]));
     } catch {
       return [];
     }
   }

   // Set on product view (server action or API route)
   export function buildRecentlyViewedCookie(currentIds, newProductId) {
     const updated = [newProductId, ...currentIds.filter(id => id !== newProductId)].slice(0, 12);
     const value = encodeURIComponent(JSON.stringify(updated));
     // SameSite=Lax, Secure, 30-day expiry
     return `rv_products=${value}; Max-Age=${30 * 24 * 60 * 60}; Path=/; SameSite=Lax; Secure`;
   }
   ```

## Examples

### Display recently viewed in cart drawer

Show the widget at the bottom of the cart as a subtle upsell when the cart has fewer than 3 items:

```jsx
function CartDrawer({ cartItems }) {
  const showRecentlyViewed = cartItems.length < 3;
  return (
    <div className="cart-drawer">
      <CartItemList items={cartItems} />
      {showRecentlyViewed && (
        <RecentlyViewedWidget maxItems={3} title="You might have missed these" />
      )}
      <CartCheckoutButton />
    </div>
  );
}
```

### Session-only mode using sessionStorage

For GDPR-strict environments where you do not want cross-session tracking without consent:

```javascript
function saveItems(items) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* Quota exceeded or blocked */ }
}

function getStoredItems() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}
```

## Best Practices

- **Store only product IDs, not full product objects** — prices and availability change; always re-fetch product data from the server when rendering the widget
- **Exclude the current product** — pass `excludeId` to prevent showing the product the shopper is already viewing
- **Fail silently** — the recently viewed widget is non-critical; catch all errors and render nothing rather than breaking the page
- **Hydrate after mount** — in SSR frameworks, read from `localStorage` inside `useEffect` to avoid server/client hydration mismatch
- **Limit to 12 IDs maximum** — more than that creates large payloads and long batch queries; the widget typically shows only 4-6 items
- **Respect privacy consent** — only write to storage after the user has accepted analytics cookies if your cookie policy requires it
- **Consider TTL expiry** — purge entries older than 30 days on read to avoid showing discontinued products

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Hydration mismatch in Next.js / SSR | Read `localStorage` only inside `useEffect`, never during render; initialize state as empty array |
| `localStorage` throws in private browsing | Wrap all reads/writes in try/catch; fall back to session-scoped cookie or in-memory array |
| Widget shows out-of-stock or deleted products | Filter server response to only include `published: true` products; never trust stored IDs to reflect current catalog state |
| Duplicate product appears at multiple positions | Before prepending, filter out the existing entry for that product ID |
| Widget causes layout shift on load | Reserve the widget's height with a min-height skeleton while data loads, or position it below the fold |

## Related Skills

- @wishlist-save-for-later
- @product-page-design
- @product-comparison
- @storefront-theming
