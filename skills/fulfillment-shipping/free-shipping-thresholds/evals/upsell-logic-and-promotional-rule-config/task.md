# Holiday Promotion and Upsell Suggestions

## Problem Description

Meridian Goods is preparing for its holiday sale and wants to do two things at once: temporarily lower the free-shipping threshold for a limited window to drive higher order volumes, and show targeted product suggestions to customers who are just a few dollars short of qualifying.

The merchandising team has specifically flagged that irrelevant suggestions (shown when a customer is far from the threshold, or shown for out-of-stock items already in the cart) have hurt trust in previous campaigns. They want suggestions to appear only when they are actionable — i.e., when the customer is genuinely close to the threshold and one product addition could push them over.

The current codebase has a `SHIPPING_RULES` array with a standard rule that provides free shipping at $75 for US customers. The team does **not** want this rule changed; instead, the holiday promotion should be layered on top.

You have been asked to:

1. Add a holiday promotion rule to the existing rules array that lowers the free-shipping threshold to $50 for US and Canadian customers from December 1 through December 31, 2026. The promotion should automatically take precedence over the standard rule during that window.
2. Build a function `getFreeShippingUpsells` that, given the current cart subtotal (in cents), the gap to the threshold (in cents), and the list of product IDs already in the cart, returns a list of product suggestions from the database.

## Output Specification

Produce the following files:

- `shipping-rules-holiday.ts` — contains the updated `SHIPPING_RULES` array (or an exported holiday rule constant that can be spread into the array) and the `getFreeShippingUpsells` function. Assume a `db.products.findAll(...)` ORM method is available; stub or type it as needed.
- `upsell-demo.ts` — a short script that demonstrates the `getFreeShippingUpsells` function being called with at least two scenarios: one where the gap is small enough that suggestions should appear, and one where the gap is too large. Log the query parameters used in each case.

The existing standard rule (`rule_us_standard`, free shipping at $75 for US, priority 5) must remain present and unchanged in the output.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: existing-rules.ts ===============
import { ShippingRule } from './types';

export const SHIPPING_RULES: ShippingRule[] = [
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
    freeShippingThreshold: null,
    applicableZones: [],
    customerSegments: [],
    priority: 1,
    isActive: true,
    startsAt: null,
    endsAt: null,
  },
];
