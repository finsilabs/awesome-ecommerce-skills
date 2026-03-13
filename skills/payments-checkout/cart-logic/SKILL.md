---
name: cart-logic
description: "Build a robust shopping cart with add/remove/update operations, session persistence across devices, and cart merge for returning logged-in users"
category: payments-checkout
risk: safe
source: curated
date_added: "2026-03-12"
tags: [cart, state-management, persistence, session, merge, add-to-cart, line-items]
triggers: ["shopping cart", "add to cart", "cart state management", "cart persistence", "merge carts", "cart implementation"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Cart Logic

## Overview

Cart logic covers how your store manages items a shopper intends to buy: adding, removing, and updating items; persisting the cart across page loads and devices; and merging a guest cart into an account when the customer logs in. On Shopify, WooCommerce, and BigCommerce, the cart is built into the platform — the goal is to configure it correctly and extend it when needed. Custom code is only required for headless storefronts.

## When to Use This Skill

- When cart state is lost when users navigate between pages (missing persistence)
- When guest cart items disappear after login (missing merge logic)
- When implementing real-time cart price updates (coupons, quantity changes, shipping estimates)
- When building a headless storefront that needs a custom cart implementation

## Core Instructions

### Step 1: Understand how your platform handles cart logic

| Platform | Cart Behavior | Where to Configure |
|----------|--------------|-------------------|
| **Shopify** | Built-in cart with automatic persistence; uses cookies/localStorage | Theme Liquid templates + Cart API; extend with Cart Transform Shopify Function |
| **WooCommerce** | Built-in cart with session persistence; configures via PHP hooks | WooCommerce settings + `woocommerce_add_cart_item_data` and `woocommerce_cart_item_price` filters |
| **BigCommerce** | Built-in Storefront Cart API; cart persists via cookie | BigCommerce Stencil theme + Storefront Cart API |
| **Custom / Headless** | Must build from scratch using platform APIs or Shopify/BigCommerce Storefront API | See Custom / Headless section below |

### Step 2: Configure and extend cart behavior

---

#### Shopify

Shopify's cart is managed automatically. To extend it:

**Customize the cart drawer or page:**
1. Go to **Online Store → Themes → Customize**
2. Select the cart section and configure: cart type (drawer vs. page), item display, quantity controls
3. Enable **Cart notes** and **Shipping estimate** in the cart settings if needed

**Enable cart persistence across devices** (requires accounts):
- Shopify automatically persists cart for logged-in customers; the cart is stored server-side on their account
- For guest carts, Shopify uses a `cart_token` cookie (30-day expiry by default)

**Merge guest cart on login:**
- Shopify handles this automatically — when a guest logs in, their cart is merged with any existing account cart

**Cart customization via Shopify Functions:**
Use **Cart Transform** Shopify Functions to modify cart items, apply custom discounts, or bundle products. Go to **Settings → Custom data** and deploy a Cart Transform function via the Shopify CLI.

**Custom cart upsells and cross-sells:**
Install **CartHook**, **ReConvert**, or **Frequently Bought Together** from the Shopify App Store for cart upsell logic without custom code.

---

#### WooCommerce

WooCommerce's cart is built-in and session-based.

**Configure cart behavior:**
1. Go to **WooCommerce → Settings → Products → General** to configure cart and add-to-cart behavior
2. Enable or disable **Redirect to cart page after successful addition** based on your store's UX preference
3. Under **WooCommerce → Settings → Advanced → Cart page**, verify the cart page is assigned

**Enable persistent cart for logged-in users:**
1. Go to **WooCommerce → Settings → Accounts & Privacy**
2. Enable **Persistent cart** — this stores a logged-in customer's cart in the database so it survives across sessions and devices

**Guest cart to account merge:**
WooCommerce automatically merges the guest cart with the customer's saved cart when they log in. To ensure this works, keep **Persistent cart** enabled.

**Extend cart item data** (e.g., for product customization options):
Use the `woocommerce_add_cart_item_data` filter in your theme's `functions.php` or a custom plugin to attach extra data to cart items (gift messages, engraving text, etc.).

**Cart abandonment tracking:**
Install **CartFlows** or **WooCommerce Cart Abandonment Recovery** plugin to track and recover abandoned carts.

---

#### BigCommerce

BigCommerce uses its Storefront Cart API for cart management.

**Configure cart settings:**
1. Go to **Settings → Storefront** to configure cart and checkout behavior
2. Cart persistence is automatic via BigCommerce's session management

**Customize the cart via Stencil theme:**
Edit cart templates in your Stencil theme (`templates/components/cart/`) to modify the cart page layout, item display, and available actions.

**Cart upsells:**
Use the BigCommerce Cart API to detect items in the cart and conditionally show related products or promotions in the cart template.

---

#### Custom / Headless

For a headless storefront, use your platform's Storefront API rather than building cart storage from scratch:

**Shopify Storefront API (recommended for Shopify-backed headless stores):**

```javascript
// Create a cart
const createCart = async () => {
  const response = await fetch(`https://${SHOP_DOMAIN}/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
    },
    body: JSON.stringify({
      query: `
        mutation cartCreate($input: CartInput!) {
          cartCreate(input: $input) {
            cart { id checkoutUrl }
            userErrors { field message }
          }
        }
      `,
      variables: { input: { lines: [{ merchandiseId: variantGid, quantity: 1 }] } },
    }),
  });
  const { data } = await response.json();
  return data.cartCreate.cart;
};

