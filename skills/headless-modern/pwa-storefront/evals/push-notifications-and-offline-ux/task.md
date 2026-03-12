# Order Update Push Notifications and Offline Browsing

## Problem/Feature Description

HomeFinds, a home goods retailer, wants to improve post-purchase engagement. Their data shows that customers who receive order status updates are significantly more likely to leave reviews and make repeat purchases. The team also wants to ensure that customers who lose their internet connection mid-browse can still see recently viewed products rather than hitting a dead end. They're building a Next.js storefront and need to add push notification support for order status changes, plus a polished offline experience.

The engineering team needs: a server-side API route that sends a push notification when an order status changes, a client-side subscription flow that requests permission at the right moment, and a service worker that handles displaying the notification and navigating to the right page when clicked. They also need the offline fallback page to show recently viewed products from local storage. The team is aware of iOS limitations and wants documentation on what customers will and won't experience on iOS devices.

A developer noted they once lost all push subscriptions during a server migration — the new implementation needs to address this risk explicitly.

## Output Specification

Produce the following files:

- `app/api/push/send/route.ts` — Next.js API route that accepts an order object and customer ID, and sends a push notification to all their subscribed devices
- `lib/push-client.ts` — client-side code for subscribing to push notifications, including the subscription endpoint call
- `public/sw-push.js` — service worker event handlers for push events and notification clicks
- `app/offline/page.tsx` — the offline fallback page component showing recently viewed products from IndexedDB
- `hooks/use-online-status.ts` — a React hook for tracking network connectivity
- `PUSH_SETUP.md` — documentation covering VAPID key generation, storage recommendations, iOS limitations, and when to prompt users for permission

The output should be complete, working TypeScript/JavaScript code.
