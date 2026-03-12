# Weight-Tiered Shipping Plugin with Analytics Endpoint

## Problem/Feature Description

A health-and-wellness store ships products across several shipping zones. Their current flat-rate shipping is losing them money on heavy orders and overcharging customers on light ones. The operations manager wants a custom shipping method that calculates cost based on the total weight of the cart — with a base handling fee plus a per-kilogram rate — and that can be configured per shipping zone from the WooCommerce admin.

In addition, the store's BI team wants a protected REST endpoint they can call from their internal dashboard to retrieve a summary of completed orders over a configurable number of days. This endpoint should be locked down so only WooCommerce administrators can call it.

Build a WooCommerce plugin that provides both pieces of functionality. The shipping method should be configurable without editing code. The REST endpoint should return the count of orders and total revenue for the requested time window.

## Output Specification

Deliver the plugin as PHP source files inside a folder named `wc-weight-shipping/`. Include:

- The main plugin file with the required plugin header
- The custom shipping method class
- The REST controller class (or equivalent)
- A `README.md` describing how to configure the shipping method in a shipping zone and how to call the REST endpoint (include the example endpoint URL pattern and what parameters it accepts)

No external libraries or build tools are needed — pure PHP/WordPress/WooCommerce only.
