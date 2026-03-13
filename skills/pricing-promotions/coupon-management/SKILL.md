---
name: coupon-management
description: "Build a coupon system with percentage and fixed discounts, usage limits per customer, expiration dates, and bulk unique-code generation"
category: pricing-promotions
risk: critical
source: curated
date_added: "2026-03-12"
tags: [coupons, discounts, promotions, validation, bulk-generation, promo-codes]
triggers: ["add coupon system", "create promo codes", "discount codes", "coupon validation", "bulk generate coupons"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Coupon Management

## Overview

Coupon systems let merchants create promotional codes with configurable rules: percentage or fixed-amount discounts, minimum order requirements, usage limits per coupon or per customer, and expiration dates. Every major e-commerce platform includes a built-in coupon system — you almost never need to build one from scratch. This skill walks you through setting up coupon management on each platform and explains when to reach for an app or plugin for advanced requirements like bulk unique codes or campaign tracking.

## When to Use This Skill

- When adding promotional codes to a checkout flow for the first time
- When migrating from a simple discount field to a rule-based coupon engine
- When running marketing campaigns that require unique, single-use codes for each recipient
- When building an admin interface to create and monitor coupon performance
- When enforcing complex coupon rules such as product/category exclusions or customer segment restrictions

## Core Instructions

### Step 1: Determine the merchant's platform and the right tool

| Platform | Built-in Capability | When to Add an App/Plugin |
|----------|-------------------|--------------------------|
| **Shopify** | Shopify Discounts — supports percentage, fixed amount, free shipping, BOGO; usage limits, expiry, minimum purchase | When you need bulk unique codes (Shopify supports import), customer-group-specific coupons, or loyalty integration (Smile.io, LoyaltyLion) |
| **WooCommerce** | WooCommerce Coupons — built into core; percentage, fixed cart, fixed product, free shipping types | When you need bulk unique code generation: WooCommerce Smart Coupons plugin; advanced rules: YITH WooCommerce Dynamic Pricing & Discounts |
| **BigCommerce** | Coupon codes built in — percentage, fixed amount, free shipping, free product types | When you need B2B-specific codes or advanced restrictions; BigCommerce app marketplace has options like Coupon Manager Pro |
| **Custom / Headless** | Must build — see Custom section below | N/A — you are building the system |

### Step 2: Set up standard coupons on your platform

---

#### Shopify

1. Go to **Discounts** in the Shopify admin sidebar
2. Click **Create discount** and choose the type:
   - **Amount off products** — percentage or fixed amount off specific products/collections
   - **Amount off order** — percentage or fixed amount off the entire cart
   - **Buy X get Y** — BOGO and bundle offers
   - **Free shipping** — removes shipping cost when code is applied
3. Configure the code:
   - Enter a code (e.g., `SUMMER20`) or click **Generate code** for a random one
   - Set **Minimum purchase requirements** (minimum subtotal or minimum quantity)
   - Set **Customer eligibility** — all customers, specific customer segments, or specific customers
   - Set **Maximum discount uses** — total uses and/or one use per customer
   - Set **Active dates** — start and optional end date
4. Click **Save discount**

**Bulk unique codes on Shopify:**
1. In the same Discounts screen, choose **Generate codes** instead of entering a single code
2. Set the quantity (up to 100 at a time from the UI; use the Shopify Admin API for larger volumes)
3. All generated codes share the same rules (discount value, expiry, usage limits)
4. Export the codes to CSV for use in your email marketing platform

**Shopify Plus — Shopify Scripts for advanced stacking:**
- Use **Shopify Scripts** (Shopify Plus only) for custom coupon logic: e.g., different discount percentages by customer tag, auto-apply coupons without a code
- Access via **Apps → Script Editor** in your Shopify admin

---

#### WooCommerce

1. Go to **WooCommerce → Coupons → Add coupon**
2. Set the **Coupon code** (unique identifier customers type at checkout)
3. Under **General** tab:
   - **Discount type**: Percentage discount, Fixed cart discount, Fixed product discount
   - **Coupon amount**: The discount value
   - **Free shipping**: Toggle to make this code grant free shipping
   - **Coupon expiry date**: Date after which the code stops working
4. Under **Usage restriction** tab:
   - **Minimum spend**: Cart subtotal must exceed this amount
   - **Maximum spend**: Cart subtotal cannot exceed this amount
   - **Individual use only**: Cannot be combined with other coupons
   - **Exclude sale items**: Don't apply to already-reduced items
   - **Products** and **Exclude products**: Restrict or exclude specific products
   - **Product categories** and **Exclude categories**: Restrict or exclude by category
   - **Email restrictions**: Limit to specific customer emails
5. Under **Usage limits** tab:
   - **Usage limit per coupon**: Total number of times this code can be used
   - **Usage limit per user**: How many times a single customer can use it
6. Click **Publish**

**Bulk unique codes on WooCommerce:**
- Install **WooCommerce Smart Coupons** (premium plugin, ~$99/year from StoreApps)
- Go to **WooCommerce → Smart Coupons → Generate Coupons**
- Set quantity, discount amount, expiry, and prefix — generates a CSV of unique codes
- Import or distribute via your email platform

---

#### BigCommerce

1. Go to **Marketing → Coupon Codes → Create Coupon Code**
2. Fill in:
   - **Code**: The code customers enter (or use the auto-generate button)
   - **Type**: Percentage off order, Dollar amount off order, Percentage off product, Dollar amount off product, Free shipping, Free product
   - **Discount amount**: The value
   - **Applies to**: All items, items from specific categories, or specific products
3. Under **Restrictions**:
   - **Minimum order**: Subtotal must exceed this amount
   - **Max uses**: Total redemptions allowed
   - **Max uses per customer**: Per-account limit
   - **Expiration date**: When the code stops working
4. Click **Save**

**Bulk codes on BigCommerce:**
Use the BigCommerce Promotions API (`POST /v2/coupons`) to generate codes programmatically, then export for distribution.

---

#### Custom / Headless

For headless stores, you need to build the validation and redemption logic. The key requirements are atomic redemption (prevent race conditions when two customers use the last available redemption simultaneously) and idempotent order processing.

```typescript
// Coupon validation at checkout
async function validateCoupon(
  code: string,
  customerId: string,
  orderSubtotalCents: number
): Promise<{ valid: boolean; discountCents: number; error?: string }> {
  const coupon = await db.coupons.findOne({ code: code.toUpperCase().trim(), is_active: true });
  if (!coupon) return { valid: false, discountCents: 0, error: 'Code not found' };

  const now = new Date();
  if (coupon.expires_at && coupon.expires_at < now) return { valid: false, discountCents: 0, error: 'Code expired' };
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) return { valid: false, discountCents: 0, error: 'Code fully used' };
  if (coupon.min_order_cents && orderSubtotalCents < coupon.min_order_cents) return { valid: false, discountCents: 0, error: `Minimum order $${coupon.min_order_cents / 100}` };

  // Per-customer limit check
  if (coupon.per_customer_limit) {
    const uses = await db.couponRedemptions.count({ coupon_id: coupon.id, customer_id: customerId });
    if (uses >= coupon.per_customer_limit) return { valid: false, discountCents: 0, error: 'Already used' };
  }

  const discountCents = coupon.type === 'percentage'
    ? Math.round(orderSubtotalCents * (coupon.value / 100))
    : Math.min(coupon.value_cents, orderSubtotalCents);

  return { valid: true, discountCents };
}

// Atomic redemption — use inside the order creation transaction
async function redeemCoupon(tx: Tx, couponId: string, customerId: string, orderId: string, discountCents: number) {
  // Atomic increment with guard — prevents over-redemption under concurrency
  const result = await tx.raw(
    `UPDATE coupons SET usage_count = usage_count + 1
     WHERE id = ? AND (usage_limit IS NULL OR usage_count < usage_limit)
     RETURNING id`,
    [couponId]
  );
  if (result.rowCount === 0) throw new Error('COUPON_EXHAUSTED');

  await tx.couponRedemptions.insert({ coupon_id: couponId, customer_id: customerId, order_id: orderId, discount_cents: discountCents });
}
```

**Bulk code generation for email campaigns:**

```typescript
import crypto from 'crypto';

function generateCode(prefix = 'PROMO', length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  return prefix + '-' + Array.from(crypto.randomBytes(length))
    .map(b => chars[b % chars.length]).join('');
}

async function bulkGenerate(template: CouponTemplate, quantity: number): Promise<string[]> {
  const codes: string[] = [];
  while (codes.length < quantity) {
    const batch = Array.from({ length: Math.min(500, quantity - codes.length) }, () => generateCode(template.prefix));
    const inserted = await db.coupons.insertMany(
      batch.map(code => ({ ...template, code, usage_limit: 1, per_customer_limit: 1 })),
      { onConflict: 'ignore' }
    );
    codes.push(...inserted.map(r => r.code));
  }
  return codes;
}
```

## Best Practices

- **Normalize codes to uppercase** — store and compare codes in uppercase and trim whitespace to prevent "code not found" errors from minor formatting differences
- **Use single-use codes for targeted campaigns** — set usage limit to 1 per code when distributing unique codes via email to prevent sharing
- **Validate at order creation, not just at cart** — re-check coupon validity (expiry, usage limits) when the order is actually placed to handle race conditions
- **Soft-delete coupons** — deactivate rather than delete to preserve redemption history for accounting
- **Track discount abuse** — if a customer has abandoned and recovered with a discount code three or more times, consider excluding them from discount campaigns
- **Cap maximum discount amounts** — for percentage coupons, set a maximum dollar discount to prevent runaway promotions (e.g., 20% off capped at $50)

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Two customers redeem the last use simultaneously | Use atomic `UPDATE ... WHERE usage_count < usage_limit` and verify rowCount === 1 (custom builds); platforms handle this natively |
| Coupon still valid after order cancellation | Decrement the usage count when an order is cancelled or refunded; Shopify does this automatically |
| Per-customer limit bypassed with multiple accounts | Supplement customer-ID checks with email checks; for high-value campaigns, require verified phone numbers |
| Bulk-generated codes collide with existing ones | Use `INSERT ... ON CONFLICT DO NOTHING` and regenerate collisions until target quantity is met |
| Free-shipping coupon stacks with a percentage discount unexpectedly | Define your stacking policy explicitly; on Shopify, use the "Can be combined with" settings on each discount |

## Related Skills

- @discount-engine
- @price-rules-engine
- @ab-testing-pricing
- @loyalty-points-system
- @checkout-flow-optimization
