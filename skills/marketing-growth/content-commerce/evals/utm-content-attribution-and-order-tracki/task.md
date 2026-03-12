# Content Revenue Attribution System

## Problem/Feature Description

A mid-size outdoor gear retailer publishes buying guides and gear reviews that attract significant organic search traffic. The head of content wants to prove that the editorial team drives real revenue, not just pageviews. Currently, when a reader clicks a product in a buying guide and later completes a purchase, there is no way to tie that order back to the article that started the journey — all that revenue is lumped into "direct" or "organic" in the existing analytics dashboards.

The engineering team needs to build the tracking layer that connects articles to orders. When a reader clicks a product link in an article, specific tracking parameters must be passed along in the URL so that when an order is placed, the attribution can be captured and stored. There is also a complication: the same customer may have come from a Google Ads campaign earlier in the same session, and the team does not want paid search spend to be eclipsed or confused by content attribution — each channel should receive credit according to a defined priority.

Your task is to implement the TypeScript functions that power this attribution pipeline, and to write a SQL query that the data team can use to report on content-driven revenue.

## Output Specification

Create a file `attribution.ts` containing:

1. A function `buildContentProductUrl(product, article)` that generates a product URL with tracking parameters embedded. The URL should uniquely identify both the article and the specific product placement.

2. A function `captureOrderAttribution(orderId, utmParams)` that stores attribution data for an order (you may use a mock `db` object — just show the call with all necessary fields).

3. A function (or constant/comment) `resolveAttributionSource(touchpoints)` that documents or implements the priority logic for determining which channel gets credit for an order when multiple channels are present in the customer journey.

Create a file `attribution_report.sql` containing a SQL query that reports content-driven revenue per article over the last 90 days, showing article slug, number of orders, total revenue, and average order value.

Write a short `ATTRIBUTION_NOTES.md` explaining how the URL parameters connect to the order attribution record.
