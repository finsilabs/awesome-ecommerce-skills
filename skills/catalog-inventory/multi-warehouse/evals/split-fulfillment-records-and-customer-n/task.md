# Checkout Experience for Orders Shipped from Multiple Locations

## Problem/Feature Description

An online furniture retailer recently expanded from one warehouse to three regional fulfillment centers. Their product catalog includes large items — sofas, dining sets, bed frames — where a single order might mix items that are only available at different locations. The current checkout flow was built assuming a single shipment per order; it silently books a second shipment without telling the customer, leading to confusion when two packages arrive days apart and the customer contacts support thinking an item is missing.

The product team wants two things fixed: first, when an order must ship from more than one location the checkout page should clearly tell the customer what to expect before they confirm the purchase; second, the backend should create proper per-location fulfillment records so each shipment can be tracked independently once the order is placed.

## Output Specification

Produce the following files:

- A React component (functional, no external UI libraries needed) that renders the customer-facing notification for split shipments
- A JavaScript module that creates fulfillment records and reserves inventory; use in-memory data structures to simulate the database
- `fulfillment-demo.js` — a runnable Node.js script (no external dependencies) that:
  1. Simulates an allocation result with two locations each covering part of the order
  2. Calls the fulfillment creation function and prints the resulting fulfillment records (JSON) to stdout
  3. Prints the contents of the split shipment notice rendered to a simple HTML string (you may use a minimal string-serialisation approach rather than a full React renderer)

Run the demo script and save its output as `fulfillment-output.txt`.
