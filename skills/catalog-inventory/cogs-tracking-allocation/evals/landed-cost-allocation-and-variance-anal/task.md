# Landed Cost Allocation and Standard Cost Variance Report

## Problem/Feature Description

A global electronics distributor imports components from three suppliers in Southeast Asia. Each inbound shipment carries freight, insurance, and customs charges that are invoiced separately from the goods — sometimes arriving weeks after the components themselves have been received and entered into the inventory system. The finance team needs a way to record these shipment-level charges and distribute them proportionally across the individual purchase lots that were included in each shipment.

Separately, the CFO has asked for a monthly report that compares what units actually cost (based on recorded COGS entries) against what the finance team budgeted they would cost (standard costs). The report should highlight the products drifting furthest from budget so the pricing team can act. The company sets new standard costs at the beginning of each fiscal year, and some SKUs have had their standards revised mid-year when a major supplier changed pricing — so the system must correctly match each COGS entry to whichever standard cost was active at the time of the sale.

## Output Specification

Write the implementation in a file called `cost-management.ts`. It should contain:

- A function to allocate a shipment's landed costs across inventory cost layers (`allocateLandedCosts` or similar)
- A function or SQL query that computes standard cost variance per product variant for a given date range (`computeVarianceReport` or similar)

Assume the database tables from the schema (inventory_cost_layers, landed_cost_shipments, landed_cost_allocations, standard_costs, cogs_entries, product_variants) are available via a `db` object. You do not need to make the code runnable. Add a brief comment explaining any important decisions.
