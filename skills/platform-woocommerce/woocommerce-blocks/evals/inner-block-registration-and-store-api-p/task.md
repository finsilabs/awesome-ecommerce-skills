# Delivery Date Picker for Block Checkout

## Problem/Feature Description

A mid-size e-commerce store selling perishable food items has recently migrated to the WooCommerce block-based checkout. Their operations team needs customers to select a preferred delivery date during checkout so that the warehouse can schedule refrigerated shipments accordingly. Without this field, customers call in after placing orders to request specific dates, creating significant manual overhead.

The store's developer needs to create a WordPress plugin that adds a "Preferred Delivery Date" picker field inside the checkout shipping step. When a customer selects a date, it must be reliably recorded on the order so the warehouse management system can read it. The field should appear after the shipping method selection.

## Output Specification

Produce the following files for a WordPress plugin called `delivery-date-checkout`:

1. `delivery-date-checkout.php` — Main plugin bootstrap file that hooks into WooCommerce Blocks loading
2. `class-delivery-date-integration.php` — The integration class that registers scripts and the inner block
3. `src/blocks/delivery-date/index.js` — The React inner block component
4. `src/blocks/delivery-date/block.json` — Block manifest file

The plugin should:
- Register the delivery date field as an inner block inside the checkout
- Persist the selected date value through the WooCommerce Store API so it survives page reloads
- Save the delivery date to the order on checkout completion
- Sanitize all incoming data before saving

Do NOT actually build/compile the JavaScript — just produce the source files. Include a brief `NOTES.md` explaining the Store API registration flow.
