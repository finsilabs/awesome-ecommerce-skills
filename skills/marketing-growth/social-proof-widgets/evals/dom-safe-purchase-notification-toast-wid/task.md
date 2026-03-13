# Purchase Notification Toast Widget for a Storefront

## Problem/Feature Description

A mid-size e-commerce brand wants to add real-time purchase notification toasts to their product pages — small pop-ups showing messages like "Alex from Portland just bought this in Blue / Large". They want these built in-house rather than relying on a paid SaaS tool, and they have a working backend endpoint already deployed at `/api/products/:id/social-proof` that returns a `recentPurchases` array (each entry has `firstName`, `location`, `variantTitle`, and `timeAgo`).

The site already injects a `data-product-id` attribute on a DOM element on product pages to identify which product is being viewed. The engineering team is concerned about security and user experience: the widget must handle customer-supplied data safely, and the notification cadence should not feel spammy. The widget should only appear on product pages, not on the cart or checkout.

## Output Specification

Produce a self-contained TypeScript file `toast-widget.ts` that implements the purchase notification toast widget as a class. The class should:
- Fetch notifications from the social proof endpoint
- Display toasts one at a time from a queue
- Handle dismissal and automatic cycling

Also produce a short `widget-notes.md` documenting:
- How many toasts are shown per session before stopping
- The timing between consecutive toasts (in milliseconds or seconds)
- How long each individual toast remains visible before auto-dismissing
- How the widget avoids XSS when rendering customer names and locations
