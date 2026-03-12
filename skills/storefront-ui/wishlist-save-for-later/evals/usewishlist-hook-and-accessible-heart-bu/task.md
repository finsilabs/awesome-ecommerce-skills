# Wishlist Toggle Hook and Heart Button Component

## Problem/Feature Description

A fashion retailer's engineering team is building their new React storefront. The previous site had a wishlist button that was notoriously slow — clicking the heart icon would freeze the page for a moment because the state was stored in a monolithic top-level component. Shoppers complained and the conversion team's A/B tests showed that fixing the responsiveness would significantly lift engagement.

The new implementation needs a `useWishlist` React hook and a `WishlistButton` component. The hook must seamlessly handle both authenticated users (persisting to the backend) and unauthenticated guests (local browser storage), with the UI feeling instant regardless of network latency. The button must also meet accessibility standards because the retailer serves a diverse audience including screen reader users.

The team has agreed that wishlist state should live at the application level (not inside individual product cards) so that the heart icon on a product in a list view and the same product's detail page stay in sync without prop-drilling. They want to see this architectural choice reflected in the code.

## Output Specification

Produce the following files:

- `hooks/useWishlist.js` — The React hook for wishlist state management
- `components/WishlistButton.jsx` — The heart toggle button component
- `context/WishlistContext.jsx` (or `store/wishlistStore.js` if using Zustand) — The application-level wishlist state provider or store
- `README.md` — A short explanation (3–5 sentences) of how to integrate the WishlistButton into a product card and how to wrap the app with the provider/store

Assume that `lib/wishlistStore.js` (with `getGuestWishlist`, `addToGuestWishlist`, `removeFromGuestWishlist`) already exists and can be imported.

## Input Files

The following file is provided as an input. Extract it before beginning.

=============== FILE: lib/wishlistStore.js ===============
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
