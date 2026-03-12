# Email Automation Core Infrastructure

## Problem/Feature Description

Florette, a mid-sized DTC skincare brand, is migrating away from its ESP's built-in automation builder into custom code so the engineering team has full control over timing, suppression logic, and analytics. The platform lead wants a typed TypeScript module that models all triggered email flows through a single, uniform event structure and a queue-based scheduler. The goal is to have one consistent "shape" that every flow (welcome series, post-purchase, win-back, browse abandonment) sends through — making it easy to add new flows or change ESP providers in the future.

The existing codebase already handles order management and customer records, but has no email automation infrastructure at all. The team wants to start from scratch with best practices around deduplication (preventing duplicate sends if a webhook fires twice), daily frequency caps (customers should not be overwhelmed), and a clean worker pattern that enforces suppression checks centrally.

## Output Specification

Produce the following TypeScript source files:

- `src/email-types.ts` — defines the EmailEvent type/interface and any supporting types
- `src/email-queue.ts` — sets up the queue, exports a `scheduleEmail` function, and creates the BullMQ worker that processes and sends emails (include a stub `renderTemplate` and `getSubject` function — they don't need real implementations)
- `src/email-worker.ts` OR integrate the worker into `email-queue.ts` if preferred

The files should be production-ready TypeScript stubs: correct types, proper imports, and documented logic — but external calls (DB, ESP API) can be stubbed with TODO comments.

Do not use `setTimeout` or `setInterval` for scheduling — use a proper job queue.
