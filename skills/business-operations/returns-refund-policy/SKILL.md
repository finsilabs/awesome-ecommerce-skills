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
platforms: [platform-agnostic]
difficulty: intermediate
---

# Returns & Refund Policy Engine

## Overview

Build a configurable policy engine that evaluates return eligibility based on product category, time since purchase, order history, and reason codes. Automates approval for low-risk returns and routes exception cases to manual review. Supports configurable restocking fees, return window overrides, and final-sale exclusions, enabling non-technical staff to adjust return rules without code changes.

## When to Use This Skill

- When your return logic is scattered across multiple code paths and needs to be centralized into a policy engine
- When you need different return windows for different product categories (electronics vs apparel vs consumables)
- When implementing tiered return policies where loyalty members get extended windows or waived restocking fees
- When building an automated approval workflow that handles 80% of returns without human intervention
- When compliance or legal requirements mandate that return policies be auditable and version-controlled

## Prerequisites & Platform Notes

**Shopify**: Integrate with Shopify via Admin API for orders, customers, and inventory. Use Shopify Flow for automation. Connect ERP/OMS via apps or custom webhooks.
**WooCommerce**: Use WooCommerce REST API for order/inventory data. Automate with AutomateWoo or custom WordPress cron jobs. Connect external systems via webhooks.
**BigCommerce / Other platforms**: Most capabilities described here have equivalent apps or APIs; check your platform's app marketplace first.
**Custom / Headless**: The code examples below target custom storefronts using Node.js and PostgreSQL. Adapt the patterns to your stack.

**You'll need**: A running store, API access, relevant third-party accounts (ERP, OMS, etc.)

## Core Instructions

1. **Define the policy rules schema**

   ```sql
   CREATE TABLE return_policies (
     id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name                VARCHAR(128) NOT NULL,
     priority            INTEGER NOT NULL DEFAULT 0,
     -- Matching conditions
     product_category_ids UUID[],         -- NULL = all categories
     customer_segments   VARCHAR(64)[],   -- NULL = all customers
     order_tags          VARCHAR(64)[],   -- e.g. ['final_sale']
     -- Policy settings
     return_window_days  INTEGER NOT NULL, -- 0 = no returns
     restocking_fee_pct  NUMERIC(5,2) NOT NULL DEFAULT 0,
     restocking_fee_max  INTEGER,         -- cents cap; NULL = no cap
     allowed_reasons     VARCHAR(64)[],   -- NULL = all reasons allowed
     auto_approve        BOOLEAN NOT NULL DEFAULT true,
     requires_receipt    BOOLEAN NOT NULL DEFAULT false,
     is_active           BOOLEAN NOT NULL DEFAULT true,
     created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   -- Version history for audit trail
   CREATE TABLE return_policy_versions (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     policy_id   UUID NOT NULL REFERENCES return_policies(id),
     snapshot    JSONB NOT NULL,  -- full policy JSON at time of change
     changed_by  UUID NOT NULL,
     changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   ```

   Seed default policies:
   ```sql
   INSERT INTO return_policies (name, priority, return_window_days, restocking_fee_pct, auto_approve) VALUES
     ('Final Sale — No Returns',    100, 0,  0,  false),
     ('Electronics — 15 days, 15% restocking', 50, 15, 15, false),
     ('Apparel — 30 days, no fee', 20,  30, 0,  true),
     ('Standard — 30 days',         0,   30, 0,  true);
   ```

2. **Evaluate the applicable policy for a return request**

   ```typescript
   interface ReturnEligibilityResult {
     eligible: boolean;
     policy: ReturnPolicy | null;
     reason?: 'WINDOW_EXPIRED' | 'FINAL_SALE' | 'REASON_NOT_ALLOWED' | 'NOT_DELIVERED';
     restockingFeeCents: number;
     requiresManualReview: boolean;
     daysRemaining: number;
   }

   async function evaluateReturnEligibility(params: {
     orderId: string;
     productIds: string[];
     returnReason: string;
     customerId: string;
   }): Promise<ReturnEligibilityResult> {
     const order = await db.orders.findById(params.orderId);
     if (order.status !== 'delivered') {
       return { eligible: false, policy: null, reason: 'NOT_DELIVERED', restockingFeeCents: 0, requiresManualReview: false, daysRemaining: 0 };
     }

     const customerSegments = await db.customers.getSegments(params.customerId);
     const productCategories = await db.products.getCategoryIds(params.productIds);
     const orderTags = order.tags ?? [];

     const policy = await resolvePolicy(productCategories, customerSegments, orderTags);
     if (!policy) {
       return { eligible: false, policy: null, reason: 'FINAL_SALE', restockingFeeCents: 0, requiresManualReview: false, daysRemaining: 0 };
     }

     if (policy.return_window_days === 0) {
       return { eligible: false, policy, reason: 'FINAL_SALE', restockingFeeCents: 0, requiresManualReview: false, daysRemaining: 0 };
     }

     if (!order.delivered_at) {
       return { eligible: false, policy: null, reason: 'NOT_DELIVERED', restockingFeeCents: 0, requiresManualReview: false, daysRemaining: 0 };
     }
     const daysSinceDelivery = Math.floor((Date.now() - order.delivered_at.getTime()) / 86400000);
     const daysRemaining = policy.return_window_days - daysSinceDelivery;
     if (daysRemaining < 0) {
       return { eligible: false, policy, reason: 'WINDOW_EXPIRED', restockingFeeCents: 0, requiresManualReview: false, daysRemaining: 0 };
     }

     if (policy.allowed_reasons && !policy.allowed_reasons.includes(params.returnReason)) {
       return { eligible: false, policy, reason: 'REASON_NOT_ALLOWED', restockingFeeCents: 0, requiresManualReview: false, daysRemaining };
     }

     const itemsValue = await calculateReturnValue(params.orderId, params.productIds);
     const restockingFeeCents = calculateRestockingFee(policy, itemsValue);

     return {
       eligible: true,
       policy,
       restockingFeeCents,
       requiresManualReview: !policy.auto_approve,
       daysRemaining,
     };
   }
   ```

