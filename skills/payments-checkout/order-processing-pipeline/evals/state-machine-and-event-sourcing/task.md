# Order Status Management Module

## Problem Description

A growing online marketplace is experiencing order status corruption: orders are being marked as shipped before payment is confirmed, refunded orders are being re-processed, and customer support can't trace when or how an order reached a given state. The engineering team needs a reliable JavaScript module to manage the order lifecycle from placement through delivery.

The module must prevent invalid status changes (a refunded order should never become "shipped", for example), record a complete history of every status change for audit and debugging purposes, and capture when each milestone was reached so SLA reporting is possible.

The system uses a Prisma-like ORM accessed via a `db` object (you can assume it is available in scope). The relevant database tables are `orders` (with at minimum `id` and `status` columns) and `orderEvents`. You do not need to produce a working database connection — stub or mock `db` calls as needed.

## Output Specification

Produce a JavaScript implementation in a `lib/` directory that includes:

1. A state machine module defining all supported order states and the transitions that are legally permitted between them.
2. A transition function module that enforces those rules when updating an order, stores a timestamped status milestone on the order record, and appends an audit event to the event log inside a single atomic operation.

Also produce a `test-transitions.js` script at the project root that exercises the implementation: demonstrate at least one successful transition path, and show what happens when an illegal transition is attempted. The script should `console.log` its results so output is visible.
