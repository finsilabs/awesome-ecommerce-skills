# Seller Disbursement Processor

## Problem/Feature Description

GigMarket is a freelance services marketplace that has grown to 800 active sellers. Every week their finance team manually exports a spreadsheet of sellers owed money and wires funds one by one — a process that takes two days and has caused several payment errors. The CTO wants a fully automated batch disbursement system that runs on a schedule and reliably transfers the correct net amounts to each seller's bank account.

Sellers have already completed Stripe Connect onboarding as part of signup. Not all accounts are fully activated yet — some are still restricted or pending review — so the system needs to skip ineligible sellers gracefully rather than failing the entire batch. When a transfer succeeds, all the underlying earnings records need to be marked as disbursed in the same atomic operation so the books never fall out of sync with what Stripe actually paid out. When a transfer fails, the failure must be recorded with the reason so the finance team can investigate. The system should also handle the edge case where a seller's net amount is zero or negative after deductions, and instead of triggering a clawback, carry that balance forward.

## Output Specification

Produce a file `disbursement-processor.js` implementing the batch disbursement logic as a JavaScript module. Include a `disbursement-design.md` document that describes the data flow, idempotency strategy, and how the system handles failure cases — detailed enough for a code reviewer to evaluate the correctness of the approach. Clean up any test artifacts before finishing.
