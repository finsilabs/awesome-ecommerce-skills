---
name: pwa-storefront
description: "Turn your store into an installable Progressive Web App with offline product browsing, push notifications, and home screen access for mobile shoppers"
category: headless-modern
risk: safe
source: curated
date_added: "2026-03-12"
tags: [pwa, service-worker, workbox, offline, web-app-manifest, push-notifications, cache-api, installable]
triggers: ["pwa storefront", "progressive web app ecommerce", "offline catalog", "service worker commerce", "installable storefront", "add to home screen"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# PWA Storefront

## Overview

A Progressive Web App (PWA) storefront combines the reach of the web with native-app-like capabilities: offline catalog browsing, push notifications, home screen installation, and fast repeat loads from cache. Service workers intercept network requests and implement caching strategies that keep the store functional on flaky connections. This skill covers implementing a service worker with Workbox, creating a Web App Manifest, caching product catalogs, and sending push notifications for order updates.

## When to Use This Skill

- When your customers are in regions with unreliable mobile internet connectivity
- When you want to enable "Add to Home Screen" for higher re-engagement rates without a native app
- When repeat page loads should be instant by serving assets from cache
- When you want to send push notifications for order status updates, back-in-stock alerts, or promotions
- When building a mobile-first storefront that needs to compete with native apps in UX quality

## Prerequisites & Platform Notes

**This skill is written for custom/headless storefronts** (Node.js, Python, or similar backend). The code examples use TypeScript/Node.js and can be adapted to any stack.

**Shopify**: Shopify Hydrogen is Shopify's headless framework. MACH/composable patterns apply when using Shopify as the commerce backend with a custom frontend, or when mixing Shopify with other best-of-breed services.
**WooCommerce**: WooCommerce can serve as a headless backend via its REST API and WPGraphQL. These patterns apply when decoupling the frontend from WordPress.
**Magento**: Magento's GraphQL API and PWA Studio support headless architectures. These composable patterns apply to Magento as a backend service in a MACH stack.

**You'll need**:
- Node.js 18+ (or adapt to your backend language)
- PostgreSQL (or your preferred relational database)
- Redis for caching/queues
- An email sending service (SendGrid, AWS SES, or Postmark)
- CDN (Cloudflare, CloudFront, or Fastly)

## Core Instructions

1. **Create the Web App Manifest**

   The manifest makes the app installable on Android and iOS (iOS has partial support):

   ```json
   // public/manifest.json
   {
     "name": "My Commerce Store",
     "short_name": "MyStore",
     "description": "Fast, reliable shopping from anywhere",
     "start_url": "/?source=pwa",
     "display": "standalone",
     "background_color": "#ffffff",
     "theme_color": "#1a1a2e",
     "orientation": "portrait-primary",
     "icons": [
       { "src": "/icons/icon-72x72.png", "sizes": "72x72", "type": "image/png" },
       { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
       { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
     ],
     "screenshots": [
       { "src": "/screenshots/home.png", "sizes": "390x844", "type": "image/png", "form_factor": "narrow" }
     ],
     "categories": ["shopping"],
     "share_target": {
       "action": "/search",
       "method": "GET",
       "params": { "title": "q" }
     }
   }
   ```

   Link in your HTML:
   ```html
   <link rel="manifest" href="/manifest.json">
   <meta name="theme-color" content="#1a1a2e">
   <meta name="apple-mobile-web-app-capable" content="yes">
   <meta name="apple-mobile-web-app-status-bar-style" content="default">
   <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
   ```

2. **Register a service worker with Workbox**

   ```bash
   npm install workbox-webpack-plugin
   # or for Vite:
   npm install vite-plugin-pwa
   ```

   Using `vite-plugin-pwa` (recommended for Vite/Next.js projects):

   ```typescript
   // vite.config.ts
   import {VitePWA} from 'vite-plugin-pwa';

   export default {
     plugins: [
       VitePWA({
         registerType: 'autoUpdate',
         workbox: {
           globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
           runtimeCaching: [
             {
               urlPattern: /^https:\/\/fonts\.googleapis\.com/,
               handler: 'CacheFirst',
               options: {cacheName: 'google-fonts-cache', expiration: {maxAgeSeconds: 60 * 60 * 24 * 365}},
             },
             {
               urlPattern: /\/api\/products/,
               handler: 'StaleWhileRevalidate',
               options: {
                 cacheName: 'products-cache',
                 expiration: {maxEntries: 500, maxAgeSeconds: 60 * 60 * 24}, // 24h
                 cacheableResponse: {statuses: [0, 200]},
               },
             },
             {
               urlPattern: /\/api\/collections/,
               handler: 'NetworkFirst',
               options: {
                 cacheName: 'collections-cache',
                 networkTimeoutSeconds: 3,
                 expiration: {maxEntries: 50, maxAgeSeconds: 60 * 60},
               },
             },
           ],
         },
         manifest: {/* inline manifest or path */},
       }),
     ],
   };
   ```

3. **Implement a custom service worker for offline catalog**

   For fine-grained control, write the service worker directly:

   ```javascript
   // public/sw.js
   import {precacheAndRoute, cleanupOutdatedCaches} from 'workbox-precaching';
   import {registerRoute} from 'workbox-routing';
   import {StaleWhileRevalidate, CacheFirst, NetworkFirst} from 'workbox-strategies';
   import {ExpirationPlugin} from 'workbox-expiration';
   import {BackgroundSyncPlugin} from 'workbox-background-sync';

   // Precache app shell (injected by build tool)
   precacheAndRoute(self.__WB_MANIFEST);
   cleanupOutdatedCaches();

   // Product images: Cache-first with 7-day expiry
   registerRoute(
     ({url}) => url.hostname.includes('cdn.shopify.com') || url.pathname.includes('/product-images/'),
     new CacheFirst({
       cacheName: 'product-images',
       plugins: [
         new ExpirationPlugin({maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7}),
       ],
     })
   );

   // Product API: Stale-while-revalidate (show cached, refresh in background)
   registerRoute(
     ({url}) => url.pathname.startsWith('/api/products') || url.pathname.startsWith('/api/collections'),
     new StaleWhileRevalidate({
       cacheName: 'api-products',
       plugins: [
         new ExpirationPlugin({maxEntries: 500, maxAgeSeconds: 60 * 60 * 24}),
       ],
     })
   );

   // Background sync for cart operations when offline
   const cartSyncPlugin = new BackgroundSyncPlugin('cart-sync-queue', {
     maxRetentionTime: 24 * 60, // Retry for 24 hours
   });

   registerRoute(
     ({url, request}) => url.pathname.startsWith('/api/cart') && request.method !== 'GET',
     new NetworkFirst({plugins: [cartSyncPlugin]}),
     'POST'
   );
   ```

4. **Show an offline fallback page**

   ```javascript
   // In the service worker
   import {setCatchHandler, setDefaultHandler} from 'workbox-routing';

   // Precache the offline page during installation
   precacheAndRoute([{url: '/offline', revision: '1'}]);

   // Serve offline page for navigation requests when network fails
   setCatchHandler(async ({event}) => {
     if (event.request.destination === 'document') {
       return caches.match('/offline');
     }
     return Response.error();
   });
   ```

   ```typescript
   // app/offline/page.tsx
   export default function OfflinePage() {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen">
         <h1>You're offline</h1>
         <p>Check your connection. Recently viewed products are still available below.</p>
         <RecentlyViewedProducts /> {/* Reads from IndexedDB */}
       </div>
     );
   }
   ```

5. **Implement Web Push notifications**

   ```typescript
   // client: subscribe to push notifications
   async function subscribeToPush() {
     const registration = await navigator.serviceWorker.ready;
     const subscription = await registration.pushManager.subscribe({
       userVisibleOnly: true,
       applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
     });

     await fetch('/api/push/subscribe', {
       method: 'POST',
       headers: {'Content-Type': 'application/json'},
       body: JSON.stringify({subscription, customerId: user.id}),
     });
   }

   // server: send push notification for order status update
   import webpush from 'web-push';

   webpush.setVapidDetails(
     'mailto:support@mystore.com',
     process.env.VAPID_PUBLIC_KEY!,
     process.env.VAPID_PRIVATE_KEY!
   );

   export async function sendOrderUpdatePush(customerId: string, order: Order) {
     const subscriptions = await db.pushSubscriptions.findByCustomer(customerId);
     await Promise.allSettled(
       subscriptions.map(sub =>
         webpush.sendNotification(sub.data, JSON.stringify({
           title: `Order #${order.number} Update`,
           body: `Your order is now ${order.status}`,
           icon: '/icons/icon-192x192.png',
           url: `/orders/${order.id}`,
           tag: `order-${order.id}`,
         }))
       )
     );
   }
   ```

   Handle push events in the service worker:
   ```javascript
   self.addEventListener('push', (event) => {
     const data = event.data?.json();
     event.waitUntil(
       self.registration.showNotification(data.title, {
         body: data.body,
         icon: data.icon,
         badge: '/icons/badge-72x72.png',
         data: {url: data.url},
         tag: data.tag,
         renotify: true,
       })
     );
   });

   self.addEventListener('notificationclick', (event) => {
     event.notification.close();
     event.waitUntil(clients.openWindow(event.notification.data.url));
   });
   ```

6. **Detect and respond to offline status in the UI**

   ```typescript
   // hooks/use-online-status.ts
   import {useState, useEffect} from 'react';

   export function useOnlineStatus() {
     const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

     useEffect(() => {
       const setOnline = () => setIsOnline(true);
       const setOffline = () => setIsOnline(false);
       window.addEventListener('online', setOnline);
       window.addEventListener('offline', setOffline);
       return () => { window.removeEventListener('online', setOnline); window.removeEventListener('offline', setOffline); };
     }, []);

     return isOnline;
   }

   // Usage in a component
   function CartButton() {
     const isOnline = useOnlineStatus();
     return (
       <button disabled={!isOnline} title={isOnline ? undefined : 'You are offline'}>
         Add to Cart
       </button>
     );
   }
   ```

## Examples

### Lighthouse PWA audit checklist (automated)

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Audit PWA criteria
lighthouse https://mystore.com --preset=desktop --only-categories=pwa --output=json --output-path=./lighthouse-pwa.json

# Key scores to target:
# - "Installable" checks: manifest, service worker, HTTPS
# - "PWA Optimized" checks: themed address bar, offline page, mobile viewport
```

