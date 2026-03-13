# 13-Week Cash Flow Model for an Ecommerce Operator

## Problem/Feature Description

Birchwood Supply Co. is an ecommerce business selling home organization products. Their operations team has been running the business on gut feel and a spreadsheet, but after nearly running out of cash during a slow January (they had ordered heavily for Q4 and the holiday revenue came in later than expected), the CEO has decided to build a proper short-term cash flow model.

They need a Python script that produces a 13-week forward-looking cash flow, giving them clear visibility into their net operating cash position each week. The business buys inventory from overseas suppliers who require payment 30 days after warehouse receipt, and the lead time from order placement to receipt is 45 days. Current inventory on hand is worth approximately $180,000 and they use a 40% COGS rate. The team targets maintaining 8 weeks of forward stock coverage.

The script also needs to handle the fact that some large outflows are not monthly — they have a $28,000 annual software contract renewal in week 6 of the forecast, a $15,000 trade show expense in week 9, and they remit quarterly sales tax at the end of the quarter (approximately $22,000 due in week 11). These are easily forgotten but material.

Finally, the ops team knows exactly what is happening in the first four weeks: they have a confirmed $95,000 purchase order payment due in week 2, scheduled payroll of $18,000 per week, and two confirmed customer payments totalling $67,000 arriving in week 3. They want the model to use these concrete commitments for the near term rather than relying on averages or models.

## Output Specification

Produce a Python script `cash_model.py` that:

1. Generates a 13-week (91-day) cash flow forecast starting from an opening balance of $450,000.
2. Models inventory purchase order timing and payment dates based on the supplier terms and stock coverage target described above, using a sales forecast of $85,000/week base case.
3. Includes the one-time outflows (software renewal, trade show, sales tax remittance) at the specific weeks described above.
4. Uses the confirmed transaction amounts for weeks 1–4 (where specified above) rather than model-derived estimates.
5. Produces a week-by-week table showing: week number, total inflows, total outflows, net cash flow, and running cash balance.

The script should run with standard Python libraries. Output to console or a CSV file.
