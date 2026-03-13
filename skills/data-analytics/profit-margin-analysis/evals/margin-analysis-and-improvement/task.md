# Margin Analysis Report for Catalog Rationalization

## Problem / Feature Description

An ecommerce operator running a subscription-box business wants to rationalize their product catalog before the next buying season. They have two years of monthly SKU-level profitability data (net revenue, gross profit, direct marketing, fulfillment costs, overhead allocation) and are struggling to separate the signal from the noise: some SKUs look great in their peak season but are terrible in the off-season, and their product manager keeps pointing at gross margin % without considering how much each SKU actually contributes in absolute dollars.

The leadership team needs a comprehensive analysis that identifies where to focus improvement efforts, surfaces products they should consider eliminating, shows how margin has moved over time in a way that accounts for seasonality, and gives them concrete levers to pull (pricing, COGS reduction, shipping costs) with estimated impact. The analysis should be in a format they can review offline — a Python script plus output files.

You are producing the analysis. The input data is provided below.

## Output Specification

Produce:

1. `margin_analysis.py` — a Python script that, when run with `python margin_analysis.py`, reads `inputs/sku_data.json` and produces all output files
2. `outputs/tier_report.csv` — products classified into profitability groupings based on their margin level and revenue volume (include the classification label in the output)
3. `outputs/trend_report.csv` — monthly margin trend data covering the full available history in a way that lets you see year-over-year movement; include both percentage and absolute dollar columns
4. `outputs/improvement_opportunities.csv` — ranked list of SKUs that are underperforming, including both their current margin % and the absolute dollar potential gain if they reached the catalog average; include a priority classification
5. `outputs/sensitivity_table.csv` — a table showing for each SKU how their margin changes under three different cost/price scenarios of your choosing that would be actionable for pricing and procurement decisions
6. `outputs/analysis_notes.md` — brief documentation of the methodology and any assumptions made in the analysis

The script should also print to stdout any SKUs that are losing money on a per-sale basis when all variable costs are included, based on recent performance.

## Input Files

The following SKU profitability data is provided. Extract it before beginning.

