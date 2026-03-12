# Promotion Tracking and Safe Rule Updates

## Problem/Feature Description

GearUp, a sporting goods retailer, has been running a pricing rule engine for two months and has surfaced two critical problems. First, customer service agents cannot look up exactly which promotions were applied to a specific past order — they only see the final discounted total, making refund calculations and dispute resolution very difficult. The team needs a function that, when an order is placed, records every applied discount against the order for future auditing.

Second, there are correctness questions about the "Accessories Buy 2 Get 1 Free" promotion: customers have been complaining the wrong item is being made free, and the engineering team needs to revisit that calculation. On top of that, the CMO wants to change the minimum cart value on their site-wide "Summer Flat $15 Off" promotion from $75 to $100 because margins are being squeezed — the team needs a workflow that changes the rule without corrupting the audit trail for the 3,400 orders already placed under the old terms.

Your task is to address all three gaps:
1. Implement the order-placement logic that persists discount records
2. Implement correct discount calculations for the flat-off and buy-X-get-Y rule types
3. Demonstrate a safe workflow for updating the live Summer sale rule

## Output Specification

Produce a `solution/` directory containing:

- `persist.ts` (or `.js`) — the function that records rule applications when an order is placed
- `apply-rules.ts` (or `.js`) — implementations of the `fixed_off` and `buy_x_get_y` discount calculations
- `rule-update.ts` (or `.js`) — a script or function demonstrating how to safely update the live Summer sale rule
- `tests/` — test files providing good coverage of the persistence, discount calculation, and rule update logic
- A `README.md` explaining the design decisions

## Input Files

The following rules and orders are provided as starting context. Extract them before beginning.

=============== FILE: inputs/existing-rules.json ===============
{
  "rules": [
    {
      "id": "rule-b2g1-accessories",
      "name": "Accessories Buy 2 Get 1 Free",
      "type": "buy_x_get_y",
      "value": null,
      "priority": 20,
      "is_stackable": true,
      "applicable_categories": ["cat-accessories"],
      "is_active": true,
      "usage_limit": null,
      "usage_count": 847
    },
    {
      "id": "rule-summer-flat15",
      "name": "Summer Flat $15 Off",
      "type": "fixed_off",
      "value": 1500,
      "priority": 10,
      "is_stackable": false,
      "min_cart_value": 7500,
      "is_active": true,
      "usage_limit": 5000,
      "usage_count": 3400
    }
  ]
}
