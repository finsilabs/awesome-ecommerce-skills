# Live Flash Sale Timer Widget

## Problem/Feature Description

TrendBuy's product team wants to add urgency-building elements to their flash sale product pages. When a flash sale is active, users should see a live countdown showing how much time is left in the sale, along with a real-time units-remaining indicator. The previous implementation polled a REST endpoint every second — at peak traffic this caused significant load on the API layer and had noticeable clock drift between browser tabs opened at different times.

The team wants a server-push approach for the timer so that all clients receive consistent ticks directly from the server. The implementation should be tolerant of clients disconnecting (e.g., navigating away) and should clean itself up properly. The units-remaining display should create a sense of scarcity but should only show exact numbers when stock is genuinely low — it should not show a precise count for large remaining quantities.

## Output Specification

Produce the following files:

1. **`timerEndpoint.ts`** — A Node.js/Express route handler that streams sale timer updates to the client. The endpoint should send updates every second and include the time remaining, stock information, and sale status. It must handle client disconnection gracefully.
2. **`FlashSaleCountdown.tsx`** — A React component that connects to the timer endpoint and renders a formatted countdown display. The countdown format should be hours, minutes, and seconds. The component should also render a stock availability message that is conditional on how much stock remains.
3. **`DESIGN.md`** — A brief explanation of the streaming protocol used, how client-side time is calculated, and the rationale for the stock display behaviour.

You may assume a standard Express `app` object and a `db.flashSales.findById()` method are available. Use TypeScript throughout.
