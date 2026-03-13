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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: beginner
---

# Recently Viewed Products

## Overview

Track which products a shopper views and display them in a "Recently Viewed" widget on product pages, the cart, and the homepage. Uses browser storage for within-session and cross-session history. Product data is always re-fetched from the server to avoid showing stale prices or out-of-stock items.

## When to Use This Skill

- When implementing a "Continue where you left off" experience for returning visitors
- When adding a "Recently Viewed" widget to product detail pages or the cart drawer
- When integrating with a personalization engine that requires client-side behavioral data
- When building a headless storefront and need lightweight browsing history without a backend dependency

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right approach

| Platform | Recommended Approach | Why |
|----------|---------------------|-----|
| **Shopify** | Enable the built-in **Recently Viewed** section in your OS2.0 theme, or install **Also Bought • Related products** / **LimeSpot Personalizer** | Dawn and most OS2.0 themes include a native Recently Viewed section; LimeSpot ($15/mo) adds AI-powered personalization including recently viewed across sessions |
| **WooCommerce** | Use WooCommerce's built-in **Recently Viewed Products** widget or shortcode, or install **YITH WooCommerce Frequently Bought Together** | WooCommerce includes a recently viewed widget out of the box; place it via **Appearance → Widgets** or with the `[recent_products]` shortcode |
| **BigCommerce** | Use the **Recently Viewed** widget in the BigCommerce Page Builder or enable it in the Cornerstone theme settings | Cornerstone and BigCommerce Page Builder both include a native Recently Viewed widget that uses browser cookies automatically |
| **Custom / Headless** | Implement `localStorage`-based view tracking with a server-side batch endpoint to fetch fresh product data | Client-side storage means no server state needed; re-fetching data on display ensures prices and stock are current |

### Step 2: Enable Recently Viewed on your platform

---

#### Shopify

**Using a built-in section (OS2.0 themes — Dawn, Sense, Craft):**
1. Go to **Online Store → Themes → Customize**
2. Navigate to a product page template
3. Click **Add section** and search for "Recently Viewed" — it appears as **Recently viewed products** in the section list
4. Configure it:
   - Set **Maximum products to show** (4–8 recommended)
   - Set the section heading text ("Recently Viewed", "Your Browsing History", etc.)
   - Set product card style: show price, show rating, etc.
5. The section uses JavaScript and browser storage (localStorage) automatically — no additional configuration needed

**For the homepage:**
1. Go to your homepage template
2. Add a **Recently viewed products** section in the same way
3. This section will only render content for returning visitors who have previously browsed products

**LimeSpot Personalizer (cross-device, AI-powered):**
1. Install from the Shopify App Store
2. LimeSpot tracks views server-side (not just in the browser) so recently viewed persists across devices and browsers
3. Configure the Recently Viewed widget placement in the LimeSpot dashboard — it can appear on any page via app blocks

---

#### WooCommerce

**Built-in Recently Viewed widget:**
1. Go to **Appearance → Widgets**
2. Find the **WooCommerce Recently Viewed Products** widget
3. Drag it to your **Shop Sidebar** or **Footer** widget area
4. Configure:
   - **Number of products to show**: 4–6 recommended
   - **Show title**: Yes/No
5. Alternatively, place the shortcode `[woocommerce_recently_viewed_products per_page="4"]` directly in a product page template, sidebar, or Gutenberg block

**For Classic Editor / Gutenberg:**
- In Gutenberg, add a **Shortcode** block and paste `[woocommerce_recently_viewed_products per_page="4"]`
- For Elementor: use the **Shortcode** widget to embed the same code

WooCommerce stores recently viewed product IDs in the visitor's session (PHP session / cookie) — no plugin required. The widget reads from this session automatically.

---

#### BigCommerce

**Built-in Recently Viewed widget (Cornerstone theme):**
1. Go to **Storefront → My Themes → Customize**
2. Navigate to a product page template
3. In the sidebar, find the **Recently Viewed** section and enable it (or adjust its position in the page layout)
4. Set the number of products to display
5. BigCommerce uses browser cookies to track recently viewed products — no app needed

