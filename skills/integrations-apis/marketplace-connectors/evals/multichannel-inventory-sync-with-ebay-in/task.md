# Multichannel Inventory Synchronization System

## Problem/Feature Description

A home goods brand sells on their own website, Amazon, eBay, and Walmart simultaneously. When a product sells on any channel, inventory levels need to update everywhere else immediately to prevent overselling. Currently, when a product sells on eBay, the warehouse team manually updates the other channels — a process that takes 15-30 minutes and regularly results in customers buying out-of-stock items.

The engineering team needs to build a TypeScript library that can propagate inventory changes across all channels automatically. When any channel reports a stock change, the system should update the other channels concurrently without one slow or failing channel blocking the rest. The team also sells direct-to-consumer and is worried about marketplace sales causing issues for their own storefront customers. Additionally, the ops team wants a nightly process that can verify inventory levels are consistent across all channels and flag discrepancies for investigation.

## Output Specification

Produce a TypeScript project with:

- `src/inventory/multichannel-sync.ts` — Core inventory sync module that propagates changes across channels
- `src/ebay/client.ts` — eBay API client with authentication and inventory item update capability
- `src/inventory/reconciliation.ts` — A job that compares inventory between the internal system and each marketplace
- `package.json` — Package manifest with required dependencies

Also write `DESIGN.md` covering your key architectural decisions for this system.

Use environment variable references for credentials. Do not make real API calls — implement the logic fully but stub out the actual HTTP calls where needed.
