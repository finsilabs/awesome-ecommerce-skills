# Order Routing Engine for a Multi-Warehouse Retailer

## Problem/Feature Description

A mid-size outdoor apparel company operates three fulfillment centers — one on the East Coast (New Jersey), one in the Midwest (Chicago), and one on the West Coast (Los Angeles). Historically their monolithic backend assigned every order to the East Coast warehouse regardless of where the customer lived, resulting in unnecessarily long transit times and high carrier costs for West Coast buyers.

The engineering team has been asked to replace the old fixed-assignment logic with a proper routing engine that sends each order to whichever warehouse can ship it most efficiently. The engine must handle the common case where a single warehouse can cover an entire order, and gracefully fall back when inventory is too spread out to fulfill from one place. The company also needs this component isolated and testable so it can be evaluated against historical order data.

## Output Specification

Implement the allocation engine as JavaScript module(s). Use in-memory data structures rather than a real database (mock out any `db` calls). Produce:

- The core allocation logic as one or more JavaScript modules
- `allocation-demo.js` — a runnable Node.js script (no external dependencies beyond Node built-ins) that:
  1. Sets up a small set of warehouse locations with geographic coordinates
  2. Defines a few test orders where: (a) one warehouse can cover the whole order, and (b) no single warehouse can and the order must be split
  3. Calls the allocation function for each and prints the result (JSON) to stdout
  4. Demonstrates the error case when stock is truly insufficient across all locations

Run the demo script and append its output as `allocation-output.txt`.
