# Resilient Payment and Database Layer

## Problem/Feature Description

An e-commerce platform's checkout service calls Stripe for payment capture and PostgreSQL for order writes. During last month's product launch, a 12-second Stripe latency spike caused 4,000 in-flight requests to each hold a thread waiting for a response. The connection pool drained in under 90 seconds, the service stopped responding, and the ops team had to manually restart pods. Recovery took 11 minutes. Post-mortem identified two root causes: no mechanism to detect and fast-fail calls to an unhealthy Stripe, and no fallback path to keep orders flowing when payment capture is temporarily unavailable.

The team wants to wrap both the Stripe payment call and the database write in circuit breakers that fail fast once a service is struggling, track their state transitions in a format compatible with Prometheus, and fall back to a retry queue when payment fails rather than showing customers an error. Catalog reads should also be separated from writes: during sales the product pages generate enormous read traffic that should not compete with order writes for connections on the primary database. Frequently-accessed product data should be served from cache when available.

## Output Specification

Write the following TypeScript files:

- `circuit-breakers.ts` — exports `paymentCircuit` and `dbCircuit`, their Prometheus metrics, and the fallback behavior for the payment circuit
- `db-router.ts` — exports a `db` object with `read()` and `write()` methods routing to separate connection pools, and a `getProductCached()` function

You may stub out the actual Stripe and database calls (e.g., `captureStripePayment`, `writeOrderToDatabase`) — focus on the circuit breaker wiring, metric instrumentation, fallback logic, and DB routing.

Include a `config.md` file (max 150 words) explaining the circuit breaker thresholds chosen and why timeout is the primary trigger.
