# Recently Viewed Widget and Product Lookup Endpoint

## Problem/Feature Description

A fashion retailer's engineering team is building a "You recently viewed" feature to reduce bounce rates on product detail pages. They need two pieces: a React component that renders a row of recently viewed product cards, and a server-side API endpoint that the component calls to retrieve up-to-date product information.

The widget will appear on every product detail page, so it must not interfere with the rest of the page — if the network call fails or no history exists, the page should render exactly as if the widget was never there. The team is also worried about showing items that have since gone out of stock or been removed from the catalog, so the API must guarantee only live products are returned. The widget should also appear in the cart drawer as a subtle upsell, but only when the cart is relatively empty.

## Output Specification

Produce the following files:

1. `components/RecentlyViewedWidget.jsx` — A React component that accepts `excludeId` and `maxItems` props. It should read stored history, fetch fresh product data, and render a grid of product cards. Assume a helper `getRecentlyViewedIds(excludeId)` is importable from `../lib/recentlyViewed`.

2. `api/products/by-ids.js` — A server-side handler function `getProductsByIds(req, res)` for a POST endpoint that receives an `ids` array in the request body and returns matching products. Assume a `db.products.findMany(...)` ORM call is available.

3. `components/CartDrawer.jsx` — A React component that accepts a `cartItems` prop and renders the cart contents, conditionally showing the recently viewed widget.

You do not need to implement `lib/recentlyViewed.js` — assume it exists and exports `getRecentlyViewedIds`. Do not wire up routing or a full server; just produce the component and handler files.
