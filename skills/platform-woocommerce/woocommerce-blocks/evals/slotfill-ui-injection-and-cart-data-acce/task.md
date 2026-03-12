# Dynamic Free Shipping Progress Banner for Block Checkout

## Problem/Feature Description

An online fashion retailer wants to increase their average order value by showing customers how close they are to earning free shipping during checkout. Their UX team has found that displaying a real-time "Add $X more for free shipping!" message significantly reduces cart abandonment and encourages customers to add one more item before completing their order.

The store runs WooCommerce with the block-based cart and checkout. The development team needs a lightweight JavaScript plugin — no inner block required — that injects a banner into the checkout order summary area. The banner should read the current cart total dynamically and display the remaining amount needed to reach the free shipping threshold of $75.00. Once the threshold is met, the banner should disappear.

The solution must work within the WooCommerce block checkout ecosystem and not require modifying any WooCommerce core templates or PHP files (a pure JavaScript approach is preferred).

## Output Specification

Produce the following files:

1. `src/frontend.js` — The JavaScript/React SlotFill plugin that injects the banner
2. `plugin-loader.php` — Minimal PHP file that enqueues the compiled frontend script
3. `ARCHITECTURE.md` — A short document (bullet points are fine) explaining which WooCommerce slot/API was used to inject the banner, why that approach was chosen over an inner block, and how the cart total is read

The banner logic and data-fetching approach are the focus — the grader will review the source files directly, so no build step is needed.
