# Revenue Variance Root-Cause Analysis Tool

## Problem/Feature Description

The finance team at a multi-channel e-commerce company is spending several hours each week manually digging into why their revenue numbers changed. After a month where gross revenue dropped 12% versus the prior month, the CFO asked the analytics team to automate the explanation: rather than just knowing that revenue fell, the business needs to understand whether it was because fewer customers bought (volume), or because they paid less (price), and which specific channels and product categories were responsible.

The team works with a SQL database containing order facts broken down by channel (e.g. DTC website, Amazon marketplace, wholesale) and product category (e.g. apparel, accessories, homeware). They want a reusable analysis script that can compare any two periods, identify the largest movers, and generate a plain-language explanation for each — so the finance team can paste the output directly into their weekly business review.

## Output Specification

Produce a Python script `variance_analysis.py` that:

1. Accepts two period identifiers as inputs (current and prior, e.g. '2024-03' and '2024-02') and a database connection (or equivalent mock).
2. Queries or processes order data broken down by channel and category for both periods.
3. Decomposes the revenue variance for each channel/category combination into its component drivers.
4. Filters and ranks results to surface only the most meaningful movers.
5. Returns or prints a structured list of explanation dicts with all fields needed to understand what happened.

Also produce a `sample_run.py` that demonstrates the analysis using an in-memory dataset (e.g. using pandas DataFrames or SQLite in-memory database) with at least 3 channels × 3 categories across 2 periods. The sample output should be visible when `python sample_run.py` is run.

## Input Files

No external files are needed. Generate sample data inline in `sample_run.py`.
