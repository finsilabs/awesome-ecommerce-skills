# Home Security System Bundle: Revenue Recognition Implementation

## Problem/Feature Description

SmartGuard Inc. sells a home security system bundle that combines a hardware kit, a professional installation visit, and a 24-month monitoring and support contract — all sold together under a single SKU for a flat price of $600. The finance team has flagged an audit risk: the company has historically recorded all $600 as product revenue at the time of shipment, but the auditors are pushing back. The CFO needs a correct revenue recognition implementation before the next quarterly close.

The company prices each component separately when sold on its own: the hardware kit lists for $350, the installation service for $100, and the 24-month monitoring contract for $200. The finance team wants a Python module and a set of sample journal entries that demonstrate the correct revenue recognition treatment for a single order that ships on March 1, 2026, with installation completed on March 5, 2026, and a monitoring contract that runs from March 5, 2026 through March 4, 2028.

## Output Specification

Produce the following files:

- `revenue_recognition.py` — A Python module containing:
  - A function to allocate the $600 transaction price across the three performance obligations using their standalone selling prices
  - A function to compute how much revenue to recognize from this order in a given reporting period (date range)
  - All monetary amounts must be handled precisely to avoid rounding artifacts

- `journal_entries.md` — A markdown document showing the correct double-entry journal entries for:
  - The initial cash receipt on the order date (February 28, 2026)
  - Recognition of each obligation as it is satisfied during March 2026
  - One sample monthly monitoring recognition entry for April 2026

- `schema.sql` — SQL DDL for the tables needed to persist this order's obligations and recognition entries in a database

The journal entries should use separate revenue and deferred revenue line items for each obligation type. Show dollar amounts calculated from the actual allocation, not placeholders.
