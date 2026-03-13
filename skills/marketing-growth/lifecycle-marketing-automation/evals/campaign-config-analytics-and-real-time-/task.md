# Lifecycle Campaign Layer and Analytics

## Problem Description

Nourish & Co. is a health food e-commerce company that has just deployed a customer lifecycle stage engine. Now they need to build the campaign management layer on top of it, plus an analytics dashboard so the marketing team can monitor health of the funnel.

The engineering team has two immediate needs:

**Campaign configuration:** Different lifecycle stages need different treatment — the channel used to reach customers, how often they receive messages, what the messaging focuses on, and whether incentives like discounts are offered. Anonymous visitors (those who haven't yet shared their email) are harder to reach through traditional channels; lapsed customers are the hardest to win back and may need a meaningful incentive; loyal customers should get exclusive content and typically don't need financial incentives to engage. The team wants a central config object that encodes these rules so campaign workers can look up the right parameters without hard-coding decisions. A critical concern: the marketing ops team has seen campaigns fire with stale stage data — a customer who made a purchase yesterday might still get a "we miss you" email if the campaign worker uses the stage from when the job was enqueued rather than the current stage.

**Real-time event hooks:** The lifecycle engine runs nightly, but two events need to update a customer's stage immediately without waiting for the batch: (a) when a customer submits a product review, reaching a threshold of reviews should move them into the advocate tier; (b) webhook handlers for other real-time purchase events should also feed into stage re-evaluation.

**Analytics dashboard:** The team wants visibility into funnel health — how customers are distributed across stages, which transitions are happening (and at what rates), how long customers spend in each stage, and the average LTV by stage.

## Output Specification

Produce a TypeScript file `campaign-layer.ts` containing:
1. A `STAGE_CAMPAIGN_CONFIG` object (or equivalent) mapping every lifecycle stage to its campaign parameters
2. A `sendCampaignToCustomer(customerId, campaignType)` function (or equivalent) that guards against stale stage data at send time
3. An `onReviewSubmitted(customerId)` event handler
4. A `getLifecycleDashboard()` function

Also write `campaign-design.md` explaining how the campaign config decisions were made for each stage, particularly around channel selection and incentive levels.
