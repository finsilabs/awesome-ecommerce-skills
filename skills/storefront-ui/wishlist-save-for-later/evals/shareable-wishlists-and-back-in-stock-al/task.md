# Wishlist Sharing and Back-in-Stock Notification System

## Problem/Feature Description

An outdoor gear retailer is launching a gift season campaign where shoppers can share wishlists with friends and family. Simultaneously, several high-demand items regularly go out of stock, and the merchandising team wants to re-engage customers as soon as inventory is replenished. They need both features designed cohesively so the database schema and API layer can support them long-term.

Your task is to design and implement the database schema, the API endpoints for enabling wishlist sharing and subscribing to back-in-stock alerts, and the notification dispatch function that fires when inventory is restocked. The solution should be production-ready: shareable links must be unguessable, shared wishlist pages should protect customer privacy, and the notification system must not spam subscribers with repeated emails for the same restock event.

## Output Specification

Produce the following files:

- `schema.sql` (or `schema.prisma` if using Prisma) — The complete database schema for the wishlist system, including all relevant tables and fields
- `api/wishlist/share.js` — Endpoint to generate/enable a public sharing link for a wishlist
- `api/wishlist/shared/[slug].js` — Endpoint (or page handler) that returns the data needed to render a shared wishlist; include a comment listing which fields are returned and which are intentionally excluded
- `api/back-in-stock/subscribe.js` — Endpoint for a user or guest to subscribe to back-in-stock notifications for a specific product variant
- `api/back-in-stock/notify.js` — Function/handler triggered when a variant comes back in stock; sends emails to eligible subscribers
- `DESIGN.md` — A brief design doc (bullet points are fine) explaining the sharing URL strategy, how duplicate subscriptions are prevented, and how the notification system avoids sending redundant emails

The files should use realistic placeholder calls (e.g. `db.wishlists.update(...)`, `emailService.send(...)`) where actual database and email infrastructure would be wired in.
