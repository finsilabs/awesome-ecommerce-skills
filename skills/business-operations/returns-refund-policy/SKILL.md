---
name: returns-refund-policy
description: "Automate your return and refund process with configurable return windows, restocking fees, and rule-based approval logic for each product type"
category: business-operations
risk: critical
source: curated
date_added: "2026-03-12"
tags: [returns-policy, refund-policy, restocking-fee, return-window, automated-approval, policy-engine]
triggers: ["return policy", "refund policy", "restocking fee", "return window", "automated returns", "return approval rules"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: intermediate
---

# Returns & Refund Policy Engine

## Overview

A returns and refund policy engine enforces your rules automatically: different return windows per product category, restocking fees for specific item types, final-sale exclusions, and extended windows for loyalty members. This prevents your customer service team from manually evaluating every return request and ensures consistent policy enforcement. Most platforms can implement these rules through their returns apps combined with product tags and customer segments.

## When to Use This Skill

- When your return logic is inconsistent because it's handled case-by-case by customer service
- When you need different return windows for different product categories (electronics vs. apparel vs. consumables)
- When implementing tiered return policies where loyalty members get extended windows or waived restocking fees
- When building an automated approval workflow that handles most returns without human intervention
- When compliance or legal requirements mandate that return policies be auditable and version-controlled

## Core Instructions

### Step 1: Determine your platform and choose the right returns tool

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Loop Returns or AfterShip Returns | Loop is the most feature-complete: supports per-product-type policies, restocking fees, final-sale blocking, and loyalty tier overrides |
| **WooCommerce** | ReturnGo or WooCommerce Returns and Warranty Requests | ReturnGo supports custom policy rules per product category and automated approval logic |
| **BigCommerce** | AfterShip Returns Center or Loop Returns | Both support per-category policy rules and restocking fees |
| **Custom / Headless** | Build a policy evaluation engine + Shippo for return labels | Store policies in a database; evaluate them programmatically when return requests come in |

### Step 2: Define your return policy rules

Before configuring any tool, define your policy matrix clearly:

| Product Category | Return Window | Restocking Fee | Auto-Approve | Notes |
|-----------------|---------------|----------------|--------------|-------|
| Default (apparel, accessories) | 30 days from delivery | 0% | Yes | Most items |
| Electronics | 15 days from delivery | 15% | No — manual review | Opened electronics |
| Final Sale | 0 days | — | No | No returns |
| VIP / Gold members | 60 days from delivery | 0% | Yes | Override for loyalty tier |
| Defective / Wrong item | 90 days from delivery | 0% | Yes | Customer not at fault |

### Step 3: Configure policy rules in your returns app

#### Shopify — Loop Returns

1. Install **Loop Returns** from the Shopify App Store
2. Go to Loop → Policy → Return Windows:
   - Default: 30 days
   - Click "Add Rule" → set "Product tag is 'electronics'" → return window: 15 days
   - Click "Add Rule" → set "Product tag is 'final-sale'" → return window: 0 days (no returns)
3. Tag your products accordingly in Shopify admin (Products → Tags)
4. Go to Loop → Policy → Restocking Fees:
   - Add a rule: "Product tag is 'electronics'" → restocking fee: 15%
5. Go to Loop → Policy → Customer Segments:
   - Add a rule: "Customer tag is 'gold-member' or 'vip'" → return window override: 60 days, restocking fee: 0%
6. Enable auto-approval for eligible returns in Loop → Settings → Automation: "Auto-approve returns that meet policy conditions"
7. Loop generates the return label automatically when a return is approved

**Testing your policy:**
- Use Loop's Policy Simulator (Loop → Policy → Test Policy) to verify that a hypothetical return request (product type, customer tag, days since delivery) applies the correct rule

#### WooCommerce — ReturnGo

1. Install **ReturnGo** from retgo.com (or WordPress.org)
2. Go to ReturnGo → Return Policy:
   - Set default return window: 30 days
   - Under "Custom Rules", add product-category-based rules:
     - Category "Electronics" → 15 days, 15% restocking fee, requires manual review
     - Category "Final Sale" → 0 days (no returns allowed)
3. Under "Customer Rules": add tag-based overrides:
   - Customer tag "wholesale" → 14 days, 10% restocking fee
4. Configure auto-approval: ReturnGo → Automation → enable "Auto-approve returns that match policy"
5. Test by creating a return request as a customer to verify rules apply correctly

**Configuring final-sale in WooCommerce:**
- Create a product category or tag called "final-sale"
- In ReturnGo, add a rule blocking returns for this category/tag
- On the product page, display the "Final Sale — No Returns" message using a product badge plugin

#### BigCommerce — AfterShip Returns Center

1. Install AfterShip Returns Center from the BigCommerce App Marketplace
2. Go to AfterShip → Policy:
   - Set the default return window and configure exceptions by product type
3. AfterShip's policy engine supports return windows and auto-approval rules based on product tags
4. For restocking fees: AfterShip includes restocking fee configuration in their paid plans

### Step 4: Handle return window calculation correctly

The single most important setting: the return window should start from the **delivery date**, not the order date or ship date.

**Why this matters:**
- Shipping a package takes 2–10 days depending on the service
- A 30-day return window starting from order date may leave the customer with only 20 days to actually return the item
- Most consumer protection laws (EU 14-day right of withdrawal, UK 14 days) count from delivery

**Verify this in your returns app:**
- Loop Returns: go to Loop → Settings → Return Window → "Starts from: Delivery Date" ✓
- ReturnGo: go to Settings → Policy → "Return window starts from: Delivered date" ✓
- AfterShip: go to Settings → Return Policy → "Start date: Order delivered date" ✓

If your returns app doesn't have tracking integration to detect delivery, use "Order Date + carrier average transit time" as an approximation.

### Step 5: Communicate policies clearly

1. **Returns page:** Create a dedicated `/returns` or `/return-policy` page with your policy matrix in a table format — customers reference this before purchasing
2. **Product pages:** Show a brief returns statement near the "Add to Cart" button: "30-day free returns" or "Final Sale — No Returns" for final sale items
3. **Order confirmation email:** Include a link to your returns page and a brief "30-day returns" statement
4. **Return window expiry reminder:** Set up an automated email 7 days before a customer's return window closes — Loop and AfterShip both support this

### Step 6: Custom / Headless — policy evaluation logic

```typescript
// Return policy rules stored in database and evaluated programmatically
interface ReturnPolicy {
  id: string;
  name: string;
  priority: number;           // higher = evaluated first
  conditions: {
    productTags?: string[];   // match any of these tags
    customerTags?: string[];  // match any of these customer tags
    orderTags?: string[];     // e.g., ['final-sale']
  };
  windowDays: number;         // 0 = no returns allowed
  restockingFeePct: number;   // 0–100
  autoApprove: boolean;
}

async function evaluateReturnEligibility(params: {
  orderId: string;
  productId: string;
  customerId: string;
  returnReason: string;
  deliveredAt: Date;
}): Promise<{
  eligible: boolean;
  policy: ReturnPolicy | null;
  restockingFeeCents: number;
  requiresManualReview: boolean;
  daysRemaining: number;
  reason?: string;
}> {
  const order = await db.orders.findById(params.orderId);
  const product = await db.products.findById(params.productId, { include: ['tags'] });
  const customer = await db.customers.findById(params.customerId, { include: ['tags'] });

  // Find highest-priority matching policy
  const policies = await db.returnPolicies.findAll({ is_active: true }, { orderBy: ['priority', 'desc'] });
  const policy = policies.find(p => {
    const productMatch = !p.conditions.productTags?.length ||
      p.conditions.productTags.some(tag => product.tags.includes(tag));
    const customerMatch = !p.conditions.customerTags?.length ||
      p.conditions.customerTags.some(tag => customer.tags.includes(tag));
    const orderMatch = !p.conditions.orderTags?.length ||
      p.conditions.orderTags.some(tag => order.tags?.includes(tag));
    return productMatch && customerMatch && orderMatch;
  }) ?? null;

  if (!policy || policy.windowDays === 0) {
    return { eligible: false, policy, restockingFeeCents: 0, requiresManualReview: false, daysRemaining: 0, reason: 'FINAL_SALE_OR_NO_POLICY' };
  }

  // Calculate days since delivery
  const daysSinceDelivery = Math.floor((Date.now() - params.deliveredAt.getTime()) / 86400000);
  const daysRemaining = policy.windowDays - daysSinceDelivery;

  if (daysRemaining < 0) {
    return { eligible: false, policy, restockingFeeCents: 0, requiresManualReview: false, daysRemaining: 0, reason: 'WINDOW_EXPIRED' };
  }

  // Calculate restocking fee on the item's original price
  const orderLine = await db.orderLines.findOne({ order_id: params.orderId, product_id: params.productId });
  const itemValueCents = orderLine.unit_price_cents * orderLine.quantity;
  const restockingFeeCents = Math.round(itemValueCents * (policy.restockingFeePct / 100));

  return {
    eligible: true,
    policy,
    restockingFeeCents,
    requiresManualReview: !policy.autoApprove,
    daysRemaining,
  };
}
```

## Best Practices

- **Start the return window from delivery date, not order date** — this is more fair to customers, reduces disputes, and aligns with consumer protection laws in most jurisdictions
- **Version every policy change** — when you update a return policy, log the old policy with a timestamp; apply the policy that was in effect at the time of purchase when a customer files a return
- **Display restocking fees before the customer confirms the return** — show "A 15% restocking fee ($12.75) will be deducted from your refund" during the return initiation flow, not after
- **Cap auto-approval by refund value** — even with auto-approval enabled, route returns over $500 to manual review to catch potential fraud
- **Notify customers proactively about expiring windows** — a "Your 30-day return window closes in 7 days" email for recent purchases reduces frustrated customers who missed the window

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Return window calculated from order date instead of delivery date | Check your returns app settings explicitly for "return window starts from" — default in some tools is order date; change to delivery date |
| Multiple policies match and the wrong one applies | Sort by `priority DESC` and take the first match; document the priority hierarchy in your admin; test edge cases (VIP member buying electronics) |
| Customer disputes restocking fee | Show the fee amount and the policy name ("Electronics Policy — 15% restocking fee") in the return confirmation email so customers have documentation |
| Final sale tag not applied consistently | Create a process: every product added to a sale must have the "final-sale" tag applied; audit monthly using a product tag report |

## Related Skills

- @returns-management
- @order-management-system
- @b2b-commerce
