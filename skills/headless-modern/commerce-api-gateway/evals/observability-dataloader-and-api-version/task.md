# Commerce Gateway: Distributed Tracing, Performance, and Versioning

## Problem/Feature Description

TradeFlow, a B2B commerce platform, has a working API gateway but it is struggling in production: the platform team is getting reports of slow pages, mysterious timeouts, and a critical performance bug — when the storefront fetches a product list with 50 items, the gateway is making 50 individual inventory API calls (one per product). Engineering has also received a complaint from a mobile app team: they added distributed tracing to their service but the gateway is not propagating trace context, making it impossible to see end-to-end traces. Finally, the commerce team is about to release a breaking change to the product API and needs a versioning strategy so the mobile app on the old API version is not disrupted.

A second initiative: the platform has acquired a legacy pricing service that only exposes a REST API. The team wants to include its data in the new unified GraphQL schema without rewriting the legacy system.

The gateway is built in TypeScript. Your task is to address these four concerns: add distributed tracing instrumentation, fix the N+1 query problem in the inventory subgraph, design an API versioning approach for the REST endpoints, and wrap the legacy pricing REST API as a GraphQL subgraph.

## Output Specification

Produce a `gateway/` directory with the following files:

- `gateway/src/tracing.ts` — OpenTelemetry setup for the gateway service
- `gateway/src/resolvers/inventory-resolver.ts` — inventory entity resolver that solves the N+1 performance problem (stub the actual upstream API call)
- `gateway/src/subgraphs/pricing/schema.graphql` — GraphQL schema for the legacy pricing subgraph
- `gateway/src/subgraphs/pricing/executor.ts` — executor that integrates the legacy pricing REST API as a virtual GraphQL subgraph
- `gateway/src/server.ts` — gateway server showing how the REST API versioning strategy is implemented in routing
- `gateway/package.json` — with all required dependencies
- `gateway/DECISIONS.md` — documenting: how tracing is initialized relative to other imports, which observability packages are used and the service name chosen, how the N+1 problem is solved, how API versioning is handled at the gateway layer, and which approach integrates the legacy REST API into GraphQL

The code does not need to connect to real services. Use stubs/mocks for the actual upstream HTTP calls. The code should be syntactically correct TypeScript.
