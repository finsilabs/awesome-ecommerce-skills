# Checkout Shipping Rate Engine

## Problem/Feature Description

A growing online retailer is struggling with slow checkout performance and occasional complete failures when carrier APIs go down. Currently their checkout page fetches shipping rates sequentially from UPS, FedEx, and USPS — when any one of them is slow or offline, customers see a spinning loader for 15+ seconds or an error message with no shipping options at all. Cart abandonment has increased significantly.

The team needs a robust `ShippingRateEngine` class in TypeScript that aggregates rates across multiple carrier adapters in a resilient way. It should be fast even when some carriers are sluggish, serve previously-fetched results when appropriate, and always give customers something useful to choose from — even when all live carrier APIs fail. The checkout team wants to show customers the most relevant options without overwhelming them with choices.

## Output Specification

Produce a TypeScript file `rate-engine.ts` containing:
- The `ShippingRateEngine` class with `registerCarrier()` and `getRates()` methods
- All required TypeScript interfaces (`ShipmentRequest`, `ShippingRate`, `CarrierAdapter`, `Address`, `Package`)

Also produce a `rate-engine.test.ts` file that demonstrates the engine's resilience and performance characteristics using mock carrier adapters — including scenarios where carriers behave differently (fast, slow, or failing entirely). Log results to the console so behavior is visible in output.