### IndexedDB catalog cache for offline browsing

```typescript
import {openDB} from 'idb';

const db = await openDB('catalog-db', 1, {
  upgrade(db) {
    db.createObjectStore('products', {keyPath: 'id'});
    db.createObjectStore('collections', {keyPath: 'id'});
  },
});

// Store products when user browses online
export async function cacheProductsLocally(products: Product[]) {
  const tx = db.transaction('products', 'readwrite');
  await Promise.all([...products.map(p => tx.store.put(p)), tx.done]);
}

// Retrieve from IDB when offline
export async function getProductFromCache(id: string): Promise<Product | null> {
  return db.get('products', id) ?? null;
}
```

## Best Practices

- **Use `StaleWhileRevalidate` for product data** — the user sees cached content immediately while the service worker fetches the latest data in the background
- **Never cache cart or checkout pages** — these must always be fresh; use `NetworkOnly` strategy for `/cart`, `/checkout`, and account pages
- **Version your service worker cache names** — when you update your app, increment cache names so stale assets are purged automatically
- **Test offline mode in Chrome DevTools** — use the Network tab → "Offline" throttle to verify your offline experience before deploying
- **Generate VAPID keys once and store them securely** — VAPID private key loss means losing all existing push subscriptions; store in a secrets manager
- **Request push permission with context** — prompt users to allow notifications only after a relevant action (order placed, back-in-stock interested) to maximize opt-in rates
- **Set reasonable cache size limits** — use `ExpirationPlugin` with `maxEntries` to prevent the service worker cache from consuming too much device storage

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Service worker not updating after deployment | Use `registerType: 'autoUpdate'` and call `skipWaiting()` in the service worker to take control immediately; show a "New version available" toast |
| Push notifications not shown on iOS | iOS requires the user to add the PWA to the Home Screen first; Web Push on iOS Safari requires iOS 16.4+ and `standalone` display mode |
| Cached API responses served after price changes | Set `maxAgeSeconds` appropriately; use on-demand cache invalidation by busting cache names on deployment |
| Background sync fails silently | Wrap background sync in try/catch and log errors; test with the DevTools Application → Background Sync panel |
| App installability failing Lighthouse audit | Check for: HTTPS, valid manifest with 512×512 maskable icon, registered service worker, and `start_url` responding with 200 |

## Related Skills

- @jamstack-storefront
- @image-optimization-cdn
- @edge-commerce
- @monitoring-alerting-commerce
