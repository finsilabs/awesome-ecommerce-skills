---
name: volume-pricing
description: "Offer quantity-based price breaks so wholesale and bulk buyers automatically see lower prices as they add more units to their cart"
category: pricing-promotions
risk: safe
source: curated
date_added: "2026-03-12"
tags: [volume-pricing, quantity-breaks, tiered-pricing, b2b, price-lists, bulk-discount]
triggers: ["volume pricing", "quantity discounts", "bulk pricing", "tiered pricing", "price breaks", "B2B price list"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Volume Pricing

## Overview

Implement quantity-based price breaks that automatically reduce the unit price as order quantities increase, with support for product-level tiers, category-level tiers, and customer-group-specific price lists. The system handles mixed-cart scenarios where items from multiple products contribute to tier qualification.

## When to Use This Skill

- When selling to B2B buyers who expect per-unit price reductions for large orders
- When running a wholesale channel alongside a retail channel with separate pricing
- When you want to increase average order value by showing customers how much they save by buying more
- When managing multiple customer groups (retail, wholesale, distributor) with distinct price lists
- When building a configure-price-quote (CPQ) flow for custom bulk orders

## Core Instructions

1. **Design the volume pricing schema**

   ```sql
   -- Product-level price tiers
   CREATE TABLE price_tiers (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     product_id   UUID REFERENCES products(id),       -- NULL = applies to all products
     category_id  UUID REFERENCES categories(id),     -- NULL = not category-scoped
     customer_group VARCHAR(32),                       -- NULL = all customers; e.g. 'wholesale'
     min_quantity INTEGER NOT NULL,
     max_quantity INTEGER,                             -- NULL = unlimited
     price_type   VARCHAR(16) NOT NULL CHECK (price_type IN ('fixed', 'percentage_off')),
     price_value  NUMERIC(10,2) NOT NULL,              -- cents if fixed; percentage if percentage_off
     priority     INTEGER NOT NULL DEFAULT 0,          -- higher = evaluated first
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE INDEX idx_price_tiers_lookup ON price_tiers(product_id, customer_group, min_quantity);

   -- Named price lists for B2B accounts
   CREATE TABLE price_lists (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name         VARCHAR(128) NOT NULL,
     customer_group VARCHAR(32) NOT NULL,
     currency     VARCHAR(3) NOT NULL DEFAULT 'USD',
     starts_at    TIMESTAMPTZ,
     ends_at      TIMESTAMPTZ,
     is_active    BOOLEAN NOT NULL DEFAULT true
   );

   CREATE TABLE price_list_items (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     price_list_id UUID NOT NULL REFERENCES price_lists(id),
     product_id   UUID NOT NULL REFERENCES products(id),
     price        INTEGER NOT NULL,    -- cents; overrides all tier logic for this product+list
     min_quantity INTEGER NOT NULL DEFAULT 1
   );
   ```

2. **Resolve the unit price for a given product + quantity + customer group**

   ```typescript
   async function resolveUnitPrice(
     productId: string,
     quantity: number,
     customerGroup: string | null,
     basePrice: number  // cents
   ): Promise<{ unitPrice: number; tierApplied: string | null }> {
     // 1. Check price list (B2B override — highest priority)
     if (customerGroup) {
       const priceListItem = await db.priceListItems
         .findActive({ product_id: productId, customer_group: customerGroup, min_quantity: { lte: quantity } })
         .orderBy('min_quantity', 'desc')
         .first();

       if (priceListItem) {
         return { unitPrice: priceListItem.price, tierApplied: 'price_list' };
       }
     }

     // 2. Find the best matching volume tier
     const tiers = await db.priceTiers.findApplicable(productId, customerGroup);
     const applicableTiers = tiers
       .filter(t => quantity >= t.min_quantity && (t.max_quantity === null || quantity <= t.max_quantity))
       .sort((a, b) => b.priority - a.priority); // highest priority first

     const tier = applicableTiers[0];
     if (!tier) return { unitPrice: basePrice, tierApplied: null };

     const unitPrice = tier.price_type === 'fixed'
       ? tier.price_value
       : Math.round(basePrice * (1 - tier.price_value / 100));

     return { unitPrice, tierApplied: tier.id };
   }
   ```

3. **Calculate line-item totals for a cart with volume pricing**

   ```typescript
   interface CartLine {
     productId: string;
     quantity: number;
     basePrice: number;
   }

   async function calculateCartWithVolumePricing(
     lines: CartLine[],
     customerGroup: string | null
   ): Promise<{
     lines: (CartLine & { unitPrice: number; lineTotal: number; savings: number })[];
     subtotal: number;
     totalSavings: number;
   }> {
     const resolvedLines = await Promise.all(
       lines.map(async line => {
         const { unitPrice } = await resolveUnitPrice(
           line.productId, line.quantity, customerGroup, line.basePrice
         );
         const lineTotal = unitPrice * line.quantity;
         const savings = (line.basePrice - unitPrice) * line.quantity;
         return { ...line, unitPrice, lineTotal, savings };
       })
     );

     const subtotal = resolvedLines.reduce((sum, l) => sum + l.lineTotal, 0);
     const totalSavings = resolvedLines.reduce((sum, l) => sum + l.savings, 0);

     return { lines: resolvedLines, subtotal, totalSavings };
   }
   ```

4. **Display a pricing table on the product page**

   ```typescript
   async function getPricingTable(
     productId: string,
     customerGroup: string | null,
     basePrice: number
   ): Promise<{ quantity: string; unitPrice: number; savingsPct: number }[]> {
     const breakpoints = [1, 5, 10, 25, 50, 100, 250];
     const table = await Promise.all(
       breakpoints.map(async qty => {
         const { unitPrice } = await resolveUnitPrice(productId, qty, customerGroup, basePrice);
         const savingsPct = Math.round((1 - unitPrice / basePrice) * 100);
         return { quantity: qty === 250 ? '250+' : `${qty}`, unitPrice, savingsPct };
       })
     );

     // Only show rows where the price actually changes
     return table.filter((row, i) => i === 0 || row.unitPrice !== table[i - 1].unitPrice);
   }
   ```

5. **Seed a wholesale price list**

   ```typescript
   async function createWholesalePriceList(productPrices: Record<string, number>): Promise<void> {
     const priceList = await db.priceLists.insert({
       name: 'Wholesale 2026',
       customer_group: 'wholesale',
       currency: 'USD',
       is_active: true,
     });

     const items = Object.entries(productPrices).map(([productId, price]) => ({
       price_list_id: priceList.id,
       product_id: productId,
       price,           // cents
       min_quantity: 1,
     }));

     await db.priceListItems.insertMany(items);
   }
   ```

## Examples

### Define quantity break tiers for a single product

```typescript
// Product retails at $29.99 ($2999 cents)
// Buy 5+: 10% off → $26.99
// Buy 10+: 20% off → $23.99
// Buy 25+: 30% off → $20.99

await db.priceTiers.insertMany([
  { product_id: 'prod_shirt', customer_group: null, min_quantity: 5,  price_type: 'percentage_off', price_value: 10, priority: 1 },
  { product_id: 'prod_shirt', customer_group: null, min_quantity: 10, price_type: 'percentage_off', price_value: 20, priority: 2 },
  { product_id: 'prod_shirt', customer_group: null, min_quantity: 25, price_type: 'percentage_off', price_value: 30, priority: 3 },
]);
```

### Pricing table rendered in HTML

```html
<table class="pricing-table">
  <thead>
    <tr><th>Quantity</th><th>Unit Price</th><th>You Save</th></tr>
  </thead>
  <tbody>
    <tr><td>1–4</td>    <td>$29.99</td><td>—</td></tr>
    <tr><td>5–9</td>    <td>$26.99</td><td>10%</td></tr>
    <tr><td>10–24</td>  <td>$23.99</td><td>20%</td></tr>
    <tr><td>25+</td>    <td>$20.99</td><td>30%</td></tr>
  </tbody>
</table>
```

## Best Practices

- **Show the pricing table on the product page** — displaying upcoming tiers ("Add 3 more to get 10% off") is a proven AOV driver
- **Apply tiers to the cart, not just the product page** — recalculate prices when the cart quantity changes so the customer always sees the current unit price
- **Use a priority column for overlapping tiers** — when multiple tiers could apply, always pick the highest-priority one to ensure predictable behavior
- **Keep price lists separate from tier logic** — price lists (B2B overrides) should take precedence over tier discounts; resolving them in a clear priority order prevents surprises
- **Invalidate pricing cache when tiers change** — if you cache resolved prices in Redis, tag cache keys with the tier version and bust the cache on any tier update
- **Display savings prominently** — "You're saving $18.00 (30%)" is more compelling than showing only the discounted price
- **Validate minimum order quantities on checkout** — some wholesale price lists require a minimum quantity; enforce this server-side, not just in the UI

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Cart quantity changes but price doesn't update | Recalculate all line item prices on every `PATCH /cart/lines/:id` call, not just at checkout |
| A customer in two groups gets inconsistent prices | Resolve by explicit priority: price list > product tier > category tier > base price |
| Tiered prices displayed on product pages are stale after a tier update | Store tier hash in the cache key; invalidate on any tier write |
| B2B buyer sees retail prices in email receipts | Pass `customerGroup` to all price resolution calls, including the order confirmation email renderer |

## Related Skills

- @b2b-commerce
- @price-rules-engine
- @discount-engine
- @coupon-management
- @multi-channel-selling
