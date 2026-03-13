# Purchase Conversion Tracking for TikTok Ads

## Problem Description

A fashion ecommerce startup has been running TikTok ads for three months and their marketing team is frustrated: the TikTok Ads Manager is reporting only about 40% of the purchases that Shopify shows in the same period. Their current setup uses only the TikTok Pixel installed in the browser. The problem is well-understood in the industry — browser-side tracking is increasingly blocked by iOS privacy restrictions, ad blockers, and cookie consent rejections.

The engineering team has been tasked with adding server-side conversion tracking so that purchase events reach TikTok reliably regardless of browser-side signal loss. The backend is a Node.js/TypeScript application. Critically, because both the browser Pixel and the new server-side integration will fire on the same purchase, the team needs to ensure TikTok doesn't double-count conversions.

Importantly, to ensure regulatory compliance, all personally identifiable information must be handled appropriately before it is transmitted to any third-party advertising platform.

## Output Specification

Produce a TypeScript module file named `tiktok-tracking.ts` that implements server-side purchase event tracking. The module should export:

1. A function that sends a purchase conversion event to TikTok's server-side API given order details and request context (IP address, user agent, cookies).
2. A sample call-site snippet (in comments or a separate `example-usage.ts` file) showing how this function would be invoked from an order webhook handler, including how the browser Pixel would fire alongside it.

Additionally, produce a short `NOTES.md` file documenting:
- How to obtain and manage the access credentials needed
- Any known failure modes and how the implementation handles them
