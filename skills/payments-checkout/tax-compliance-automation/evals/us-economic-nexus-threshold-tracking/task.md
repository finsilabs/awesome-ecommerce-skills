# US Economic Nexus Tracker

## Problem/Feature Description

A direct-to-consumer apparel brand called ThreadWell has been fulfilling orders from a single warehouse in Oregon for the past 18 months. They started small, but sales have been climbing steadily into states like California, Texas, New York, and the typical mix of smaller states. The finance team has just flagged that they've never properly tracked whether they've crossed economic nexus thresholds — the revenue and transaction volume levels at which a state can require you to collect and remit sales tax.

The stakes are high: if ThreadWell crossed thresholds without registering, they may already owe back taxes, interest, and penalties. The CTO needs a JavaScript/Node.js module that tracks cumulative sales and transaction counts per state per year, detects when thresholds are breached, and fires off alerts so the tax team can take immediate action before the situation gets worse. They also want early-warning alerts so they can prepare before a threshold is actually hit.

## Output Specification

Produce the following files:

- `nexus-tracker.js` — A complete Node.js module implementing the economic nexus threshold tracking logic. The module should export at minimum a `trackTowardThreshold(order, customer)` function. You may use `console.log` or a stub `sendEmail()` in place of a real email service.
- `nexus-tracker.test.js` — Unit tests that verify threshold detection logic for at least California, Texas, New York, and the default case. Tests should verify both the sales threshold and transaction count threshold branches where applicable. You can use any standard test framework (e.g., Jest or plain assertions).
- `README.md` — A short explanation of how the threshold logic works, what states have custom thresholds, and what actions the system recommends when thresholds are approached or triggered.

The implementation should handle the case where an order arrives from a state where no nexus currently exists and correctly accumulate running totals over time.