// Add an item to an existing cart
const addToCart = async (cartId, variantGid, quantity) => {
  const response = await fetch(`https://${SHOP_DOMAIN}/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
    },
    body: JSON.stringify({
      query: `
        mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
          cartLinesAdd(cartId: $cartId, lines: $lines) {
            cart { id totalQuantity cost { totalAmount { amount currencyCode } } }
          }
        }
      `,
      variables: { cartId, lines: [{ merchandiseId: variantGid, quantity }] },
    }),
  });
  const { data } = await response.json();
  return data.cartLinesAdd.cart;
};
```

Store the `cartId` in a cookie or localStorage. On login, use `cartBuyerIdentityUpdate` to associate the cart with the customer's account — Shopify handles the merge automatically.

**BigCommerce Storefront API (for BigCommerce-backed headless stores):**

Use the BigCommerce Storefront Cart API (`/api/storefront/carts`) which handles cart creation, item management, and customer association automatically.

### Step 3: Implement key cart UX behaviors

Regardless of platform, these are the cart behaviors that most affect conversion:

1. **Show mini-cart on add-to-cart** — most Shopify, WooCommerce, and BigCommerce themes support a slide-out cart drawer that opens when an item is added; enable this instead of redirecting to the cart page
2. **Show stock levels in the cart** — display "Only 2 left" warnings on items with low inventory; both Shopify and WooCommerce support this via metafields and cart item data
3. **Guest cart persistence** — ensure guest carts survive for at least 30 days so returning visitors find their items; Shopify does this by default; WooCommerce requires the session duration setting to be configured
4. **Free shipping progress bar** — show a "You're $X away from free shipping" bar in the cart; install **Free Shipping Bar** (Shopify) or **WooCommerce Free Shipping Bar** plugin

## Best Practices

- **Use your platform's native cart** — Shopify, WooCommerce, and BigCommerce carts are battle-tested and handle edge cases (stock validation, price changes, tax calculation) correctly
- **Enable persistent cart for logged-in customers** — all three platforms support server-side cart storage for accounts; enable it
- **Validate stock at checkout, not only on add-to-cart** — items may sell out while in a guest's cart; re-validate at checkout time (platforms do this automatically)
- **Show the cart total prominently** — including item count and subtotal; reduces anxiety about total spend
- **For headless: use the platform's Storefront API** — Shopify and BigCommerce Storefront APIs are production-hardened and handle cart merging, stock checks, and checkout initiation correctly

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Cart disappears when user logs in (WooCommerce) | Ensure **Persistent cart** is enabled in WooCommerce → Settings → Accounts & Privacy |
| Guest cart is empty after browser restart | Check cookie expiry settings; Shopify uses 30-day cart tokens by default; WooCommerce session duration is configurable |
| Same item added twice instead of incrementing quantity | The platform's native cart handles this; if using headless with Storefront API, use `cartLinesUpdate` to increment quantity on existing lines |
| Cart shows outdated prices after a price change | Shopify and WooCommerce automatically use current prices at checkout, not add-to-cart prices; a "price changed" notice appears automatically |
| Custom add-to-cart code bypasses stock checks | Always use the platform's official add-to-cart mechanisms; custom code that writes directly to cart storage skips inventory validation |

## Related Skills

- @checkout-flow-optimization
- @guest-checkout
- @inventory-tracking
- @stripe-integration
