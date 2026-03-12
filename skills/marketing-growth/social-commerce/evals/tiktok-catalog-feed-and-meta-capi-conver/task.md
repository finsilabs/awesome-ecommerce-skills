# TikTok Shop Catalog Feed and Server-Side Purchase Tracking

## Problem/Feature Description

BrewGear is a DTC coffee accessories brand that sells premium espresso equipment and merchandise. They've had strong Instagram traction but their marketing team wants to test TikTok Shop to reach a younger demographic. Simultaneously, their head of data noticed that their Facebook Pixel is missing a significant portion of purchase events — the data shows only about 65% of known orders appearing in Meta Events Manager, which is causing their ad optimization to underperform.

The team needs two things delivered at once: a working TikTok catalog feed endpoint for their product catalog, and a server-side purchase event system that reliably captures every conversion from their checkout flow to Meta. The two workstreams can share some infrastructure but should be implemented as separate, clean TypeScript modules. The team uses Node.js/Express and their product database stores prices in cents.

## Output Specification

Produce the following files:

- `src/catalog/tiktok-feed.ts` — exports `generateTikTokCatalogFeed(req, res)` — an Express handler that generates a TikTok-compatible catalog feed. Use inline product stubs (at least 2 products with 2 variants each) — no real database required.
- `src/tracking/meta-capi.ts` — exports `sendMetaPurchaseEvent(order)` — a function that sends a purchase conversion event to Meta via the server-side Conversions API
- `INTEGRATION_GUIDE.md` — a short document explaining: the TikTok feed format requirements (field names, description limits), why server-side tracking is needed alongside browser tracking, how event deduplication works, and any TikTok Shop prerequisites the team should be aware of before going live

The `order` parameter for `sendMetaPurchaseEvent` can be typed as:
```typescript
interface Order {
  id: string;
  customerEmail: string;
  customerPhone: string;
  customerFirstName: string;
  customerLastName: string;
  totalValue: number;
  lineItems: Array<{ sku: string; quantity: number }>;
}
```
