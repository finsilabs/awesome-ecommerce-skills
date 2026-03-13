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
platforms: [platform-agnostic]
difficulty: intermediate
---

# Discount Engine

## Overview

Build a flexible, rule-based discount engine that supports percentage off, fixed amount off, buy-one-get-one (BOGO), tiered pricing, free shipping, and conditional discounts. This skill covers the data model for discount rules, the evaluation pipeline that applies discounts to a cart, stacking and exclusion logic, and safeguards to prevent margin-destroying combinations.

## When to Use This Skill

- When building a promotions system for a new e-commerce store
- When adding coupon code support to an existing checkout flow
- When implementing tiered pricing (e.g., buy 3+ get 10% off, buy 10+ get 20% off)
- When creating automatic discounts that apply based on cart conditions
- When you need BOGO, bundle, or gift-with-purchase promotions

## Prerequisites & Platform Notes

**Shopify**: Use Shopify's built-in discount system, Shopify Functions for custom discount logic, or apps like Bold Discounts. Price rules can be managed via the Admin API.
**WooCommerce**: WooCommerce has built-in coupons and pricing rules. Extend with plugins (Dynamic Pricing, WooCommerce Subscriptions) or custom code via woocommerce_get_price filter.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A store with pricing control, Shopify Functions or WooCommerce hooks for custom logic

## Core Instructions

1. **Define the discount data model**

   ```typescript
   interface Discount {
     id: string;
     code?: string;              // null for automatic discounts
     title: string;
     type: 'percentage' | 'fixed_amount' | 'bogo' | 'free_shipping';
     value: number;              // percentage (0-100) or fixed amount in cents
     target: 'order' | 'line_item' | 'shipping';
     allocationMethod: 'across' | 'each';  // spread across items or apply per item

     // Conditions
     conditions: DiscountCondition[];
     minPurchaseAmount?: number;  // in cents
     minQuantity?: number;

     // Limits
     maxUses?: number;
     currentUses: number;
     maxUsesPerCustomer?: number;
     maxDiscountAmount?: number;  // cap the discount value

     // Scope
     appliesTo: 'all' | 'specific_products' | 'specific_collections' | 'specific_customers';
     entitledProductIds?: string[];
     entitledCollectionIds?: string[];
     entitledCustomerIds?: string[];
     excludedProductIds?: string[];

     // Stacking
     combinesWithProductDiscounts: boolean;
     combinesWithOrderDiscounts: boolean;
     combinesWithShippingDiscounts: boolean;

     // Schedule
     startsAt: Date;
     endsAt?: Date;
     isActive: boolean;

     createdAt: Date;
     updatedAt: Date;
   }

   interface DiscountCondition {
     type: 'min_purchase' | 'min_quantity' | 'customer_tag' | 'first_order' | 'specific_product';
     value: string | number;
   }
   ```

2. **Build the discount evaluation pipeline**

   ```typescript
   interface CartContext {
     lineItems: CartLineItem[];
     subtotal: number;           // in cents
     customerId?: string;
     customerTags: string[];
     customerOrderCount: number;
     shippingCost: number;
   }

   interface CartLineItem {
     id: string;
     productId: string;
     variantId: string;
     collectionIds: string[];
     quantity: number;
     unitPrice: number;          // in cents
     lineTotal: number;          // unitPrice * quantity
   }

   interface DiscountAllocation {
     discountId: string;
     code?: string;
     title: string;
     amount: number;             // total discount in cents
     lineAllocations: Map<string, number>; // lineItemId -> discount amount
   }

   function evaluateDiscounts(
     cart: CartContext,
     discounts: Discount[]
   ): DiscountAllocation[] {
     const now = new Date();

     // 1. Filter to active, valid discounts
     const eligible = discounts.filter(d =>
       d.isActive &&
       d.startsAt <= now &&
       (!d.endsAt || d.endsAt > now) &&
       (!d.maxUses || d.currentUses < d.maxUses)
     );

     // 2. Check conditions for each discount
     const qualifying = eligible.filter(d => meetsConditions(d, cart));

     // 3. Sort by priority: specific > general, higher value > lower
     qualifying.sort((a, b) => discountPriority(b) - discountPriority(a));

     // 4. Apply stacking logic
     const allocations: DiscountAllocation[] = [];
     const appliedTypes = new Set<string>();

     for (const discount of qualifying) {
       if (!canStack(discount, appliedTypes)) continue;

       const allocation = calculateAllocation(discount, cart, allocations);
       if (allocation.amount > 0) {
         allocations.push(allocation);
         appliedTypes.add(discount.target);
       }
     }

     return allocations;
   }
   ```

