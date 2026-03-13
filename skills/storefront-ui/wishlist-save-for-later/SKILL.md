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
platforms: [platform-agnostic]
difficulty: intermediate
---

# Wishlist / Save for Later

## Overview

Implement persistent wishlists that survive browser sessions for both authenticated and guest users. Includes shareable wishlist links, back-in-stock email alerts for out-of-stock wishlist items, and move-to-cart flows. Guest wishlists are stored in `localStorage` and merged with the server-side list on login.

## When to Use This Skill

- When shoppers want to save items for future purchase but are not ready to buy
- When building a feature to reduce cart abandonment by offering "save for later" on cart items
- When implementing back-in-stock notifications for high-demand products
- When the brand's social/sharing strategy should include wishlist sharing
- When migrating a Shopify store's wishlist app to a custom headless implementation

## Core Instructions

1. **Design the wishlist data model**

   ```javascript
   // Wishlist schema (database)
   // wishlists table
   {
     id: 'wl_abc123',
     user_id: 'usr_xyz',         // null for guest (token-based)
     guest_token: 'gt_randomid', // used when user_id is null
     name: 'Summer Wish List',
     is_public: true,
     share_slug: 'summer-2026-abc', // for public sharing URL
     created_at: Date,
     updated_at: Date,
   }

   // wishlist_items table
   {
     id: 'wli_123',
     wishlist_id: 'wl_abc123',
     product_id: 'prod_001',
     variant_id: 'var_blue_M',
     quantity: 1,
     added_at: Date,
     notify_back_in_stock: true,
   }
   ```

2. **Implement client-side wishlist state with localStorage guest fallback**

   ```javascript
   // lib/wishlistStore.js
   const GUEST_WISHLIST_KEY = 'guest_wishlist';

   export function getGuestWishlist() {
     try {
       return JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) ?? '[]');
     } catch {
       return [];
     }
   }

   export function saveGuestWishlist(items) {
     localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
   }

   export function addToGuestWishlist(item) {
     const items = getGuestWishlist();
     const exists = items.some(i => i.variantId === item.variantId);
     if (!exists) {
       saveGuestWishlist([...items, { ...item, addedAt: Date.now() }]);
     }
   }

   export function removeFromGuestWishlist(variantId) {
     const items = getGuestWishlist().filter(i => i.variantId !== variantId);
     saveGuestWishlist(items);
   }
   ```

3. **Build the useWishlist React hook**

   ```javascript
   // hooks/useWishlist.js
   import { useState, useEffect, useCallback } from 'react';
   import { getGuestWishlist, addToGuestWishlist, removeFromGuestWishlist } from '../lib/wishlistStore';

   export function useWishlist({ userId } = {}) {
     const [items, setItems] = useState([]);
     const [loading, setLoading] = useState(false);

     useEffect(() => {
       if (userId) {
         fetchServerWishlist();
       } else {
         setItems(getGuestWishlist());
       }
     }, [userId]);

     async function fetchServerWishlist() {
       const res = await fetch('/api/wishlist');
       const data = await res.json();
       setItems(data.items);
     }

     const toggle = useCallback(async (item) => {
       const isInWishlist = items.some(i => i.variantId === item.variantId);

       if (userId) {
         // Server-side for authenticated users
         if (isInWishlist) {
           await fetch(`/api/wishlist/items/${item.variantId}`, { method: 'DELETE' });
           setItems(prev => prev.filter(i => i.variantId !== item.variantId));
         } else {
           const res = await fetch('/api/wishlist/items', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(item),
           });
           const saved = await res.json();
           setItems(prev => [...prev, saved]);
         }
       } else {
         // Guest — localStorage
         if (isInWishlist) {
           removeFromGuestWishlist(item.variantId);
           setItems(prev => prev.filter(i => i.variantId !== item.variantId));
         } else {
           addToGuestWishlist(item);
           setItems(prev => [...prev, item]);
         }
       }
     }, [items, userId]);

     const isWishlisted = useCallback((variantId) =>
       items.some(i => i.variantId === variantId), [items]);

     return { items, loading, toggle, isWishlisted };
   }
   ```

