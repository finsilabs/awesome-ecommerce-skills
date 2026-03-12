# Flash Sale Readiness: k6 Load Test for Storefront

## Problem/Feature Description

Finsi, a mid-sized online clothing retailer, is preparing for their annual summer sale — historically their largest traffic event of the year, driving 8× normal traffic. The engineering team wants to validate that the checkout flow and product catalog can handle the expected surge without degrading response times for shoppers. In previous years, the checkout service experienced latency spikes during peak periods that caused abandoned carts and lost revenue.

The team needs a realistic k6 load test that simulates how shoppers actually behave across the storefront — from browsing the catalog to completing a purchase — so they can identify bottlenecks before the event. The test must reflect real shopping patterns (most visitors browse; a small fraction actually buy) and must not interfere with the payment processor or leave test garbage in the production order database.

## Output Specification

Write a k6 load test script in `k6/checkout-flow.js` that simulates realistic multi-user shopping behavior. The script should include:

- Multiple scenario functions exported from the same file, covering different user journeys
- Scenario configuration with executor settings, ramp-up/steady-state/ramp-down stages, and weights that reflect realistic traffic distribution
- Performance thresholds appropriate for checkout and catalog workloads
- A `data/products.json` file with at least 3 sample product objects (each with `id` and `defaultVariantId` fields) for use as test data
- A `load-test-plan.md` summarizing the test design decisions, including: why the chosen executor was selected, how think time values were chosen, and how test users/orders can be cleaned up after the run
