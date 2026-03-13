# BFCM Campaign Infrastructure: Safety Controls and Analytics

## Problem/Feature Description

Northfield Outdoors ran their Black Friday / Cyber Monday campaign last year and encountered three problems. During the sale, their email sender reputation tanked because they sent too many emails too quickly and their complaint rate spiked — ISPs started routing their messages to spam. They also discovered after the fact that some customers received both a win-back campaign and the general BFCM broadcast on the same day, which drove unsubscribes. Finally, their post-sale reporting only showed total revenue for the campaign week — the board questioned whether the sale cannibalized December sales or generated truly new revenue, and the marketing team had no way to answer.

You have been asked to address all three issues by building the safety and analytics layer for their email platform. Specifically: implement the logic that determines whether it is safe to send an email to a given customer on a given day, implement the API endpoint for the countdown timer image that is embedded in sale emails, and design the post-campaign performance report. All work should be in TypeScript.

## Output Specification

Produce the following files:
- `email-safety.ts` — Logic that checks whether a customer can receive an email today (contact frequency enforcement) and monitors sender health
- `countdown-timer.ts` — The Express route handler for `GET /api/countdown-timer` that generates a countdown image for use in emails
- `campaign-report.ts` — The function that calculates and returns post-campaign performance metrics
- `analytics-notes.md` — A short explanation of how you chose to measure whether the campaign generated incremental revenue vs. pulled forward demand from a later period

Each file should include inline comments explaining the key safety/correctness decisions.
