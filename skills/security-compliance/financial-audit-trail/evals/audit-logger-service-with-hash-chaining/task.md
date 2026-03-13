# Build the Financial Audit Logger Module

## Problem/Feature Description

The payments engineering team at a B2B ecommerce platform has been asked by the CFO to make every financial mutation traceable after a support investigation revealed that a large order total had been changed by an unknown actor with no record of who or when. The platform handles orders, payments, and refunds across hundreds of merchants and processes about 50,000 financial events per day.

Your job is to implement the core `FinancialAuditLogger` TypeScript module that will become the single source of truth for all financial audit events. The team has agreed that the module must make tampering detectable — any change to historical records should be visible by examining the stored data alone, without requiring logs or external systems. It also needs to capture enough context per event that the finance team can answer questions like "who changed this order total, from which IP, and as part of which request?" without hunting through server logs.

The engineering team uses a database abstraction called `db` (already in scope), and the codebase uses `RequestContext` to carry per-request metadata (userId, userRole, ip, requestId).

## Output Specification

Produce a single TypeScript file `audit-logger.ts` containing:

- A `FinancialAuditLogger` class with a `record()` method that inserts a new audit event
- A `withAudit` decorator (or higher-order function) that wraps a financial service method to automatically capture state changes
- A `FinancialEvents` object with typed helper functions for at least two common financial event types (e.g. order creation, refund, manual price adjustment)
- Export `auditLog` as a singleton instance of `FinancialAuditLogger`

Also produce a short `audit-logger-design.md` (max 1 page) explaining the tamper-detection approach you implemented and any key design decisions.

You do not need to implement the `db` layer or run any code — produce the TypeScript source files only. Assume TypeScript with standard Node.js built-ins available.
