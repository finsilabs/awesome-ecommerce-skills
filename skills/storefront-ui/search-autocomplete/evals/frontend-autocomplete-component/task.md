# Storefront Search Autocomplete Component

## Problem/Feature Description

The UX team at a mid-market fashion retailer has identified that shoppers frequently abandon the site when they can't quickly find products. Exit surveys show that the site's static search bar is a major pain point — shoppers start typing and nothing happens until they hit Enter. Competitors all offer live suggestions as you type, and internal data shows a 23% drop in search-to-purchase conversion compared to industry benchmarks.

The team wants a React search autocomplete component that shows product and category suggestions as the shopper types. The backend API already exists at `/api/search/autocomplete` and accepts a `q` query parameter and `limit` parameter, returning JSON shaped as `{ products: [...], categories: [...], suggestions: [...] }`. Each product has `objectID`, `name`, `image`, `price`, `url`, and a `_highlightResult.name.value` field containing server-rendered HTML with matched substrings already tagged. Each category has `name`, `url`, and `product_count`.

Your job is to build the frontend: a custom React hook and a dropdown UI component. The component should be accessible and handle edge cases gracefully. Consider the experience both for mouse users and for power users navigating entirely by keyboard.

## Output Specification

Produce the following files:
- `useSearchAutocomplete.js` — custom React hook encapsulating all data fetching and state
- `SearchAutocomplete.jsx` — the rendered component using the hook
- `SearchAutocomplete.css` — basic styles for the dropdown (positioning, z-index, active states)

The component should work standalone: a developer should be able to drop it into any React app and see it work against the `/api/search/autocomplete` endpoint.
