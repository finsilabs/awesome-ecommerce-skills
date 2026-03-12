# Product Promotion Badge Plugin

## Problem/Feature Description

A boutique online retailer wants to highlight certain products with labels such as "New Arrival", "Staff Pick", or "Limited Stock" to draw shoppers' attention. Store managers need to assign these badges per product from the WooCommerce product editor, and the badge should be visible in the cart so customers know why they added the item. The marketing team also wants a global on/off toggle and a configurable default badge text accessible from the WooCommerce admin, so they don't have to touch code to change the store-wide defaults.

Your task is to build a WordPress plugin that makes this possible. Product editors in WooCommerce admin should be able to pick a badge for each product. Shoppers should see the badge label alongside the product in their cart. The plugin should also provide an admin configuration area within WooCommerce where a store manager can toggle the feature on or off and set a default label for products that have no individual badge assigned.

## Output Specification

Deliver the plugin as PHP source files inside a folder named `wc-product-badges/`. The plugin should be structured so a developer can read and understand it. Also include a `README.md` inside that folder explaining how to install the plugin and how a store manager would use it.

No external libraries or composer packages are required — the plugin should use only WordPress and WooCommerce built-in APIs.
