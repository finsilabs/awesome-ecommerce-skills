# Referral Reward Engine

## Problem Description

A growing online retailer wants to encourage their best customers to refer more friends by offering escalating rewards. The existing flat-rate payout is easy to game: fraudsters are signing up dummy accounts and placing tiny orders just to claim the reward. Meanwhile, power-users who have referred many friends are complaining they still get the same reward as someone on their first referral. The business wants to fix both problems simultaneously.

The team needs a reward engine that grants rewards only on qualifying purchases, scales up the referrer's reward based on their referral track record, and notifies the referrer so they keep engaging with the program. The rewards should be stored against each customer's account and expire after a reasonable period to encourage return purchases.

## Output Specification

Implement the reward engine in a TypeScript file called `referral-rewards.ts`. It should include:

- The tier definitions as a constant
- A function to look up the correct tier for a given number of successful referrals
- The first-purchase event handler that validates eligibility, issues rewards, updates records, and triggers notifications

Also include a `reward-issuance.ts` file that shows the reward issuance function with the correct expiry policy.

Use stub/interface definitions for `db` and email notification helpers so the logic is clear without needing a real database. Annotate the code with TypeScript types.
