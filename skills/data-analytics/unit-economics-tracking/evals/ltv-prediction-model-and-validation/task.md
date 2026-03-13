# LTV Forecasting Model for Investor Due Diligence

## Problem/Feature Description

Elevate Commerce is a hybrid ecommerce company with two customer segments: subscribers who pay $29/month for a curated product box, and one-time transactional buyers who purchase irregularly based on seasonal promotions. The company is preparing for a growth equity raise and their lead investor has asked for a defensible LTV model as part of due diligence. In a prior preliminary meeting, the investor specifically called out that most DTC companies "make up" their LTV numbers by projecting far beyond their data, and that they want to see the methodology clearly documented.

The company has 24 months of transaction data for subscribers and 18 months for transactional customers. The Head of Finance wants a Python-based LTV model that produces credible, investor-ready forecasts — one that a skeptical investor could scrutinize and trust. The model must include a validation mechanism using historical cohort predictions already in the data so the Finance team can demonstrate the model's track record and reliability.

## Output Specification

Write a Python script (`ltv_model.py`) that reads the provided input data and produces a JSON report (`ltv_report.json`) containing:

- LTV predictions for both subscriber and transactional customer segments at the 12, 24, and 36 month horizons
- A validation section comparing prior LTV predictions (provided in the input) against actual cohort outcomes
- A summary of model performance and recommendations for improvement

Print a human-readable summary to stdout and write full results to `ltv_report.json`.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/model_inputs.json ===============
{
  "subscribers": {
    "segment": "subscription",
    "monthly_revenue_per_customer": 29.00,
    "contribution_margin_rate": 0.52,
    "monthly_churn_rate": 0.045,
    "data_months_available": 24,
    "discount_rate_annual": 0.10,
    "cohort_size": 280
  },
  "transactional": {
    "segment": "transactional",
    "avg_order_value": 87.50,
    "purchases_per_year": 2.8,
    "gross_margin_rate": 0.43,
    "annual_churn_rate": 0.38,
    "data_months_available": 18,
    "discount_rate_annual": 0.10,
    "cohort_size": 640
  },
  "prior_predictions": [
    {
      "cohort": "2023-Q1",
      "segment": "subscription",
      "predicted_ltv_12m": 148.00,
      "actual_cumulative_margin_12m": 131.50,
      "months_observed": 12
    },
    {
      "cohort": "2023-Q1",
      "segment": "transactional",
      "predicted_ltv_12m": 95.00,
      "actual_cumulative_margin_12m": 88.20,
      "months_observed": 12
    },
    {
      "cohort": "2023-Q2",
      "segment": "subscription",
      "predicted_ltv_12m": 152.00,
      "actual_cumulative_margin_12m": 127.80,
      "months_observed": 12
    },
    {
      "cohort": "2023-Q3",
      "segment": "subscription",
      "predicted_ltv_12m": 155.00,
      "actual_cumulative_margin_12m": 119.40,
      "months_observed": 12
    },
    {
      "cohort": "2023-Q3",
      "segment": "transactional",
      "predicted_ltv_12m": 98.00,
      "actual_cumulative_margin_12m": 82.60,
      "months_observed": 12
    }
  ]
}
