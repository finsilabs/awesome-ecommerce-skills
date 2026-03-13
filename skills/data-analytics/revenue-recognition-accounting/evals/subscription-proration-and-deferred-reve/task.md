# Subscription Box Revenue Recognition: Monthly Close Report

## Problem/Feature Description

FreshCrate is a monthly subscription box service charging $30/month. Subscribers can start at any point during the month, and their billing date does not align to the first of the month. The accounting team is preparing its February and March 2026 monthly close, and needs a revenue recognition report that correctly attributes revenue to the period in which boxes are delivered — which means handling partial months at the start and end of each subscription.

A recent internal audit found that the previous system was computing partial-period revenue using a simplified calendar approximation, causing small errors that accumulated to a material amount over the subscriber base. The CFO wants a correct proration methodology and a deferred revenue roll-forward that reconciles ending balances to cash collected.

The finance team has provided a sample subscriber dataset (below) and wants a Python script that, for a given reporting month, computes the recognized and deferred revenue for each subscriber, plus a summary roll-forward table.

## Output Specification

Produce the following files:

- `recognition_engine.py` — Python script that:
  - Reads the subscriber data from the inline CSV below
  - For each subscriber, computes the revenue recognized in February 2026 (2026-02-01 to 2026-02-28) and March 2026 (2026-03-01 to 2026-03-31)
  - Outputs a per-subscriber table and a monthly deferred revenue roll-forward summary for each month
  - Run it and print the results to stdout

- `results.txt` — The actual printed output from running the script

The output should show how much of each subscriber's $30/month is recognized vs. deferred in each period.

## Input Files

The following subscriber data is provided. Extract it before beginning.

=============== FILE: inputs/subscribers.csv ===============
subscriber_id,name,subscription_start,monthly_fee,status
SUB001,Alice,2026-01-15,30.00,active
SUB002,Bob,2026-02-01,30.00,active
SUB003,Carol,2026-02-10,30.00,active
SUB004,Dave,2026-02-20,30.00,active
SUB005,Eve,2026-03-05,30.00,active
SUB006,Frank,2026-01-28,30.00,active
