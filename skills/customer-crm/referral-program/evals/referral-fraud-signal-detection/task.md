# Referral Fraud Detection

## Problem Description

A fintech startup running a referral program has discovered that a small number of bad actors are draining the referral reward budget. Some users are creating multiple accounts at the same address to refer themselves. Others appear to be operating referral "rings" where many accounts are created from the same network and immediately refer each other. The fraud team needs a structured, auditable fraud detection function that evaluates each referral relationship and returns a list of signals — some of which should block the referral outright, others which should simply be logged for manual review.

The team wants the function to be modular and signal-based so they can tune blocking thresholds independently for each signal type without changing business logic. Each signal should carry a name and a flag indicating whether it warrants an automatic block.

## Output Specification

Implement the fraud detection logic in a TypeScript file called `referral-fraud.ts`. The function should accept the referrer ID, referee ID, and referee email, query relevant data, and return an array of fraud signals. Each signal object must have at minimum a `signal` name string and a `block` boolean.

The function should evaluate at least the following patterns:
- Shared contact or address details between referrer and referee
- Email domain similarity (with exclusions for common consumer email providers)
- Behavioral patterns around account creation timing relative to referral clicks
- Geographic clustering signals based on network proximity

Use TypeScript interfaces and stub the `db` access layer. Include a comment explaining the rationale for each signal's blocking decision.
