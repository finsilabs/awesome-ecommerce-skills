# Storefront Wishlist API Endpoints

## Problem/Feature Description

A fashion retailer running Medusa wants to add a wishlist feature to their Next.js storefront. Shoppers should be able to save products they're interested in and come back to purchase them later. The feature needs to be customer-specific — each logged-in shopper has their own private wishlist — and the storefront will call the Medusa backend directly to manage it.

The backend team has already built and registered a `WishlistModuleService` (registered under the key `'wishlistModuleService'`) that exposes the following methods:
- `addItem(customerId: string, variantId: string): Promise<WishlistItem>`
- `removeItem(customerId: string, variantId: string): Promise<void>`
- `listItems(customerId: string): Promise<WishlistItem[]>`

Your job is to expose these through Medusa's custom route system so the storefront can interact with them. The storefront team expects the following HTTP interface:

- `GET /store/wishlist` — return the current customer's wishlist items
- `POST /store/wishlist` — add an item; request body contains `variant_id` (string, required)
- `DELETE /store/wishlist/:variant_id` — remove an item

All three endpoints require the customer to be authenticated. The POST endpoint must validate the request body before calling the service.

## Output Specification

Produce the route handler file(s) under the appropriate `src/api/` path(s). The file layout should reflect the URL structure. Include a brief `IMPLEMENTATION.md` that describes each endpoint's file path, its URL, and how authentication is handled.
