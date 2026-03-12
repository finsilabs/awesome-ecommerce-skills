# Shipping Rule Engine

## Problem Description

Volta Commerce is a mid-size online retailer that currently hard-codes a single $75 free-shipping threshold for all customers. The engineering team has been asked to replace this with a flexible rule engine that supports different thresholds for different customer tiers and shipping destinations, and can accommodate temporary promotional thresholds during sales events — all without shipping a code change every time a rule changes.

The business requirements are:

- Gold and Platinum loyalty members shipping within the US qualify for free shipping at $49+.
- Standard US customers qualify for free shipping at $75+.
- International customers (any zone not matched by a more specific rule) never qualify for free shipping via the rule engine.
- Rules can be scheduled to activate and deactivate on specific dates (for holiday promotions, etc.).
- When multiple rules match a customer's cart, the rule with the highest priority takes effect.

You have been asked to build a TypeScript module that models these rules and provides a function to determine, given a cart subtotal, a shipping zone, and a customer's segment memberships, whether the cart qualifies for free shipping and — if not — how much more the customer needs to spend.

## Output Specification

Produce a single TypeScript file `shipping-rules.ts` that contains:

1. The `ShippingRule` type/interface definition.
2. A hardcoded array of at least the three rules described above (`SHIPPING_RULES` or similar).
3. A function that accepts a cart subtotal, a shipping zone string, and an array of customer segment strings, and returns an object indicating whether shipping is free, what the applicable threshold is, how much more the customer needs to spend to qualify, and the cart's progress toward the threshold as a percentage (0–100).

Also produce a short `shipping-rules.test.ts` (or equivalent test/demo script) that demonstrates the function returning correct results for at least these three cases:
- A Gold member in the US with a $40 cart.
- A standard US customer with a $60 cart.
- An international customer with a $200 cart.

You may use Node.js built-ins and TypeScript; no additional packages should be required to run the demo.
