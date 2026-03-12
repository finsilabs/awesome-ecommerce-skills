# Exit-Intent Popup A/B Test and Offer Backend

## Problem/Feature Description

A growth team at a direct-to-consumer supplement brand has been running an exit-intent popup for three months with a 10% discount code "WELCOME10". Their CMO is skeptical that the popup is actually driving incremental revenue — a consultant pointed out that visitors who were already going to convert are just using the generic code for a discount they didn't need. The team also can't tell whether the popup is responsible for their email list growth or whether those signups would have happened anyway via the footer form.

The engineering team has been asked to rebuild the experiment infrastructure: implement proper A/B variant assignment so the same user consistently sees the same variant, include a group that sees no popup at all so the team can measure true incremental impact, and replace the shared promo code with individually generated codes. There's also a dispute about whether the team is testing too many things at once — their designer wants to simultaneously test headline copy, offer type, and background color. The engineering lead wants the system to enforce single-variable testing.

## Output Specification

Produce the following files:
- `exit-intent-variants.ts`: variant assignment and experiment orchestration logic
- `popup-api.ts`: a mock server-side handler (TypeScript) for the email capture endpoint, showing how subscribers and promo codes are handled
- `analytics-query.sql`: the SQL query to compare conversion rates across variants and the holdout group
- `experiment-design.md`: a short document explaining the variant setup, how assignment works, and why the experiment is structured the way it is
