# Live Shopping Event Platform Backend

## Problem/Feature Description

A fashion retailer wants to launch weekly live shopping events where hosts showcase new collections in real time. Viewers watch the live stream and see featured products highlighted on screen the moment the host calls them out — with one click to add to cart. The business expects 2,000–5,000 concurrent viewers per event and has had WebSocket infrastructure fall over in the past when serving at scale.

The engineering team needs a backend implementation plan and working code stubs for the live shopping system. They need guidance on the streaming infrastructure choices (they currently use Mux but are open to alternatives), how to fan out product featuring events to all viewers in real time, and how to ensure the system holds up under load. The team also wants documentation on event scheduling best practices to maximize attendance.

Your task is to write a TypeScript implementation of the live shopping backend, including the event creation flow, the host-side product featuring function, and the viewer-side WebSocket client component. Write an `architecture.md` document explaining the infrastructure choices you recommend, particularly for WebSocket scaling and live stream latency.

## Output Specification

- `live-shopping-backend.ts` — TypeScript implementation covering:
  - `createLiveShoppingEvent()` function
  - `featureProductInLive()` function
  - Data model interfaces for the live event
- `live-viewer-client.tsx` — React component for the viewer side receiving real-time product features
- `architecture.md` — Document covering streaming infrastructure choice, WebSocket scaling approach, latency recommendations, and event scheduling guidance
