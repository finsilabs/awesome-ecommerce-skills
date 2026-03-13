# Financial Approval Controls for Order and Payment Processing

## Problem/Feature Description

NovaTrade is an ecommerce marketplace preparing for its first external financial audit. The audit committee has flagged two gaps in their transaction controls: large wholesale orders can be fulfilled without any management sign-off, and the accounts payable team can release payment batches to vendors without a second reviewer. These gaps represent material risks that auditors expect to see addressed with automated, traceable controls.

The head of engineering has been tasked with implementing two preventive controls that block transactions from proceeding when they don't meet approval requirements, and ensure every control decision is captured in a structured, queryable evidence log. The controls must be implemented at the service layer so they cannot be bypassed by calling the API directly. Each log entry must carry enough information for an auditor to understand what happened, who was involved, and whether the control passed or failed — without needing to consult any other system.

## Output Specification

Produce a TypeScript implementation in `src/` that includes:

1. A `FinancialControlEvent` interface and an `FinancialAuditLog` class that writes control events to a store. The log must be designed so that entries cannot be modified after writing.
2. A function implementing the high-value order approval control: orders meeting a specific monetary threshold require a user with the appropriate approval role; the function should throw a typed error if the check fails.
3. A function implementing the large payment run control: payment runs meeting a specific monetary threshold require at least two distinct approvers; the function should throw a typed error if the check fails.
4. Both control functions must write to the audit log on every invocation (pass or fail), including the relevant control reference ID.

Write a `controls-design.md` file that lists each control, its monetary threshold, what role or approval count is required, and what error type is thrown on failure.

Do NOT use any external HTTP APIs or cloud services in your implementation — use in-memory or mock storage so the code can run standalone.
