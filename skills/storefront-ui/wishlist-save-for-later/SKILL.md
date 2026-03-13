---
name: wishlist-save-for-later
description: "Let shoppers save products to a wishlist, share it with friends, and get notified when saved items come back in stock or drop in price"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [wishlist, save-for-later, back-in-stock, sharing, favorites, alerts, cart]
triggers: ["wishlist", "save for later", "add to wishlist", "back in stock alert", "favorite products", "share wishlist"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Wishlist / Save for Later

## Overview

Implement persistent wishlists that survive browser sessions for both authenticated and guest users. Includes shareable wishlist links, back-in-stock email alerts for out-of-stock wishlist items, and move-to-cart flows. Guest wishlists stored in `localStorage` are merged with the server-side list on login.

## When to Use This Skill

- When shoppers want to save items for future purchase but are not ready to buy
- When building a feature to reduce cart abandonment by offering "save for later" on cart items
- When implementing back-in-stock notifications for high-demand products
- When the brand's social/sharing strategy should include wishlist sharing

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right approach

| Platform | Recommended Approach | Why |
|----------|---------------------|-----|
| **Shopify** | Install **Wishlist Plus** (free tier) or **Growave** (from $9/mo, includes wishlist + loyalty + reviews) | Wishlist Plus is the most installed wishlist app on Shopify — adds heart buttons to product and collection pages, persistent wishlists for logged-in users, guest wishlist via browser storage, and a shareable wishlist page |
| **WooCommerce** | Install **YITH WooCommerce Wishlist** (free) — the most widely used WooCommerce wishlist plugin | YITH Wishlist adds an "Add to Wishlist" button to product pages, creates a shareable wishlist page for each customer, handles guest wishlists via session, and includes "move to cart" functionality |
| **BigCommerce** | Enable the built-in **Wishlists** feature in **Account → Wishlists** — it's native to the platform; extend with **Wishlist Plus** app if needed | BigCommerce includes server-side wishlists for registered customers built in; guests need a third-party app or custom solution |
| **Custom / Headless** | Build with localStorage for guest users + server-side storage for authenticated users; merge on login | Full control over data model, sharing, and back-in-stock notifications; see implementation below |

### Step 2: Set up wishlists on your platform

---

#### Shopify

**Wishlist Plus (recommended — free tier available):**
1. Install **Wishlist Plus** from the Shopify App Store
2. In the app dashboard:
   - Set **Guest wishlist**: Enabled (uses browser storage for logged-out users)
   - Set **Auto-merge**: Enabled (merges guest wishlist into account wishlist on login)
   - Configure the heart button position: **Above add to cart**, **Below add to cart**, or **On product image**
3. The app automatically adds a heart/wishlist button to all product pages and collection cards
4. Configure **Wishlist page** URL (default: `/pages/wishlist`) in the app settings
5. Enable **Email reminders**: sends a reminder email when wishlist items go on sale or come back in stock
6. Add the wishlist link to your navigation:
   - Go to **Online Store → Navigation → Main menu**
   - Add a link pointing to `/pages/wishlist`

**Back-in-stock alerts:**
- Wishlist Plus sends automatic back-in-stock emails when inventory is restored
- Configure the email template and timing in **Wishlist Plus → Email Settings**

---

#### WooCommerce

**YITH WooCommerce Wishlist (free):**
1. Install and activate from WordPress.org
2. Go to **YITH → Wishlist → Settings → General**:
   - Set **Wishlist page**: create a new page with the `[yith_wcwl_wishlist]` shortcode, then select it
   - Enable **Share wishlist**: lets customers share a public URL to their wishlist
   - Enable **Move to cart**: shows a "Move to Cart" button on the wishlist page
   - Configure **Add to Wishlist button** position: under Add to Cart, or via shortcode/widget
3. Under **YITH → Wishlist → Settings → Guest Users**:
   - Enable **Allow guests to use wishlist**: stores in session/cookie
   - Set **Redirect after login**: redirect to wishlist page so guest list merges automatically
4. The plugin creates a customer-specific wishlist page at `/wishlist/?token=[user-token]` for sharing

**Back-in-stock with YITH:**
- Install the companion plugin **YITH WooCommerce Back In Stock Notifications** (free)
- When a wishlist item goes out of stock, customers see an "Email me when available" option
- Configure the notification email template in the plugin settings

---

#### BigCommerce

**Built-in Wishlists:**
1. Wishlists are available to logged-in customers in their **Account → Wishlists** section
2. Customers can create multiple named wishlists (Birthday, Home, etc.)
3. To add "Add to Wishlist" buttons to product pages in Cornerstone:
   - Go to **Storefront → My Themes → Customize**
   - In **Product Page**, enable the **Add to Wishlist** button if not already visible
4. Shared wishlists: customers can set individual wishlists to Public in their account and share the URL

**For guest wishlists:** BigCommerce's built-in wishlist requires login. Install **Wishlist Plus** from the BigCommerce App Marketplace for guest wishlist support.

---

#### Custom / Headless

**localStorage guest wishlist:**
```javascript
// lib/wishlistStore.js
const KEY = 'guest_wishlist';

export function getGuestWishlist() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}

export function toggleGuestWishlist(item) {
  const items = getGuestWishlist();
  const exists = items.some(i => i.variantId === item.variantId);
  const updated = exists
    ? items.filter(i => i.variantId !== item.variantId)
    : [...items, { ...item, addedAt: Date.now() }];
  try { localStorage.setItem(KEY, JSON.stringify(updated)); } catch {}
  return updated;
}
```

**Merge guest wishlist on login:**
```javascript
export async function mergeGuestWishlistOnLogin() {
  const guestItems = getGuestWishlist();
  if (guestItems.length === 0) return;
  await fetch('/api/wishlist/merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: guestItems }),
  });
  localStorage.removeItem('guest_wishlist');
}

// Server: POST /api/wishlist/merge
// Insert only items not already in the user's server wishlist
```

**Heart button component:**
```jsx
function WishlistButton({ product, variant }) {
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(variant.id);
  return (
    <button
      onClick={() => toggle({ productId: product.id, variantId: variant.id })}
      aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      aria-pressed={wishlisted}
      className={`wishlist-btn ${wishlisted ? 'active' : ''}`}>
      <svg aria-hidden="true" viewBox="0 0 24 24"
        fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
```

**Back-in-stock notification trigger (run on inventory webhook or cron):**
```javascript
async function notifyBackInStock(variantId) {
  const subscribers = await db.backInStockSubscriptions.findMany({
    where: { variantId, notifiedAt: null },
  });
  for (const sub of subscribers) {
    await emailService.send({
      to: sub.email,
      template: 'back-in-stock',
      data: { productName: sub.productName, productUrl: sub.productUrl },
    });
    await db.backInStockSubscriptions.update({
      where: { id: sub.id }, data: { notifiedAt: new Date() },
    });
  }
}
```

## Best Practices

- **Optimistic UI for toggle** — update the heart icon immediately on click; revert on API error to avoid perceived sluggishness
- **Merge guest wishlists on login** — nothing frustrates shoppers more than losing saved items after signing in
- **Rate-limit back-in-stock emails** — send at most one notification per subscriber per variant per restock event
- **Show wishlist count in the header** — a small badge count reinforces engagement
- **Allow move-to-cart from wishlist** — provide a "Move to Cart" button that adds the item and removes it from the wishlist atomically
- **Expire guest wishlists** — clear `localStorage` entries older than 90 days to avoid showing discontinued products

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Guest wishlist lost on login | Implement the merge flow immediately after authentication; trigger it in the post-login redirect |
| Back-in-stock email sends multiple times | Mark `notifiedAt` on the subscription record after sending; only notify subscribers where `notifiedAt IS NULL` |
| Wishlist heart causes full-page re-render | Manage wishlist state at a context level (React Context or Zustand) so only the heart button re-renders |
| Share link exposes private data | Render only product name, image, and price on shared wishlists — never addresses, notes, or account info |
| localStorage blocked in private browsing | Wrap all reads/writes in try/catch; fall back to in-memory storage for the current session |

## Related Skills

- @recently-viewed-products
- @product-page-design
- @cart-abandonment-recovery
- @accessibility-commerce
