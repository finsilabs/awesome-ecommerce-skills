# E-Commerce Returns Backend

## Problem/Feature Description

A mid-sized online retailer currently handles all product returns through manual customer-service emails, which creates delays, inconsistencies, and opportunities for fraud. The team wants to launch a self-service returns portal that lets customers submit return requests directly, reduces customer service overhead, and provides structured tracking of every return from initiation to resolution.

The engineering team has been asked to build the backend data layer and business logic for initiating return requests. The system must support multiple product categories with different return rules — different product categories (such as electronics or promotional items) have different return windows and restocking fees, and some items may not be returnable at all. The system must also assign each return a human-readable reference number that customer service agents can look up quickly over the phone.

## Output Specification

Produce a TypeScript implementation with:

1. **`schema.sql`** — Database schema for the returns system. Include all tables needed to track return requests, the individual line items being returned, and any associated shipment information.

2. **`returns.ts`** — TypeScript module containing:
   - The return policy configuration with category-based rules
   - A function to determine how many return window days an order has
   - A function to create a new return request (with all required validation)
   - A function that generates human-readable RMA reference numbers

3. **`eligibility.ts`** — A REST API endpoint handler for checking whether a specific order is eligible for return, returning structured eligibility data to the client.

The code does not need to connect to a real database — use placeholder `db` calls (as if a `db` ORM object is in scope), but the logic and structure must be complete and correct.
