# Multi-Channel Marketing Performance Dashboard

## Problem Description

A mid-size DTC home goods brand runs paid advertising across Meta, Google (search and shopping), and TikTok, plus an email marketing program through Klaviyo. Their current reporting is fragmented: the Meta team looks at Meta Ads Manager, the Google team lives in Google Ads, and no one has a unified view. The CMO is preparing for a monthly board meeting and needs a single, coherent picture of marketing efficiency across all channels.

The marketing ops lead has exported two weeks of raw campaign-level data from each platform. She needs a Python analysis script that ingests this data, normalizes it into a unified structure, and produces a weekly marketing performance report. The report needs to be actionable — the CMO should be able to glance at it and immediately know which channels are performing well, which need attention, and whether the overall budget is on pace for the month.

The brand runs both prospecting campaigns (targeting new audiences) and remarketing campaigns (targeting website visitors and past customers), and the CFO has asked that these be reported separately because the economics are very different.

Google search includes both branded terms (people searching the company's own brand name) and non-branded terms (generic product searches). The CFO suspects the branded campaigns are inflating Google's overall numbers.

## Output Specification

Write a Python script named `marketing_dashboard.py` that:
1. Loads the campaign data provided below as hard-coded inputs
2. Normalizes it into a unified data structure
3. Produces a formatted text report saved as `weekly_report.txt`
4. Saves structured channel metrics to `channel_metrics.json`

Run with: `python marketing_dashboard.py`

The report should cover at minimum:
- Portfolio-level summary (total spend, attributed revenue, overall efficiency)
- Per-channel breakdown comparing this week vs last week
- Prospecting vs remarketing performance split
- Google branded vs non-branded performance split
- Budget pacing status (each channel has a monthly budget cap provided below)
- A note on which channels warrant attention

## Input Files (optional)

The following campaign data covers two weeks (Week 1 = days 1–7, Week 2 = days 8–14 of the current month). Extract and use this data before beginning.

=============== FILE: inputs/campaign_data.csv ===============
week,platform,campaign_type,campaign_name,spend,impressions,clicks,platform_conversions,platform_revenue,first_party_revenue,monthly_budget
1,meta,prospecting,Meta_Prospecting_Broad,18200,1450000,8700,142,28400,19800,80000
1,meta,remarketing,Meta_Retargeting_Visitors,6400,320000,4100,98,17640,14200,30000
1,google,branded_search,Google_Brand_Search,3800,210000,12400,185,29600,27100,20000
1,google,nonbranded_search,Google_NonBrand_Search,7200,380000,6200,74,14800,9600,35000
1,tiktok,prospecting,TikTok_TopFunnel_UGC,9100,2100000,11200,87,13050,7900,40000
1,klaviyo,remarketing,Email_Weekly_Newsletter,1100,0,0,64,9600,9100,5000
2,meta,prospecting,Meta_Prospecting_Broad,19100,1520000,9100,149,29800,21400,80000
2,meta,remarketing,Meta_Retargeting_Visitors,6700,335000,4300,103,18540,15100,30000
2,google,branded_search,Google_Brand_Search,3900,215000,12700,191,30560,28200,20000
2,google,nonbranded_search,Google_NonBrand_Search,7400,392000,6400,76,15200,9900,35000
2,tiktok,prospecting,TikTok_TopFunnel_UGC,9400,2180000,11600,91,13650,8200,40000
2,klaviyo,remarketing,Email_Weekly_Newsletter,1100,0,0,67,10050,9500,5000
