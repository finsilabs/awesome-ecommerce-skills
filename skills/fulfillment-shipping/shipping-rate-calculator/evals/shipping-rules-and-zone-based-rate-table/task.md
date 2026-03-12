# Store Shipping Rules and Zone Pricing Module

## Problem/Feature Description

A specialty outdoor retailer ships products across the US, Canada, and internationally. Their current shipping system charges every customer the same flat rate regardless of destination or order size, causing them to lose money on heavy international orders and frustrate domestic customers who expect free shipping after spending over a certain amount.

The product team wants a configurable shipping rules module that can apply store-defined promotions (free shipping above a threshold, flat-rate domestic options) on top of carrier-quoted rates, and also support a fallback rate table based on destination zone and package weight when carrier APIs are unavailable. The module needs to handle the full mix: carrier rates combined with store rules, filtered appropriately by country and order weight, and presented back in a consistent format.

## Output Specification

Write a TypeScript file `shipping-rules.ts` that exports:
- The `ShippingRule` interface
- An `applyShippingRules()` function that takes carrier rates, an array of rules, order total, total weight, and destination address, and returns a combined sorted list of all applicable rates
- A `getZoneRate()` function implementing a three-zone rate table (domestic US, Canada, international) with weight buckets
- A `getZone()` helper and `getWeightBucket()` helper

Write a `demo.ts` script that creates a sample set of shipping rules (at least one free shipping rule with a minimum order total, one flat rate rule, and one zone-based rate lookup), runs them against two different scenarios (one domestic order above the free-shipping threshold, one international order), and prints the resulting rate options for each scenario.
