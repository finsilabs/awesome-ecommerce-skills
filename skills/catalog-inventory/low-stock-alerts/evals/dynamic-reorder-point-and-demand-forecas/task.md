# Demand-Driven Reorder Points for Inventory Management

## Problem Description

A fashion retailer has been using fixed reorder points across their entire product catalogue — every variant triggers an alert when stock drops to 10 units regardless of how quickly it sells. This means slow-moving items get reorder alerts constantly while fast-moving variants sometimes run out before an alert fires, because 10 units represents three days of supply for one product but two months for another.

The engineering team has been asked to build a **demand forecasting module** that replaces fixed thresholds with dynamically calculated reorder points. The core idea is simple: look at recent order history to estimate how many units sell per day, then multiply by the supplier's lead time so the reorder fires with enough runway to receive new stock before running out. The formula also needs to include a buffer for safety stock.

The product team flagged one concern: some of their seasonal lines (swimwear, winter coats) see very skewed velocity during peak months. The solution should address how seasonal products should be handled within this framework.

## Output Specification

Produce the following files:

- `lib/demandForecasting.js` — The demand forecasting module containing the velocity calculation and the reorder point formula as separate exported functions.
- `jobs/checkStockLevels.js` — A background job that fetches inventory levels with their reorder configs and, for variants with dynamic reorder enabled, calls the forecasting module to compute the threshold before checking stock levels.
- `DEMAND_FORECASTING.md` — A short technical note explaining the approach, the formula, how the safety stock buffer works, and how seasonal products should be configured.
