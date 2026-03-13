# Financial Data Integrity and Board Reporting Pipeline

## Problem/Feature Description

Volta Supply Co. is a consumer goods ecommerce company preparing for a Series B fundraise. Their investors have requested audited-quality monthly financials going back 18 months. The current dashboard was built by a junior engineer who piped Shopify revenue figures and Stripe payout data directly into the reporting tables. Before a recent board meeting, the CFO discovered that the revenue numbers in the dashboard were ~$40,000 higher than the QuickBooks P&L for the same month, and that $18,000 in customer returns processed in April were incorrectly showing as an April expense rather than a Q1 reduction. The board also complained that the February P&L they reviewed last week had been silently updated, making it impossible to know what numbers they had actually approved.

For the upcoming fundraise, the finance team needs a redesigned data pipeline and reporting layer with proper data governance: clean sourcing from the accounting system, correct return attribution, immutable closed periods with an adjusting-entry workflow, a full audit trail so any number can be traced back to a source transaction, and a variance commentary feature so the finance team can annotate month-end variances before the dashboard is shared with the investment committee.

## Output Specification

Produce the following:

1. `pipeline_design.md` — A design document describing:
   - The correct data sourcing strategy (which systems should be the authoritative source for each type of financial data and why)
   - How returns and refunds will be attributed to the correct accounting period
   - The period close workflow (how periods are locked and how corrections are handled afterward)
   - How multi-entity intercompany transactions will be handled at the consolidated level

2. `schema_updates.sql` — SQL statements that implement:
   - Any schema changes needed to enforce the data governance rules identified in your design document
   - The database structures needed to support the variance annotation feature
   - Any linkage or reference tables needed for the audit and traceability requirements

3. `etl_notes.py` — A Python script or pseudo-code that demonstrates:
   - The period close snapshot process (including how it could be automated)
   - How adjusting entries for closed periods are handled
   - The commentary workflow (creating and associating notes with specific line item variances)
