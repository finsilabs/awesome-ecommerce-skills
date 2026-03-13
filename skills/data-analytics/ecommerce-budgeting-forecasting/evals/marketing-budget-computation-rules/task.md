# Marketing Budget Automation Tool

## Problem/Feature Description

A mid-size ecommerce brand sells through its own website (DTC), Amazon, and a wholesale channel. The head of finance wants to automate the monthly marketing budget allocation process. Currently, the marketing team manually emails a spreadsheet each month with their planned spend — there is no single source of truth, channels compete for budget ad hoc, and the finance team can never tell whether the total spend is appropriate relative to actual revenue.

The finance director wants a Python script that takes projected monthly revenue by channel and outputs a full marketing budget breakdown with every line item budgeted to the appropriate account code. The team has discussed applying performance-based rates to each channel's revenue (so that if revenue grows, marketing spend grows proportionally), while brand and content costs remain fixed but may vary seasonally.

## Output Specification

Produce a Python script named `marketing_budget.py` that:

1. Accepts monthly revenue inputs by channel (website, amazon) for a given period.
2. Computes a monthly marketing budget for all relevant line items.
3. Applies the correct computation method (percentage of revenue or fixed) for each line item.
4. Outputs a list of budget rows, each with: `period_id`, `account_code`, `line_item`, `version`, and `budget_amount`.

Also produce a file `sample_output.json` showing the computed budget for a sample month (e.g. November 2026) using these revenue inputs:
- website channel revenue: $800,000
- amazon channel revenue: $300,000

The sample output should contain all line items computed for that month.
