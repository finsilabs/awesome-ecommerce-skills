# Order Fulfillment Tracker Plugin

## Problem/Feature Description

A mid-sized e-commerce store running WooCommerce has recently integrated with a third-party warehouse management system (WMS). When an order is paid and moves through the fulfillment pipeline, the warehouse system needs to be notified, and a tracking token returned from the WMS must be recorded against the order so that the support team can look it up later.

The store's tech lead has asked you to build a WordPress plugin that hooks into the order lifecycle to detect when relevant transitions happen, records a simulated fulfillment token on the order, and can later retrieve that token. The plugin must be safe to install on a modern WooCommerce store that has the high-performance order storage feature turned on.

## Output Specification

Produce a working WordPress plugin as PHP source code. The plugin does not need to make real HTTP requests to an external WMS — simulate the fulfillment API call with a simple function that returns a fake token string. The plugin should:

- Be structured as a standalone plugin (single file or with an includes/ subfolder)
- Detect when an order reaches a relevant status (such as payment received or order completed)
- Record a fulfillment token on the order (use a made-up token value like `'FULFILL-' . $order_id . '-' . time()`)
- Expose a way to read back the stored token from an order object

Deliver all plugin PHP files under a folder named `wc-fulfillment-tracker/`. Also produce a `README.md` inside that folder briefly describing what the plugin does and how the token is stored and retrieved.
