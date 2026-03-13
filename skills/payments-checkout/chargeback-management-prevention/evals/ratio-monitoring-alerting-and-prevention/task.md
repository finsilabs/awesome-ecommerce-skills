# Chargeback Risk Dashboard and Prevention Controls

## Problem/Feature Description

MerchantHub processes payments for a B2C marketplace. Their payment operations lead recently received a warning letter from their acquiring bank: Visa's internal systems flagged the merchant's dispute ratio as elevated over the past two months. The lead doesn't have a reliable way to track the ratio in real time, doesn't know exactly where the warning and critical thresholds sit for different card networks, and the team keeps getting caught off-guard by upcoming response deadlines.

Additionally, the fraud team has identified a pattern of "friendly fraud": certain customers file disputes repeatedly and the same email addresses appear across multiple chargebacks within a year. The marketplace also noticed it has a high friendly fraud rate on Visa transactions and wants to reduce it by adding a checkout control. Finally, the analytics team wants to understand whether their dispute strategy is working differently for different dispute categories — their overall win rate number tells them nothing about whether "item not received" disputes are being won at a different rate from "not as described" ones.

You have been asked to deliver: (1) a monitoring module that computes the monthly chargeback ratio per card network and fires alerts at the correct warning and critical thresholds, (2) a deadline management module that sends automated reminders for open disputes approaching their response window, (3) a customer-risk utility that identifies repeat disputers, and (4) a short design document covering checkout-level changes to reduce friendly fraud and how to correctly segment win-rate analytics.

## Output Specification

Produce the following files:

- `monitoring.js` — JavaScript module that computes the monthly chargeback ratio for a given month and network, using the correct calendar-month window, and fires warning and critical alerts at the appropriate network-specific thresholds.
- `deadline-alerts.js` — JavaScript module that queries open disputes and sends automated reminders at the correct intervals before each response deadline.
- `repeat-disputer.js` — JavaScript module with a function that takes a customer email and determines whether that customer should be flagged for manual review based on their chargeback history.
- `design-doc.md` — Covers: (a) the specific checkout-level change that combats friendly fraud at the point of sale, and (b) how to correctly segment win-rate reporting so that different dispute types can be measured and improved separately.