4. **Merge guest wishlist on login**

   After authentication, merge the guest localStorage wishlist into the user's server-side list.

   ```javascript
   // lib/mergeWishlist.js
   import { getGuestWishlist, saveGuestWishlist } from './wishlistStore';

   export async function mergeGuestWishlistOnLogin() {
     const guestItems = getGuestWishlist();
     if (guestItems.length === 0) return;

     await fetch('/api/wishlist/merge', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ items: guestItems }),
     });

     // Clear guest wishlist after successful merge
     saveGuestWishlist([]);
   }

   // Server endpoint: POST /api/wishlist/merge
   export async function mergeWishlistHandler(req, res) {
     const { items } = req.body;
     const userId = req.session.userId;

     // Get existing server wishlist
     const existing = await db.wishlistItems.findMany({ where: { wishlist: { userId } } });
     const existingVariantIds = new Set(existing.map(i => i.variantId));

     // Add only items not already in the wishlist
     const newItems = items.filter(i => !existingVariantIds.has(i.variantId));
     if (newItems.length > 0) {
       await db.wishlistItems.createMany({
         data: newItems.map(item => ({ ...item, wishlistId: req.session.wishlistId })),
       });
     }

     res.json({ merged: newItems.length });
   }
   ```

5. **Implement back-in-stock alerts**

   When a user wishlists an out-of-stock variant, allow them to opt in to email notification.

   ```javascript
   // api/wishlist/items/[variantId]/notify.js
   export async function subscribeBackInStock(req, res) {
     const { variantId } = req.params;
     const { email } = req.body; // required for guests

     await db.backInStockSubscriptions.upsert({
       where: { variantId_email: { variantId, email: email ?? req.session.userEmail } },
       create: {
         variantId,
         email: email ?? req.session.userEmail,
         subscribedAt: new Date(),
       },
       update: { subscribedAt: new Date() },
     });

     res.json({ subscribed: true });
   }

   // Triggered by inventory webhook or cron job
   export async function notifyBackInStock(variantId) {
     const subscribers = await db.backInStockSubscriptions.findMany({
       where: { variantId, notifiedAt: null },
       include: { variant: { include: { product: true } } },
     });

     for (const sub of subscribers) {
       await emailService.send({
         to: sub.email,
         template: 'back-in-stock',
         data: {
           productName: sub.variant.product.name,
           variantName: sub.variant.name,
           productUrl: sub.variant.product.url,
         },
       });
       await db.backInStockSubscriptions.update({
         where: { id: sub.id },
         data: { notifiedAt: new Date() },
       });
     }
   }
   ```

## Examples

### Shareable wishlist URL

Generate a public share link and render a read-only wishlist page:

```javascript
// Generate a share slug on wishlist creation or when sharing is enabled
import { nanoid } from 'nanoid';

async function enableSharing(wishlistId) {
  const slug = nanoid(10); // e.g., 'K8-aBcDeFg'
  await db.wishlists.update({
    where: { id: wishlistId },
    data: { isPublic: true, shareSlug: slug },
  });
  return `https://yourstore.com/wishlist/shared/${slug}`;
}
```

### Heart button component

```jsx
function WishlistButton({ product, variant }) {
  const { userId } = useAuth();
  const { toggle, isWishlisted } = useWishlist({ userId });
  const wishlisted = isWishlisted(variant.id);

  return (
    <button
      onClick={() => toggle({ productId: product.id, variantId: variant.id })}
      aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      aria-pressed={wishlisted}
      className={`wishlist-btn ${wishlisted ? 'active' : ''}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
```

## Best Practices

- **Optimistic UI for toggle** — update the heart icon immediately on click; revert on API error to avoid perceived sluggishness
- **Merge guest wishlists on login** — nothing frustrates shoppers more than losing saved items after signing in
- **Rate-limit back-in-stock emails** — send at most one notification per subscriber per variant per 24 hours to avoid spam
- **Support multiple named wishlists** — power users create wishlists for different occasions (Birthday, Home, Travel); the data model should support it
- **Show wishlist count in header** — a small badge count on the wishlist nav icon reinforces engagement
- **Allow move-to-cart from wishlist** — a "Move to Cart" button should call `addToCart` then `removeFromWishlist` atomically
- **Expire guest wishlists** — clear `localStorage` entries older than 90 days to avoid stale product data

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Guest wishlist lost on login | Implement the merge flow immediately after authentication; do not rely on session cookies alone |
| Back-in-stock email sends for every restock, not just first | Mark `notifiedAt` on the subscription record after sending; only notify subscribers where `notifiedAt IS NULL` |
| Wishlist heart button causes full-page re-render | Manage wishlist state at a context level with a reducer; use React Context or Zustand so only the heart button re-renders |
| Share link exposes private data | Render only product name, image, and price on shared wishlists — never addresses, notes, or user info |
| localStorage blocked in private browsing | Wrap `localStorage` access in try/catch; fall back to in-memory storage for the session |

## Related Skills

- @cart-logic
- @recently-viewed-products
- @product-page-design
- @accessibility-commerce
