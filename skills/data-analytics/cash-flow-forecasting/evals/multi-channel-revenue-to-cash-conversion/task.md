# Cash Inflow Projection for a Multi-Channel DTC Brand

## Problem/Feature Description

Meridian Home Goods is a direct-to-consumer brand selling premium kitchenware across four channels: their own Shopify storefront (processed through Shopify Payments), Amazon FBA, eBay, and a growing B2B wholesale line (Net-30 terms) with independent kitchen retailers. The finance team currently tracks sales in their ERP but has no visibility into *when* that revenue will actually land in their bank accounts. They need a Python script that takes a week-by-week sales forecast by channel and produces a precise cash inflow schedule — showing the expected cash receipt date and amount for each sale, not just the sale date.

The team has also flagged that their eBay storefront requires a reserve that is held back, and their B2B accounts occasionally result in uncollectible invoices. They want the model to reflect these realities. Additionally, their cookware and tableware products have a meaningful customer return rate (approximately 18%) and they want returns modeled as a cash cost in the schedule as well.

Finally, the business runs monthly paid social campaigns billed in arrears by the ad platforms. The finance team has been burned before when a large ad bill hit the bank account weeks after the spend occurred; they want the script to account for this correctly in the outflow schedule.

## Output Specification

Produce a single Python script `cash_projection.py` that:

1. Accepts or hardcodes a sample weekly revenue forecast dataset (at least 8 weeks, covering the channels listed below) as input data defined within the script itself.
2. Computes a projected cash inflow schedule — a table/DataFrame with columns for the sale date, expected cash receipt date, channel, gross revenue, and expected cash received.
3. Models the return cash outflows for the cookware/tableware category at an 18% return rate, adding these as negative cash entries to the schedule.
4. Models the ad spend cash outflow schedule (use a sample monthly ad budget of $12,000 billed on the last day of the month with payment clearing 5 days later).
5. Outputs a combined cash schedule (inflows and outflows) sorted by cash date, and a weekly summary showing total net cash by week.

The script should run with standard Python data science libraries (pandas, numpy, etc.) and produce console output or a CSV file showing the results.

## Input Files (optional)

No external input files are required. All sample data should be generated or hardcoded within the script.
