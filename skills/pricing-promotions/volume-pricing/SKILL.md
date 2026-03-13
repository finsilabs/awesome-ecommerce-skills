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
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Volume Pricing

## Overview

Volume pricing — also called quantity breaks or tiered pricing — automatically reduces the unit price as order quantities increase. It is a core feature for B2B and wholesale channels, and an effective average-order-value driver for consumer stores ("Add 3 more for 10% off"). Most platforms do not include volume pricing natively; you need an app or plugin. This skill walks through setup on each platform and covers custom implementation for headless storefronts.

## When to Use This Skill

- When selling to B2B buyers who expect per-unit price reductions for large orders
- When running a wholesale channel alongside a retail channel with separate pricing
- When you want to increase average order value by showing customers how much they save by buying more
- When managing multiple customer groups (retail, wholesale, distributor) with distinct price lists
- When building a configure-price-quote (CPQ) flow for custom bulk orders

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Wholesale Club or Quantity Breaks & Discounts by FORSBERG | Wholesale Club adds a full B2B channel with customer-group pricing; Quantity Breaks handles tiered pricing for B2C with a pricing table on product pages |
| **Shopify Plus** | Shopify B2B (built in) | Shopify Plus includes native B2B features including company accounts, price lists, and quantity minimums |
| **WooCommerce** | WooCommerce Dynamic Pricing extension (~$99/year) or YITH WooCommerce Dynamic Pricing & Discounts (~$70/year) | Both plugins support quantity-based tiers, customer-role-specific pricing, and product-page pricing tables |
| **BigCommerce** | Price Lists (native, Plus plan and above) | BigCommerce's Price Lists feature is designed for B2B volume pricing — assign price lists to customer groups |
| **Custom / Headless** | Build tier resolution logic calling your platform's pricing API | Full control over tier definitions and cart recalculation |

### Step 2: Set up volume pricing on your platform

---

#### Shopify (non-Plus)

**Option A: Quantity Breaks & Discounts app (B2C-focused)**

1. Install **Quantity Breaks & Discounts** (by FORSBERG+two) from the Shopify App Store (free tier; paid plans ~$10/month)
2. In the app, go to **Discount Groups → Create**
3. Choose which products or collections to apply the tiers to
4. Add quantity tiers:
   - Tier 1: Quantity 1+, 0% off (regular price)
   - Tier 2: Quantity 5+, 10% off
   - Tier 3: Quantity 10+, 20% off
   - Tier 4: Quantity 25+, 30% off
5. The app automatically shows a pricing table on product pages and applies the correct discount when the customer updates their cart quantity

**Option B: Wholesale Club (B2B-focused)**

1. Install **Wholesale Club** from the Shopify App Store (~$30/month)
2. Create a wholesale customer group (the app creates a tag-based system)
3. Set wholesale prices: fixed prices or percentage discounts per product or collection
4. Tag wholesale customers with the wholesale tag to give them access
5. Wholesale customers see the tiered prices on product pages and at checkout

---

#### Shopify Plus — Native B2B

Shopify Plus includes a native **B2B channel** that replaces the need for a wholesale app:

1. Go to **Sales channels → B2B**
2. Create a **Company** for each B2B client
3. Under the company, create a **Location** and assign a **Price list**
4. In the price list, set prices per product (fixed prices or percentage adjustments)
5. Set **Payment terms** (net 30, net 60, etc.) and **Order minimums**
6. Company contacts log in through your store's B2B portal and see their assigned prices automatically

---

#### WooCommerce

**Using WooCommerce Dynamic Pricing:**

1. Install **WooCommerce Dynamic Pricing** from WooCommerce.com or **YITH WooCommerce Dynamic Pricing & Discounts**
2. Go to **WooCommerce → Dynamic Pricing → Add Rule**
3. Set:
   - **Rule type**: Product Pricing or Category Pricing
   - **Apply to**: specific products, categories, or all products
   - **Pricing type**: percentage discount or fixed price override
4. Add quantity tiers:
   | Minimum Qty | Maximum Qty | Discount |
   |------------|------------|---------|
   | 1 | 4 | 0% |
   | 5 | 9 | 10% |
   | 10 | 24 | 20% |
   | 25 | — | 30% |
5. Optionally restrict by **User role** for B2B/wholesale-only tiers
6. The plugin automatically recalculates prices when cart quantities change

**Displaying a pricing table on product pages:**
Both Dynamic Pricing plugins include a pricing table widget that shows quantity break tiers directly on the product page. Configure its appearance in the plugin settings.

---

#### BigCommerce

BigCommerce's **Price Lists** feature handles volume pricing natively on Plus and above plans.

**Setting up a price list with quantity tiers:**
1. Go to **Products → Price Lists → Create Price List**
2. Name the list (e.g., "Wholesale 2026") and assign it to a **Customer Group**
3. Add products and set prices:
   - For each product, you can set a base price override
   - For quantity breaks, use the **Bulk Pricing** section on each product
