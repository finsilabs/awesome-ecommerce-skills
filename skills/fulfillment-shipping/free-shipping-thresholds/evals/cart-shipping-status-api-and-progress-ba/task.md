# Cart Shipping Progress Feature

## Problem Description

Velox Shop's data team has found that customers who can see how close they are to earning free shipping add significantly more items to their cart before checking out. The product team wants to add a real-time shipping progress indicator to the storefront — both on the main cart page and in the slide-out mini-cart drawer — so customers always know how much more they need to spend.

The feature must reflect the current cart state immediately whenever items are added or removed; stale progress information that lingers after a cart change has been identified as a conversion killer in prior A/B tests.

You have been asked to build two things:

1. **A backend route** that the frontend can call to get the current shipping status for the active cart session.
2. **A frontend React component** that consumes the response and renders the progress indicator in three distinct visual states: no free shipping available, partway to the threshold, and threshold reached.

The designer has provided the following UI copy requirements:
- When the threshold has been reached: communicate that free shipping has been unlocked.
- When still working toward the threshold: tell the customer how much more they need to add, with the currency amount prominently displayed.
- When free shipping is not offered at all for this customer/zone combination: show nothing.

The designer also wants the progress bar fill to animate smoothly as the percentage changes.

## Output Specification

Produce the following files:

- `server/routes/cart.ts` (or `.js`) — the backend route handler for the shipping status endpoint. Assume helper functions `getCart(sessionId)`, `getCustomerSegments(userId)`, `inferZoneFromIP(ip)`, and `resolveShippingRule(subtotal, zone, segments)` already exist and can be imported; stub them if needed.
- `components/FreeShippingProgress.tsx` (or `.jsx`) — the React component that accepts a shipping status object and renders the progress bar.
- `components/FreeShippingProgress.css` — the stylesheet for the component.
- `INTEGRATION.md` — a short note (max 10 lines) describing where in the storefront this component should be rendered.
