# Referral Program Fraud Detection and Viral Analytics

## Problem/Feature Description

Craftly, a marketplace for handmade goods, launched a referral program six months ago and it has grown beyond what anyone expected. Unfortunately, the finance team has started flagging unusual reward payouts — some customers appear to be creating fake accounts or colluding with friends to farm referral rewards. Meanwhile, the growth team has no way to measure whether the program is actually producing viral growth or just giving discounts to people who would have signed up anyway.

The engineering team needs two additions to the existing referral system: a fraud detection function that can identify suspicious conversions before rewards are granted, and an analytics function that calculates the viral coefficient (K-factor) so leadership can track program health over time. The fraud detection needs to catch multiple categories of abuse — not just the obvious cases. The analytics function needs to return a structured result that non-technical stakeholders can interpret.

The fraud detection should integrate into the existing conversion flow, and any suspicious conversions should be escalated rather than silently dropped.

## Output Specification

Produce a TypeScript file `referral-analytics.ts` containing:
- A `checkReferralFraud(conversion)` function that returns a boolean indicating whether fraud was detected
- A `calculateViralCoefficient(programId, lookbackDays?)` function that returns a structured analytics result

Also produce a `fraud-and-analytics-design.md` that:
- Lists all fraud signals being detected and the rationale for each
- Explains the K-factor formula used and how to interpret the result
- Recommends a sensible value for the monthly per-customer referral cap and preferred reward type for referrers

Assume the following are available: `db` object with ORM-style access methods, `notifyFraudTeam(conversionId, flags)` function, and `daysBetween(date1, date2)` / `subDays(date, n)` date utilities.
