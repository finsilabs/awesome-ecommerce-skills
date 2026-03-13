# Marketplace Revenue Audit: Gift Cards, Returns, and Third-Party Sellers

## Problem/Feature Description

Bellwether Commerce operates an online retail platform with three distinct revenue streams that are currently all being recorded the same way — as gross revenue at the time of transaction. An external auditor has flagged this as a material misstatement risk ahead of a Series B financing round. The three streams are:

1. **Direct sales** — Bellwether sells its own inventory directly to customers. Products have a 30-day return window, and historical data shows a 12% return rate on direct sales. Currently, 100% of revenue is recognized at the time of sale with no return reserve.

2. **Gift card sales** — Bellwether sells gift cards that customers can redeem later. Historical data shows that 8% of gift card balances are never redeemed. Currently, all gift card proceeds are recorded as revenue at the time of sale.

3. **Marketplace sales** — Bellwether facilitates sales for third-party sellers, charging a 15% commission. Bellwether never takes possession of the inventory; the seller ships directly to the buyer. Currently, the full transaction amount (not just the 15%) is recorded as Bellwether's revenue.

The CFO has asked for a Python module that correctly models the revenue recognition policy for each stream, and a memo explaining the accounting rationale for each treatment.

## Output Specification

Produce the following files:

- `revenue_policy.py` — Python module containing functions for:
  - `recognize_direct_sale(sale_amount, return_rate)` — returns (recognized_revenue, refund_liability) applying a variable consideration constraint
  - `recognize_gift_card_redemption(face_value, amount_redeemed, breakage_rate, total_redeemed_to_date, total_issued)` — returns revenue to recognize at redemption including proportional breakage
  - `recognize_marketplace_transaction(gross_transaction_amount, commission_rate)` — returns Bellwether's revenue (net commission only)

- `sample_calculations.py` — Script using the above functions with the sample data below, printing the computed revenue amounts for each stream

- `accounting_memo.md` — A short memo (bullet points acceptable) explaining: why each stream is treated differently, what was wrong with the previous treatment, and what the correct accounting basis is for each

## Input Files

The following sample transaction data is provided. Extract it before beginning.

=============== FILE: inputs/transactions.csv ===============
transaction_id,stream,gross_amount,notes
TXN001,direct_sale,500.00,standard product sale
TXN002,gift_card_sale,100.00,card issued; not yet redeemed
TXN003,gift_card_redemption,80.00,customer redeems $80 of a $100 card
TXN004,marketplace,200.00,third-party seller; Bellwether earns 15% commission
TXN005,direct_sale,300.00,standard product sale
