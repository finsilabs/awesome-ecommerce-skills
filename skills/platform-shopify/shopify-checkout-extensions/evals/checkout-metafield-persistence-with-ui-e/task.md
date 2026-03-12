# Order Notes Checkout Extension

## Problem/Feature Description

A gifting marketplace wants to let customers add a personal message to their order during checkout. The message should be saved alongside the order so that the fulfillment team can print it on the packing slip. Customers who return to the checkout after navigating away should see their previously entered message still populated in the field.

The marketplace uses Shopify and needs a Checkout UI extension that renders a text input in the checkout flow, after the shipping options section. Whatever the customer types must be persisted to the order using Shopify's standard persistence mechanism for extensions, and it must be pre-populated on re-render if data was already entered.

The team wants this built as a standalone extension with its configuration file, ready to be added to an existing Shopify app.

## Output Specification

Produce the following files:

- `extensions/order-notes/src/index.tsx` — the extension source code
- `extensions/order-notes/shopify.extension.toml` — the extension configuration

Do not create a full Shopify app scaffold — just these two files as if they were part of an existing app.
