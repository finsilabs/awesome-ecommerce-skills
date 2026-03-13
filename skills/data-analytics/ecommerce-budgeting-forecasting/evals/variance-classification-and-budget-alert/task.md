# Budget vs. Actuals Monitoring System

## Problem/Feature Description

The CFO of an ecommerce company is tired of getting surprised at the end of each month when actuals come in. By then it's too late to course-correct. She wants two things: (1) a SQL query that she can run against the financial database each month to flag which budget lines have meaningful gaps versus actuals, prioritizing the lines that deserve real management attention rather than burying them in a sea of noise; and (2) a Python function that fires alerts mid-month when any department is burning through budget too fast or suspiciously underspending.

The company has a `budget_entries` table and a `financial_facts` table in its data warehouse. The ops team runs the monthly close on approximately the 2nd of the following month. The CFO wants the report ready by the 3rd business day. She also wants the in-month alerting tool to tell her at-a-glance which items are most urgent.

## Output Specification

Produce two artifacts:

1. `variance_report.sql` — A SQL query that compares budget to actuals and adds a `variance_flag` column classifying each line as one of three categories based on the size of the gap. Include `variance_absolute` (actuals minus budget) and `variance_pct` columns. Assume the tables available are `budget_entries`, `financial_facts` (with columns `fiscal_period`, `account_code`, `amount`, `statement_type`), and `budget_accounts` (with `account_code`, `account_name`, `category`). Use a parameterized version filter `:active_budget_version`.

2. `budget_alerts.py` — A Python function `generate_budget_alerts(budget_vs_actuals, current_day_of_month, days_in_month)` that takes a DataFrame of budget vs. actuals rows and returns a list of alert dictionaries. Each alert should have `account`, `severity`, and `message` fields. The returned list should be ordered by urgency.

Also produce `sample_alerts.json` showing output from the alert function for this scenario: it is day 20 of a 30-day month, and the following accounts have these actuals vs. budgets:
- Paid Search: actual $95,000 vs budget $100,000
- Paid Social: actual $85,000 vs budget $50,000
- Email Platform: actual $2,500 vs budget $2,500
- Influencer: actual $5,000 vs budget $30,000
