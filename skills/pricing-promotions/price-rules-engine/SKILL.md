---
name: price-rules-engine
description: "Stackable pricing rules with priority, exclusions, and customer segment targeting"
category: pricing-promotions
risk: critical
source: curated
date_added: "2026-03-12"
tags: [price-rules, promotions, stacking, priority, exclusions, customer-segments, rule-engine]
triggers: ["price rules", "promotion rules", "stackable discounts", "pricing rule engine", "promotional pricing logic", "customer segment pricing"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: advanced
---

# Price Rules Engine

## Overview

Build a flexible pricing rule engine that evaluates multiple promotions against a cart, applies them in priority order, enforces stacking constraints, and respects product/category exclusions and customer segment targeting. The engine cleanly separates rule definition from evaluation, making it easy to add new rule types without changing the core logic.

## When to Use This Skill

- When you have multiple concurrent promotions (site-wide sale + coupon + loyalty discount) and need deterministic stacking behavior
- When marketing needs to create complex promotions (e.g., "20% off all shoes except Nike, for Gold loyalty members") without engineering involvement
- When migrating from hardcoded promotional logic scattered across the codebase to a data-driven rule system
- When building a promotion scheduler that activates and deactivates rules at configured times
- When you need an audit log that shows exactly which rules were applied and why for customer service queries

## Core Instructions

1. **Define the rule schema**

   ```sql
   CREATE TABLE price_rules (
     id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name           VARCHAR(128) NOT NULL,
     description    TEXT,
     type           VARCHAR(32) NOT NULL
                      CHECK (type IN ('percentage_off', 'fixed_off', 'free_shipping', 'buy_x_get_y', 'fixed_price')),
     value          NUMERIC(10,2),             -- discount value (percentage or cents)
     priority       INTEGER NOT NULL DEFAULT 0, -- higher = applied first
     is_stackable   BOOLEAN NOT NULL DEFAULT true,
     -- Conditions
     min_cart_value INTEGER,                   -- cents; NULL = no minimum
     customer_segments VARCHAR(255)[],          -- NULL = all segments
     applicable_products UUID[],               -- NULL = all products
     applicable_categories UUID[],             -- NULL = all categories
     excluded_products UUID[],
     excluded_categories UUID[],
     -- Schedule
     starts_at      TIMESTAMPTZ,
     ends_at        TIMESTAMPTZ,
     usage_limit    INTEGER,
     usage_count    INTEGER NOT NULL DEFAULT 0,
     is_active      BOOLEAN NOT NULL DEFAULT true,
     -- Coupon linkage (optional)
     coupon_code    VARCHAR(64),               -- NULL = automatic (no code required)
     created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE TABLE price_rule_applications (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     order_id     UUID NOT NULL,
     rule_id      UUID NOT NULL REFERENCES price_rules(id),
     discount_amount INTEGER NOT NULL,         -- cents
     applied_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   ```

2. **Implement the rule evaluator**

   ```typescript
   interface CartContext {
     customerId: string;
     customerSegments: string[];
     cartSubtotal: number;         // cents
     lines: CartLine[];
     appliedCouponCode?: string;
   }

   interface CartLine {
     lineId: string;
     productId: string;
     categoryIds: string[];
     quantity: number;
     basePrice: number;            // cents, original price
     currentPrice: number;         // cents, already-modified price
   }

   interface RuleApplication {
     ruleId: string;
     ruleName: string;
     discountAmount: number;       // cents
     affectedLineIds: string[];
   }

   async function evaluateRules(cart: CartContext): Promise<RuleApplication[]> {
     const now = new Date();
     const rules = await db.priceRules.findAll({
       is_active: true,
       starts_at: { lte: now },
       ends_at: { or: [null, { gt: now }] },
     }).orderBy('priority', 'desc');

     const applications: RuleApplication[] = [];
     let nonStackableApplied = false;

     for (const rule of rules) {
       // Skip non-stackable rules if another non-stackable has already been applied
       if (!rule.is_stackable && nonStackableApplied) continue;

       // Coupon-linked rules require the coupon code
       if (rule.coupon_code && rule.coupon_code !== cart.appliedCouponCode) continue;

       if (!meetsConditions(rule, cart)) continue;

       const application = applyRule(rule, cart);
       if (!application || application.discountAmount <= 0) continue;

       applications.push(application);

       if (!rule.is_stackable) nonStackableApplied = true;

       // Mutate cart for subsequent (lower-priority) rules to see updated prices
       for (const affected of application.affectedLineIds) {
         const line = cart.lines.find(l => l.lineId === affected);
         if (line) {
           // Each rule discounts from the running (already-discounted) price
           // This implements "rules apply sequentially" semantics
         }
       }
     }

     return applications;
   }
   ```

3. **Implement condition checking**

   ```typescript
   function meetsConditions(rule: PriceRule, cart: CartContext): boolean {
     // Cart minimum
     if (rule.min_cart_value !== null && cart.cartSubtotal < rule.min_cart_value) {
       return false;
     }

     // Customer segment
     if (rule.customer_segments?.length > 0) {
       const hasSegment = rule.customer_segments.some(s => cart.customerSegments.includes(s));
       if (!hasSegment) return false;
     }

     // Usage limit
     if (rule.usage_limit !== null && rule.usage_count >= rule.usage_limit) {
       return false;
     }

     // Check that at least one non-excluded line is applicable
     const eligibleLines = getEligibleLines(rule, cart.lines);
     return eligibleLines.length > 0;
   }

   function getEligibleLines(rule: PriceRule, lines: CartLine[]): CartLine[] {
     return lines.filter(line => {
       // Exclusions take precedence
       if (rule.excluded_products?.includes(line.productId)) return false;
       if (rule.excluded_categories?.some(c => line.categoryIds.includes(c))) return false;

       // Inclusion scope
       if (rule.applicable_products?.length > 0) {
         return rule.applicable_products.includes(line.productId);
       }
       if (rule.applicable_categories?.length > 0) {
         return rule.applicable_categories.some(c => line.categoryIds.includes(c));
       }

       return true; // no scope restriction = all products
     });
   }
   ```

4. **Implement rule application logic**

   ```typescript
   function applyRule(rule: PriceRule, cart: CartContext): RuleApplication | null {
     const eligibleLines = getEligibleLines(rule, cart.lines);
     let discountAmount = 0;

     if (rule.type === 'percentage_off') {
       discountAmount = eligibleLines.reduce((sum, line) =>
         sum + Math.round(line.currentPrice * line.quantity * (rule.value / 100)), 0);
     } else if (rule.type === 'fixed_off') {
       // Fixed off applies to the cart once, not per line
       discountAmount = Math.min(rule.value, cart.cartSubtotal);
     } else if (rule.type === 'fixed_price') {
       // Each eligible line is set to the fixed price
       discountAmount = eligibleLines.reduce((sum, line) =>
         sum + Math.max(0, (line.currentPrice - rule.value) * line.quantity), 0);
     } else if (rule.type === 'buy_x_get_y') {
       discountAmount = applyBxGy(rule, eligibleLines);
     }

     if (discountAmount <= 0) return null;

     return {
       ruleId: rule.id,
       ruleName: rule.name,
       discountAmount,
       affectedLineIds: eligibleLines.map(l => l.lineId),
     };
   }

   function applyBxGy(rule: PriceRule, lines: CartLine[]): number {
     // Simplest form: buy 2 get 1 free — every 3rd unit is free
     const BUY_X = 2; const GET_Y = 1;
     const totalUnits = lines.reduce((s, l) => s + l.quantity, 0);
     const freeUnits = Math.floor(totalUnits / (BUY_X + GET_Y)) * GET_Y;
     // Apply to cheapest eligible items first
     const sortedPrices = lines
       .flatMap(l => Array(l.quantity).fill(l.currentPrice))
       .sort((a, b) => a - b);
     return sortedPrices.slice(0, freeUnits).reduce((s, p) => s + p, 0);
   }
   ```

5. **Persist applications and update usage counters on order placement**

   ```typescript
   async function persistRuleApplications(
     tx: DatabaseTransaction,
     orderId: string,
     applications: RuleApplication[]
   ): Promise<void> {
     for (const app of applications) {
       await tx.priceRuleApplications.insert({
         order_id: orderId,
         rule_id: app.ruleId,
         discount_amount: app.discountAmount,
       });

       await tx.raw(
         'UPDATE price_rules SET usage_count = usage_count + 1 WHERE id = ?',
         [app.ruleId]
       );
     }
   }
   ```

## Examples

### Define a "Summer Sale" — 15% off all apparel, excluding sale items already below $20

```typescript
await db.priceRules.insert({
  name: 'Summer Sale 2026',
  type: 'percentage_off',
  value: 15,
  priority: 10,
  is_stackable: false,
  applicable_categories: ['cat_apparel'],
  excluded_products: ['prod_clearance_1', 'prod_clearance_2'],
  starts_at: new Date('2026-06-01'),
  ends_at: new Date('2026-08-31'),
  is_active: true,
});
```

### "Buy 2 get 1 free" on all accessories, stackable with loyalty discounts

```typescript
await db.priceRules.insert({
  name: 'Accessories B2G1',
  type: 'buy_x_get_y',
  value: null,
  priority: 20,
  is_stackable: true,
  applicable_categories: ['cat_accessories'],
  starts_at: null,
  ends_at: null,
  is_active: true,
});
```

## Best Practices

- **Higher priority = evaluated first** — use an explicit `priority` integer so marketing can control evaluation order without code changes
- **Separate stackable from exclusive rules** — once a non-stackable rule applies, skip all subsequent non-stackable rules; stackable rules always apply on top
- **Apply discounts to `currentPrice`, not `basePrice`** — this ensures sequential rules compound correctly (rule 2 discounts the already-reduced price from rule 1)
- **Store rule applications with the order** — attach the rule IDs and discount amounts to each order for customer service queries and promotion ROI reporting
- **Test rules in dry-run mode before activation** — add an `evaluate_only` flag that runs the full engine and returns the result without persisting any applications
- **Use exclusion lists generously** — always let marketing specify excluded products/categories; unexpected rule application to premium or sale products creates margin problems
- **Version rules rather than editing them** — deactivate old rules and create new versions; this preserves the historical calculation for past orders

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Two non-stackable rules both apply | Sort rules by priority descending and set `nonStackableApplied = true` after the first non-stackable rule matches; skip others |
| A rule applies to an excluded product | Evaluate exclusions before inclusions in `getEligibleLines`; exclusion always wins |
| Discount causes order total to go negative | Cap total discount at cart subtotal; `discountAmount = Math.min(totalDiscount, cartSubtotal)` |
| Marketing edits a live rule mid-campaign, affecting in-flight orders | Treat rules as immutable once active — create a new rule version and deactivate the old one |

## Related Skills

- @coupon-management
- @discount-engine
- @dynamic-pricing
- @ab-testing-pricing
- @volume-pricing
