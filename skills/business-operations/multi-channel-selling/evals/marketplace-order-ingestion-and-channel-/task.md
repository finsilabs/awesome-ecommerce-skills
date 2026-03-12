# Marketplace Webhook Order Ingestion

## Problem/Feature Description

Crafter's Depot is an arts-and-crafts retailer that just completed their marketplace expansion, adding Amazon US and Walmart Marketplace alongside their existing DTC store. Their webhook handlers are a mess: Amazon-specific parsing logic is mixed into the order processing code, Walmart's format is handled inline with a bunch of `if (source === 'walmart')` branches scattered throughout, and they have had multiple incidents where the same order got imported twice when a marketplace webhook fired more than once. Their engineers have also reported that new marketplace onboarding takes weeks because each new channel requires touching many unrelated files.

The team wants to refactor this into a clean, maintainable ingestion layer. Orders from each marketplace arrive via HTTP webhook in that marketplace's native format. The system must normalize them before processing, look up internal product records from marketplace-facing identifiers, and atomically reserve inventory for each line item. The architecture should make it easy to add a new marketplace (like eBay) in the future without touching core order processing logic.

## Output Specification

Produce the following TypeScript files:
- `types.ts` — shared type definitions for the normalized order format
- `adapters/amazon.ts` — adapter that converts an Amazon order payload to the normalized format
- `adapters/walmart.ts` — adapter that converts a Walmart order payload to the normalized format
- `order-ingestion.ts` — core ingestion function that accepts a normalized order, resolves channel SKUs to internal product IDs, creates the order record, and reserves inventory

You may stub database access and reserveInventory as simple stubs. Include realistic but simplified example payloads (inlined as constants) for both the Amazon and Walmart formats to demonstrate what normalization is doing.

Also produce a `retry-strategy.md` document explaining how the system should handle failures when calling outbound marketplace APIs (e.g. confirming an order or updating stock), covering retry behavior and failure logging.
