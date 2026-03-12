---
name: coupon-management
description: "Coupon CRUD, validation rules, usage limits, single-use codes, bulk generation"
category: pricing-promotions
risk: safe
source: curated
date_added: "2026-03-12"
tags: [coupons, discounts, promotions, validation, bulk-generation, promo-codes]
triggers: ["add coupon system", "create promo codes", "discount codes", "coupon validation", "bulk generate coupons"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Coupon Management

## Overview

Build a coupon system that handles the full lifecycle: creation with configurable rules, validation at checkout, usage tracking, and bulk code generation. Supports percentage and fixed-amount discounts, minimum order requirements, usage limits per coupon and per customer, expiration dates, and single-use codes for targeted campaigns.

## When to Use This Skill

- When adding promotional codes to a checkout flow for the first time
- When migrating from a simple discount field to a rule-based coupon engine
- When running marketing campaigns that require unique, single-use codes for each recipient
- When building an admin interface to create and monitor coupon performance
- When enforcing complex coupon rules such as product/category exclusions or customer segment restrictions

## Core Instructions

1. **Design the coupon schema**

   ```sql
   CREATE TABLE coupons (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     code         VARCHAR(64) NOT NULL UNIQUE,
     type         VARCHAR(16) NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping')),
     value        NUMERIC(10,2) NOT NULL,          -- e.g. 20.00 = 20% off or $20 off
     min_order_amount NUMERIC(10,2) DEFAULT 0,
     max_discount_amount NUMERIC(10,2),            -- cap for percentage discounts
     usage_limit  INTEGER,                          -- NULL = unlimited
     usage_count  INTEGER NOT NULL DEFAULT 0,
     per_customer_limit INTEGER DEFAULT 1,
     starts_at    TIMESTAMPTZ,
     expires_at   TIMESTAMPTZ,
     is_active    BOOLEAN NOT NULL DEFAULT true,
     product_ids  UUID[],                           -- NULL = applies to all products
     category_ids UUID[],
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE TABLE coupon_redemptions (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     coupon_id    UUID NOT NULL REFERENCES coupons(id),
     customer_id  UUID NOT NULL,
     order_id     UUID NOT NULL,
     discount_amount NUMERIC(10,2) NOT NULL,
     redeemed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE INDEX idx_coupons_code ON coupons(code);
   CREATE INDEX idx_redemptions_customer_coupon ON coupon_redemptions(customer_id, coupon_id);
   ```

2. **Validate a coupon at checkout**

   ```typescript
   interface CouponValidationResult {
     valid: boolean;
     discountAmount: number;
     errorCode?: 'EXPIRED' | 'USAGE_LIMIT_REACHED' | 'MIN_ORDER_NOT_MET' | 'NOT_FOUND' | 'CUSTOMER_LIMIT_REACHED';
   }

   async function validateCoupon(
     code: string,
     customerId: string,
     orderSubtotal: number,
     itemIds: string[]
   ): Promise<CouponValidationResult> {
     const coupon = await db.coupons.findByCode(code.toUpperCase().trim());

     if (!coupon || !coupon.is_active) {
       return { valid: false, errorCode: 'NOT_FOUND', discountAmount: 0 };
     }

     const now = new Date();
     if (coupon.starts_at && coupon.starts_at > now) {
       return { valid: false, errorCode: 'NOT_FOUND', discountAmount: 0 };
     }
     if (coupon.expires_at && coupon.expires_at < now) {
       return { valid: false, errorCode: 'EXPIRED', discountAmount: 0 };
     }
     if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
       return { valid: false, errorCode: 'USAGE_LIMIT_REACHED', discountAmount: 0 };
     }
     if (orderSubtotal < coupon.min_order_amount) {
       return { valid: false, errorCode: 'MIN_ORDER_NOT_MET', discountAmount: 0 };
     }

     // Per-customer limit check
     if (coupon.per_customer_limit !== null) {
       const redemptionCount = await db.couponRedemptions.countByCustomerAndCoupon(customerId, coupon.id);
       if (redemptionCount >= coupon.per_customer_limit) {
         return { valid: false, errorCode: 'CUSTOMER_LIMIT_REACHED', discountAmount: 0 };
       }
     }

     const discountAmount = calculateDiscount(coupon, orderSubtotal, itemIds);
     return { valid: true, discountAmount };
   }

   function calculateDiscount(coupon: Coupon, subtotal: number, itemIds: string[]): number {
     if (coupon.type === 'fixed_amount') return Math.min(coupon.value, subtotal);
     if (coupon.type === 'percentage') {
       const raw = subtotal * (coupon.value / 100);
       return coupon.max_discount_amount ? Math.min(raw, coupon.max_discount_amount) : raw;
     }
     if (coupon.type === 'free_shipping') return 0; // handled separately in shipping calc
     return 0;
   }
   ```

3. **Redeem a coupon atomically inside the order transaction**

   ```typescript
   async function redeemCoupon(
     tx: DatabaseTransaction,
     couponId: string,
     customerId: string,
     orderId: string,
     discountAmount: number
   ): Promise<void> {
     // Increment usage_count with optimistic locking to prevent race conditions
     const updated = await tx.raw(`
       UPDATE coupons
       SET usage_count = usage_count + 1
       WHERE id = ? AND (usage_limit IS NULL OR usage_count < usage_limit)
       RETURNING id
     `, [couponId]);

     if (updated.rowCount === 0) {
       throw new Error('COUPON_EXHAUSTED'); // race condition — coupon was just used up
     }

     await tx.couponRedemptions.insert({
       coupon_id: couponId,
       customer_id: customerId,
       order_id: orderId,
       discount_amount: discountAmount,
     });
   }
   ```

4. **Bulk generate unique single-use codes**

   ```typescript
   import crypto from 'crypto';

   function generateCouponCode(prefix = 'PROMO', length = 8): string {
     const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit ambiguous chars (0/O, 1/I)
     const bytes = crypto.randomBytes(length);
     const code = Array.from(bytes)
       .map(b => chars[b % chars.length])
       .join('');
     return `${prefix}-${code}`;
   }

   async function bulkGenerateCoupons(
     template: Omit<Coupon, 'id' | 'code' | 'usage_count'>,
     quantity: number
   ): Promise<string[]> {
     const codes: string[] = [];
     const batchSize = 500;

     while (codes.length < quantity) {
       const batch = Array.from({ length: Math.min(batchSize, quantity - codes.length) }, () =>
         generateCouponCode(template.prefix)
       );

       // Insert and get back the codes that didn't collide
       const inserted = await db.coupons.insertMany(
         batch.map(code => ({ ...template, code, usage_limit: 1, per_customer_limit: 1 })),
         { onConflict: 'ignore' }
       );
       codes.push(...inserted.map(r => r.code));
     }

     return codes;
   }
   ```

5. **Expose a clean API for the checkout frontend**

   ```typescript
   // POST /api/coupons/validate
   app.post('/api/coupons/validate', requireAuth, async (req, res) => {
     const { code, orderSubtotal, itemIds } = req.body;
     const result = await validateCoupon(code, req.user.id, orderSubtotal, itemIds);

     if (!result.valid) {
       return res.status(422).json({ error: result.errorCode });
     }
     res.json({ discountAmount: result.discountAmount, code: code.toUpperCase().trim() });
   });

   // DELETE /api/coupons/:id  (admin)
   app.delete('/api/coupons/:id', requireAdmin, async (req, res) => {
     await db.coupons.update(req.params.id, { is_active: false });
     res.json({ success: true });
   });
   ```

## Examples

### Create a 20%-off coupon with a $50 minimum order, capped at $30 discount

```typescript
await db.coupons.insert({
  code: 'SUMMER20',
  type: 'percentage',
  value: 20,
  min_order_amount: 50.00,
  max_discount_amount: 30.00,
  usage_limit: 500,
  per_customer_limit: 1,
  expires_at: new Date('2026-09-01T00:00:00Z'),
  is_active: true,
});
```

### Generate 10,000 single-use email campaign codes

```typescript
const codes = await bulkGenerateCoupons(
  {
    type: 'fixed_amount',
    value: 10.00,
    min_order_amount: 0,
    expires_at: new Date('2026-06-30T00:00:00Z'),
    is_active: true,
    prefix: 'EMAIL',
  },
  10000
);

// Export to CSV for your email marketing platform
const csv = ['code', ...codes].join('\n');
await fs.writeFile('campaign-codes.csv', csv);
```

## Best Practices

- **Normalize coupon codes** — always store and compare codes in uppercase, trim whitespace to prevent "code not found" errors from case differences
- **Use database transactions** — validate and redeem in the same transaction as order creation to prevent inventory overselling and coupon over-redemption
- **Increment `usage_count` atomically** — use `UPDATE ... WHERE usage_count < usage_limit` rather than read-then-write to handle concurrent checkouts correctly
- **Never expose internal IDs in coupon codes** — codes should be opaque random strings, not sequential integers that are easy to enumerate
- **Log every validation attempt** — store failed validations with reason codes for fraud detection and campaign analytics
- **Soft-delete coupons** — set `is_active = false` rather than deleting rows to preserve redemption history for accounting
- **Index the `code` column** — coupon lookup happens on every checkout; an unindexed code column will cause slow queries at scale
- **Set `per_customer_limit = 1` by default** for campaign codes — prevents a single customer from claiming multiple unique codes if they have multiple email addresses

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Two customers redeem the last use of a coupon simultaneously | Use an atomic `UPDATE ... WHERE usage_count < usage_limit` and check `rowCount === 1` |
| Coupon applied before shipping, then free-shipping coupon stacks | Evaluate coupon type first — flag `free_shipping` type coupons and skip from subtotal discount calculation |
| Bulk-generated codes collide with existing codes | Use `INSERT ... ON CONFLICT DO NOTHING` and keep generating until the target quantity is reached |
| Customers bypass per-customer limit with multiple accounts | Supplement customer-ID checks with email-address checks or IP rate limiting for anonymous sessions |
| Coupon still works after order cancellation | Decrement `usage_count` and delete the redemption row when an order is cancelled or refunded |

## Related Skills

- @discount-engine
- @price-rules-engine
- @ab-testing-pricing
- @loyalty-points-system
- @checkout-flow-optimization
