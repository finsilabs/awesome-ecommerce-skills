# Experiment Analytics: Tracking and Results Analysis

## Problem/Feature Description

A fashion retailer's engineering team has an A/B test running on their product detail page: one variant shows a redesigned "Add to Cart" button with social proof messaging. The experiment assignment system is already in place, but the team has no tracking or analysis layer. Results are currently being estimated by eyeballing order counts in a spreadsheet, which the data team says is completely unreliable.

The analytics lead wants a proper tracking system that records when users are actually exposed to each variant, and a results API that computes statistical significance so the team can confidently decide whether to ship the new button. She specifically flagged two past mistakes to avoid: (1) a previous system double-counted exposures when users visited the same page multiple times, inflating exposure counts and making the test appear more powered than it was; (2) a separate system counted conversions for users who had never actually seen the experiment variant, because someone placed an order through a direct link.

The experiment is for a checkout event called `order_placed` and has a control variant and a treatment variant. The team wants to be able to call a results endpoint to see the current state of the experiment.

## Output Specification

Produce a TypeScript file `experiment-tracking.ts` containing:

1. A `trackExposure(experimentId, variantId, userId)` function that safely records experiment exposure.
2. A `trackConversion(experimentId, userId, event, value?)` function that records conversion events.
3. A `calculateSignificance(results)` function that takes control and variant exposure/conversion counts and returns p-value, significance flag, and relative lift.
4. A `getExperimentResults(req, res)` Express handler for `GET /api/experiments/:id/results` that assembles the full results response.

Also produce a `analysis-notes.md` explaining the statistical method used and any important caveats about when results should and should not be trusted.
