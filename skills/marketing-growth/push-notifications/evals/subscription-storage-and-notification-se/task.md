# Server-Side Push Notification Handlers

## Problem/Feature Description

NorthShore Goods has the push subscription infrastructure in place and now needs the server-side logic to complete two critical notification flows. First, the team needs an endpoint to receive and persistently store browser push subscriptions from customers. Second, they need the back-end logic that fires notifications to subscribed customers when a product they are waiting on comes back into stock.

The store runs a PostgreSQL-backed database with tables for `pushSubscriptions`, `pushWaitlist`, and `products`. The back-end is a TypeScript/Node.js API using Express. A `webpush` instance has already been configured with VAPID keys elsewhere and is available as an import. Your code should be production-quality and handle real-world edge cases gracefully.

## Output Specification

Produce the following files:

1. `api/push-subscribe.ts` — The POST handler for `/api/push/subscribe` that saves a push subscription to the database. The handler should handle the case where a browser re-subscribes or the same user subscribes from multiple devices gracefully.

2. `api/notify-back-in-stock.ts` — The function `notifyBackInStock(productId: string)` that is triggered when a product's inventory transitions from 0 to greater than 0. It should look up the waitlisted subscribers and send each a push notification.

3. `api/notify-price-drop.ts` — The function `checkPriceWatches(productId: string, newPriceCents: number)` that fires notifications when a product's new price meets a customer's target price.

The files should use TypeScript and assume the `db` and `webpush` objects are available as imports. Include realistic pseudo-implementations of any db helper calls.
