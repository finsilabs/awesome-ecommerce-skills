# Automated Return Processing Workflow

## Problem/Feature Description

FinSi processes several hundred return requests per day. Right now every request lands in a customer-service queue and a human has to open each ticket, look up the order, check whether it falls within the return window, and approve or reject it — a process that takes an average of 8 minutes per ticket and creates a 48-hour backlog during peak season. The operations director estimates that roughly 80% of requests are routine and could be handled without any human intervention.

The team also has a fraud concern: last month three fraudulent returns totalling over $2,000 slipped through because the original rules had no special handling for high-value items. They need the automated system to escalate anything above a certain threshold to the human team for a second look, even if the return would otherwise be auto-approved.

Customer satisfaction surveys highlight two recurring complaints: customers are surprised by restocking fees they weren't told about, and they feel blindsided when their return window quietly expires. The new system needs to address both.

## Output Specification

Produce the following files:

- `workflow.ts` (or `.js`) — The return request processing logic, including:
  - A `processReturnRequest` function that evaluates eligibility and routes the request to the correct outcome, including special handling for high-value items
  - A `previewReturn` function (or equivalent) that returns the calculated restocking fee and days remaining *before* the customer submits the final return request
  - A `sendExpiryNotifications` function (or equivalent job) that identifies orders whose return window closes within 7 days and queues a notification
- `workflow.test.ts` (or `.js`) — Unit tests covering:
  - An ineligible return is rejected and a rejection notification is triggered
  - A low-value, auto-approve return is approved and a shipping label is issued
  - A high-value return (above your chosen threshold) is routed to manual review even when the policy is configured for auto-approval
  - The restocking fee is stored on the return request before the routing decision is made
  - An eligibility evaluation call is recorded with its inputs and outcome
- `log-store.ts` (or `.js`) — A simple in-memory or file-backed store for eligibility evaluation logs (used by the tests)

You may stub database and notification calls. Include a `package.json` if dependencies are needed. Tests should run with a standard `npm test` or `npx jest` invocation.
