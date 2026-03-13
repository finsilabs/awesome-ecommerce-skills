# Annual Revenue Budget and Mid-Year Forecast Update

## Problem/Feature Description

A DTC ecommerce brand is preparing for its 2026 planning cycle. The VP of Finance needs to produce the annual revenue budget from historical data, and also wants a system for updating the forecast quarterly as actuals come in — without losing the original plan as a reference. The brand sells across three channels: website (DTC), Amazon, and wholesale. The planning team has noted that revenue is highly seasonal (Q4 is by far the largest quarter), and past attempts at flat monthly splits caused confusing variances every November.

The VP also wants the mid-year forecast update process to be rigorous: once a month has closed, its actuals should be locked in and only forward periods should be revised. A growth rate revision (positive or negative) can be applied to all future unlocked periods. The board expects to always be able to compare the current forecast to the original annual plan.

## Output Specification

Produce a Python script `revenue_budget.py` that implements two functions:

1. `build_revenue_budget(historical_monthly_revenue, growth_assumptions, seasonality_weights, budget_year)` — builds a monthly revenue budget DataFrame for `budget_year` from the provided historical data, applying per-channel growth assumptions and distributing the annual totals across months using the seasonality weights. Each output row must include `period_id`, `channel`, `category`, `version`, `budget_amount`, and `account_code`.

2. `update_rolling_forecast(original_budget, actuals_to_date, current_period, growth_rate_revision)` — updates the budget by locking actuals for periods up to and including `current_period`, and applying `growth_rate_revision` to all future unlocked periods. The function must preserve the original version and set a new version for the forecast output.

Also produce `sample_output.json` demonstrating both functions using the following inputs:

**Historical revenue (2025 actuals):**
- website channel, apparel category: Jan–Dec 2025 with these monthly values (USD):
  Jan: 120000, Feb: 110000, Mar: 130000, Apr: 125000, May: 140000, Jun: 135000,
  Jul: 145000, Aug: 150000, Sep: 160000, Oct: 180000, Nov: 300000, Dec: 280000

**Growth assumptions:** website: 20%, amazon: 10%

**Seasonality weights:**
Jan: 0.07, Feb: 0.06, Mar: 0.07, Apr: 0.07, May: 0.08, Jun: 0.07,
Jul: 0.08, Aug: 0.08, Sep: 0.08, Oct: 0.09, Nov: 0.15, Dec: 0.10

**For the forecast update:** Actuals are available through 2026-03. Apply a -5% revision to forward periods.

The sample_output.json should show:
- Part 1: The full 12-month annual budget for the website/apparel channel
- Part 2: The rolling forecast after applying the March 2026 actuals lock and -5% revision

**Note:** Clean up any large intermediate files. The final outputs should only be `revenue_budget.py` and `sample_output.json`.
