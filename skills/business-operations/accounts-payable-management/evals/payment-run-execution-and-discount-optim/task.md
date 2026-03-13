# Weekly Payment Run Automation with Discount Capture

## Problem/Feature Description

A regional retail chain runs weekly payments to its 150+ active suppliers. The treasury team currently picks invoices manually each Friday, misses early-payment discounts worth tens of thousands of dollars annually, and occasionally sends payments to vendors whose bank accounts have recently changed — leading to returned ACH transactions. The CFO wants a TypeScript module that automates the weekly payment run: gather approved invoices that are due, layer in any invoices with expiring early-payment discounts, apply the discounts to the payment amounts, execute everything atomically, and notify vendors of what was paid.

The approval workflow is already in place and enforces a strict rule: whoever approves an invoice must not be the same person who kicks off the payment run. The system needs to support this separation. Additionally, to reduce fraud risk, any invoice from a vendor whose bank account details have changed recently must be held for manual verification rather than included automatically in the payment batch.

## Output Specification

Write a TypeScript file named `payment_run.ts` that implements the following:

- `getEarlyPaymentOpportunities(): Promise<DiscountOpportunity[]>` — returns approved invoices eligible for early-payment discount, within the correct look-ahead window, sorted appropriately
- `buildPaymentRun(options: PaymentRunOptions): Promise<string>` — selects which invoices to pay (due invoices + discount-eligible invoices), applies discounts, creates the run and payment records atomically, and transitions invoice statuses
- `notifyVendorsOfPayment(runId: string): Promise<void>` — sends remittance communication to vendors being paid in this run

Include TypeScript interfaces for all data shapes. Add a brief `DESIGN_NOTES.md` file (max 1 page) explaining the key design decisions made, including how segregation of duties is enforced and how the bank account change risk is handled.
