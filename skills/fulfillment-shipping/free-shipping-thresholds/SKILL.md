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
platforms: [platform-agnostic]
difficulty: beginner
---

# Free Shipping Thresholds

## Overview

Implement configurable free shipping thresholds with real-time cart progress indicators and upsell nudges that encourage customers to add more items. Supports multiple rules with customer segment targeting (e.g., loyalty members get a lower threshold) and geographic overrides for international shipping.

## When to Use This Skill

- When adding a free shipping banner or cart progress bar to increase average order value
- When different customer tiers should have different free shipping thresholds
- When A/B testing different threshold amounts to find the AOV sweet spot
- When you want to surface "add $X more to unlock free shipping" messages dynamically
- When free shipping rules should vary by shipping zone (domestic vs. international)

## Prerequisites & Platform Notes

**Shopify**: Use Shopify Shipping (carrier-calculated rates), Shopify Fulfillment Network, or apps like ShipStation. The Fulfillment API handles custom fulfillment workflows.
**WooCommerce**: Use WooCommerce Shipping or plugins (ShipStation, WooCommerce Table Rate Shipping). Extend with woocommerce_shipping_methods filter.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A store with shipping configured, carrier API accounts if using custom rates

## Core Instructions

1. **Define shipping threshold rules**

   ```typescript
   interface ShippingRule {
     id: string;
     name: string;
     freeShippingThreshold: number | null;   // cents; null = always free
     applicableZones: string[];               // ['US', 'CA'] or [] for all zones
     customerSegments: string[];              // [] for all segments
     priority: number;
     isActive: boolean;
     startsAt: Date | null;
     endsAt: Date | null;
   }

   // Example rules stored in DB or config
   const SHIPPING_RULES: ShippingRule[] = [
     {
       id: 'rule_gold_member',
       name: 'Gold members — free shipping $49+',
       freeShippingThreshold: 4900,
       applicableZones: ['US'],
       customerSegments: ['gold', 'platinum'],
       priority: 10,
       isActive: true,
       startsAt: null,
       endsAt: null,
     },
     {
       id: 'rule_us_standard',
       name: 'Standard US — free shipping $75+',
       freeShippingThreshold: 7500,
       applicableZones: ['US'],
       customerSegments: [],
       priority: 5,
       isActive: true,
       startsAt: null,
       endsAt: null,
     },
     {
       id: 'rule_international',
       name: 'International — no free shipping',
       freeShippingThreshold: null,   // null means never free via this rule
       applicableZones: [],            // catch-all
       customerSegments: [],
       priority: 1,
       isActive: true,
       startsAt: null,
       endsAt: null,
     },
   ];
   ```

2. **Resolve the applicable rule for a cart**

   ```typescript
   function resolveShippingRule(
     cartSubtotal: number,
     shippingZone: string,
     customerSegments: string[]
   ): { isFree: boolean; threshold: number | null; amountNeeded: number } {
     const now = new Date();
     const applicableRules = SHIPPING_RULES
       .filter(rule => {
         if (!rule.isActive) return false;
         if (rule.startsAt && rule.startsAt > now) return false;
         if (rule.endsAt && rule.endsAt < now) return false;
         if (rule.applicableZones.length > 0 && !rule.applicableZones.includes(shippingZone)) return false;
         if (rule.customerSegments.length > 0 &&
             !rule.customerSegments.some(s => customerSegments.includes(s))) return false;
         return true;
       })
       .sort((a, b) => b.priority - a.priority); // highest priority first

     const rule = applicableRules[0];
     if (!rule) return { isFree: false, threshold: null, amountNeeded: 0 };

     if (rule.freeShippingThreshold === null) {
       return { isFree: false, threshold: null, amountNeeded: 0 };
     }

     const isFree = cartSubtotal >= rule.freeShippingThreshold;
     const amountNeeded = isFree ? 0 : rule.freeShippingThreshold - cartSubtotal;

     return { isFree, threshold: rule.freeShippingThreshold, amountNeeded };
   }
   ```

3. **Expose shipping status to the cart API**

   ```typescript
   // GET /api/cart/shipping-status
   app.get('/api/cart/shipping-status', async (req, res) => {
     const cart = await getCart(req.sessionId);
     const zone = req.user?.shippingZone ?? inferZoneFromIP(req.ip);
     const segments = req.user ? await getCustomerSegments(req.user.id) : [];

     const result = resolveShippingRule(cart.subtotal, zone, segments);

     res.json({
       isFree: result.isFree,
       threshold: result.threshold ? result.threshold / 100 : null,
       amountNeeded: result.amountNeeded / 100,
       progressPct: result.threshold
         ? Math.min(100, Math.round((cart.subtotal / result.threshold) * 100))
         : 100,
     });
   });
   ```

