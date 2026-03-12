# Stock Rebalancing System for Distributed Warehouses

## Problem/Feature Description

A home goods retailer has noticed persistent regional stock imbalances: their West Coast warehouse is chronically out of stock on kitchen appliances while the East Coast warehouse holds surplus. Meanwhile, their operations team has been manually updating inventory spreadsheets when goods are physically shipped between locations — a process that's both error-prone and slow to reflect actual availability on the storefront.

The backend team needs a transfer order module that the ops team can use to initiate, track, and finalize stock movements between warehouses. The module must prevent staff from accidentally over-allocating stock that is already committed to customer orders, and it must keep the available inventory figures accurate throughout the entire transit lifecycle — from the moment a transfer is approved right through to physical receipt at the destination.

## Output Specification

Implement the transfer order module as JavaScript. Use in-memory data structures (plain objects/maps) to simulate the database — no real database or external services required. Produce:

- The transfer order management logic as one or more JavaScript modules
- `transfer-demo.js` — a runnable Node.js script (no external dependencies) that:
  1. Sets up inventory levels at two locations for a couple of product variants
  2. Creates a transfer order moving stock from the over-stocked location to the under-stocked one
  3. Calls the ship function and prints inventory state after shipping
  4. Calls the receive function with a partial quantity (simulating one item being lost in transit) and prints the final inventory state
  5. Demonstrates the validation error when the source location has insufficient available stock

Run the demo script and save its output as `transfer-output.txt`.