3. **Implement condition checking**

   ```typescript
   function meetsConditions(discount: Discount, cart: CartContext): boolean {
     // Check minimum purchase amount
     if (discount.minPurchaseAmount && cart.subtotal < discount.minPurchaseAmount) {
       return false;
     }

     // Check minimum quantity
     if (discount.minQuantity) {
       const eligibleQty = getEligibleQuantity(discount, cart);
       if (eligibleQty < discount.minQuantity) return false;
     }

     // Check product/collection scope
     if (discount.appliesTo === 'specific_products') {
       const hasEligibleItem = cart.lineItems.some(
         li => discount.entitledProductIds?.includes(li.productId)
              && !discount.excludedProductIds?.includes(li.productId)
       );
       if (!hasEligibleItem) return false;
     }

     if (discount.appliesTo === 'specific_collections') {
       const hasEligibleItem = cart.lineItems.some(
         li => li.collectionIds.some(c => discount.entitledCollectionIds?.includes(c))
       );
       if (!hasEligibleItem) return false;
     }

     // Check customer conditions
     for (const condition of discount.conditions) {
       switch (condition.type) {
         case 'first_order':
           if (cart.customerOrderCount > 0) return false;
           break;
         case 'customer_tag':
           if (!cart.customerTags.includes(condition.value as string)) return false;
           break;
       }
     }

     return true;
   }
   ```

4. **Calculate discount amounts by type**

   ```typescript
   function calculateAllocation(
     discount: Discount,
     cart: CartContext,
     existingAllocations: DiscountAllocation[]
   ): DiscountAllocation {
     const lineAllocations = new Map<string, number>();
     let totalDiscount = 0;

     const eligibleItems = getEligibleLineItems(discount, cart);
     const alreadyDiscounted = sumExistingDiscounts(existingAllocations);

     switch (discount.type) {
       case 'percentage': {
         for (const item of eligibleItems) {
           const itemDiscount = Math.round(
             item.lineTotal * (discount.value / 100)
           );
           lineAllocations.set(item.id, itemDiscount);
           totalDiscount += itemDiscount;
         }
         break;
       }

       case 'fixed_amount': {
         if (discount.target === 'order') {
           // Spread fixed amount proportionally across eligible items
           const eligibleTotal = eligibleItems.reduce((s, i) => s + i.lineTotal, 0);
           const discountAmount = Math.min(discount.value, eligibleTotal);

           for (const item of eligibleItems) {
             const proportion = item.lineTotal / eligibleTotal;
             const itemDiscount = Math.round(discountAmount * proportion);
             lineAllocations.set(item.id, itemDiscount);
             totalDiscount += itemDiscount;
           }

           // Remainder allocation: Math.round() per item can cause the sum to drift by 1-2 cents.
           // Adjust the last item so the total exactly equals the intended discount amount.
           const actualTotal = Array.from(lineAllocations.values()).reduce((s, v) => s + v, 0);
           const remainder = discountAmount - actualTotal;
           if (remainder !== 0 && eligibleItems.length > 0) {
             const lastItem = eligibleItems[eligibleItems.length - 1];
             lineAllocations.set(lastItem.id, (lineAllocations.get(lastItem.id) ?? 0) + remainder);
             totalDiscount += remainder;
           }
         } else {
           // Apply fixed amount per eligible item
           for (const item of eligibleItems) {
             const itemDiscount = Math.min(discount.value, item.unitPrice) * item.quantity;
             lineAllocations.set(item.id, itemDiscount);
             totalDiscount += itemDiscount;
           }
         }
         break;
       }

       case 'bogo': {
         // Buy X get Y free (value = number of free items per qualifying group)
         const buyQty = discount.minQuantity || 1;
         const getQty = discount.value;

         for (const item of eligibleItems) {
           const groups = Math.floor(item.quantity / (buyQty + getQty));
           const freeItems = groups * getQty;
           const itemDiscount = freeItems * item.unitPrice;
           lineAllocations.set(item.id, itemDiscount);
           totalDiscount += itemDiscount;
         }
         break;
       }

       case 'free_shipping': {
         totalDiscount = cart.shippingCost;
         break;
       }
     }

     // Apply max discount cap
     if (discount.maxDiscountAmount) {
       totalDiscount = Math.min(totalDiscount, discount.maxDiscountAmount);
     }

     return {
       discountId: discount.id,
       code: discount.code,
       title: discount.title,
       amount: totalDiscount,
       lineAllocations,
     };
   }
   ```