4. **Render a progress bar component**

   ```tsx
   interface ShippingStatus {
     isFree: boolean;
     threshold: number | null;
     amountNeeded: number;
     progressPct: number;
   }

   function FreeShippingProgress({ status }: { status: ShippingStatus }) {
     if (status.threshold === null) return null; // no free shipping available

     if (status.isFree) {
       return (
         <div className="shipping-progress shipping-progress--unlocked">
           <span>You unlocked FREE shipping!</span>
           <div className="progress-bar" style={{ width: '100%' }} />
         </div>
       );
     }

     const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
       .format(status.amountNeeded);

     return (
       <div className="shipping-progress">
         <span>Add <strong>{formatted}</strong> more for FREE shipping</span>
         <div className="progress-bar-track">
           <div className="progress-bar-fill" style={{ width: `${status.progressPct}%` }} />
         </div>
       </div>
     );
   }
   ```

5. **Add upsell product suggestions when near the threshold**

   ```typescript
   async function getFreeShippingUpsells(
     cartSubtotal: number,
     amountNeeded: number,
     cartProductIds: string[]
   ): Promise<Product[]> {
     if (amountNeeded <= 0 || amountNeeded > 3000) return []; // only show when $0–$30 away

     // Find products priced within the gap — customer can add just one item to qualify
     return db.products.findAll({
       price: { gte: amountNeeded, lte: amountNeeded + 1000 },  // up to $10 above the gap
       id: { notIn: cartProductIds },
       inStock: true,
     }).limit(4).orderBy('popularity_score', 'desc');
   }
   ```

## Examples

### Seasonal free shipping promotion (lowered threshold for holidays)

```typescript
const HOLIDAY_RULE: ShippingRule = {
  id: 'rule_holiday_2026',
  name: 'Holiday — free shipping $50+ (Dec 1–31)',
  freeShippingThreshold: 5000,
  applicableZones: ['US', 'CA'],
  customerSegments: [],
  priority: 15,   // overrides the standard $75 rule
  isActive: true,
  startsAt: new Date('2026-12-01'),
  endsAt:   new Date('2026-12-31T23:59:59Z'),
};
```

### Animated cart progress bar CSS

```css
.progress-bar-track {
  background: #e5e7eb;
  border-radius: 4px;
  height: 6px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-bar-fill {
  background: #16a34a;
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease-in-out;
}

.shipping-progress--unlocked .progress-bar-fill {
  background: #16a34a;
}
```

## Best Practices

- **Compute shipping eligibility server-side** — always re-evaluate in the checkout API, not just in the UI, to prevent forged requests from bypassing the threshold
- **Show the progress bar on both the cart page and the mini-cart drawer** — customers who see the progress bar in the mini-cart convert at a higher AOV than those who only see it at checkout
- **Update the progress in real time as items are added or removed** — fetch the `/shipping-status` endpoint on every cart mutation; don't let the progress bar show stale values
- **Use a high-priority rule for promotions** — set `priority` higher than the default rule so temporary threshold reductions automatically take precedence without modifying the base rule
- **Show upsells only when the customer is close to the threshold** — product suggestions more than $15 away from the threshold feel irrelevant; limit upsells to a $0–$20 gap
- **Test the threshold with your actual shipping costs** — the threshold should be set so that the average order above the threshold still generates positive gross margin after absorbing the shipping cost

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Threshold UI shows "free shipping" but checkout charges shipping | Always recompute `resolveShippingRule` in the shipping rates API; don't rely on the client-side state |
| Free shipping applies to orders that include non-qualifying products | Add an `excludedProductIds` or `excludedCategoryIds` filter to the rule and subtract non-qualifying items from the subtotal |
| Progress bar shows 100% but order subtotal is below threshold | Ensure `progressPct` is calculated server-side and returned from the API, not computed from a cached subtotal |
| A coupon reduces the cart below the free shipping threshold | Recalculate shipping eligibility after every discount is applied, using the post-discount subtotal |

## Related Skills

- @shipping-rate-calculator
- @coupon-management
- @discount-engine
- @loyalty-points-system
- @checkout-flow-optimization
