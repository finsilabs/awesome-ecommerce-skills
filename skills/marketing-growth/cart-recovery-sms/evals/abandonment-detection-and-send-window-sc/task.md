# SMS Cart Recovery Sequence Scheduler

## Problem/Feature Description

A fashion e-commerce brand has built out its SMS consent layer and is now ready to implement the core cart recovery engine. The operations team wants a backend service that detects when shoppers have walked away from their checkout and automatically queues a timed sequence of recovery messages. They're especially worried about two failure modes from their previous email recovery system: messages arriving in the middle of the night (which generated a wave of complaints from customers in different time zones), and the same customer receiving duplicate messages after a service restart.

The brand's head of growth has specified that only carts with meaningful order value should qualify — low-value carts don't justify the cost or the opt-out risk. The sequence should be limited in length to avoid feeling like spam, and each step should fire at a specific interval after abandonment. The engineering lead wants the scheduler to use a persistent job queue so messages survive restarts, with automatic retry on transient failures.

## Output Specification

Produce the following files:

- `src/jobs/detectAbandonedCarts.ts` — the function that identifies newly abandoned carts and enqueues recovery sequences
- `src/jobs/sendRecoverySms.ts` — the function that executes a single step of the recovery sequence
- `src/lib/sendWindow.ts` — the quiet-hours utility that determines whether it is currently safe to send to a given phone number
- `src/config/recoverySchedule.ts` — the sequence configuration (steps, delays, types)
- `DESIGN.md` — a short document explaining: (1) the abandonment time threshold chosen, (2) the cron frequency for detection, (3) how the system avoids sending duplicate messages

All TypeScript files should be syntactically valid. No actual SMS sending or database connection is required — stubs or mock calls are fine.
