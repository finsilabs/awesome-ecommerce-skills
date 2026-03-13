# B2B Order Credit Gate

## Problem/Feature Description

TradeCo Supplies is a wholesale distributor that has just moved from prepay-only to offering net payment terms for its B2B customers. Before this change, every order required upfront payment, so there was no credit risk. Now, approved customers can place orders and pay later — but the engineering team needs to make sure the business doesn't overextend credit.

The head of finance has flagged three recurring problems from the pilot rollout: orders are occasionally being accepted for customers whose accounts have been put on hold due to disputes; some customers with "pending" applications are placing orders before their credit has been approved; and a handful of large orders have been processed that push customers well past their authorized credit ceiling. The root cause is that the current checkout service only checks credit after invoicing, not at order placement — meaning the warehouse ships the goods before the system catches the problem.

Your task is to implement a `checkCreditAvailability` function and a `releaseReservedCredit` function for the order service. The functions should handle all the edge cases the finance team identified, and when credit is approved, the system must update the customer's credit state immediately at order creation time (not after invoicing) so that a second simultaneous order cannot exceed the same limit. Also implement a `releaseReservedCredit` function for when orders are cancelled before confirmation.

Write the implementation as a JavaScript module (`credit-check.js`) along with a test file (`credit-check.test.js`) that demonstrates each decision path using in-memory mock data. The test file should print results to stdout so the outcomes are visible.

## Output Specification

- `credit-check.js` — The credit check module with `checkCreditAvailability` and `releaseReservedCredit` functions
- `credit-check.test.js` — A runnable test/demo script (no test framework required, plain Node.js) that exercises all decision paths and prints the results
- `results.txt` — Run `node credit-check.test.js > results.txt 2>&1` and save the output

The test script must be runnable with `node credit-check.test.js` without any npm install (use no external dependencies).