3. **Resolve the highest-priority matching policy**

   ```typescript
   async function resolvePolicy(
     productCategoryIds: string[],
     customerSegments: string[],
     orderTags: string[]
   ): Promise<ReturnPolicy | null> {
     const allPolicies = await db.returnPolicies.findAll({ is_active: true }).orderBy('priority', 'desc');

     for (const policy of allPolicies) {
       const categoryMatch = !policy.product_category_ids?.length ||
         policy.product_category_ids.some(c => productCategoryIds.includes(c));

       const segmentMatch = !policy.customer_segments?.length ||
         policy.customer_segments.some(s => customerSegments.includes(s));

       const tagMatch = !policy.order_tags?.length ||
         policy.order_tags.some(t => orderTags.includes(t));

       if (categoryMatch && segmentMatch && tagMatch) {
         return policy;
       }
     }

     return null;
   }
   ```

4. **Calculate restocking fees**

   ```typescript
   function calculateRestockingFee(policy: ReturnPolicy, itemValueCents: number): number {
     if (policy.restocking_fee_pct === 0) return 0;

     const fee = Math.round(itemValueCents * (policy.restocking_fee_pct / 100));
     if (policy.restocking_fee_max !== null) {
       return Math.min(fee, policy.restocking_fee_max);
     }
     return fee;
   }

   async function calculateReturnValue(orderId: string, productIds: string[]): Promise<number> {
     const lines = await db.orderLines.findAll({
       order_id: orderId,
       product_id: { in: productIds },
     });
     return lines.reduce((sum, l) => sum + l.unit_price * l.quantity, 0);
   }
   ```

5. **Auto-approve or route to manual review**

   ```typescript
   async function processReturnRequest(returnRequestId: string): Promise<void> {
     const rma = await db.returnRequests.findById(returnRequestId);
     const lines = await db.returnLines.findByReturnRequestId(returnRequestId);
     const productIds = lines.map(l => l.product_id);

     const eligibility = await evaluateReturnEligibility({
       orderId: rma.order_id,
       productIds,
       returnReason: rma.return_reason,
       customerId: rma.customer_id,
     });

     if (!eligibility.eligible) {
       await db.returnRequests.update(returnRequestId, { status: 'rejected' });
       await sendRejectionEmail(rma, eligibility.reason!);
       return;
     }

     await db.returnRequests.update(returnRequestId, { restocking_fee: eligibility.restockingFeeCents });

     if (eligibility.requiresManualReview) {
       await db.returnRequests.update(returnRequestId, { status: 'requested' });
       await alertCustomerServiceTeam(rma, eligibility);
     } else {
       // Auto-approve and issue label
       await db.returnRequests.update(returnRequestId, { status: 'approved' });
       await approveReturnAndIssueLabel(returnRequestId, 'system');
     }
   }
   ```

## Examples

### Gold loyalty members get a 60-day return window with no restocking fee

```typescript
await db.returnPolicies.insert({
  name: 'Gold Member Extended Return',
  priority: 60,
  product_category_ids: null,     // all categories
  customer_segments: ['gold', 'platinum'],
  order_tags: null,
  return_window_days: 60,
  restocking_fee_pct: 0,
  auto_approve: true,
  is_active: true,
});
```

### Audit log: policy changes over time

```sql
SELECT
  rp.name,
  rpv.changed_at,
  u.name AS changed_by,
  rpv.snapshot->>'return_window_days' AS window_days,
  rpv.snapshot->>'restocking_fee_pct' AS fee_pct
FROM return_policy_versions rpv
JOIN return_policies rp ON rp.id = rpv.policy_id
LEFT JOIN users u ON u.id = rpv.changed_by
WHERE rp.id = $1
ORDER BY rpv.changed_at DESC;
```

## Best Practices

- **Version every policy change** — any modification to a return policy should create a new row in `return_policy_versions` with a JSONB snapshot; this creates an immutable audit trail for disputes
- **Evaluate the policy that was active at purchase time** — for regulatory compliance, use the policy in effect on `order.created_at`, not the current policy, when a customer files a return
- **Build a test console for policy evaluation** — let non-engineers test hypothetical scenarios ("what if a Gold member returns electronics after 20 days?") without deploying code
- **Clearly communicate restocking fees at return initiation** — display the calculated fee before the customer confirms the return so there are no billing surprises
- **Cap auto-approval by value** — even with `auto_approve = true`, route high-value returns (e.g., over $500) to manual review to catch fraud
- **Log every `evaluateReturnEligibility` call** — store the input parameters and the policy result so customer service can reconstruct exactly why a return was approved or rejected
- **Notify customers proactively about return window expiry** — a "Your return window closes in 7 days" email for recent orders reduces customer frustration and increases trust

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Return window calculated from ship date instead of delivery date | Use `order.delivered_at` as the start of the return clock, not `order.created_at` or `shipped_at` |
| Multiple policies match the same order and the wrong one applies | Sort by `priority DESC` and take the first match; document the priority scheme clearly in the admin UI |
| Customer disputes the restocking fee after the fact | Show the restocking fee amount and the policy it came from in the return confirmation email |
| Policy engine ignores order tags (e.g., final_sale) | Test with orders that have final_sale tags; ensure `tagMatch` logic evaluates order-level tags correctly |

## Related Skills

- @returns-management
- @order-management-system
- @loyalty-points-system
- @coupon-management
- @b2b-commerce
