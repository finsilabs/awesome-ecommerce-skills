# Lifecycle Email Flow Triggers

## Problem/Feature Description

Harbour & Lane is a home goods e-commerce company that has just finished building a BullMQ-based email queue infrastructure. Now they need to implement the actual trigger functions that feed events into that queue. Their CRM team has outlined four lifecycle moments they care about: new customer signup, order completion, customers who haven't bought in a while, and customers who viewed products without purchasing.

The engineering lead wants each trigger function to schedule the right number of email steps at the right time intervals — no more, no less. She is particularly concerned about two failure modes they have seen with competitors: (1) customers receiving a "we miss you" email the day after placing an order because the win-back job wasn't cancelled, and (2) customers receiving a flood of emails because a duplicate webhook fired the same trigger twice. The implementation must handle both cases correctly.

The company runs at international scale, so the win-back campaign needs to run on a schedule that catches up with lapsed customers systematically.

## Output Specification

Produce the following TypeScript source files. Assume a `scheduleEmail(event, delayMs)` helper and an `emailQueue` BullMQ Queue instance are already available (import them from `./email-queue`).

- `src/flows/welcome.ts` — exports `triggerWelcomeSeries(customer)`
- `src/flows/post-purchase.ts` — exports `triggerPostPurchaseFlow(order)`
- `src/flows/win-back.ts` — exports `enqueueWinBackCandidates()` with the nightly cron comment
- `src/flows/cancellation.ts` — exports handlers for the conversion and browsing events that cancel competing flows

Types can be stubbed inline (e.g., `interface Customer { id: string; email: string; firstName: string; welcomeCode: string; }`). Database calls can be stubs with TODO comments. Focus on the scheduling logic and timing.
