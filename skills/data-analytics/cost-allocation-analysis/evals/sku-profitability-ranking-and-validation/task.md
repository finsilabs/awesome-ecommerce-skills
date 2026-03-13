# SKU Profitability Ranking and Cost Allocation Validation

## Problem Description

The operations and finance team at Peak Provisions, an outdoor nutrition brand, has recently set up a cost allocation database following a redesign of their reporting infrastructure. They sell roughly 40 SKUs across direct, Amazon, and subscription channels, and their orders routinely contain multiple SKUs in a single shipment. The head of operations needs two things:

First, a SQL query that ranks all SKUs by their true per-unit contribution margin after variable costs — including a fair share of the shipping cost for each SKU in mixed-SKU orders. The team suspects that their lightest, cheapest items are actually unprofitable because they ship in the same boxes as heavier products that absorb a disproportionate share of the label cost. The ranking should reflect the real cost burden each SKU contributes to a shipment.

Second, the team's data engineer wants to make sure the overhead allocation job ran correctly last month. She needs a validation script (SQL or TypeScript/Python) that catches common failure modes: orders that got skipped during the overhead allocation run, and allocated overhead totals that don't match what was expected for the period. She's also noticed that the overhead rate seems to change wildly in low-revenue months, and wants the validation to include a check that can detect unusually large swings in the rate over time.

## Output Specification

Produce:
1. `sku_ranking.sql` — a SQL query that ranks all SKUs by contribution margin per unit sold, with shipping costs fairly distributed across SKUs within each order
2. `validate_allocation.sql` (or `validate_allocation.py` / `validate_allocation.ts`) — the validation script that checks:
   - Whether the sum of overhead allocations for a given period matches the overhead_allocations table total for that period
   - Whether any orders in the period are missing from order_overhead_allocations
   - A flag or warning if the overhead rate for recent periods appears anomalous compared to surrounding periods
3. `findings.md` — a short document describing what the validation checks are designed to catch and any assumptions made

The scripts should be runnable with only the database connection available — no large external files are required.
