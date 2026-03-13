# FX Risk Management Report and Treasury Policy

## Problem/Feature Description

ShopGlobal is a D2C ecommerce company with USD as its functional currency. It generates approximately EUR 2.5M/year in European sales and also pays EUR 800K/year to European logistics and fulfilment partners. The CFO has raised concerns after noticing that monthly P&L reports show unexplained swings in reported revenue that correlate with EUR/USD movements. The board has asked the finance team to produce a currency risk management report and establish a formal hedging policy before the next audit.

The company currently has no forward contracts in place and the finance team is unsure whether they need them. They have a mix of confirmed purchase orders and projected seasonal revenue targets for the next quarter. The accounting system currently has a single "revenue" account that receives all proceeds regardless of whether gains or losses arose from FX movements.

## Output Specification

Produce two files:

1. `fx-risk-report.md` — A currency risk analysis report for ShopGlobal that:
   - Analyzes the EUR exposure (both revenue and payables) and quantifies the net exposure
   - Explains how FX effects should be reported separately from operating revenue
   - Describes the rate source that should be used for booking transactions
   - Recommends a hedging approach for the net exposure, including which positions qualify for hedging and which do not
   - Addresses the accounting treatment requirements for any hedging instruments used
   - Describes what to do with small rounding differences between the booked rate and actual settlement rate

2. `treasury-policy.md` — A written treasury policy document that:
   - States which currency exposures will be hedged and using what instruments
   - Defines the threshold above which natural hedging applies
   - Specifies how hedges must be recorded and documented at the time they are entered into
   - Describes the monthly close process for open FX positions
   - Defines how effective rate tracking per currency corridor will be maintained
   - Describes the chart of accounts structure for FX gains and losses