5. **Implement stacking and exclusion rules**

   ```typescript
   function canStack(discount: Discount, appliedTypes: Set<string>): boolean {
     if (discount.target === 'line_item' && appliedTypes.has('line_item')) {
       return discount.combinesWithProductDiscounts;
     }
     if (discount.target === 'order' && appliedTypes.has('order')) {
       return discount.combinesWithOrderDiscounts;
     }
     if (discount.target === 'shipping' && appliedTypes.has('shipping')) {
       return discount.combinesWithShippingDiscounts;
     }
     return true;
   }

   function discountPriority(discount: Discount): number {
     // Automatic discounts before code-based
     let priority = discount.code ? 0 : 100;
     // Specific > general scope
     if (discount.appliesTo === 'specific_products') priority += 50;
     else if (discount.appliesTo === 'specific_collections') priority += 25;
     return priority;
   }
   ```

6. **Add coupon code validation endpoint**

   ```typescript
   // POST /api/cart/discount
   async function applyDiscountCode(req: Request, res: Response) {
     const { cartId, code } = req.body;

     // Find discount by code (case-insensitive)
     const discount = await db.discounts.findOne({
       code: code.toUpperCase().trim(),
       isActive: true,
     });

     if (!discount) {
       return res.status(404).json({ error: 'Discount code not found' });
     }

     // Validate expiry
     const now = new Date();
     if (discount.endsAt && discount.endsAt < now) {
       return res.status(410).json({ error: 'This discount has expired' });
     }

     // Validate usage limits
     if (discount.maxUses && discount.currentUses >= discount.maxUses) {
       return res.status(410).json({ error: 'This discount has reached its usage limit' });
     }

     // Check per-customer limit
     if (discount.maxUsesPerCustomer) {
       const customerUses = await db.discountUsages.count({
         discountId: discount.id,
         customerId: req.user?.id,
       });
       if (customerUses >= discount.maxUsesPerCustomer) {
         return res.status(403).json({ error: 'You have already used this discount' });
       }
     }

     // Apply to cart and recalculate
     const cart = await getCartWithItems(cartId);
     const allocations = evaluateDiscounts(cart, [discount]);

     if (allocations.length === 0) {
       return res.status(422).json({
         error: 'Your cart does not meet the requirements for this discount',
       });
     }

     await saveCartDiscounts(cartId, allocations);
     return res.json({ discount: allocations[0], cart: await getUpdatedCart(cartId) });
   }
   ```

## Examples

### Tiered pricing discount (buy more, save more)

