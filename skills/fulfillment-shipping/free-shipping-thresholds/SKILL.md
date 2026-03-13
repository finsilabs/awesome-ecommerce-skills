---
name: free-shipping-thresholds
description: "Motivate larger orders by showing a progress bar toward free shipping and nudging customers to add more items to qualify"
category: fulfillment-shipping
risk: safe
source: curated
date_added: "2026-03-12"
tags: [free-shipping, threshold, upsell, progress-indicator, cart, shipping-rules]
triggers: ["free shipping", "free shipping threshold", "shipping progress bar", "add more for free shipping", "free shipping upsell"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: beginner
---

# Free Shipping Thresholds

## Overview

A free shipping threshold motivates customers to add more to their cart to avoid paying for shipping — one of the highest-converting tactics for increasing average order value. The key is showing a dynamic progress bar ("Add $12 more for free shipping") that updates as items are added. Most platforms support this natively or via an app without writing any code.

## When to Use This Skill

- When adding a free shipping banner or cart progress bar to increase average order value
- When different customer tiers should have different free shipping thresholds
- When A/B testing different threshold amounts to find the AOV sweet spot
- When you want to surface "add $X more to unlock free shipping" messages dynamically
- When free shipping rules should vary by shipping zone (domestic vs. international)

## Core Instructions

### Step 1: Determine your platform and choose the right tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Built-in shipping settings + Hextom Free Shipping Bar app | Shopify handles the rule; Hextom or similar apps add the visible progress bar |
| **WooCommerce** | WooCommerce Shipping (built-in free shipping method) + WooCommerce Free Shipping Bar plugin | WooCommerce has native free shipping rules; plugins handle the bar UI |
| **BigCommerce** | Built-in free shipping promotion + free shipping bar app | BigCommerce has native promotional rules for free shipping thresholds |
| **Custom / Headless** | Build a rule resolver + progress bar component | Full control over threshold logic, per-segment rules, and UI |

### Step 2: Set up the free shipping rule

#### Shopify

**Create the free shipping rate (required first):**
1. Go to **Settings → Shipping and delivery → Manage rates**
2. Under your shipping zone, click **Add rate**
3. Name it "Free Shipping" and set the price to $0.00
4. Under **Conditions**, check "Only available if order meets conditions" → **Based on order price** → set the minimum order price (e.g., $75)
5. Save

**Add the progress bar (Hextom Free Shipping Bar app — free tier available):**
1. Install **Hextom: Free Shipping Bar** from the Shopify App Store
2. The app automatically detects your free shipping threshold from Shopify settings
3. Customize the bar text: "You're {{amount}} away from free shipping!" where `{{amount}}` is replaced dynamically
4. Place the bar on cart pages and/or the mini-cart via the app's theme editor
5. For tiered thresholds (e.g., lower threshold for loyalty members): use the paid tier of Hextom which supports customer-tag-based conditions

**Alternative — Shopify Plus: use Scripts for per-segment thresholds:**
- Shopify Scripts (Plus only) let you write Ruby-like code to apply different shipping rates based on customer tags
- Go to **Online Store → Scripts → Shipping** to set up segment-specific free shipping rules

#### WooCommerce

**Create the free shipping method:**
1. Go to **WooCommerce → Settings → Shipping → [Your shipping zone] → Add shipping method**
2. Select **Free Shipping** and click **Add shipping method**
3. Click on Free Shipping to configure it
4. Set "Free shipping requires..." to **A minimum order amount** and enter the threshold (e.g., $75)
5. Optionally check **Coupon** to also allow free shipping coupons to trigger this rule
6. Save changes

**Add the progress bar:**
- Install **WooCommerce Free Shipping Bar** by WPFactory (free on WordPress.org) or **Iconic WooCommerce Free Gifts** (paid, with bar feature)
- The WPFactory plugin automatically reads your free shipping threshold and shows the bar in the cart
- Configure the bar message in the plugin settings: "Add {{amount_remaining}} more to get free shipping!"

**For customer-tier-based thresholds:**
- Install the **WooCommerce Role-Based Pricing** plugin or use conditional logic in the **Advanced Shipping** plugin to apply different thresholds to different user roles
- A common approach: create a "Wholesale" user role with a custom free shipping method that triggers at a lower minimum order

#### BigCommerce

**Create the free shipping promotion:**
1. Go to **Marketing → Promotions → Create a promotion**
2. Choose **Shipping** promotion type
3. Set condition: "Cart subtotal is greater than or equal to [amount]"
4. Set action: "Free shipping"
5. Enable the promotion and set start/end dates if it's temporary

**Add the progress bar:**
- Install a free shipping bar app from the BigCommerce App Marketplace (search "free shipping bar")
- **Rebolt ‑ Free Shipping Bar** is available for BigCommerce and reads your promotion settings automatically

**For geographic variation (domestic vs. international):**
- Create separate shipping promotions for different shipping zones in BigCommerce
- Each promotion can be restricted to specific shipping zones

### Step 3: Configure the progress bar message and upsell behavior

Regardless of platform, these messaging best practices apply:

1. **Before threshold:** "Add **$12.50** more for FREE shipping!" — always show the specific dollar amount, not a percentage
2. **Just before threshold ($5–$15 away):** Consider showing product suggestions that fill the gap — "These popular items could qualify you:" (many apps support this)
3. **At threshold:** "You've unlocked FREE shipping!" with a congratulatory style — green color, checkmark icon
4. **Place the bar on both the cart page and mini-cart drawer** — customers who see it in the mini-cart have higher AOV

#### Custom / Headless

```typescript
// Server-side: resolve free shipping status for a cart
function resolveShippingThreshold(params: {
  cartSubtotalCents: number;
  shippingCountry: string;
  customerTags: string[];
  thresholdRules: ShippingThresholdRule[];
}): { isFree: boolean; thresholdCents: number; amountNeededCents: number; progressPct: number } {
  // Find the highest-priority matching rule
  const rule = params.thresholdRules
    .filter(r => r.isActive)
    .filter(r => !r.countries?.length || r.countries.includes(params.shippingCountry))
    .filter(r => !r.customerTags?.length || r.customerTags.some(t => params.customerTags.includes(t)))
    .sort((a, b) => b.priority - a.priority)[0];

  if (!rule) return { isFree: false, thresholdCents: 0, amountNeededCents: 0, progressPct: 0 };

  const isFree = params.cartSubtotalCents >= rule.thresholdCents;
  const amountNeededCents = Math.max(0, rule.thresholdCents - params.cartSubtotalCents);
  const progressPct = Math.min(100, Math.round((params.cartSubtotalCents / rule.thresholdCents) * 100));

  return { isFree, thresholdCents: rule.thresholdCents, amountNeededCents, progressPct };
}
```

```tsx
// React component for the progress bar
function FreeShippingBar({ amountNeededCents, progressPct, isFree }: {
  amountNeededCents: number; progressPct: number; isFree: boolean;
}) {
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(amountNeededCents / 100);

  return (
    <div className="free-shipping-bar">
      {isFree ? (
        <p>You've unlocked FREE shipping!</p>
      ) : (
        <p>Add <strong>{formatted}</strong> more for FREE shipping</p>
      )}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
    </div>
  );
}
```

### Step 4: Set the right threshold amount

The threshold should be above your average order value (AOV) but achievable:
- **Rule of thumb:** Set the free shipping threshold at 20–30% above your current AOV
- **Test the economics:** If your average shipping cost is $8 and your gross margin is 40%, you need the incremental revenue from the upsell to cover the $8 shipping cost
- **A/B test:** Tools like Google Optimize (now GA4 Experiments) or Shopify's built-in theme A/B testing let you test different threshold amounts

## Best Practices

- **Show the progress bar on both the cart page and the mini-cart** — customers who see the progress bar in the mini-cart add items more frequently than those who only see it at full checkout
- **Update in real time** — the bar should update immediately when items are added; stale values erode trust
- **Use free shipping as the default reward, not a coupon code** — requiring a code adds friction; automatic thresholds convert better
- **Don't apply free shipping to international orders by default** — international shipping costs can exceed your entire margin; set geographic restrictions from day one
- **Communicate the threshold in the header/sitewide banner** — "Free shipping on orders over $75" in the top bar sets expectations before customers even start shopping

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Progress bar shows "free shipping" but checkout still charges | Double-check that the free shipping rate is active in your platform's shipping settings AND that no other rule is overriding it |
| Free shipping fires when a coupon reduces the cart below threshold | In WooCommerce, set the free shipping method to require "minimum order amount" after discounts; in Shopify, ensure the shipping rate uses post-discount subtotal |
| International customers see the free shipping bar | Scope your shipping rate to domestic zones only; configure the app to only show the bar for domestic visitors |
| Progress bar shows 100% but order is below threshold | Ensure progress calculation uses the same subtotal as the shipping rate rule (post-discount, excluding non-qualifying items) |

## Related Skills

- @shipping-rate-calculator
- @coupon-management
- @discount-engine
- @loyalty-points-system
- @checkout-flow-optimization
