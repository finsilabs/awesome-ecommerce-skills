---
name: price-rules-engine
description: "Define stackable pricing rules with priority ordering, customer-segment targeting, product exclusions, and automatic discount combination logic"
category: pricing-promotions
risk: critical
source: curated
date_added: "2026-03-12"
tags: [price-rules, promotions, stacking, priority, exclusions, customer-segments, rule-engine]
triggers: ["price rules", "promotion rules", "stackable discounts", "pricing rule engine", "promotional pricing logic", "customer segment pricing"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Price Rules Engine

## Overview

A price rules engine lets you define multiple concurrent promotions — site-wide sales, coupon codes, loyalty discounts — and apply them to a cart in a predictable, controlled order. The key concerns are: which rules apply to which products, which rules can stack with others, and what happens when multiple rules target the same item. Every major platform has some form of this built in; the gap is usually in advanced stacking control and customer-segment targeting.

## When to Use This Skill

- When you have multiple concurrent promotions (site-wide sale + coupon + loyalty discount) and need deterministic stacking behavior
- When marketing needs to create complex promotions (e.g., "20% off all shoes except Nike, for Gold loyalty members") without engineering involvement
- When migrating from hardcoded promotional logic scattered across the codebase to a data-driven rule system
- When building a promotion scheduler that activates and deactivates rules at configured times
- When you need an audit log that shows exactly which rules were applied and why for customer service queries

## Core Instructions

### Step 1: Determine the merchant's platform and choose the right tool

| Platform | Built-in Capability | When to Extend |
|----------|-------------------|----------------|
| **Shopify** | Discounts admin handles basic stacking via "Combinations" settings | Use Bold Discounts or Shopify Scripts (Plus) for advanced rule stacking, customer-segment targeting, and conditional logic |
| **WooCommerce** | Coupons core + Dynamic Pricing plugin for conditional rules | For complex priority ordering and segment targeting: YITH WooCommerce Dynamic Pricing & Discounts provides the most control |
| **BigCommerce** | Promotions engine supports multiple concurrent promotions with priority ordering and stacking rules | BigCommerce's built-in system handles most scenarios natively |
| **Custom / Headless** | Must build | Required when none of the above fits your use case |

### Step 2: Configure price rules with stacking on your platform

---

#### Shopify

Shopify manages discount stacking through the **Combinations** setting on each discount.

**Setting up stacking rules:**
1. Go to **Discounts** → create or edit a discount
2. Scroll to the **Combinations** section
3. Toggle which types this discount can combine with:
   - **Product discounts** — can this stack with other product-level discounts?
   - **Order discounts** — can this stack with order-level discounts?
   - **Shipping discounts** — can this stack with free-shipping discounts?
4. For automatic discounts, the highest-value automatic discount takes precedence by default; use Combinations to allow stacking

**Customer-segment targeting:**
1. Under **Customer eligibility**, choose **Specific customer segments**
2. Select segments created in **Customers → Segments** (e.g., "VIP customers", "First-time buyers")

**Priority and exclusions:**
- Set **Start and end dates** to control which rules are active
- Under **Products**, set which products or collections the discount applies to
- Add exclusions: "Exclude sale items" or specify products that are excluded

**Shopify Plus — Shopify Scripts:**
For rules that cannot be expressed through the Discounts UI (e.g., tiered stacking where the second discount only applies if the cart is above a threshold):
1. Go to **Apps → Script Editor** (Scripts is a separate Shopify Plus feature)
2. Create a **Line Item Script** or **Shipping Script**
3. Scripts run at checkout and can apply complex conditional discounts; they take precedence over other discounts

**Bold Discounts (App Store, ~$20/month):**
A visual rule builder for Shopify that supports:
- Stack / don't stack per promotion
- Priority ordering between promotions
- Complex conditions (customer tags, collection membership, quantity thresholds)

---

#### WooCommerce

WooCommerce coupons support basic single-rule discounts. For a full price rules engine with priority ordering and stacking control, use the **Dynamic Pricing** plugin.

**Installing and configuring YITH WooCommerce Dynamic Pricing & Discounts:**
1. Install the plugin from YITH.com (~$70/year)
2. Go to **YITH → Dynamic Pricing → Pricing Rules**
3. Create a rule and configure:
   - **Type**: cart, product, or category pricing
   - **Discount**: percentage or fixed amount
   - **Conditions**: cart subtotal, quantity, customer role, date range
   - **Products/categories**: which items the rule applies to; set exclusions
   - **Priority**: lower number = higher priority (applied first)
   - **Stacking**: "Stop other rules" to prevent lower-priority rules from stacking

**Customer segment targeting in WooCommerce:**
1. Use WooCommerce **Customer Roles** (available via plugins like User Role Editor or WooCommerce B2B):
   - Assign customers to roles like "wholesale", "vip", "trade"
2. In Dynamic Pricing rules, restrict each rule to specific customer roles
3. Customers in that role see the discounted price; others see the regular price

**Example: VIP-only 20% off apparel, excludes clearance:**
1. Create a rule: Type = Category pricing, Category = Apparel
2. Discount = 20% off
3. Customer Role = VIP
4. Excluded products: [list of clearance product IDs]
5. Priority = 10

---

#### BigCommerce

BigCommerce's **Promotions** engine natively supports priority ordering and stacking control.

1. Go to **Marketing → Promotions → Create Promotion**
2. Under **Conditions**:
   - Set cart value, quantity, or product conditions
   - Under **Customer groups**: restrict to specific groups (wholesale, VIP, etc.)
3. Under **Actions**: set the discount type and amount
4. Set **Shipping** conditions if applicable
5. Under **Rules**:
   - **Can be combined with other promotions**: yes/no
   - **Priority**: lower number runs first
6. Set **Active date range**

BigCommerce evaluates promotions in priority order and respects the "can be combined" setting. Multiple non-combinable promotions will apply only the best-value one for the customer.

---

#### Custom / Headless

For custom storefronts, implement a rule evaluator that processes rules in priority order, enforces stacking constraints, and applies rules to eligible cart lines:

```typescript
interface PriceRule {
  id: string;
  name: string;
  type: 'percentage_off' | 'fixed_off' | 'free_shipping' | 'buy_x_get_y';
  value: number;            // percentage or cents
  priority: number;         // higher = applied first
  isStackable: boolean;
  couponCode?: string;      // null = automatic (no code required)
  minCartCents?: number;
  customerSegments?: string[];
  applicableProducts?: string[];
  applicableCategories?: string[];
  excludedProducts?: string[];
  startsAt: Date;
  endsAt?: Date;
}

interface CartContext {
  lines: { lineId: string; productId: string; categoryIds: string[]; quantity: number; currentPriceCents: number }[];
  subtotalCents: number;
  customerSegments: string[];
  appliedCouponCode?: string;
}

function evaluateRules(cart: CartContext, rules: PriceRule[]): { ruleId: string; discountCents: number }[] {
  const now = new Date();
  const active = rules.filter(r =>
    r.startsAt <= now && (!r.endsAt || r.endsAt > now)
  ).sort((a, b) => b.priority - a.priority); // highest priority first

  const applications: { ruleId: string; discountCents: number }[] = [];
  let nonStackableApplied = false;

  for (const rule of active) {
    if (!rule.isStackable && nonStackableApplied) continue;

    // Coupon-linked rules require the code to be applied
    if (rule.couponCode && rule.couponCode !== cart.appliedCouponCode) continue;

    // Cart minimum check
    if (rule.minCartCents && cart.subtotalCents < rule.minCartCents) continue;

    // Customer segment check
    if (rule.customerSegments?.length && !rule.customerSegments.some(s => cart.customerSegments.includes(s))) continue;

    // Find eligible lines
    const eligibleLines = cart.lines.filter(line => {
      if (rule.excludedProducts?.includes(line.productId)) return false;
      if (rule.applicableProducts?.length) return rule.applicableProducts.includes(line.productId);
      if (rule.applicableCategories?.length) return rule.applicableCategories.some(c => line.categoryIds.includes(c));
      return true; // no scope restriction = all products
    });
    if (eligibleLines.length === 0) continue;

    let discountCents = 0;
    if (rule.type === 'percentage_off') {
      discountCents = Math.round(
        eligibleLines.reduce((s, l) => s + l.currentPriceCents * l.quantity, 0) * rule.value / 100
      );
    } else if (rule.type === 'fixed_off') {
      discountCents = Math.min(rule.value, cart.subtotalCents);
    }

    if (discountCents > 0) {
      applications.push({ ruleId: rule.id, discountCents });
      if (!rule.isStackable) nonStackableApplied = true;
    }
  }

  return applications;
}
```

Persist rule applications with every order so you can answer customer service questions ("which discount applied?") and track promotion ROI.

## Best Practices

- **Higher priority = evaluated first** — use an explicit `priority` integer so marketing can control evaluation order without code changes
- **Separate stackable from exclusive rules** — once a non-stackable rule applies, skip all subsequent non-stackable rules; stackable rules always apply on top
- **Test rules in "dry run" mode before activating** — review the discount calculation on a sample cart before the promotion goes live
- **Use exclusion lists generously** — always allow marketing to specify excluded products/categories; unexpected application to premium or already-reduced items creates margin problems
- **Version rules rather than editing live rules** — deactivate old rules and create new versions; this preserves historical calculation for past orders
- **Log which rules were applied to each order** — store rule IDs and discount amounts on the order for customer service and ROI analysis

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Two non-stackable rules both apply | Sort by priority, apply the highest-priority non-stackable first, then skip all other non-stackable rules |
| A rule applies to an excluded product | Always check exclusions before inclusions; exclusion takes precedence in all cases |
| Total discount causes order to go negative | Cap total discount at cart subtotal; no order total should go below zero |
| Marketing edits a live rule mid-campaign | Treat active rules as immutable — create a new rule and deactivate the old one; never edit live rules |
| Rule activates/deactivates a few seconds off schedule | Set start/end times conservatively (a few minutes before/after intended time) and verify in staging; for critical timing, use Launchpad (Shopify Plus) or a scheduled job |

## Related Skills

- @coupon-management
- @discount-engine
- @dynamic-pricing
- @ab-testing-pricing
- @volume-pricing