```typescript
// Create a tiered discount: 10% off 3+, 15% off 5+, 20% off 10+
const tieredDiscounts: Discount[] = [
  {
    id: 'tier-10pct',
    title: 'Buy 3+, save 10%',
    type: 'percentage',
    value: 10,
    target: 'line_item',
    allocationMethod: 'each',
    minQuantity: 3,
    conditions: [],
    appliesTo: 'specific_collections',
    entitledCollectionIds: ['bulk-eligible'],
    combinesWithProductDiscounts: false, // Only best tier applies
    combinesWithOrderDiscounts: true,
    combinesWithShippingDiscounts: true,
    startsAt: new Date('2026-01-01'),
    isActive: true,
    currentUses: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'tier-15pct',
    title: 'Buy 5+, save 15%',
    type: 'percentage',
    value: 15,
    target: 'line_item',
    allocationMethod: 'each',
    minQuantity: 5,
    conditions: [],
    appliesTo: 'specific_collections',
    entitledCollectionIds: ['bulk-eligible'],
    combinesWithProductDiscounts: false,
    combinesWithOrderDiscounts: true,
    combinesWithShippingDiscounts: true,
    startsAt: new Date('2026-01-01'),
    isActive: true,
    currentUses: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// The evaluation pipeline naturally picks the highest-value qualifying tier
// because specific, higher-value discounts are sorted first
```

### Database schema for discount persistence

```sql
CREATE TABLE discounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              VARCHAR(50) UNIQUE,
  title             VARCHAR(255) NOT NULL,
  type              VARCHAR(30) NOT NULL,
  value             NUMERIC(10,2) NOT NULL,
  target            VARCHAR(20) NOT NULL,
  allocation_method VARCHAR(10) DEFAULT 'across',
  applies_to        VARCHAR(30) DEFAULT 'all',
  min_purchase      INTEGER,       -- in cents
  min_quantity      INTEGER,
  max_uses          INTEGER,
  current_uses      INTEGER DEFAULT 0,
  max_uses_per_customer INTEGER,
  max_discount_amount INTEGER,     -- in cents
  conditions        JSONB DEFAULT '[]',
  entitled_products UUID[] DEFAULT '{}',
  entitled_collections UUID[] DEFAULT '{}',
  excluded_products UUID[] DEFAULT '{}',
  combines_product  BOOLEAN DEFAULT false,
  combines_order    BOOLEAN DEFAULT false,
  combines_shipping BOOLEAN DEFAULT true,
  starts_at         TIMESTAMPTZ NOT NULL,
  ends_at           TIMESTAMPTZ,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_discounts_code ON discounts(UPPER(code)) WHERE code IS NOT NULL;
CREATE INDEX idx_discounts_active ON discounts(is_active, starts_at, ends_at);

-- Track per-customer usage
CREATE TABLE discount_usages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id UUID NOT NULL REFERENCES discounts(id),
  customer_id UUID NOT NULL,
  order_id    UUID NOT NULL,
  amount      INTEGER NOT NULL,  -- discount amount applied, in cents
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_usage_customer ON discount_usages(discount_id, customer_id);
```

## Best Practices

- **Always calculate discounts server-side** — never trust client-submitted discount amounts; recalculate at checkout
- **Store monetary values as integers (cents)** — avoids floating-point rounding issues in discount math
- **Cap maximum discount amounts** — set `maxDiscountAmount` to prevent runaway promotions (e.g., 99% off with no cap)
- **Log every discount application** — record discount ID, customer, order, and amount for audit trails and analytics
- **Validate discounts at order creation, not just at cart** — re-evaluate all discounts when the order is placed to prevent race conditions
- **Use case-insensitive code matching** — normalize codes to uppercase on input and storage
- **Separate automatic discounts from code-based** — automatic discounts apply without user action; code discounts require explicit entry
- **Set clear stacking rules** — decide upfront whether multiple discounts can combine and communicate this to merchandising teams

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Discount exceeds item price (negative line total) | Clamp discount per line item to never exceed `lineTotal`; ensure no line goes below zero |
| BOGO applied to single-item cart | Require `minQuantity >= buyQty + getQty` before BOGO triggers |
| Race condition: two requests consume the last use of a limited discount | Use atomic `UPDATE discounts SET current_uses = current_uses + 1 WHERE current_uses < max_uses` with row-level locking |
| Percentage discount on already-discounted price | Define whether percentage discounts apply to original or post-discount price; document the policy clearly |
| Expired discount still applied to abandoned carts | Re-validate all discounts when the cart is loaded and when checkout begins; remove expired ones silently |

## Related Skills

- @stripe-integration
- @checkout-flow-optimization
- @product-data-modeling
- @merchandising-rules
- @ecommerce-data-warehouse
