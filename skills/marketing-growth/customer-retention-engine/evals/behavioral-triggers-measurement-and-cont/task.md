# Behavioral Triggers and Retention Campaign Analytics

## Problem/Feature Description

Orchard Home is an online home goods retailer that has started sending retention emails but isn't sure whether they actually work. The head of growth wants two things: (1) a set of real-time behavioral triggers so that emails fire when customers show specific disengagement signals rather than on a fixed schedule, and (2) a measurement framework that produces reliable evidence that the campaigns are generating incremental repurchases — not just capturing customers who would have come back anyway.

The team also wants to make sure they're not burning goodwill by emailing enthusiastic VIP customers with aggressive discount offers every time they take a brief pause, and they want to understand whether certain campaigns are causing customers to unsubscribe at elevated rates.

## Output Specification

Produce a TypeScript file `behavioral-triggers.ts` implementing two event-driven trigger functions that fire based on customer activity signals.

Produce a second TypeScript file `campaign-analytics.ts` implementing a lift measurement function that compares campaign recipients against a control group and returns repurchase rates, percentage lift, and revenue recovered.

Also produce an `ANALYTICS_NOTES.md` that covers:
1. What signals trigger each behavioral email and under what conditions
2. How the control group is selected and what fraction of at-risk customers it represents
3. How the measurement handles the comparison to calculate lift
4. How to avoid over-discounting VIP customers
5. What unsubscribe tracking should look like
