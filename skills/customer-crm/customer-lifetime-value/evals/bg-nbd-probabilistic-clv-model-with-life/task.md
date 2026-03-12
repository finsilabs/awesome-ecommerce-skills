# Probabilistic Customer Lifetime Value Prediction

## Problem/Feature Description

FreshCart, an online grocery platform with over 80,000 repeat customers, wants to move beyond rule-based customer segmentation and adopt a statistically rigorous approach to predicting which customers are most valuable over the next year. Their head of analytics has heard about probabilistic models that account for both purchase frequency and order value separately, and wants to evaluate one for use in their annual customer value report.

The data team has an export of completed orders from the last 3 years. They want a Python script that ingests this transaction data, fits a probabilistic model, and outputs a 12-month predicted CLV for each customer — ready to be imported back into their data warehouse. The script should be production-quality: documented, reproducible, and designed to be rerun monthly without overfitting on any particular data slice.

## Output Specification

Produce a Python script `clv_model.py` that:

1. Loads transaction data from the provided CSV file (see Input Files below)
2. Prepares the RFM (recency, frequency, monetary) summary needed for model fitting
3. Fits the appropriate probabilistic models for purchase frequency and monetary value
4. Generates 12-month CLV predictions for all customers
5. Saves predictions to `clv_predictions.csv` with columns: `customer_id`, `predicted_clv_12mo`

Also produce a `model-notes.md` file that explains:
- Which Python library and model classes are used
- The regularization approach and the coefficient value chosen
- Why customers with zero repeat purchases are handled separately in one of the model fitting steps
- The discount rate assumption used for the time-value calculation

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/orders.csv ===============
customer_id,created_at,subtotal_cents,status
C001,2022-01-15,4500,completed
C001,2022-04-20,5200,completed
C001,2022-09-10,4800,completed
C001,2023-02-14,5100,completed
C001,2023-08-22,4900,completed
C002,2022-03-01,12000,completed
C002,2022-06-15,9800,completed
C002,2023-01-10,11500,completed
C002,2023-07-20,10200,completed
C002,2024-02-08,11000,completed
C003,2022-05-20,3200,completed
C003,2023-11-30,2900,completed
C004,2022-02-10,6700,completed
C004,2022-05-18,7200,completed
C004,2022-11-25,6900,completed
C004,2023-04-12,7100,completed
C004,2023-10-08,6800,completed
C004,2024-03-15,7300,completed
C005,2022-07-01,2100,completed
C005,2022-10-15,1950,completed
C005,2023-03-22,2200,completed
C006,2022-08-10,15000,completed
C006,2023-02-28,14500,completed
C006,2023-09-14,16000,completed
C006,2024-01-20,15500,completed
C007,2022-04-05,890,completed
C007,2023-12-01,920,completed
C008,2022-06-20,5500,completed
C008,2022-09-30,5800,completed
C008,2023-01-15,5300,completed
C008,2023-06-10,5600,completed
C008,2023-12-05,5400,completed
C008,2024-04-01,5700,completed
C009,2022-11-01,3400,completed
C010,2022-03-15,8900,completed
C010,2022-07-22,9200,completed
C010,2023-01-08,8700,completed
C010,2023-08-14,9100,completed
C010,2024-02-20,8800,completed
