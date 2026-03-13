# FBA Fee Audit and Profitability Optimization

## Problem/Feature Description

UrbanNest Home has been using Amazon FBA to fulfill their furniture accessory products for two years. Their operations manager has noticed that the fulfillment fees on their settlement reports seem higher than what the Amazon FBA fee calculator shows when she manually checks a few SKUs. She suspects that Amazon may have the wrong dimensions on file for some products — a common issue when products are measured by Amazon's receiving team rather than the manufacturer's spec sheet.

Additionally, the business development team wants to know which SKUs are candidates for operational changes: products eating up warehouse space in long-term storage, products where FBA costs are becoming a disproportionate share of their price, and products with razor-thin margins that may need to be repriced or discontinued. The team wants an automated script that takes their product dimension data and a settlement summary, identifies any potential overcharges, and generates a prioritized list of operational recommendations.

## Output Specification

Write a Python script named `fba_audit.py` that:
1. Reads the product dimensions from `product_dimensions.csv`
2. Reads the FBA fee charges summary from `fba_charges.csv`
3. Reads the SKU financial summary from `sku_financials.csv`
4. Computes expected FBA fees using Amazon's size tier and dimensional weight logic
5. Identifies overcharges and writes them to `fba_overcharges.csv`
6. Generates optimization recommendations and writes them to `recommendations.csv`
7. Prints a brief summary to stdout

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: product_dimensions.csv ===============
sku,length,width,height,weight_oz
SOFA-PAD-S,14.0,10.0,0.5,11.0
SOFA-PAD-L,17.5,13.5,1.2,18.0
CURTAIN-SET,22.0,8.0,4.0,24.0
LAMP-SHADE,16.0,16.0,12.0,38.0
DOOR-MAT,28.0,18.0,2.0,48.0

=============== FILE: fba_charges.csv ===============
sku,units_shipped,total_fba_fee_charged
SOFA-PAD-S,120,530.40
SOFA-PAD-L,85,892.50
CURTAIN-SET,60,480.00
LAMP-SHADE,40,520.00
DOOR-MAT,30,390.00

=============== FILE: fba_rate_table.json ===============
{
  "small_standard": {
    "0.25": 3.06,
    "0.5": 3.15,
    "0.75": 3.28,
    "1.0": 3.48,
    "2.0": 4.05
  },
  "large_standard": {
    "1.0": 4.75,
    "2.0": 5.40,
    "3.0": 6.10,
    "4.0": 6.75,
    "5.0": 7.45,
    "10.0": 9.20,
    "20.0": 12.50
  },
  "large_bulky": {
    "30.0": 15.00,
    "50.0": 20.00,
    "70.0": 26.00
  }
}

=============== FILE: sku_financials.csv ===============
sku,gross_revenue,fulfillment_fees,long_term_storage_fees,advertising_fees,refund_fees,net_margin_pct
SOFA-PAD-S,1800.00,530.40,0,120.00,0,18.5
SOFA-PAD-L,4675.00,892.50,145.00,200.00,0,3.2
CURTAIN-SET,2400.00,480.00,0,80.00,25.00,21.3
LAMP-SHADE,3200.00,520.00,210.00,150.00,0,-2.1
DOOR-MAT,1200.00,390.00,0,60.00,0,8.7
