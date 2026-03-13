# Amazon Settlement Fee Analysis

## Problem/Feature Description

Finley Home Goods sells kitchen products on Amazon and has just received their bi-weekly settlement file from Seller Central. The finance team wants to understand exactly how much they're paying in each type of fee per product SKU so they can identify which fees are hurting margins most. The settlement file contains a mix of order proceeds, FBA fulfillment charges, referral fees, storage fees, advertising spend, and refund-related fees — all in a single flat file.

The finance analyst has extracted the raw settlement data and needs a Python script that parses the file, classifies each transaction by fee type, and produces a clean per-SKU fee summary broken down by category. The analyst specifically wants advertising fees called out separately from the unavoidable transaction fees, since advertising is a discretionary spend they want to analyze on its own.

## Output Specification

Write a Python script named `parse_settlement.py` that:
1. Reads the provided settlement file (`settlement.tsv`)
2. Parses and normalizes the data
3. Maps each transaction's fee type to a fee category
4. Produces a CSV output file named `fee_summary_by_sku.csv` with per-SKU fee totals broken out by category

The script should print a brief summary to stdout showing total fees collected per category across all SKUs.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: settlement.tsv ===============
settlement-id	settlement-start-date	settlement-end-date	transaction-type	order-id	merchant-order-id	shipment-id	marketplace-name	amount-type	amount-description	amount	quantity-purchased	posted-date	sku	product-description
1234567890	2026-02-01	2026-02-14	Order	112-3456789-0000001		SHP001	Amazon.com	ItemPrice	Principal	29.99	1	2026-02-03	KIT-001	Bamboo Cutting Board
1234567890	2026-02-01	2026-02-14	Order	112-3456789-0000001		SHP001	Amazon.com	ItemFees	FBAPerUnitFulfillmentFee	-3.22	1	2026-02-03	KIT-001	Bamboo Cutting Board
1234567890	2026-02-01	2026-02-14	Order	112-3456789-0000001		SHP001	Amazon.com	ItemFees	Commission	-4.50	1	2026-02-03	KIT-001	Bamboo Cutting Board
1234567890	2026-02-01	2026-02-14	Order	112-3456789-0000002		SHP002	Amazon.com	ItemPrice	Principal	49.99	1	2026-02-04	KIT-002	Stainless Steel Pan Set
1234567890	2026-02-01	2026-02-14	Order	112-3456789-0000002		SHP002	Amazon.com	ItemFees	FBAPerUnitFulfillmentFee	-5.80	1	2026-02-04	KIT-002	Stainless Steel Pan Set
1234567890	2026-02-01	2026-02-14	Order	112-3456789-0000002		SHP002	Amazon.com	ItemFees	Commission	-7.50	1	2026-02-04	KIT-002	Stainless Steel Pan Set
1234567890	2026-02-01	2026-02-14	Order	112-3456789-0000003		SHP003	Amazon.com	ItemPrice	Principal	29.99	2	2026-02-05	KIT-001	Bamboo Cutting Board
1234567890	2026-02-01	2026-02-14	Order	112-3456789-0000003		SHP003	Amazon.com	ItemFees	FBAPerUnitFulfillmentFee	-6.44	2	2026-02-05	KIT-001	Bamboo Cutting Board
1234567890	2026-02-01	2026-02-14	Order	112-3456789-0000003		SHP003	Amazon.com	ItemFees	Commission	-9.00	2	2026-02-05	KIT-001	Bamboo Cutting Board
1234567890	2026-02-01	2026-02-14	Refund	112-3456789-0000002		SHP002	Amazon.com	ItemFees	RefundCommission	1.50	1	2026-02-07	KIT-002	Stainless Steel Pan Set
1234567890	2026-02-01	2026-02-14	other-transaction			 	Amazon.com	other-transaction	FBAStorageFee	-12.80	 	2026-02-14	KIT-001	Bamboo Cutting Board
1234567890	2026-02-01	2026-02-14	other-transaction			 	Amazon.com	other-transaction	FBAStorageFee	-8.40	 	2026-02-14	KIT-002	Stainless Steel Pan Set
1234567890	2026-02-01	2026-02-14	other-transaction			 	Amazon.com	other-transaction	FBALongTermStorageFee	-45.00	 	2026-02-14	KIT-001	Bamboo Cutting Board
1234567890	2026-02-01	2026-02-14	other-transaction			 	Amazon.com	Subscription	Subscription	-39.99	 	2026-02-14
1234567890	2026-02-01	2026-02-14	other-transaction			 	Amazon.com	Sponsored Products	Sponsored Products	-28.50	 	2026-02-14	KIT-001	Bamboo Cutting Board
1234567890	2026-02-01	2026-02-14	other-transaction			 	Amazon.com	Sponsored Brands	Sponsored Brands	-15.00	 	2026-02-14	KIT-002	Stainless Steel Pan Set
1234567890	2026-02-01	2026-02-14	other-transaction			 	Amazon.com	Lightning Deal fees	Lightning Deal fees	-5.00	 	2026-02-14	KIT-001	Bamboo Cutting Board
1234567890	2026-02-01	2026-02-14	other-transaction			 	Amazon.com	other-transaction	other-transaction	-2.10	 	2026-02-14	KIT-002	Stainless Steel Pan Set
