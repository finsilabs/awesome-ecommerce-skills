# Automated Credit Scoring and Collections Escalation

## Problem/Feature Description

Meridian Distribution has been extending net payment terms to B2B customers for two years. The credit manager currently reviews all accounts manually — a process that doesn't scale as the customer base has grown to several hundred accounts. Two problems have emerged: the team treats every overdue account the same way regardless of the customer's track record (sending aggressive collection emails to 20-year accounts that are 4 days late), and new accounts are being given overly generous terms because the sales reps are making judgment calls without a consistent methodology.

The engineering team has been asked to build two things: (1) an automated credit scoring function that analyzes a customer's 12-month payment history and outputs a risk score, risk tier, and recommended payment terms and credit limit multiplier, and (2) a collections escalation engine that, given a customer's risk tier and the number of days an invoice is overdue, determines what action should be taken next.

Implement these as a JavaScript module (`credit-risk.js`). The module should export a `scoreCustomerCredit(customerId, paymentHistoryRecords)` function that takes in payment history data directly (no database calls — accept the records as a parameter) and returns the scoring result. Also export a `getNextCollectionsAction(riskTier, daysOverdue, actionsTaken)` function that returns the next action to take given the overdue days and what has already been done, or null if no further action is warranted yet.

Write a demo/test script (`demo.js`) that runs several representative scenarios through both functions and prints the outcomes. Save the output to `results.txt`.

## Output Specification

- `credit-risk.js` — Module exporting `scoreCustomerCredit` and `getNextCollectionsAction`
- `demo.js` — Runnable Node.js script (no external dependencies) covering multiple customer risk profiles and overdue scenarios
- `results.txt` — Output of `node demo.js`, saved to file

The demo should cover: a new customer with no history, a customer with excellent payment history, a customer with poor history, and collections escalation examples for all three risk tiers at various days-overdue values.
