---
name: discount-engine
description: "Create a flexible discount system supporting percentage off, fixed amounts, buy-one-get-one, tiered thresholds, and complex conditional rules"
category: pricing-promotions
risk: critical
source: curated
date_added: "2026-03-12"
tags: [discounts, promotions, pricing, coupons, bogo, tiered-pricing, rules-engine]
triggers: ["build discount system", "implement promo codes", "create discount engine", "add coupon support"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Discount Engine

## Overview

A discount engine evaluates promotions against a cart and applies the right discounts in the right order. Every major e-commerce platform has one built in — you should configure the platform's native system before considering custom code. This skill covers how to set up complex discount logic (percentage off, fixed amount, BOGO, tiered thresholds, conditional rules) on each platform, and when to use apps or plugins to extend native capabilities.

## When to Use This Skill

- When building a promotions system for a new e-commerce store
- When adding coupon code support to an existing checkout flow
- When implementing tiered pricing (e.g., buy 3+ get 10% off, buy 10+ get 20% off)
- When creating automatic discounts that apply based on cart conditions
- When you need BOGO, bundle, or gift-with-purchase promotions

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right tool

| Platform | Built-in Discount Capabilities | When to Add Apps/Plugins |
|----------|-------------------------------|--------------------------|
| **Shopify** | Automatic discounts, code-based discounts, BOGO, tiered Buy X Get Y — all in **Discounts** admin | Shopify Plus Scripts for advanced stacking and custom logic; Bold Discounts for visual rule building |
| **WooCommerce** | Coupons (core) cover basic cases | For BOGO, tiered quantity pricing, or automatic rule-based discounts: YITH WooCommerce Dynamic Pricing & Discounts (~$70/yr) or Dynamic Pricing extension by WooCommerce (~$99/yr) |
| **BigCommerce** | Promotions engine supports cart-level and item-level discounts, free products, BOGO | BigCommerce's built-in Promotions are powerful — use custom scripts for edge cases |
| **Custom / Headless** | Must build — see below | N/A |

### Step 2: Set up automatic discounts and BOGO on your platform

---

#### Shopify

**Automatic discounts (no code required):**
1. Go to **Discounts → Create discount → Amount off products** (or Amount off order)
2. Toggle **No discount code** (makes it automatic — applies without a code)
3. Set the discount value and conditions
4. Under **Minimum purchase requirements**: set a minimum quantity or subtotal to trigger the discount
5. Set the **Active dates** — automatic discounts apply to all eligible carts during this window

**BOGO (Buy X Get Y):**
1. Go to **Discounts → Create discount → Buy X get Y**
2. Set the **Customer buys** section: quantity and which products/collections qualify
3. Set the **Customer gets** section: quantity of free/discounted items and which products
4. Set the discount percentage (100% = free)
5. Set a **Maximum uses** limit if needed

**Tiered quantity discounts (Shopify):**
Native Shopify does not support tiered quantity breaks (e.g., 1–4 units = full price, 5–9 = 10% off, 10+ = 20% off) without an app. Options:
- **Bold Discounts** (App Store, ~$20/month): visual interface for tiered pricing rules
- **Wholesale Club** (App Store): adds a wholesale/tiered pricing layer for B2B
- **Shopify Plus + Shopify Functions**: write a Discount Function in JavaScript that applies the correct tier based on cart line quantities

**Stacking rules:**
In Shopify, each discount can be configured to combine with others:
1. Edit a discount → scroll to **Combinations**
2. Toggle which discount types it can be combined with: product discounts, order discounts, shipping discounts

---

#### WooCommerce

WooCommerce core coupons cover single-code, percentage, and fixed-amount discounts. For automatic, rule-based, and BOGO discounts, use the **Dynamic Pricing & Discounts** plugin.

**Installing Dynamic Pricing:**
1. Purchase and install **YITH WooCommerce Dynamic Pricing & Discounts** or the WooCommerce-branded **Dynamic Pricing** extension
2. Go to **WooCommerce → Dynamic Pricing → Add Rule**

**Creating a tiered quantity rule:**
1. Set rule type to **Product Pricing** or **Category Pricing**
2. Add pricing tiers:
   - From 1 to 4 quantity: 0% off (full price)
   - From 5 to 9: 10% off
   - From 10 to 24: 20% off
   - From 25 and above: 30% off
3. Set which products or categories this applies to
4. Save and publish

**BOGO in WooCommerce:**
1. In Dynamic Pricing, create a new rule of type **Cart Pricing**
2. Set the condition: "When cart contains X of [product]"
3. Set the action: "Add Y of [product] at [0% of regular price]"
4. Or use **WooCommerce Smart Coupons** for gift-with-purchase

**Preventing unintended stacking:**
In WooCommerce core coupons, tick **Individual use only** to prevent a coupon from combining with other coupons. For automatic rules in Dynamic Pricing, each rule has a "Stops further rules" option that prevents lower-priority rules from applying.

---

#### BigCommerce

BigCommerce has a native **Promotions** system that covers most discount scenarios.

1. Go to **Marketing → Promotions → Create promotion**
2. Set the **Promotion type**: cart-level discount, item-level discount, free shipping, free item, BOGO
3. Configure **Conditions**:
   - Minimum cart subtotal
   - Specific products or categories included/excluded
   - Customer groups (for B2B or segment-specific pricing)
4. Set **Actions**: the discount amount and which items it applies to
5. Set **Coupon** (optional): attach a code to require manual application, or leave blank for automatic
6. Set **Rules** for stacking: BigCommerce allows defining whether a promotion can stack with other promotions

**Tiered quantity pricing on BigCommerce:**
Use the **Price Lists** feature (Plus plan and above):
1. Go to **Products → Price Lists**
2. Create a price list with explicit per-unit prices at different quantity thresholds
3. Assign the price list to a customer group
4. Customers in that group automatically see the tiered prices

---

#### Custom / Headless

For custom storefronts, the discount engine evaluates applicable discounts and allocates them to cart lines. The key principles are: evaluate server-side, apply in priority order, and enforce stacking rules.

```typescript
interface Discount {
  id: string;
  type: 'percentage' | 'fixed_amount' | 'bogo' | 'free_shipping';
  value: number;        // percentage (0-100) or cents
  target: 'order' | 'line_item' | 'shipping';
  isStackable: boolean;
  minCartCents?: number;
  minQuantity?: number;
  entitledProductIds?: string[];
  excludedProductIds?: string[];
  startsAt: Date;
  endsAt?: Date;
}

interface CartLine {
  id: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
}

function evaluateDiscounts(
  cart: { lines: CartLine[]; subtotalCents: number },
  discounts: Discount[]
): { discountId: string; amountCents: number; affectedLineIds: string[] }[] {
  const now = new Date();
  const eligible = discounts.filter(d =>
    d.startsAt <= now && (!d.endsAt || d.endsAt > now)
  );

  // Sort: non-stackable first, then higher-value
  const sorted = [...eligible].sort((a, b) => (a.isStackable ? 1 : -1) - (b.isStackable ? 1 : -1));

  const applications: { discountId: string; amountCents: number; affectedLineIds: string[] }[] = [];
  let nonStackableApplied = false;

  for (const discount of sorted) {
    if (!discount.isStackable && nonStackableApplied) continue;

    // Check minimum cart value
    if (discount.minCartCents && cart.subtotalCents < discount.minCartCents) continue;

    const eligibleLines = cart.lines.filter(line =>
      (!discount.entitledProductIds || discount.entitledProductIds.includes(line.productId)) &&
      (!discount.excludedProductIds || !discount.excludedProductIds.includes(line.productId))
    );
    if (eligibleLines.length === 0) continue;

    let amountCents = 0;
    if (discount.type === 'percentage') {
      amountCents = Math.round(
        eligibleLines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0) * discount.value / 100
      );
    } else if (discount.type === 'fixed_amount') {
      amountCents = Math.min(discount.value, cart.subtotalCents);
    } else if (discount.type === 'bogo') {
      const buyQty = discount.minQuantity ?? 1;
      for (const line of eligibleLines) {
        const freeItems = Math.floor(line.quantity / (buyQty + discount.value)) * discount.value;
        amountCents += freeItems * line.unitPriceCents;
      }
    }

    if (amountCents > 0) {
      applications.push({ discountId: discount.id, amountCents, affectedLineIds: eligibleLines.map(l => l.id) });
      if (!discount.isStackable) nonStackableApplied = true;
    }
  }

  return applications;
}
```

Always re-run this evaluation at order creation, not just at cart-add time, to catch race conditions and expired discounts.

## Best Practices

- **Always calculate discounts server-side** — never trust client-submitted discount amounts; recalculate at checkout
- **Define stacking rules explicitly** — decide upfront whether multiple discounts can combine and document the policy for your merchandising team
- **Cap maximum discount amounts** — for percentage discounts, set a maximum dollar cap to prevent runaway promotions
- **Exclude sale items from additional promotions** — prevent compounding discounts from destroying margins; Shopify and WooCommerce both support "exclude sale items" rules
- **Test rules on staging before activating** — particularly important for automatic discounts that apply to all eligible customers without requiring a code
- **Log every discount application** — record discount ID, customer, order, and amount for audit trails and promotion ROI reporting
- **Set clear end dates** — automatic discounts without an end date continue applying indefinitely; always set an expiry

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Discount applied after order is placed (stale cart) | Re-validate all discounts at order creation; remove expired or invalid ones before charging |
| BOGO applied to a single-unit cart | Enforce a minimum cart quantity equal to the buy quantity before the BOGO triggers |
| Discount causes an order total to go negative | Cap the total discount at the cart subtotal; no order total should go below zero |
| Automatic and code-based discounts stack unexpectedly | Review the "Combinations" settings on each discount in Shopify; use "Individual use only" in WooCommerce coupons |
| Tiered discount shows wrong tier when quantity is updated | Recalculate the applicable tier on every cart quantity change, not just at checkout |

## Related Skills

- @stripe-integration
- @checkout-flow-optimization
- @coupon-management
- @price-rules-engine
- @volume-pricing
