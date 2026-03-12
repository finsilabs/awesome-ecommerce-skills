# Evolving the Product Service API and Adding Observability

## Problem Description

A composable commerce platform has a Product Service that has been running in production for 18 months. The current API (v1) exposes basic product data — id, name, and price. The product team wants to add richer attributes in a v2: product categories, custom attributes map, and brand. However, several existing consumers (a mobile app, a partner integration, and a legacy reporting tool) are still on the v1 contract and cannot be migrated immediately. Any change that breaks v1 consumers would cause an incident.

At the same time, the platform's SRE team has been struggling to diagnose production failures. When a customer complaint comes in about a bad checkout, they need to trace the request across the product service, cart service, and checkout service, but currently each service logs independently with no shared correlation. The SRE team wants all service calls for a single user request to be identifiable under one trace.

You have been brought in to update the Product Service codebase to address both concerns.

## Output Specification

Produce the following files:

- `product-service/src/types.ts` — TypeScript type definitions for ProductV1 and ProductV2
- `product-service/src/routes/products.ts` — Express (or similar) route handlers for the v1 and v2 product endpoints
- `product-service/src/tracing.ts` — OpenTelemetry setup and trace propagation helpers
- `product-service/package.json` — package manifest listing dependencies

The versioning implementation should ensure existing v1 consumers continue to work without modification. The tracing implementation should show how a trace ID is established and propagated so that downstream service calls can be correlated. Code does not need to connect to a live database but should be complete and correct TypeScript.
