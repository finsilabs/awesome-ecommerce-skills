# Marketplace Profitability Dashboard

## Problem/Feature Description

NovaCraft Supplies is a mid-size seller on Amazon and eBay. Their CFO has been frustrated that the accounting system only shows the net bank deposits from each marketplace, making it impossible to understand true product-level profitability. The CFO suspects that some SKUs look profitable on paper because the team has been treating the settlement payout as if it were gross revenue — masking the real impact of fulfillment costs, referral fees, and storage charges.

The CFO wants a proper profitability analysis that starts from gross selling prices and decomposes every fee component to arrive at true net proceeds per SKU per period. She also wants percentage-based fee metrics so that fee efficiency can be compared across SKUs regardless of volume, and wants the team to start tracking how much each fee type eats into revenue as a rate, not just in dollars.

## Output Specification

Write a Python script named `net_revenue_analysis.py` that:
1. Reads the provided normalized transaction data from `transactions.csv`
2. Computes net revenue per SKU per month with a full fee breakdown
3. Writes results to `net_revenue_by_sku.csv`

The output CSV should include columns showing gross revenue, each fee category as a separate column, net marketplace proceeds, and fee rates as percentages of net sales. The script should also print a summary table to stdout.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: transactions.csv ===============
marketplace,transaction_date,transaction_type,fee_category,sku,selling_price,marketplace_fee,net_proceeds
amazon,2026-01-05,order,none,KIT-001,29.99,0,29.99
amazon,2026-01-05,order,fulfillment,KIT-001,0,-3.22,-3.22
amazon,2026-01-05,order,referral_fee,KIT-001,0,-4.50,-4.50
amazon,2026-01-08,order,none,KIT-001,29.99,0,29.99
amazon,2026-01-08,order,fulfillment,KIT-001,0,-3.22,-3.22
amazon,2026-01-08,order,referral_fee,KIT-001,0,-4.50,-4.50
amazon,2026-01-12,order,none,KIT-002,49.99,0,49.99
amazon,2026-01-12,order,fulfillment,KIT-002,0,-5.80,-5.80
amazon,2026-01-12,order,referral_fee,KIT-002,0,-7.50,-7.50
amazon,2026-01-15,refund,none,KIT-002,-49.99,0,-49.99
amazon,2026-01-15,refund,refund_fee,KIT-002,0,1.50,1.50
amazon,2026-01-31,fee,storage,KIT-001,0,-12.80,-12.80
amazon,2026-01-31,fee,storage_long_term,KIT-001,0,-45.00,-45.00
amazon,2026-01-31,fee,storage,KIT-002,0,-8.40,-8.40
amazon,2026-01-31,fee,advertising,KIT-001,0,-28.50,-28.50
amazon,2026-01-31,fee,advertising,KIT-002,0,-15.00,-15.00
amazon,2026-02-03,order,none,KIT-001,29.99,0,29.99
amazon,2026-02-03,order,fulfillment,KIT-001,0,-3.22,-3.22
amazon,2026-02-03,order,referral_fee,KIT-001,0,-4.50,-4.50
amazon,2026-02-07,order,none,KIT-002,49.99,0,49.99
amazon,2026-02-07,order,fulfillment,KIT-002,0,-5.80,-5.80
amazon,2026-02-07,order,referral_fee,KIT-002,0,-7.50,-7.50
amazon,2026-02-10,order,none,KIT-002,49.99,0,49.99
amazon,2026-02-10,order,fulfillment,KIT-002,0,-5.80,-5.80
amazon,2026-02-10,order,referral_fee,KIT-002,0,-7.50,-7.50
amazon,2026-02-28,fee,storage,KIT-001,0,-12.80,-12.80
amazon,2026-02-28,fee,storage,KIT-002,0,-8.40,-8.40
amazon,2026-02-28,fee,advertising,KIT-001,0,-22.00,-22.00
ebay,2026-01-06,order,none,KIT-001,32.00,0,32.00
ebay,2026-01-06,order,referral_fee,KIT-001,0,-4.16,-4.16
ebay,2026-01-20,order,none,KIT-002,52.00,0,52.00
ebay,2026-01-20,order,referral_fee,KIT-002,0,-6.76,-6.76
ebay,2026-01-20,order,fulfillment,KIT-002,0,-2.50,-2.50
