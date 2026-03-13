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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: beginner
---

# Push Notifications

## Overview

Web push notifications deliver timely messages to subscribers even when they are not on your site — for back-in-stock alerts, price drops, and cart reminders. Push requires explicit browser permission, making the opt-in prompt timing critical. For Shopify, WooCommerce, and BigCommerce, dedicated push notification apps (PushOwl, OneSignal) handle all the subscriber management, triggering logic, and delivery without custom service worker code.

## When to Use This Skill

- When adding back-in-stock notifications to replace static "notify me" email forms
- When recovering abandoned carts via a browser push channel alongside email
- When building a price-watch feature for wishlisted items
- When email deliverability is poor and a supplemental channel is needed
- When targeting mobile-first markets where push opt-in rates exceed email opt-in

## Core Instructions

### Step 1: Choose the right push notification platform

| Platform | Best For | Shopify | WooCommerce | BigCommerce | Price |
|----------|---------|---------|-------------|-------------|-------|
| **PushOwl** | Shopify-native, back-in-stock + abandonment | App Store | — | — | Free tier; $19+/mo |
| **OneSignal** | All platforms, free tier, highly configurable | Via JS tag | Plugin | Via JS tag | Free tier; $9+/mo |
| **Klaviyo Web Push** | Already using Klaviyo for email | App Store | Plugin | App Marketplace | Included in Klaviyo |
| **PushEngage** | WooCommerce + segmented campaigns | — | Plugin | Via JS tag | Free tier; $9+/mo |

**Shopify recommendation:** Use **PushOwl** — it's the most integrated Shopify push app with built-in back-in-stock, cart abandonment, and shipping alerts.

**WooCommerce recommendation:** Use **PushEngage** or **OneSignal** — both have WordPress plugins and handle subscriber management automatically.

### Step 2: Set up push notifications

---

#### Shopify with PushOwl

1. Install **PushOwl** from the Shopify App Store
2. Go to **PushOwl → Settings → Opt-in Prompt** and configure:
   - Delay the prompt: set it to trigger after a customer views 2+ pages or adds an item to cart
   - Opt-in message: "Get notified when items are back in stock and for price drops"
3. Go to **PushOwl → Automations → Back in Stock** and enable it — PushOwl automatically adds a "Notify Me" button to out-of-stock products and fires the push when inventory is replenished
4. Go to **PushOwl → Automations → Cart Abandonment** and enable it:
   - Set timing: 1 hour after abandonment, then 24 hours
   - Customize the notification message and the cart recovery URL
5. Go to **PushOwl → Campaigns** to send broadcast push notifications for sales, new arrivals, or flash discounts

---

#### WooCommerce with PushEngage

1. Install **PushEngage** from the WordPress plugin directory (free tier available)
2. Go to **PushEngage → Settings → Subscription Prompt** and configure the opt-in dialog
3. Enable automated campaigns:
   - Go to **PushEngage → Automation → Cart Abandonment** and set the timing and message
   - Go to **PushEngage → Automation → Back in Stock** and enable it (requires WooCommerce stock event integration)
4. For price drop alerts: go to **PushEngage → Automation → Price Drop Alert** and enable subscriber opt-in per product
5. Use **PushEngage → Broadcast** to send manual push campaigns to all subscribers

---

#### BigCommerce with OneSignal

1. Sign up for **OneSignal** at onesignal.com and create a Web Push app
2. Go to **OneSignal → Settings → Web Push → Setup** and follow the HTTPS domain verification
3. Add the OneSignal JavaScript snippet to your BigCommerce store via **Storefront → Script Manager**:
   ```javascript
   <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
   <script>
     window.OneSignalDeferred = window.OneSignalDeferred || [];
     OneSignalDeferred.push(async function(OneSignal) {
       await OneSignal.init({ appId: "YOUR_APP_ID" });
     });
   </script>
   ```
4. For back-in-stock: use BigCommerce webhooks to trigger a OneSignal API call when product stock transitions from 0 to available
5. For cart abandonment: use BigCommerce's Abandoned Cart webhook + OneSignal REST API to send cart recovery pushes

---

#### Custom / Headless

For headless stores, implement push using the Web Push API directly:

