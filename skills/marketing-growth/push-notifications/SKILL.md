---
name: push-notifications
description: "Send browser push notifications for price drops, back-in-stock alerts, and cart reminders to bring shoppers back without needing their email"
category: marketing-growth
risk: safe
source: curated
date_added: "2026-03-12"
tags: [push-notifications, web-push, pwa, vapid, service-worker, back-in-stock, price-drop, cart-reminder]
triggers: ["web push notifications", "push notifications", "browser push", "back in stock notification", "price drop alert", "push notification setup"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: beginner
---

# Push Notifications

## Overview

Web Push Notifications use the Push API and Service Workers to deliver timely, personalized messages to subscribers even when they are not on your site. For e-commerce, the highest-converting use cases are back-in-stock alerts, price drop notifications, and cart reminders. Push requires explicit browser permission, making opt-in rate the key metric to optimize.

## When to Use This Skill

- When adding back-in-stock notifications to replace static "notify me" email forms
- When recovering abandoned carts via a browser push channel alongside email
- When building a price-watch feature so customers are alerted when a wishlisted item drops in price
- When a Progressive Web App (PWA) requires native-like notification capability
- When email deliverability is poor and a supplemental channel is needed
- When targeting mobile-first markets where push permission rates exceed email opt-in rates

## Prerequisites & Platform Notes

**Shopify**: Most marketing features are handled by apps from the Shopify App Store (Klaviyo for email, Postscript for SMS, Stamped for reviews, etc.). Use the Shopify Admin API and webhooks to build custom integrations. Shopify's marketing_event API tracks campaign attribution.
**WooCommerce**: Install dedicated plugins (AutomateWoo, WooCommerce Points and Rewards, YITH plugins). Use WooCommerce hooks (woocommerce_order_status_completed, etc.) for custom automation.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A Shopify/WooCommerce store, push notification service (OneSignal, Klaviyo web push, or PushOwl), HTTPS storefront

## Core Instructions

1. **Generate VAPID keys and configure the server**

   VAPID (Voluntary Application Server Identification) authenticates your server with browser push services:

   ```bash
   npx web-push generate-vapid-keys
   # Output:
   # Public Key: BNxx...
   # Private Key: abcd...
   ```

   ```bash
   npm install web-push
   ```

   ```typescript
   import webpush from 'web-push';

   webpush.setVapidDetails(
     'mailto:admin@yourstore.com',
     process.env.VAPID_PUBLIC_KEY!,
     process.env.VAPID_PRIVATE_KEY!
   );
   ```

2. **Register a Service Worker and subscribe the browser**

   ```javascript
   // public/sw.js — service worker file
   self.addEventListener('push', (event) => {
     const data = event.data?.json() ?? {};
     event.waitUntil(
       self.registration.showNotification(data.title, {
         body: data.body,
         icon: data.icon ?? '/icons/icon-192.png',
         badge: '/icons/badge-72.png',
         image: data.image,
         data: { url: data.url },
         actions: data.actions ?? [],
       })
     );
   });

   self.addEventListener('notificationclick', (event) => {
     event.notification.close();
     const url = event.notification.data?.url ?? '/';
     event.waitUntil(clients.openWindow(url));
   });
   ```

   ```typescript
   // Client-side subscription
   async function subscribeToPush(): Promise<PushSubscription | null> {
     if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

     const registration = await navigator.serviceWorker.register('/sw.js');
     const permission = await Notification.requestPermission();
     if (permission !== 'granted') return null;

     const subscription = await registration.pushManager.subscribe({
       userVisibleOnly: true,
       applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
     });

     // Save subscription to server
     await fetch('/api/push/subscribe', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         subscription: subscription.toJSON(),
         userId: getCurrentUserId(),
       }),
     });

     return subscription;
   }

   function urlBase64ToUint8Array(base64String: string): Uint8Array {
     const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
     const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
     const raw = window.atob(base64);
     return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
   }
   ```

3. **Store subscriptions and handle back-in-stock triggers**

   ```typescript
   // POST /api/push/subscribe
   export async function savePushSubscription(req: Request, res: Response) {
     const { subscription, userId } = req.body;
     await db.pushSubscriptions.upsert(
       { userId, endpoint: subscription.endpoint },
       {
         userId,
         endpoint: subscription.endpoint,
         p256dh: subscription.keys.p256dh,
         auth: subscription.keys.auth,
         createdAt: new Date(),
       }
     );
     res.json({ ok: true });
   }

   // Triggered when inventory transitions from 0 to > 0
   async function notifyBackInStock(productId: string) {
     const product = await db.products.findById(productId);
     const waitlist = await db.pushWaitlist.findByProduct(productId);

     for (const entry of waitlist) {
       const sub = await db.pushSubscriptions.findByUserId(entry.userId);
       if (!sub) continue;

       try {
         await webpush.sendNotification(
           { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
           JSON.stringify({
             title: 'Back in stock!',
             body: `${product.name} is available again — grab it before it sells out`,
             icon: product.images[0]?.url,
             url: `${process.env.STORE_URL}/products/${product.slug}`,
             actions: [{ action: 'buy', title: 'Buy Now' }],
           })
         );
       } catch (err: any) {
         if (err.statusCode === 410) {
           // Subscription expired — remove it
           await db.pushSubscriptions.deleteByEndpoint(sub.endpoint);
         }
       }
     }
   }
   ```

4. **Build price drop notifications**

   Track price watches and notify when the threshold is crossed:

   ```typescript
   // POST /api/push/watch-price
   export async function watchPrice(req: Request, res: Response) {
     const { productId, targetPrice, userId } = req.body;
     await db.priceWatches.create({ productId, targetPrice, userId, active: true });
     res.json({ ok: true });
   }

   // Called from the product pricing update handler
   async function checkPriceWatches(productId: string, newPriceCents: number) {
     const watches = await db.priceWatches.findActive(productId, newPriceCents);

     for (const watch of watches) {
       if (newPriceCents <= watch.targetPriceCents) {
         const sub = await db.pushSubscriptions.findByUserId(watch.userId);
         const product = await db.products.findById(productId);
         if (!sub) continue;

         await webpush.sendNotification(
           { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
           JSON.stringify({
             title: 'Price drop!',
             body: `${product.name} is now $${(newPriceCents / 100).toFixed(2)} — your target price was met`,
             url: `${process.env.STORE_URL}/products/${product.slug}`,
             icon: product.images[0]?.url,
           })
         );

         await db.priceWatches.deactivate(watch.id);
       }
     }
   }
   ```

5. **Send cart reminder push notifications**

   ```typescript
   async function sendCartReminderPush(customerId: string, cartItems: CartItem[]) {
     const sub = await db.pushSubscriptions.findByUserId(customerId);
     if (!sub) return;

     const itemNames = cartItems.slice(0, 2).map((i) => i.product.name).join(', ');
     const moreCount = cartItems.length - 2;

     await webpush.sendNotification(
       { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
       JSON.stringify({
         title: 'Your cart is waiting',
         body: moreCount > 0 ? `${itemNames} and ${moreCount} more items` : itemNames,
         icon: cartItems[0]?.product.images[0]?.url,
         url: `${process.env.STORE_URL}/cart`,
         actions: [
           { action: 'checkout', title: 'Checkout' },
           { action: 'dismiss', title: 'Dismiss' },
         ],
       })
     );
   }
   ```

## Examples

### Opt-in prompt with timing strategy

Show the permission prompt after positive engagement, not on first page load:

```typescript
function initSmartPushPrompt() {
  let pageViews = parseInt(sessionStorage.getItem('pageViews') ?? '0', 10) + 1;
  sessionStorage.setItem('pageViews', String(pageViews));

  const alreadySubscribed = localStorage.getItem('pushSubscribed');
  const dismissed = localStorage.getItem('pushDismissed');

  if (alreadySubscribed || dismissed) return;

  // Ask after 3 page views and only after add-to-cart
  if (pageViews >= 3) {
    document.addEventListener('cart:item:added', async () => {
      const confirmed = confirm('Get notified about price drops and back-in-stock alerts?');
      if (confirmed) {
        await subscribeToPush();
        localStorage.setItem('pushSubscribed', 'true');
      } else {
        localStorage.setItem('pushDismissed', 'true');
      }
    }, { once: true });
  }
}
```

### Batch push broadcast for a flash sale

```typescript
async function broadcastFlashSale(saleDetails: { title: string; discountPct: number; endsAt: Date; url: string }) {
  const subscriptions = await db.pushSubscriptions.findAll({ limit: 10000 });
  const payload = JSON.stringify({
    title: saleDetails.title,
    body: `${saleDetails.discountPct}% off — ends ${saleDetails.endsAt.toLocaleTimeString()}`,
    url: saleDetails.url,
    icon: '/icons/sale-badge.png',
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: Math.floor((saleDetails.endsAt.getTime() - Date.now()) / 1000) }
      )
    )
  );

  const expired = results
    .filter((r, i) => r.status === 'rejected' && (r.reason as any)?.statusCode === 410)
    .map((_, i) => subscriptions[i].endpoint);

  if (expired.length > 0) {
    await db.pushSubscriptions.deleteManyByEndpoint(expired);
  }
}
```

## Best Practices

- **Never request permission on first page load** — permission prompt acceptance rates jump from ~5% to ~25% when shown after a user action like adding to cart
- **Always handle 410/404 errors** — these indicate expired subscriptions; delete them immediately to keep your database clean
- **Set a TTL on time-sensitive notifications** — flash sale pushes should have `TTL` set to the sale duration so stale pushes are not delivered after it ends
- **Keep notification body under 100 characters** — longer bodies are truncated on Android; test on both iOS and Android
- **Use `actions` for binary choices** — "Buy Now" / "Remind Later" gives users control and increases click-through rate
- **Do not send more than 2 push notifications per day per user** — excessive push frequency is the top driver of notification opt-out
- **Track notification click rate and opt-out rate** by notification type to identify which flows annoy users versus delight them

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Service worker not updating after deployment | Use a versioned cache name in the service worker and call `skipWaiting()` to activate the new version immediately |
| Push fails silently — no errors in logs | Add try/catch around `webpush.sendNotification` and log the status code; 429 means rate limited, 410 means expired |
| iOS Safari not receiving push notifications | Web Push on iOS requires iOS 16.4+ and the user must add the site to their Home Screen (PWA install) |
| Users see the permission dialog before engaging | Gate the `Notification.requestPermission()` call behind meaningful user interaction, not on page load |
| Duplicate subscriptions stored per user | Use `upsert` keyed on `(userId, endpoint)` — the same browser tab can call subscribe multiple times |

## Related Skills

- @email-marketing-automation
- @cart-abandonment-recovery
- @sms-marketing
- @exit-intent-popups
- @customer-segmentation