4. Go to a product → **Pricing** tab → **Bulk Pricing**:
   - Add tiers: e.g., 5+ units = $X per unit, 10+ units = $Y per unit
   - Set whether the bulk price applies to all customers or a specific price list
5. Assign the price list to a customer group under **Customers → Customer Groups**

---

#### Custom / Headless

For headless storefronts, implement tier resolution in your pricing service:

```typescript
interface PriceTier {
  minQuantity: number;
  maxQuantity?: number;       // undefined = no upper limit
  type: 'fixed' | 'percentage_off';
  value: number;              // cents if fixed; percentage (0-100) if percentage_off
  customerGroup?: string;     // null = all customers
}

async function resolveUnitPrice(
  productId: string,
  quantity: number,
  customerGroup: string | null,
  basePrice: number   // cents
): Promise<{ unitPriceCents: number; savingsPct: number }> {
  // 1. Check for customer-group-specific price list (highest priority)
  if (customerGroup) {
    const priceListItem = await db.priceLists
      .findActive({ product_id: productId, customer_group: customerGroup, min_quantity: { lte: quantity } })
      .orderBy('min_quantity', 'desc')
      .first();
    if (priceListItem) {
      const savingsPct = Math.round((1 - priceListItem.price / basePrice) * 100);
      return { unitPriceCents: priceListItem.price, savingsPct };
    }
  }

  // 2. Find the best matching general volume tier
  const tiers = await db.priceTiers.find({
    product_id: productId,
    customer_group: customerGroup ?? null,
  });

  const applicable = tiers.filter(t =>
    quantity >= t.minQuantity && (t.maxQuantity === undefined || quantity <= t.maxQuantity)
  ).sort((a, b) => b.minQuantity - a.minQuantity); // highest-qualifying tier first

  const tier = applicable[0];
  if (!tier) return { unitPriceCents: basePrice, savingsPct: 0 };

  const unitPriceCents = tier.type === 'fixed'
    ? tier.value
    : Math.round(basePrice * (1 - tier.value / 100));
  const savingsPct = Math.round((1 - unitPriceCents / basePrice) * 100);

  return { unitPriceCents, savingsPct };
}
```

**Recalculate on every cart quantity change:**

```typescript
async function updateCartLinePricing(cartId: string, lineId: string, newQuantity: number) {
  const line = await db.cartLines.findById(lineId);
  const { unitPriceCents } = await resolveUnitPrice(
    line.productId, newQuantity, line.customerGroup, line.basePriceCents
  );
  await db.cartLines.update(lineId, {
    quantity: newQuantity,
    unitPriceCents,
    lineTotalCents: unitPriceCents * newQuantity,
  });
}
```

**Show a pricing table on product pages:**

Query the tier breakpoints and display the table:
```typescript
async function getPricingTable(productId: string, customerGroup: string | null, basePrice: number) {
  const breakpoints = [1, 5, 10, 25, 50, 100];
  const rows = await Promise.all(breakpoints.map(async qty => {
    const { unitPriceCents, savingsPct } = await resolveUnitPrice(productId, qty, customerGroup, basePrice);
    return { quantity: qty, unitPriceCents, savingsPct };
  }));
  // Only show rows where the price actually changes
  return rows.filter((row, i) => i === 0 || row.unitPriceCents !== rows[i - 1].unitPriceCents);
}
```

## Best Practices

- **Show the pricing table on the product page** — displaying upcoming tiers ("Add 3 more to get 10% off") is a proven AOV driver; do not hide this information
- **Recalculate prices when cart quantity changes** — ensure the unit price updates live in the cart, not just at checkout
- **Keep price lists separate from tier logic** — B2B price list overrides should take precedence over volume tier discounts; resolve them in a clear priority order
- **Set minimum order quantities for wholesale tiers** — if a wholesale price list requires a minimum order, enforce this at checkout, not just in the UI
- **Validate minimum quantities on checkout** — some B2B configurations require minimum quantities; enforce server-side to prevent orders that bypass the UI
- **Display savings prominently** — "You're saving $18.00 (30%)" is more compelling than showing only the discounted price

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Cart quantity changes but price doesn't update | Recalculate all line item prices on every cart quantity change in real-time, not just at checkout |
| B2B buyer sees retail prices in order confirmation email | Pass `customerGroup` to all price resolution calls, including order confirmation email rendering |
| A customer in two groups gets inconsistent prices | Resolve by explicit priority: price list > product tier > category tier > base price |
| Pricing table shows stale tiers after an update | Clear your pricing cache when tiers are modified; invalidate by product or tier version |
| Tiered prices not shown on search results pages | Product cards on search/collection pages should also resolve prices server-side for logged-in B2B customers |

## Related Skills

- @b2b-commerce
- @price-rules-engine
- @discount-engine
- @coupon-management
- @multi-channel-selling
