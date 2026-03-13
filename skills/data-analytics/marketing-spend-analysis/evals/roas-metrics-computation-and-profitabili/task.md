# Marketing Profitability Analysis

## Problem Description

A DTC apparel brand runs paid ads on Meta and Google. Their finance lead has flagged that the numbers reported by the ad platforms look suspiciously good, and she suspects the company is actually losing money on some channels when you account for product costs and fulfillment expenses.

The head of growth has pulled together a weekly data snapshot: Meta says it drove $42,000 in revenue from $10,000 in spend, while Google reports $31,500 in revenue from $9,000 in spend. However, their analytics team's own attribution model (based on post-purchase surveys and data from their order management system) attributes $28,000 to Meta and $19,000 to Google during the same period. Total gross revenue for the week across all sources was $95,000. Total marketing spend was $19,000.

Your job is to produce a clear profitability analysis that the finance lead and CMO can use to understand the true performance of each channel, identify which (if any) channels are below break-even, and understand overall marketing efficiency.

## Output Specification

Write a Python script named `roas_analysis.py` that:
1. Takes the data above as hard-coded inputs
2. Computes a full set of efficiency metrics for each channel and the portfolio as a whole
3. Prints a formatted summary showing all computed metrics for each channel and a portfolio-level view
4. Saves the computed metrics to `roas_output.json`

The analysis should be runnable with `python roas_analysis.py` and should not require any external data files or API keys.
