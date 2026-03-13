# Cash Runway Forecast for Seasonal Ecommerce Business

## Problem/Feature Description

Solstice Outdoor Gear is a seasonal ecommerce company selling camping and hiking equipment. Their revenue peaks sharply in May–August (summer) and has a smaller secondary peak in November–December (holiday gifts). The founding team is preparing for a Series A pitch and their lead investor wants to see a rigorous 52-week cash flow projection showing how long the business can operate under different revenue outcomes before needing to raise.

The CFO has three years of weekly revenue data and wants a Python script that: (1) fits a forecasting model to the historical data to project the next 52 weeks of revenue, capturing both the upward trend and the seasonal pattern; (2) converts that revenue forecast into a cash runway model by combining it with the company's known weekly fixed costs ($42,000/week: payroll $25k, rent $8k, software/ops $9k) and variable costs (COGS at 38% of revenue, marketing at 12% of revenue); (3) shows the runway under multiple revenue scenarios so the board can see the downside risk clearly.

The company has $1,200,000 in the bank today. The script should show the investor exactly when cash hits zero under each scenario — or confirm there is no cash-out event within the 52-week window.

## Output Specification

Produce a Python script `runway_forecast.py` that:

1. Generates or hardcodes 3 years of synthetic historical weekly revenue data that exhibits seasonal patterns consistent with an outdoor gear business (summer peak, smaller Q4 peak, weekly granularity = 156 data points).
2. Fits a forecasting model to the historical data and produces a 52-week forward forecast with confidence bands.
3. Computes net weekly cash flow for each scenario by combining the revenue forecast with weekly fixed costs ($42,000) and variable costs (COGS 38%, marketing 12%).
4. Calculates the cash runway for each scenario starting from an opening cash balance of $1,200,000.
5. Outputs a results summary (to console or CSV) showing: scenario name, weeks until cash reaches zero (or ">52 weeks"), minimum cash balance, and the week of minimum balance.

Delete any intermediate large files if generated. The script should run end-to-end with standard Python data science libraries.
