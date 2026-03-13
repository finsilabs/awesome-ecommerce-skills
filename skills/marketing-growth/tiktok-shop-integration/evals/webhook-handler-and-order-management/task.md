# TikTok Shop Webhook Handler

## Problem/Feature Description

NovaSport is a sports equipment retailer that recently launched TikTok Shop. Their backend runs on Node.js/Express, and the team needs to receive and process real-time events from TikTok Shop — including order updates, product approval notifications, and payment settlements — so the platform keeps its internal order management system (OMS) up to date without polling the TikTok API.

The backend engineer has been asked to build the webhook endpoint. The ops team was burned previously by a third-party integration that accepted spoofed callbacks, so security is a priority: the endpoint must reject any request that cannot be verified as genuinely coming from TikTok. The team also wants to make sure that TikTok's delivery system doesn't interpret successful processing as an error and keep retrying events.

When an order status changes, the handler should fetch the full order detail from TikTok and store it in the OMS. The OMS's `db.orders.upsert` function accepts a lookup key as the first argument and the data to write as the second; the team wants a consistent strategy for identifying TikTok orders so there are no duplicates even if the same event fires twice.

## Output Specification

Produce a TypeScript file `tiktok-webhook-handler.ts` containing an Express route handler function `handleTikTokShopWebhook` that:

1. Validates incoming webhook requests
2. Routes each event type to an appropriate handler
3. Responds correctly to TikTok's delivery system

Also produce a short `WEBHOOK_SETUP.md` that describes the steps needed to configure the webhook in TikTok Seller Center, including any requirements for the endpoint URL itself.

Stub out any external dependencies (database, tiktokShopRequest) with comments indicating what they would do — the grader only needs to assess the handler's structure and logic, not run it.
