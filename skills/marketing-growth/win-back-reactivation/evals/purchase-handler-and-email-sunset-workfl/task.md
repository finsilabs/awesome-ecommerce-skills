# Win-Back Campaign Cleanup and Deliverability Protection

## Problem Description

The engineering team at an online retailer has been running win-back email campaigns for six months. Two problems have emerged. First, a handful of customers have complained that they received promotional emails the same day they made a purchase, which damaged trust and generated unsubscribe complaints. The team suspects pending campaign jobs aren't being cancelled when an order is placed. Second, the company's email deliverability scores have been declining — investigation points to a growing list of completely unresponsive contacts who are still receiving campaign emails month after month. Industry best practice recommends removing these contacts from the active mailing list, but the legal team insists on giving them one final opt-in opportunity before suppression.

The team wants two pieces of functionality implemented to address these issues: a robust order-completion handler that terminates any in-flight win-back activity when a purchase happens, and a periodic cleanup job that identifies contacts who have never engaged with win-back emails and gracefully sunsets them.

## Output Specification

Write a TypeScript file `win-back-lifecycle.ts` that implements:
1. `onOrderPaid(order)` — handles the cleanup when a customer makes a purchase
2. `runSunsetWorkflow()` — runs periodically to suppress chronically unresponsive contacts

Also write a short `process-notes.md` describing:
- What the order handler does step by step
- The criteria used to identify unresponsive contacts and what actions are taken

Assume the following are available via imports:
- `db` from `'./db'`
- `winBackQueue` from `'./queue'`
- `sendEmail` from `'./mailer'`
- `subDays` from `'date-fns'`
- Types `Order` from `'./types'`
