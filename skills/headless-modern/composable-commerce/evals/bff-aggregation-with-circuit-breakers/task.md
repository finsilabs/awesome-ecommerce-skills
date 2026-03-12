# Product Detail Page Backend Aggregation Service

## Problem Description

A mid-sized fashion retailer is migrating from a monolithic Magento store to a composable commerce stack. Their product detail page currently requires data from four separate services: a product catalog (with full product attributes), an inventory service (real-time stock levels), a reviews service (customer reviews and ratings), and a recommendations engine (personalized product suggestions). Each service has its own independent API.

The frontend team is building a React storefront and is frustrated because making four separate API calls from the browser introduces waterfalls, exposes internal API structure, and makes it hard to handle partial failures gracefully. They need a single backend endpoint that aggregates all the data they need for a product page.

The inventory service in particular has a track record of intermittent slowdowns under load. The team has been burned before when inventory failures cascaded to take down the entire product page. They need the aggregation layer to degrade gracefully when inventory is unavailable — showing the product as available with no exact stock count — rather than returning an error to the user.

The team also wants this aggregation API to be queryable with GraphQL so that different frontends (web, mobile app) can request exactly the fields they need.

## Output Specification

Implement the BFF service in TypeScript. Produce the following files:

- `bff/src/routes/product-page.ts` — the aggregation function that fetches from catalog, inventory, reviews, and recommendations
- `bff/src/gateway.ts` — the GraphQL gateway setup that exposes the aggregated data
- `bff/src/resilience/inventory-circuit.ts` — the circuit breaker configuration for the inventory service
- `bff/package.json` — package manifest listing dependencies

The code does not need to be runnable against live services, but should be complete and correct TypeScript demonstrating the patterns used.
