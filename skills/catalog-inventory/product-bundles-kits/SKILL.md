---
name: product-bundles-kits
description: "Sell grouped products as bundles or kits with automatic inventory deduction, bundle pricing, and display logic using platform apps"
category: catalog-inventory
risk: safe
source: curated
date_added: "2026-03-12"
tags: [bundles, kits, product-sets, dynamic-pricing, upsell, inventory, cross-sell]
triggers: ["product bundle", "product kit", "bundle pricing", "buy together", "kit builder", "bundle discount", "frequently bought together"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Product Bundles & Kits

## Overview

Product bundles let you sell multiple products together — optionally at a discount — as a single purchasable unit. This increases average order value and is one of the most effective upsell mechanisms in e-commerce. Dedicated bundle apps handle the inventory tracking, pricing, and display logic that platforms don't support natively. Only build a custom bundle system if your kit configuration requirements (dynamic assembly, real-time pricing, component substitution) exceed what apps offer.

## When to Use This Skill

- When implementing a "Frequently Bought Together" or "Complete the Look" feature
- When selling product kits (e.g., a camera body + lens + bag as a bundle)
- When offering a discount for purchasing a set of products together
- When building a custom kit builder where shoppers assemble their own set from options

## Core Instructions

### Step 1: Determine platform and choose the right tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Bundler — Product Bundles or Bundle Builder | Bundler is the most popular; handles fixed bundles, mix-and-match, and inventory deduction per component |
| **WooCommerce** | WooCommerce Product Bundles (WooCommerce extension) | Official WooCommerce extension; supports fixed and configurable bundles, per-component pricing, and inventory |
| **BigCommerce** | Product Bundler app or native "Frequently Bought Together" | BigCommerce App Marketplace has several bundle apps; native "Frequently Bought Together" for simple cross-sells |
| **Custom / Headless** | Build bundle data model with component inventory deduction | Required when bundle logic (real-time pricing, dynamic component substitution) exceeds app capabilities |

---

### Step 2: Platform-specific setup

---

#### Shopify

**Option A: Bundler — Product Bundles (recommended)**

1. Install **Bundler — Product Bundles** from the Shopify App Store
2. Go to **Bundler → Bundles → Create bundle**
3. Select bundle type:
   - **Fixed bundle**: a predefined set of products (e.g., "Skincare Starter Kit")
   - **Mix & Match**: shopper picks X items from a collection
   - **Build a Box**: shopper fills a box with any combination
4. Add component products and set quantities
5. Set pricing:
   - **Percentage discount** (e.g., 15% off the combined price)
   - **Fixed bundle price** (e.g., $49.99 regardless of component prices)
   - **Sum of parts** (no discount — just convenience bundling)
6. Bundler handles inventory: when a bundle is purchased, it decrements each component's stock automatically

**For "Frequently Bought Together":**
- Install **Frequently Bought Together** by Code Black Belt (App Store)
- The app analyzes your order history and automatically suggests products to bundle on the PDP
- Works out of the box with no manual configuration

**Important for Shopify Plus:**
- For bundles that must appear as a single line item in the cart (for loyalty points, discount exclusions, etc.), consider **Shopify Bundles** (native, available in admin under **Products → Bundles**)
- Shopify's native Bundles product type creates a parent SKU that the buyer purchases, with automatic inventory deduction of components

---

#### WooCommerce

**WooCommerce Product Bundles (official extension):**

1. Install **WooCommerce Product Bundles** from WooCommerce.com
2. Create a new product: **Products → Add Product → Product type: Bundle**
3. Go to the **Bundled Products** tab
4. Add each component:
   - Search and select the product
   - Set the default quantity and whether it's optional (for configurable bundles)
   - Enable **Ship separately** if components ship from different locations
5. Set bundle pricing under the **General** tab:
   - **Per-item pricing**: bundle price = sum of component prices (with optional discount)
   - **Static bundle pricing**: enter a fixed price for the bundle
6. **Inventory**: enable **Manage stock?** if you want to cap how many bundles can be sold (based on component availability)

**For "Frequently Bought Together":**
- Install **WooCommerce Frequently Bought Together** (free or paid versions available)
- Or use **YITH WooCommerce Frequently Bought Together**

---

#### BigCommerce

**Bundle apps from the App Marketplace:**

1. Search for **"Bundle"** in the **Apps** section of your BigCommerce admin
2. **Bold Bundles** is widely used — install and configure bundle products linking to existing SKUs
3. Set discount rules (percent off, fixed price, BOGO)
4. Bold Bundles handles inventory decrement for each component automatically

**Native cross-sell / "Frequently Bought Together":**
1. Go to **Products → [Product] → Related Products tab**
2. Add related products — these appear as suggestions on the PDP
3. No automatic discount, but customers can add individual items

---

#### Custom / Headless

For headless storefronts, build a bundle model where components are stored as separate cart line items (simplifies inventory, tax, and fulfillment):

```typescript
// lib/bundles.ts

interface BundleComponent { variantId: string; quantity: number; unitPrice: number; }
interface BundlePricing { componentSum: number; bundlePrice: number; savings: number; savingsPct: number; }

// Calculate bundle price dynamically from current component prices
export async function calculateBundlePrice(bundle: Bundle, selectedVariants: BundleComponent[]): Promise<BundlePricing> {
  const componentSum = selectedVariants.reduce((total, c) => total + c.unitPrice * c.quantity, 0);

  let bundlePrice: number;
  switch (bundle.pricingType) {
    case 'fixed': bundlePrice = bundle.pricingValue; break;
    case 'discount_pct': bundlePrice = +(componentSum * (1 - bundle.pricingValue / 100)).toFixed(2); break;
    case 'discount_abs': bundlePrice = Math.max(0, +(componentSum - bundle.pricingValue).toFixed(2)); break;
    default: bundlePrice = componentSum;
  }

  const savings = +(componentSum - bundlePrice).toFixed(2);
  return { componentSum, bundlePrice, savings, savingsPct: componentSum > 0 ? Math.round((savings / componentSum) * 100) : 0 };
}

// Check availability for all bundle components atomically
export async function checkBundleAvailability(selectedVariants: BundleComponent[]) {
  const unavailable = [];
  for (const { variantId, quantity } of selectedVariants) {
    const level = await db.inventoryLevels.findFirst({ where: { variantId } });
    const available = (level?.onHand ?? 0) - (level?.reserved ?? 0);
    if (available < quantity) {
      unavailable.push({ variantId, requested: quantity, available: Math.max(0, available) });
    }
  }
  return { available: unavailable.length === 0, unavailable };
}

// Add bundle to cart as separate line items (grouped by bundle ID for UI display)
export async function addBundleToCart(cartId: string, bundleId: string, selectedVariants: BundleComponent[]) {
  const bundle = await db.productBundles.findUnique({ where: { id: bundleId } });
  const pricing = await calculateBundlePrice(bundle, selectedVariants);

  const { available, unavailable } = await checkBundleAvailability(selectedVariants);
  if (!available) throw new Error(`Bundle not available: ${unavailable.map(u => u.variantId).join(', ')}`);

  // Create a bundle group record to keep line items visually associated
  const bundleGroup = await db.cartBundleGroups.create({
    data: { cartId, bundleId, bundlePrice: pricing.bundlePrice, bundleSavings: pricing.savings },
  });

  // Pro-rate the discount across components proportionally to their share of the total
  const lineItems = selectedVariants.map(({ variantId, quantity, unitPrice }) => {
    const itemSubtotal = unitPrice * quantity;
    const discountShare = pricing.savings * (itemSubtotal / pricing.componentSum);
    const discountedUnitPrice = +(unitPrice - discountShare / quantity).toFixed(4);
    return { cartId, variantId, quantity, bundleGroupId: bundleGroup.id, unitPrice: discountedUnitPrice };
  });

  await db.cartItems.createMany({ data: lineItems });
  return bundleGroup;
}
```

---

### Step 3: Configure bundle display on product pages

**Bundle display checklist:**
- Show "Value: $149 | Bundle price: $119 — Save $30 (20% off)" to make the discount tangible
- Show which items are included with product images and names
- Show availability: if any component is out of stock, show which item and suggest a substitute
- On the cart page, group bundle line items under a visual header with the bundle name and total savings badge

**For Shopify/Bundler:** The app generates a bundle product page automatically — customize the template in **Bundler → Customize**

**For WooCommerce Product Bundles:** The plugin renders a bundle-specific product page layout; style it using the built-in CSS settings or child theme overrides

---

### Step 4: Verify inventory deduction is working

After setting up bundles, test that inventory deducts correctly for each component:

1. Place a test order for a bundle
2. Check inventory levels for each component product — each should have decremented by the bundle component quantity
3. Test the edge case: a bundle where one component has exactly 1 unit remaining; ordering 2 bundles should fail on the second

## Best Practices

- **Use apps instead of building from scratch** — Bundler for Shopify and WooCommerce Product Bundles handle edge cases (split fulfillment, partial availability, refunds) that take weeks to build correctly
- **Always validate bundle availability server-side** — check that all components have sufficient stock atomically before adding to cart; a bundle is only purchasable if every component is in stock
- **Recalculate bundle pricing at checkout** — never trust client-submitted bundle prices; recalculate from current component prices at order time
- **Show per-item and bundle prices together** — the discount is only meaningful when customers can see what they're saving against
- **Keep bundles to 2–5 components** — larger bundles confuse shoppers and are harder to merchandise clearly

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Bundle discount applied incorrectly at checkout | Use the app's built-in discount logic; don't layer additional discount codes on top of bundle discounts without testing the interaction |
| One bundle component goes out of stock mid-cart | Re-check availability at checkout; display which specific component is unavailable so the customer can adjust |
| Bundle pricing stale when component prices change | Recalculate bundle price on each cart refresh and at checkout, not just at add-to-cart time |
| Fulfillment system confused by bundle line items | For headless builds, ensure each line item has a standard `variant_id` and `quantity`; use `bundle_group_id` only for UI grouping |
| Inventory not decremented for all bundle components | After setup, always test with a real order and verify each component SKU decremented by the correct quantity |

## Related Skills

- @variant-matrix
- @inventory-tracking
- @product-content-enrichment
