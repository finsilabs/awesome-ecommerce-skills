# Regional Storefront Routing and Checkout Experiments for a Fashion Platform

## Problem/Feature Description

Kova Fashion is a mid-sized apparel brand with dedicated storefronts for shoppers in the UK, Germany, France, Canada, and Australia. Currently, all traffic hits the same US-based Next.js origin regardless of where the shopper is located, causing frustrating experiences: UK shoppers see USD prices and US sizing, German shoppers see content in the wrong language, and load times for European users are noticeably slower.

The engineering team wants to implement middleware that automatically sends international visitors to their regional storefront on the first page visit, passes country context to the origin for any requests that aren't redirected, and runs a checkout button color experiment without adding client-side JavaScript that would delay page rendering. They also need the ability to toggle a maintenance mode and disable checkout via fast-reading configuration flags, without making any slow network calls in the middleware itself.

## Output Specification

Produce a `middleware.ts` file (suitable for a Next.js project) that:

- Handles geo-based routing: visitors from supported regions are redirected to the appropriate regional path on the homepage; all requests include the resolved country on a request/response header for downstream use
- Runs a checkout button color A/B experiment: each new visitor is assigned a variant and that assignment is persisted; the current variant is always surfaced as a response header
- Reads at least two feature flags (maintenance mode and checkout availability) from a fast edge-side configuration store and applies the corresponding rewrites/redirects
- Applies only to the paths relevant to product browsing and collection pages

Also produce a brief `implementation-notes.md` explaining any key design decisions, especially around how configuration is read at the edge and what the middleware does vs. what is left to the origin.
