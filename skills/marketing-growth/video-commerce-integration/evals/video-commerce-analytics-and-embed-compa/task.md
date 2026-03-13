# Video Commerce Analytics Dashboard and Embed Compatibility

## Problem/Feature Description

A home goods retailer has been running shoppable videos on their product pages for three months. The head of e-commerce wants a report on which videos are actually driving purchases — not just views — and needs a reusable analytics function that the data team can call per-video. They also discovered a bug: customers using the embedded player on their blog (hosted on a separate subdomain) can't complete add-to-cart actions because of browser security errors. A few product managers using iPhones have also complained that videos won't load at all.

The engineering team needs to address all three issues: build the analytics function, fix the cart integration in the embedded player, and document the video encoding requirements to prevent the iOS playback problem from happening again. Write a brief technical report (`technical-report.md`) documenting the root causes and fixes for the embedded player cart failures and the iOS loading problem, and implement the analytics function in `video-analytics.ts`.

## Output Specification

- `video-analytics.ts` — TypeScript implementation of a `getVideoCommerceMetrics(videoId: string)` function that returns video commerce KPIs
- `technical-report.md` — A concise technical document covering:
  - Root cause and fix for the add-to-cart failures in the embedded player
  - Root cause and fix for videos not loading on iOS devices
  - Recommended video encoding settings going forward
