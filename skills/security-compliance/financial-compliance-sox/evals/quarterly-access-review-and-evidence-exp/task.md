# Financial Access Review and Auditor Evidence Package

## Problem/Feature Description

Frontier Payments is a payments infrastructure company that recently received a letter from its external auditors requesting evidence for two IT General Controls: a quarterly review of who holds financial system access, and an exported evidence package for a specific control covering the last fiscal quarter. The audit engagement partner noted that the previous year's review was done manually in a spreadsheet, and several stale accounts were missed — resulting in a significant deficiency finding. This year, the controls need to be automated and generate machine-readable evidence.

The compliance engineering team needs to build two capabilities: first, a report generator for the quarterly user access review that surfaces any accounts requiring attention from managers; second, an evidence export function that an auditor can run to pull all recorded control events for a given control reference over a specific date range. The company's security team has also flagged that the audit function must be completely separated from the ability to perform financial transactions. All of this needs to be documented clearly so that a new team member — or an auditor — can understand the controls without reading the source code.

## Output Specification

Produce a TypeScript implementation in `src/` that includes:

1. A quarterly access review function that, given a quarter identifier, returns a report containing: all users with financial roles, their last login date, whether each account is dormant, whether each account has any role conflicts, and a separate list of exceptions (dormant or conflicted accounts).
2. An evidence export function that accepts a control reference ID and a date range, retrieves all matching control events, and produces a structured report object with a summary section (total events, pass/fail/exception counts) and a detail section (all individual events).
3. A `controls-documentation.md` file that documents: the quarterly access review control (objective, who runs it, frequency, what evidence it produces), what constitutes a dormant account, and why the AUDITOR role must never hold transaction permissions.

Use in-memory or mock data — no external services or databases required.

## Input Files

The following file provides sample user data to use as mock input for the access review function. Extract it before beginning.

=============== FILE: inputs/users.json ===============
[
  { "userId": "u001", "email": "alice@frontier.com", "name": "Alice Tan", "roles": ["po_requester", "order_entry"], "lastLogin": "2026-01-15T09:00:00Z", "active": true },
  { "userId": "u002", "email": "bob@frontier.com", "name": "Bob Okonkwo", "roles": ["po_approver"], "lastLogin": "2025-09-30T14:22:00Z", "active": true },
  { "userId": "u003", "email": "carol@frontier.com", "name": "Carol Reyes", "roles": ["payment_initiator", "payment_approver"], "lastLogin": "2026-02-28T11:00:00Z", "active": true },
  { "userId": "u004", "email": "dan@frontier.com", "name": "Dan Novak", "roles": ["auditor"], "lastLogin": "2026-03-01T08:00:00Z", "active": true },
  { "userId": "u005", "email": "eve@frontier.com", "name": "Eve Müller", "roles": ["revenue_reporter"], "lastLogin": null, "active": true },
  { "userId": "u006", "email": "frank@frontier.com", "name": "Frank Osei", "roles": ["invoice_processor", "cash_receipts"], "lastLogin": "2026-03-10T16:00:00Z", "active": true }
]
