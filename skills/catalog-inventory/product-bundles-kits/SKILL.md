---
name: product-bundles-kits
description: "Sell grouped products as bundles or kits with automatic inventory deduction for each component, bundle pricing, and display logic"
category: catalog-inventory
risk: safe
source: curated
date_added: "2026-03-12"
tags: [bundles, kits, product-sets, dynamic-pricing, upsell, inventory, cross-sell]
triggers: ["product bundle", "product kit", "bundle pricing", "buy together", "kit builder", "bundle discount", "frequently bought together"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Product Bundles & Kits

## Overview

Implement product bundles and kits where multiple products are sold together — optionally at a discount — as a single purchasable item. Covers two bundle types: fixed bundles (a predefined set of products) and dynamic kits (shopper selects from option groups). Handles per-component inventory deduction, bundle pricing rules, and display on both the PDP and the cart.

## When to Use This Skill

- When implementing a "Frequently Bought Together" or "Complete the Look" feature
- When selling product kits (e.g., a camera body + lens + bag as a bundle)
- When offering a discount for purchasing a set of products together
- When building a custom kit builder where shoppers assemble their own set from options

## Prerequisites & Platform Notes

**Shopify**: Shopify has built-in inventory management, product variants, and metafields. Use the Shopify Admin API for bulk operations. For advanced needs, apps like Stocky or custom Shopify Functions.
**WooCommerce**: WooCommerce has built-in stock management. Extend with plugins (ATUM, WP All Import for bulk catalog). Use WooCommerce REST API for integrations.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A store with product catalog access, API credentials

## Core Instructions

1. **Design the bundle data model**

   ```javascript
   // product_bundles table
   {
     id: 'bundle_camera_kit',
     name: 'Camera Starter Kit',
     handle: 'camera-starter-kit',
     description: 'Everything you need to start shooting',
     bundle_type: 'fixed'|'dynamic',
     pricing_type: 'sum'|'fixed'|'discount_pct'|'discount_abs',
     pricing_value: 10,    // 10% off if pricing_type='discount_pct'
     published: true,
   }

   // bundle_components table
   {
     id,
     bundle_id: 'bundle_camera_kit',
     product_id: 'prod_camera_body',
     variant_id: null,          // null = shopper selects variant
     group_name: 'Camera Body', // For dynamic kits — groups shopper picks from
     quantity: 1,
     is_required: true,
     position: 0,
     // For dynamic kits: list of selectable products in this slot
     selectable_product_ids: ['prod_a6000', 'prod_a6400'],
   }
   ```

2. **Calculate bundle price dynamically**

   ```javascript
   // lib/bundlePricing.js
   export async function calculateBundlePrice(bundle, selectedVariants) {
     // Fetch current prices for all component variants
     const prices = await Promise.all(
       selectedVariants.map(async ({ variantId, quantity }) => {
         const variant = await db.productVariants.findUnique({
           where: { id: variantId },
           select: { price: true, compareAtPrice: true },
         });
         return { variantId, unitPrice: variant.price, quantity };
       })
     );

     const sumPrice = prices.reduce((total, p) => total + p.unitPrice * p.quantity, 0);

     let bundlePrice;
     switch (bundle.pricingType) {
       case 'sum':
         bundlePrice = sumPrice;
         break;
       case 'fixed':
         bundlePrice = bundle.pricingValue;
         break;
       case 'discount_pct':
         bundlePrice = +(sumPrice * (1 - bundle.pricingValue / 100)).toFixed(2);
         break;
       case 'discount_abs':
         bundlePrice = Math.max(0, +(sumPrice - bundle.pricingValue).toFixed(2));
         break;
       default:
         bundlePrice = sumPrice;
     }

     const savings = +(sumPrice - bundlePrice).toFixed(2);

     return {
       componentSum: sumPrice,
       bundlePrice,
       savings,
       savingsPct: sumPrice > 0 ? Math.round((savings / sumPrice) * 100) : 0,
     };
   }
   ```

3. **Add a bundle to the cart as separate line items**

   Bundles are stored in the cart as grouped line items (not a single composite item), which simplifies inventory tracking, tax calculation, and fulfillment.

   ```javascript
   // lib/cartBundles.js
   export async function addBundleToCart(cartId, bundleId, selectedVariants) {
     const bundle = await db.productBundles.findUnique({
       where: { id: bundleId },
       include: { components: true },
     });

     const pricing = await calculateBundlePrice(bundle, selectedVariants);

     // Create a bundle group record to keep line items visually associated
     const bundleCartGroup = await db.cartBundleGroups.create({
       data: {
         cartId,
         bundleId,
         bundlePrice: pricing.bundlePrice,
         bundleSavings: pricing.savings,
       },
     });

     // Add each component as an individual line item, tagged with the group
     const lineItems = selectedVariants.map(({ variantId, quantity }) => ({
       cartId,
       variantId,
       quantity,
       bundleGroupId: bundleCartGroup.id,
       // Pro-rate the discount across components
       unitPrice: applyProRatedDiscount(variantId, selectedVariants, pricing),
     }));

     await db.cartItems.createMany({ data: lineItems });

     return bundleCartGroup;
   }

   function applyProRatedDiscount(variantId, selectedVariants, pricing) {
     // Distribute the discount proportionally to each item's share of the total
     const item = selectedVariants.find(v => v.variantId === variantId);
     const itemSubtotal = item.unitPrice * item.quantity;
     const discountShare = pricing.savings * (itemSubtotal / pricing.componentSum);
     return +((item.unitPrice - discountShare / item.quantity)).toFixed(4);
   }
   ```

4. **Deduct inventory from each bundle component on fulfillment**

   Since bundles are stored as individual line items, standard inventory deduction applies. But validate bundle availability before allowing add-to-cart.

   ```javascript
   export async function checkBundleAvailability(bundleId, selectedVariants) {
     const unavailable = [];

     for (const { variantId, quantity } of selectedVariants) {
       const level = await db.inventoryLevels.findFirst({
         where: { variantId },
       });
       const available = (level?.onHand ?? 0) - (level?.reserved ?? 0);

       if (available < quantity) {
         const variant = await db.productVariants.findUnique({
           where: { id: variantId }, include: { product: true },
         });
         unavailable.push({
           variantId,
           productName: variant.product.name,
           requested: quantity,
           available: Math.max(0, available),
         });
       }
     }

     return { available: unavailable.length === 0, unavailable };
   }
   ```

5. **Render the bundle product page**

   ```jsx
   // BundlePDP.jsx
   import { useState, useEffect } from 'react';

   export function BundlePDP({ bundle }) {
     const [selections, setSelections] = useState(() =>
       // Pre-select the first available variant for each required component
       Object.fromEntries(
         bundle.components
           .filter(c => c.isRequired && !c.variantId)
           .map(c => [c.id, c.selectableProducts[0]?.variants[0]?.id])
       )
     );
     const [pricing, setPricing] = useState(null);

     useEffect(() => {
       const allSelected = bundle.components
         .filter(c => c.isRequired)
         .every(c => c.variantId || selections[c.id]);

       if (!allSelected) return;

       const variants = bundle.components.map(c => ({
         variantId: c.variantId ?? selections[c.id],
         quantity: c.quantity,
       }));

       fetch('/api/bundles/price', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ bundleId: bundle.id, variants }),
       })
         .then(r => r.json())
         .then(setPricing);
     }, [selections, bundle]);

     return (
       <div className="bundle-pdp">
         <h1>{bundle.name}</h1>
         {bundle.components.map(component => (
           <ComponentSlot
             key={component.id}
             component={component}
             selectedVariantId={component.variantId ?? selections[component.id]}
             onSelect={(variantId) => setSelections(s => ({ ...s, [component.id]: variantId }))}
           />
         ))}
         {pricing && (
           <div className="bundle-pricing">
             <p>Bundle price: <strong>${pricing.bundlePrice}</strong></p>
             {pricing.savings > 0 && (
               <p className="savings">
                 You save ${pricing.savings} ({pricing.savingsPct}% off)
               </p>
             )}
           </div>
         )}
         <button onClick={() => addBundleToCart(bundle.id, selections)}>
           Add Bundle to Cart
         </button>
       </div>
     );
   }
   ```

## Examples

### Cart display for bundle groups

Show bundled items in the cart under a visual group header:

```jsx
function CartBundleGroup({ group, items }) {
  return (
    <div className="cart-bundle-group">
      <div className="bundle-group-header">
        <strong>{group.bundleName}</strong>
        {group.bundleSavings > 0 && (
          <span className="savings-badge">Save ${group.bundleSavings}</span>
        )}
      </div>
      {items.map(item => (
        <CartLineItem key={item.id} item={item} showBundleIndicator />
      ))}
    </div>
  );
}
```

### API: check bundle availability

```
GET /api/bundles/:bundleId/availability?variant[]=var_a&variant[]=var_b

Response:
{
  "available": true,
  "components": [
    { "variantId": "var_a", "available": 15 },
    { "variantId": "var_b", "available": 3 }
  ]
}
```

## Best Practices

- **Store bundle components as individual cart line items** — this simplifies inventory, tax, shipping, and fulfillment; use a `bundle_group_id` to keep them visually associated in the cart
- **Recalculate bundle pricing server-side** — never trust client-submitted prices; recalculate based on current variant prices at add-to-cart time
- **Check availability for all components together** — a bundle is only addable if every component has sufficient stock; validate atomically before reserving
- **Display per-item and bundle prices** — show "Value: $149 | Bundle price: $119 — Save $30" to make the discount tangible
- **Handle partial availability gracefully** — if one component is out of stock, show which item is unavailable and suggest alternatives

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Bundle discount applied to wrong items | Pro-rate discounts proportionally by item price when distributing across components |
| One bundle component goes out of stock mid-cart | Check availability again at checkout; display a specific error indicating which component is now unavailable |
| Bundle pricing stale when component prices change | Recalculate bundle price on each cart refresh and at checkout, not just at add-to-cart |
| Fulfillment system confused by grouped cart items | Ensure each line item has a standard `variant_id` and `quantity`; use `bundle_group_id` only for UI grouping |

## Related Skills

- @variant-matrix
- @inventory-tracking
- @cart-logic
- @pricing-promotions
