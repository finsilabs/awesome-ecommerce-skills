# Goods Receipt Processing and Vendor Performance Reporting

## Problem Description

NorthBay Goods' warehouse team needs a system to log what actually arrives from vendors — both in terms of quantities and quality. This is more complex than it sounds: large orders often arrive in several shipments over multiple days, and some items arrive damaged. The warehouse staff cannot wait until an entire order is complete before updating inventory; they need to update stock levels for each individual delivery as it arrives. At the same time, damaged items must be clearly separated from sellable stock — in a previous system, damaged goods were accidentally added to inventory and sold to customers.

On the reporting side, the operations VP wants a quarterly performance review system for suppliers. She needs an objective, numeric scorecard for each vendor that the procurement team can use in contract renewal negotiations. The scorecard must measure delivery reliability, order completeness, and quality. It should look back over a configurable recent time window and produce a single overall score that can be compared across vendors.

The product team has asked you to implement both pieces: the receiving workflow and the scorecard generation. The receiving workflow must handle both complete and partial deliveries correctly. The scorecard must be computed from actual historical data in the database and follow a defined weighting formula.

## Output Specification

Produce a TypeScript file `receiving_and_scorecard.ts` containing:
1. A `receiveGoodsAgainstPO(poId, receipts)` function for processing incoming shipments
2. A `generateVendorScorecard(vendorId, periodDays?)` function returning on-time rate, fill rate, defect rate, and an overall score

Also produce `scorecard_explanation.md` that explains:
- What each of the three metrics measures and how it is calculated
- How the overall score is derived from the three metrics (include the formula and weights)
- What the default lookback window is, what it represents, and why it was chosen

You may assume the following are already available as imports:
- `db` — a database client with standard query methods
- Types for PO lines, purchase orders, and vendor entities

Do not call any external APIs. All data comes from the mock `db` client.
