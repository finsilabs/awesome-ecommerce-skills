# Integrate International Tax Calculation for a Global Marketplace

## Problem/Feature Description

NexaTrade is expanding from a domestic US-only marketplace to serving customers in Canada, Australia, and the EU. Their existing checkout has no tax engine at all — orders just ship and the finance team manually reconciles taxes monthly, which is becoming unsustainable as international volume grows. The Head of Finance has mandated that all orders must generate tax filing records automatically.

The team has chosen Avalara AvaTax because it covers all the jurisdictions NexaTrade now ships to. There are two distinct moments where tax matters: first when the customer is filling in their shipping address (to show an accurate tax total before they pay), and second when the payment succeeds (to lock in the official filing record). The solution also needs to handle the case where an order is cancelled after payment — the filing record must not count that revenue.

Your task is to build the Avalara tax integration module for NexaTrade's Node.js checkout service.

## Output Specification

Produce a JavaScript module at `lib/avalaraTax.js` that exports:

1. A function to calculate a tax estimate for an order at checkout time (given from/to addresses, line items with sku, title, unit price, quantity, optional tax code, and shipping cost). The estimate should NOT create a filing record.
2. A function to commit a finalized tax transaction after payment succeeds (accepts an order object that may already have a tax transaction code from the estimate step).
3. A function to void a committed transaction when an order is cancelled.

Also produce `lib/avalaraClient.js` that sets up and exports the initialized Avalara client, reading all configuration from environment variables.

Include a brief `integration-notes.md` describing when each function should be called in the order lifecycle.