**Page Builder approach:**
1. Go to **Storefront → Page Builder**
2. Open any page where you want the widget
3. Drag the **Recently Viewed Products** widget from the widget panel onto the page
4. Configure display settings in the widget panel on the right

---

#### Custom / Headless

**localStorage-based view tracking:**
```javascript
// lib/recentlyViewed.js
const STORAGE_KEY = 'rv_products';
const MAX_ITEMS = 12;
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function recordView(productId) {
  const items = getStoredItems();
  const filtered = items.filter(i => i.id !== productId); // remove existing entry
  const updated = [{ id: productId, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
}

export function getRecentlyViewedIds(excludeId = null) {
  const now = Date.now();
  return getStoredItems()
    .filter(i => now - i.viewedAt < TTL_MS && i.id !== excludeId)
    .map(i => i.id);
}

function getStoredItems() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
  catch { return []; }
}
```

**Record view on the product detail page:**
```jsx
// In ProductDetailPage.jsx — read localStorage only in useEffect to avoid SSR mismatch
import { useEffect } from 'react';
import { recordView } from '../lib/recentlyViewed';

export function ProductDetailPage({ product }) {
  useEffect(() => { recordView(product.id); }, [product.id]);
  return (
    <div>
      {/* product content */}
      <RecentlyViewedWidget excludeId={product.id} maxItems={4} />
    </div>
  );
}
```

**Widget component — re-fetches fresh product data from the server:**
```jsx
// RecentlyViewedWidget.jsx
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
        // Preserve the viewed order (API may return in any order)
        const map = new Map(data.products.map(p => [p.id, p]));
        setProducts(ids.map(id => map.get(id)).filter(Boolean));
      })
      .catch(() => {}); // Non-critical — fail silently
  }, [excludeId, maxItems]);

  if (products.length === 0) return null;

  return (
    <section aria-label="Recently viewed">
      <h2>Recently Viewed</h2>
      <div className="recently-viewed-grid">
        {products.map(product => (
          <article key={product.id}>
            <a href={product.url}>
              <img src={product.image} alt={product.name} loading="lazy" width="150" height="150" />
              <p>{product.name}</p>
              <p>${product.price}</p>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
```

**Batch product endpoint (Node.js):**
```javascript
// api/products/by-ids.js
export async function getProductsByIds(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 20)
    return res.status(400).json({ error: 'Invalid ids' });

  const products = await db.products.findMany({
    where: { id: { in: ids }, published: true },
    select: { id: true, name: true, price: true, image: true, url: true, inStock: true },
  });
  res.json({ products });
}
```

## Best Practices

- **Store only product IDs, not full product objects** — prices and availability change; always re-fetch from the server when rendering the widget
- **Exclude the current product** — pass `excludeId` to prevent showing the product the shopper is already viewing
- **Fail silently** — the recently viewed widget is non-critical; catch all errors and render nothing rather than breaking the page
- **Hydrate after mount** — in SSR frameworks, read from `localStorage` inside `useEffect` to avoid server/client mismatch
- **Respect privacy consent** — only write to storage after the user has accepted analytics cookies if your cookie policy requires it
- **Consider TTL expiry** — purge entries older than 30 days on read to avoid showing discontinued products

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Hydration mismatch in Next.js / SSR | Read `localStorage` only inside `useEffect`, never during render; initialize state as empty array |
| `localStorage` throws in private browsing | Wrap all reads/writes in try/catch; fall back to in-memory array for the current session |
| Widget shows out-of-stock or deleted products | Filter server response to only include `published: true` products; never trust stored IDs to reflect current catalog state |
| Duplicate product appears at multiple positions | Before prepending, filter out the existing entry for that product ID |
| Widget causes layout shift on load | Reserve the widget's height with a min-height skeleton while data loads, or position it below the fold |

## Related Skills

- @wishlist-save-for-later
- @product-page-design
- @product-comparison
- @storefront-theming
