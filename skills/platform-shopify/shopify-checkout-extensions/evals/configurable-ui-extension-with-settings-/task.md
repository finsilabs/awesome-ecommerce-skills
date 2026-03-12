# Warranty Upsell Block for Checkout

## Problem/Feature Description

A Shopify app agency is building a warranty upsell app for e-commerce merchants. The app needs to display a warranty add-on offer inside the Shopify checkout — merchants want to offer customers an optional warranty product alongside their main purchase. Critically, different merchants sell different warranty products, so the specific warranty product variant must be configurable per merchant through the Shopify Admin rather than being baked into the app's code.

The team needs a Checkout UI extension that renders the warranty upsell offer. When the customer clicks to add the warranty, the extension should add it to the cart. The UI must not flicker or allow double-clicks during the add operation. The extension should only display the offer when the warranty item is not already in the cart.

## Output Specification

Produce the following files representing the extension source code and configuration:

- `extensions/warranty-upsell/src/index.tsx` — the React extension source code
- `extensions/warranty-upsell/shopify.extension.toml` — the extension configuration file

Do not create a full Shopify app scaffold — just write these two files as if they were part of an existing app.
