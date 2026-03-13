# B2B Payment Processing and Credit Management Service

## Problem/Feature Description

A wholesale supplier's finance team records incoming payments manually today — each morning they open bank statements and mark invoices as paid in the system. This causes problems: partially paid invoices sit unrecorded for days, customers on credit hold are unblocked late, and occasionally a payment is applied to an already-voided invoice causing data integrity issues.

The engineering team needs a payment recording service that handles the full lifecycle: recording each incoming payment against an invoice, updating the invoice status correctly (distinguishing partial from full payment), keeping the customer's outstanding AR balance accurate, and automatically releasing credit holds when a customer's overdue invoices are cleared. The service will be called both from the finance team's internal admin panel and by an automated bank reconciliation feed.

Separately, the team also needs the B2B checkout flow to enforce credit limits — orders placed by trade accounts should be blocked if the customer would exceed their approved credit limit.

## Output Specification

Produce two JavaScript files:
- `payment-recorder.js` — the payment recording service
- `credit-check.js` — a module that checks a customer's credit availability before an order is placed

Also produce a `payment_notes.md` explaining:
- How the system determines whether an invoice is fully paid vs. partially paid
- How the customer's AR balance is kept consistent with payment activity
- What happens to a customer's credit hold status when their overdue invoice is paid
- What checks are in place to prevent data integrity problems with payment recording
