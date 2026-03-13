# Marketplace Earnings Calculator

## Problem/Feature Description

Craft & Co is a handmade goods marketplace launching next quarter. Their product team has finalized the business model: the platform takes a commission on every sale, Stripe handles card processing, and new sellers are placed on a reserve program for their first 90 days to protect against chargebacks. Some sellers — particularly those who signed up without completing their tax paperwork — will have income tax withheld directly from their earnings.

The engineering team needs a JavaScript module that calculates the exact amount a seller earns for a given order, breaking down every deduction so that earnings records are transparent and auditable. The module must handle multiple commission structures (the marketplace offers different rates to different seller tiers) and must produce a database record for every order — calculation happens at the moment the order is placed, not at payout time. Seller year-to-date totals must also be updated as part of this process, because the finance team uses them for end-of-year tax reporting.

## Output Specification

Produce a file `earnings-calculator.js` containing the earnings calculation logic as a JavaScript module. The file should be self-contained and include inline comments explaining any non-obvious numeric constants or business rules. Also produce a `calculation-notes.md` that documents the calculation formula used, what each deduction represents, and any edge cases handled. The calculation-notes document should be detailed enough for a finance auditor to verify the logic.
