# Financial Reporting Database Design

## Problem/Feature Description

Meridian Commerce is a Series A ecommerce company selling across four channels: its own website (Shopify), Amazon, a B2B wholesale portal, and a retail distributor network. The finance team currently produces monthly P&L reports by manually assembling CSV exports from Shopify, Amazon Seller Central, their 3PL (for fulfillment costs), Google/Meta ad platforms, and QuickBooks Online (their accounting GL). The process takes three days each month-end and is error-prone.

The engineering team has been asked to build a database-backed financial reporting layer that will power a management dashboard. The new system must support comparing any month against the prior month (and prior year same month), must allow the CFO to filter the P&L by channel or product category, and must eventually support budget vs. actuals reporting once the FP&A team completes their annual planning model. The company uses a standard calendar year but their largest retail customer recently asked about 4-4-5 fiscal calendar support for a joint business plan.

## Output Specification

Produce a SQL schema file (`schema.sql`) containing:
- The core fact table(s) and any dimension or mapping tables needed for the reporting layer
- All indexes required for efficient dashboard queries
- A query (`pnl_comparison.sql`) that returns a period-over-period P&L comparison for two fiscal periods passed as parameters, including both absolute and percentage variance columns
- A brief `design_notes.md` explaining the key design decisions, including how the schema handles budget vs. actuals data and how it accommodates non-standard fiscal calendars

The schema should cover all three financial statements (P&L, balance sheet, cash flow) but the comparison query only needs to cover the P&L.
