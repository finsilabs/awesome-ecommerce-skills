# Waitlist Signup System for Product Pre-Launch

## Problem/Feature Description

A direct-to-consumer skincare brand, Luminary Beauty, is preparing to launch its first-ever SPF-serum hybrid next quarter. The marketing team has run successful campaigns before but has never built a structured waitlist system — customers used to simply "follow us for updates." This time, the team wants a proper waitlist mechanic: customers can sign up, receive a confirmation, see their position in line, and the most loyal customers should automatically get a head start on purchasing before the general public.

The engineering team has a TypeScript/Node.js backend with a `db` object (with `waitlist`, `customers`, and `products` collections), a `sendEmail` function, and a `sendBatchEmail` function already available. They need you to implement the waitlist signup logic and the function that grants early purchase access to top-tier loyalty members ahead of the public launch.

## Output Specification

Produce a TypeScript file named `waitlist.ts` containing:

1. A `WaitlistEntry` interface capturing all relevant fields for a waitlist record
2. A `joinWaitlist` async function that handles new signups
3. A `grantEarlyAccess` async function that marks eligible customers for early access and notifies them

Assume the following are available as imports: `db`, `sendEmail`, `sendBatchEmail`, `addHours` — you do not need to implement them.

Also produce a brief `implementation-notes.md` explaining any key design decisions you made, particularly around how the early access page should be secured and how the early access timing works relative to the public launch.
