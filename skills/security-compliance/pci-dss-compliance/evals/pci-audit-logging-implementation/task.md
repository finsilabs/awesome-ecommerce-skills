# Audit Logging Module for PCI-Compliant Admin Panel

## Problem/Feature Description

Meridian Commerce operates an e-commerce platform that processes credit card payments via Stripe. Their security team has received a finding from an external assessor: the admin panel has no structured audit logging. Currently, when an admin user logs in, updates an order, or grants another user elevated access, no trace is recorded anywhere. The assessor noted that this would be a blocking issue during a PCI-DSS assessment.

The team needs a TypeScript audit logging module that can be dropped into their Express-based admin panel. The module must produce log entries that satisfy the auditor's requirements, write those logs to a destination that cannot be tampered with after the fact, and cover all the specific admin-panel event types the assessor flagged. The logging infrastructure must also have a documented retention approach: the assessor asked specifically how long audit records are kept and how quickly historical records can be retrieved.

## Output Specification

Produce the following files:

- `audit-logger.ts` — A TypeScript module containing:
  - An interface or type definition for audit log entries
  - An `AuditLogger` class with a constructor that accepts a transport
  - Methods to log: authentication events, access to cardholder data, admin actions, privilege escalation changes, and access-denied events
  - Each log entry must capture enough information to satisfy PCI auditor requirements

- `log-transport.ts` — A short TypeScript module showing how the AuditLogger would be wired to a tamper-proof log destination. You do not need to implement a real cloud client — a concrete class with a `write(entry)` stub is sufficient. Include a comment explaining why this destination is suitable for PCI compliance.

- `retention-policy.md` — A short document (bullet points are fine) describing the log retention approach that satisfies PCI-DSS requirements, including how long logs must be kept and how quickly a subset of recent logs must be retrievable.