=============== FILE: inputs/sku_data.json ===============
{
  "skus": [
    {
      "sku": "BOX-CLASSIC-M",
      "product_name": "Classic Box Medium",
      "category": "subscription",
      "monthly_data": [
        {"period": "2024-01", "units_sold": 420, "net_revenue": 12600, "product_cost": 5040, "inbound_freight": 378, "outbound_shipping": 1260, "payment_fees": 365, "marketplace_fees": 0, "packaging_cost": 210, "direct_marketing": 2520, "overhead_allocation": 630, "returns": 252},
        {"period": "2024-02", "units_sold": 395, "net_revenue": 11850, "product_cost": 4740, "inbound_freight": 355, "outbound_shipping": 1185, "payment_fees": 344, "marketplace_fees": 0, "packaging_cost": 198, "direct_marketing": 2370, "overhead_allocation": 593, "returns": 237},
        {"period": "2024-03", "units_sold": 410, "net_revenue": 12300, "product_cost": 4920, "inbound_freight": 369, "outbound_shipping": 1230, "payment_fees": 357, "marketplace_fees": 0, "packaging_cost": 205, "direct_marketing": 2460, "overhead_allocation": 615, "returns": 246},
        {"period": "2024-04", "units_sold": 430, "net_revenue": 12900, "product_cost": 5160, "inbound_freight": 387, "outbound_shipping": 1290, "payment_fees": 374, "marketplace_fees": 0, "packaging_cost": 215, "direct_marketing": 2580, "overhead_allocation": 645, "returns": 258},
        {"period": "2024-05", "units_sold": 460, "net_revenue": 13800, "product_cost": 5520, "inbound_freight": 414, "outbound_shipping": 1380, "payment_fees": 400, "marketplace_fees": 0, "packaging_cost": 230, "direct_marketing": 2760, "overhead_allocation": 690, "returns": 276},
        {"period": "2024-06", "units_sold": 480, "net_revenue": 14400, "product_cost": 5760, "inbound_freight": 432, "outbound_shipping": 1440, "payment_fees": 418, "marketplace_fees": 0, "packaging_cost": 240, "direct_marketing": 2880, "overhead_allocation": 720, "returns": 288},
        {"period": "2024-07", "units_sold": 455, "net_revenue": 13650, "product_cost": 5460, "inbound_freight": 410, "outbound_shipping": 1365, "payment_fees": 396, "marketplace_fees": 0, "packaging_cost": 228, "direct_marketing": 2730, "overhead_allocation": 683, "returns": 273},
        {"period": "2024-08", "units_sold": 445, "net_revenue": 13350, "product_cost": 5340, "inbound_freight": 400, "outbound_shipping": 1335, "payment_fees": 387, "marketplace_fees": 0, "packaging_cost": 223, "direct_marketing": 2670, "overhead_allocation": 668, "returns": 267},
        {"period": "2024-09", "units_sold": 470, "net_revenue": 14100, "product_cost": 5640, "inbound_freight": 423, "outbound_shipping": 1410, "payment_fees": 409, "marketplace_fees": 0, "packaging_cost": 235, "direct_marketing": 2820, "overhead_allocation": 705, "returns": 282},
        {"period": "2024-10", "units_sold": 510, "net_revenue": 15300, "product_cost": 6120, "inbound_freight": 459, "outbound_shipping": 1530, "payment_fees": 444, "marketplace_fees": 0, "packaging_cost": 255, "direct_marketing": 3060, "overhead_allocation": 765, "returns": 306},
        {"period": "2024-11", "units_sold": 620, "net_revenue": 18600, "product_cost": 7440, "inbound_freight": 558, "outbound_shipping": 1860, "payment_fees": 539, "marketplace_fees": 0, "packaging_cost": 310, "direct_marketing": 3720, "overhead_allocation": 930, "returns": 372},
        {"period": "2024-12", "units_sold": 710, "net_revenue": 21300, "product_cost": 8520, "inbound_freight": 639, "outbound_shipping": 2130, "payment_fees": 618, "marketplace_fees": 0, "packaging_cost": 355, "direct_marketing": 4260, "overhead_allocation": 1065, "returns": 426},
        {"period": "2025-01", "units_sold": 430, "net_revenue": 12900, "product_cost": 5160, "inbound_freight": 387, "outbound_shipping": 1290, "payment_fees": 374, "marketplace_fees": 0, "packaging_cost": 215, "direct_marketing": 2580, "overhead_allocation": 645, "returns": 258},
        {"period": "2025-02", "units_sold": 415, "net_revenue": 12450, "product_cost": 4980, "inbound_freight": 374, "outbound_shipping": 1245, "payment_fees": 361, "marketplace_fees": 0, "packaging_cost": 208, "direct_marketing": 2490, "overhead_allocation": 623, "returns": 249}
      ]
    },
    {
      "sku": "BOX-PREMIUM-L",
      "product_name": "Premium Box Large",
      "category": "subscription",
      "monthly_data": [
        {"period": "2024-01", "units_sold": 180, "net_revenue": 9000, "product_cost": 2700, "inbound_freight": 270, "outbound_shipping": 900, "payment_fees": 261, "marketplace_fees": 0, "packaging_cost": 180, "direct_marketing": 900, "overhead_allocation": 450, "returns": 90},
        {"period": "2024-02", "units_sold": 175, "net_revenue": 8750, "product_cost": 2625, "inbound_freight": 263, "outbound_shipping": 875, "payment_fees": 254, "marketplace_fees": 0, "packaging_cost": 175, "direct_marketing": 875, "overhead_allocation": 438, "returns": 88},
        {"period": "2024-03", "units_sold": 190, "net_revenue": 9500, "product_cost": 2850, "inbound_freight": 285, "outbound_shipping": 950, "payment_fees": 276, "marketplace_fees": 0, "packaging_cost": 190, "direct_marketing": 950, "overhead_allocation": 475, "returns": 95},
        {"period": "2024-04", "units_sold": 200, "net_revenue": 10000, "product_cost": 3000, "inbound_freight": 300, "outbound_shipping": 1000, "payment_fees": 290, "marketplace_fees": 0, "packaging_cost": 200, "direct_marketing": 1000, "overhead_allocation": 500, "returns": 100},
        {"period": "2024-05", "units_sold": 210, "net_revenue": 10500, "product_cost": 3150, "inbound_freight": 315, "outbound_shipping": 1050, "payment_fees": 305, "marketplace_fees": 0, "packaging_cost": 210, "direct_marketing": 1050, "overhead_allocation": 525, "returns": 105},
        {"period": "2024-06", "units_sold": 220, "net_revenue": 11000, "product_cost": 3300, "inbound_freight": 330, "outbound_shipping": 1100, "payment_fees": 319, "marketplace_fees": 0, "packaging_cost": 220, "direct_marketing": 1100, "overhead_allocation": 550, "returns": 110},
        {"period": "2024-07", "units_sold": 215, "net_revenue": 10750, "product_cost": 3225, "inbound_freight": 323, "outbound_shipping": 1075, "payment_fees": 312, "marketplace_fees": 0, "packaging_cost": 215, "direct_marketing": 1075, "overhead_allocation": 538, "returns": 108},
        {"period": "2024-08", "units_sold": 205, "net_revenue": 10250, "product_cost": 3075, "inbound_freight": 308, "outbound_shipping": 1025, "payment_fees": 297, "marketplace_fees": 0, "packaging_cost": 205, "direct_marketing": 1025, "overhead_allocation": 513, "returns": 103},
        {"period": "2024-09", "units_sold": 225, "net_revenue": 11250, "product_cost": 3375, "inbound_freight": 338, "outbound_shipping": 1125, "payment_fees": 326, "marketplace_fees": 0, "packaging_cost": 225, "direct_marketing": 1125, "overhead_allocation": 563, "returns": 113},
        {"period": "2024-10", "units_sold": 250, "net_revenue": 12500, "product_cost": 3750, "inbound_freight": 375, "outbound_shipping": 1250, "payment_fees": 363, "marketplace_fees": 0, "packaging_cost": 250, "direct_marketing": 1250, "overhead_allocation": 625, "returns": 125},
        {"period": "2024-11", "units_sold": 310, "net_revenue": 15500, "product_cost": 4650, "inbound_freight": 465, "outbound_shipping": 1550, "payment_fees": 450, "marketplace_fees": 0, "packaging_cost": 310, "direct_marketing": 1550, "overhead_allocation": 775, "returns": 155},
        {"period": "2024-12", "units_sold": 370, "net_revenue": 18500, "product_cost": 5550, "inbound_freight": 555, "outbound_shipping": 1850, "payment_fees": 537, "marketplace_fees": 0, "packaging_cost": 370, "direct_marketing": 1850, "overhead_allocation": 925, "returns": 185},
        {"period": "2025-01", "units_sold": 195, "net_revenue": 9750, "product_cost": 2925, "inbound_freight": 293, "outbound_shipping": 975, "payment_fees": 283, "marketplace_fees": 0, "packaging_cost": 195, "direct_marketing": 975, "overhead_allocation": 488, "returns": 98},
        {"period": "2025-02", "units_sold": 188, "net_revenue": 9400, "product_cost": 2820, "inbound_freight": 282, "outbound_shipping": 940, "payment_fees": 273, "marketplace_fees": 0, "packaging_cost": 188, "direct_marketing": 940, "overhead_allocation": 470, "returns": 94}
      ]
    },
    {
      "sku": "ADD-ON-SNACK",
      "product_name": "Snack Add-on Pack",
      "category": "add-on",
      "monthly_data": [
        {"period": "2024-01", "units_sold": 95, "net_revenue": 950, "product_cost": 570, "inbound_freight": 95, "outbound_shipping": 285, "payment_fees": 28, "marketplace_fees": 0, "packaging_cost": 48, "direct_marketing": 475, "overhead_allocation": 95, "returns": 19},
        {"period": "2024-02", "units_sold": 88, "net_revenue": 880, "product_cost": 528, "inbound_freight": 88, "outbound_shipping": 264, "payment_fees": 26, "marketplace_fees": 0, "packaging_cost": 44, "direct_marketing": 440, "overhead_allocation": 88, "returns": 18},
        {"period": "2024-03", "units_sold": 102, "net_revenue": 1020, "product_cost": 612, "inbound_freight": 102, "outbound_shipping": 306, "payment_fees": 30, "marketplace_fees": 0, "packaging_cost": 51, "direct_marketing": 510, "overhead_allocation": 102, "returns": 20},
        {"period": "2024-04", "units_sold": 98, "net_revenue": 980, "product_cost": 588, "inbound_freight": 98, "outbound_shipping": 294, "payment_fees": 28, "marketplace_fees": 0, "packaging_cost": 49, "direct_marketing": 490, "overhead_allocation": 98, "returns": 20},
        {"period": "2024-05", "units_sold": 110, "net_revenue": 1100, "product_cost": 660, "inbound_freight": 110, "outbound_shipping": 330, "payment_fees": 32, "marketplace_fees": 0, "packaging_cost": 55, "direct_marketing": 550, "overhead_allocation": 110, "returns": 22},
        {"period": "2024-06", "units_sold": 115, "net_revenue": 1150, "product_cost": 690, "inbound_freight": 115, "outbound_shipping": 345, "payment_fees": 33, "marketplace_fees": 0, "packaging_cost": 58, "direct_marketing": 575, "overhead_allocation": 115, "returns": 23},
        {"period": "2024-07", "units_sold": 108, "net_revenue": 1080, "product_cost": 648, "inbound_freight": 108, "outbound_shipping": 324, "payment_fees": 31, "marketplace_fees": 0, "packaging_cost": 54, "direct_marketing": 540, "overhead_allocation": 108, "returns": 22},
        {"period": "2024-08", "units_sold": 105, "net_revenue": 1050, "product_cost": 630, "inbound_freight": 105, "outbound_shipping": 315, "payment_fees": 30, "marketplace_fees": 0, "packaging_cost": 53, "direct_marketing": 525, "overhead_allocation": 105, "returns": 21},
        {"period": "2024-09", "units_sold": 112, "net_revenue": 1120, "product_cost": 672, "inbound_freight": 112, "outbound_shipping": 336, "payment_fees": 32, "marketplace_fees": 0, "packaging_cost": 56, "direct_marketing": 560, "overhead_allocation": 112, "returns": 22},
        {"period": "2024-10", "units_sold": 120, "net_revenue": 1200, "product_cost": 720, "inbound_freight": 120, "outbound_shipping": 360, "payment_fees": 35, "marketplace_fees": 0, "packaging_cost": 60, "direct_marketing": 600, "overhead_allocation": 120, "returns": 24},
        {"period": "2024-11", "units_sold": 145, "net_revenue": 1450, "product_cost": 870, "inbound_freight": 145, "outbound_shipping": 435, "payment_fees": 42, "marketplace_fees": 0, "packaging_cost": 73, "direct_marketing": 725, "overhead_allocation": 145, "returns": 29},
        {"period": "2024-12", "units_sold": 165, "net_revenue": 1650, "product_cost": 990, "inbound_freight": 165, "outbound_shipping": 495, "payment_fees": 48, "marketplace_fees": 0, "packaging_cost": 83, "direct_marketing": 825, "overhead_allocation": 165, "returns": 33},
        {"period": "2025-01", "units_sold": 92, "net_revenue": 920, "product_cost": 552, "inbound_freight": 92, "outbound_shipping": 276, "payment_fees": 27, "marketplace_fees": 0, "packaging_cost": 46, "direct_marketing": 460, "overhead_allocation": 92, "returns": 18},
        {"period": "2025-02", "units_sold": 85, "net_revenue": 850, "product_cost": 510, "inbound_freight": 85, "outbound_shipping": 255, "payment_fees": 25, "marketplace_fees": 0, "packaging_cost": 43, "direct_marketing": 425, "overhead_allocation": 85, "returns": 17}
      ]
    }
  ]
}
