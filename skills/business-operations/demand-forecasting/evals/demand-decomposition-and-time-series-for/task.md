# Sales Demand Decomposition and Forecasting Module

## Problem/Feature Description

A regional wholesale distributor is modernizing its planning tools. Their analysts currently produce demand forecasts in spreadsheets by eyeballing charts, which is error-prone and doesn't scale to their 400-SKU catalog. The data engineering team has built a data warehouse with a clean daily sales fact table, and they now want a programmatic forecasting library that a planning application can call to get a 30-day demand outlook for any individual product.

The analysts' key insight is that most products show predictable cyclical shopping patterns and a slow upward or downward trend over time. Capturing these two signals separately and measuring the remaining noise will help the team understand forecast confidence. The library should work purely from historical sales data (no external data sources needed) and should produce consistent, reproducible forecasts given the same input.

## Output Specification

Write a self-contained TypeScript module (`forecast.ts`) that exports:
- A `computeMovingAverage` function
- A `decomposeProductDemand` function that returns trend, seasonality indices, and residual noise
- A `forecastDemand` function that returns a 30-day demand array

The module should work with the sample data provided below (loaded from a JSON file rather than a database). Write a `runner.ts` script that imports the module, runs decomposition and forecasting for the product in the sample data, and writes the results to `forecast_output.json`.

The output file should contain: the trend slope, the seasonal index values, the residualStdDev, and the 30-day forecast array.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/sales_history.json ===============
{
  "productId": "PROD-42",
  "records": [
    {"sale_date": "2025-03-14", "units_sold": 12},
    {"sale_date": "2025-03-15", "units_sold": 8},
    {"sale_date": "2025-03-16", "units_sold": 5},
    {"sale_date": "2025-03-17", "units_sold": 9},
    {"sale_date": "2025-03-18", "units_sold": 14},
    {"sale_date": "2025-03-19", "units_sold": 18},
    {"sale_date": "2025-03-20", "units_sold": 20},
    {"sale_date": "2025-03-21", "units_sold": 11},
    {"sale_date": "2025-03-22", "units_sold": 7},
    {"sale_date": "2025-03-23", "units_sold": 6},
    {"sale_date": "2025-03-24", "units_sold": 10},
    {"sale_date": "2025-03-25", "units_sold": 15},
    {"sale_date": "2025-03-26", "units_sold": 19},
    {"sale_date": "2025-03-27", "units_sold": 21},
    {"sale_date": "2025-03-28", "units_sold": 13},
    {"sale_date": "2025-03-29", "units_sold": 9},
    {"sale_date": "2025-03-30", "units_sold": 8},
    {"sale_date": "2025-03-31", "units_sold": 11},
    {"sale_date": "2025-04-01", "units_sold": 16},
    {"sale_date": "2025-04-02", "units_sold": 22},
    {"sale_date": "2025-04-03", "units_sold": 23},
    {"sale_date": "2025-04-04", "units_sold": 14},
    {"sale_date": "2025-04-05", "units_sold": 10},
    {"sale_date": "2025-04-06", "units_sold": 9},
    {"sale_date": "2025-04-07", "units_sold": 12},
    {"sale_date": "2025-04-08", "units_sold": 17},
    {"sale_date": "2025-04-09", "units_sold": 20},
    {"sale_date": "2025-04-10", "units_sold": 24},
    {"sale_date": "2025-04-11", "units_sold": 15},
    {"sale_date": "2025-04-12", "units_sold": 10},
    {"sale_date": "2025-04-13", "units_sold": 8},
    {"sale_date": "2025-04-14", "units_sold": 13},
    {"sale_date": "2025-04-15", "units_sold": 18},
    {"sale_date": "2025-04-16", "units_sold": 21},
    {"sale_date": "2025-04-17", "units_sold": 25},
    {"sale_date": "2025-04-18", "units_sold": 16},
    {"sale_date": "2025-04-19", "units_sold": 11},
    {"sale_date": "2025-04-20", "units_sold": 9},
    {"sale_date": "2025-04-21", "units_sold": 14},
    {"sale_date": "2025-04-22", "units_sold": 19},
    {"sale_date": "2025-04-23", "units_sold": 23},
    {"sale_date": "2025-04-24", "units_sold": 26},
    {"sale_date": "2025-04-25", "units_sold": 17},
    {"sale_date": "2025-04-26", "units_sold": 12},
    {"sale_date": "2025-04-27", "units_sold": 10},
    {"sale_date": "2025-04-28", "units_sold": 15},
    {"sale_date": "2025-04-29", "units_sold": 20},
    {"sale_date": "2025-04-30", "units_sold": 24},
    {"sale_date": "2025-05-01", "units_sold": 27},
    {"sale_date": "2025-05-02", "units_sold": 18},
    {"sale_date": "2025-05-03", "units_sold": 13},
    {"sale_date": "2025-05-04", "units_sold": 11},
    {"sale_date": "2025-05-05", "units_sold": 16},
    {"sale_date": "2025-05-06", "units_sold": 21},
    {"sale_date": "2025-05-07", "units_sold": 25},
    {"sale_date": "2025-05-08", "units_sold": 28},
    {"sale_date": "2025-05-09", "units_sold": 19}
  ],
  "baseline_30day_avg": 14.2
}
