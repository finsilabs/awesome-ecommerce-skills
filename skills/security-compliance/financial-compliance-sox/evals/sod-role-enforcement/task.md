# User Access Management for Financial Systems

## Problem/Feature Description

Meridian Commerce is a fast-growing B2B ecommerce company that recently hired a new CFO. During their first week, the CFO discovered that several warehouse managers have been assigned both purchasing and payment approval responsibilities — a legacy arrangement that grew organically as the company scaled. External consultants have flagged this as a potential audit risk ahead of the company's Series C financing round, which requires demonstrating credible internal controls.

The engineering team has been asked to build a user role management module for the admin backend. The module needs to handle assigning financial roles to staff members and must enforce the appropriate constraints. The system should make it impossible to assign a user a combination of roles that would give them unchecked financial authority, and every role change must be traceable. The company currently has around 40 admin users whose role assignments need to be validated as part of the rollout.

## Output Specification

Produce a TypeScript module (or set of modules) that implements:

1. A role model defining the financial roles for the order-to-cash and procure-to-pay cycles, plus system administration roles.
2. Logic to detect prohibited role combinations when assigning roles to a user.
3. A function to assign roles to a user that enforces the prohibited combinations and records the change to an audit log.
4. A one-time scan function that checks all existing user-role assignments for conflicts and returns a report of any violations found.

Write the implementation to `src/financial-roles.ts` (and any supporting files you need).

Also write a `design-notes.md` file explaining:
- Which role combinations are prohibited and why
- How the audit log entry is structured
- What happens when a violation is detected

## Input Files

The following file describes the existing user population. Extract it before beginning.

=============== FILE: inputs/existing-users.json ===============
[
  { "userId": "u001", "email": "alice@meridian.com", "name": "Alice Chen", "roles": ["po_requester", "order_entry"] },
  { "userId": "u002", "email": "bob@meridian.com", "name": "Bob Martinez", "roles": ["po_approver", "invoice_processor"] },
  { "userId": "u003", "email": "carol@meridian.com", "name": "Carol Smith", "roles": ["po_requester", "po_approver"] },
  { "userId": "u004", "email": "dan@meridian.com", "name": "Dan Lee", "roles": ["payment_initiator", "payment_approver"] },
  { "userId": "u005", "email": "eve@meridian.com", "name": "Eve Johnson", "roles": ["invoice_processor", "payment_initiator"] },
  { "userId": "u006", "email": "frank@meridian.com", "name": "Frank Brown", "roles": ["order_approver", "revenue_reporter"] },
  { "userId": "u007", "email": "grace@meridian.com", "name": "Grace Kim", "roles": ["auditor", "revenue_reporter"] },
  { "userId": "u008", "email": "henry@meridian.com", "name": "Henry Davis", "roles": ["user_admin"] },
  { "userId": "u009", "email": "iris@meridian.com", "name": "Iris Wilson", "roles": ["po_requester", "payment_approver"] },
  { "userId": "u010", "email": "jake@meridian.com", "name": "Jake Taylor", "roles": ["cash_receipts", "revenue_reporter"] }
]