```javascript
// Service worker — save as /sw.js in your public directory
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon ?? '/icons/icon-192.png',
      image: data.image,
      data: { url: data.url },
      actions: data.actions ?? [],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url ?? '/'));
});
```

```typescript
// Server-side push sending using the web-push library
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:admin@yourstore.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Generate VAPID keys once: npx web-push generate-vapid-keys

async function sendPushNotification(subscription: PushSubscription, payload: {
  title: string;
  body: string;
  url: string;
  icon?: string;
}) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err: any) {
    if (err.statusCode === 410) {
      // Subscription expired — remove from database
      await db.pushSubscriptions.deleteByEndpoint(subscription.endpoint);
    }
  }
}

// Triggered when inventory transitions from 0 to > 0
async function notifyBackInStock(productId: string) {
  const product = await db.products.findById(productId);
  const waitlist = await db.pushWaitlist.findByProduct(productId);

  for (const entry of waitlist) {
    const sub = await db.pushSubscriptions.findByUserId(entry.userId);
    if (!sub) continue;
    await sendPushNotification(sub, {
      title: 'Back in stock!',
      body: `${product.name} is available again`,
      url: `${process.env.STORE_URL}/products/${product.slug}`,
      icon: product.images[0]?.url,
    });
  }
}
```

### Step 3: Optimize opt-in timing

The most critical factor for push notification effectiveness is **when** you show the permission prompt. Never ask on the first page load.

**Best triggers for the opt-in prompt:**
- After the visitor has viewed 3+ products
- Immediately after a customer adds an item to cart
- When a customer views an out-of-stock product (context: "Get notified when it's back")
- On the order confirmation page ("Get shipping updates and deals via browser push")

In PushOwl: go to **Settings → Opt-in Prompt → Advanced** and set the trigger condition.
In PushEngage: go to **Subscription Prompt → Display Rules** and set page view count or cart event triggers.

### Step 4: Set up the highest-converting push campaigns

**Priority order by conversion rate:**

1. **Back-in-stock alerts** — highest CTR (15–25%); customers opted in specifically for this product
2. **Cart abandonment** — set for 1 hour and 24 hours after abandonment; use urgency in the second push ("Your cart expires soon")
3. **Price drop alerts** — customers watching a specific product convert at 10–20% when notified of their target price
4. **Shipping updates** — low-friction way to grow push subscribers (capture at order confirmation); keeps brand top-of-mind

**In PushOwl:** all four are available as pre-built automations under **Automations** — enable them and customize the message.

### Step 5: Measure push performance

| Metric | Healthy Target | Where to Find |
|--------|----------------|---------------|
| Opt-in rate | 5–15% of new visitors | App dashboard |
| Back-in-stock click rate | 15–25% | PushOwl/PushEngage analytics |
| Cart abandonment recovery rate | 2–5% | App analytics |
| Unsubscribe rate per campaign | < 2% | App analytics |

If unsubscribe rate is above 2%, reduce push frequency or improve message relevance.

## Best Practices

- **Never request permission on first page load** — acceptance rates jump from ~5% to ~25% when shown after a user action like adding to cart
- **Limit to 2 push notifications per day per user maximum** — excessive frequency is the top driver of opt-out
- **Set a TTL on time-sensitive notifications** — flash sale pushes should expire when the sale ends; PushOwl and PushEngage both support notification expiry
- **Keep notification body under 100 characters** — longer bodies are truncated on Android; test on mobile before deploying
- **Use "Notify me" at the product level for out-of-stock** — this captures high-intent subscribers with context; generic sitewide opt-ins perform worse

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Low opt-in rate | Move the permission prompt to after add-to-cart or product view #3; never show on first load |
| iOS users not receiving push | Web push on iOS requires iOS 16.4+ and the user must install the site as a PWA (Add to Home Screen); this is a browser limitation |
| Push notifications not firing for back-in-stock | Verify the inventory webhook is connected in PushOwl/PushEngage settings; check the app's automation logs |
| High unsubscribe rate | Reduce push frequency; add preference management so subscribers can choose which notification types they receive |
| Duplicate subscriptions in the database | For custom implementations, use `upsert` keyed on `(userId, endpoint)` |

## Related Skills

- @email-marketing-automation
- @cart-abandonment-recovery
- @sms-marketing
- @exit-intent-popups
- @customer-retention-engine
