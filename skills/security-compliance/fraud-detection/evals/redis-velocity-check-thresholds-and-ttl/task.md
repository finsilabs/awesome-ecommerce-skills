# Checkout Velocity Guard Module

## Problem/Feature Description

An online marketplace selling consumer electronics has been experiencing a wave of card-testing attacks and coordinated fraud attempts during flash sales. The engineering team has noticed that the existing payment processor's built-in fraud tools are not enough — attackers are rotating IP addresses but reusing the same card numbers across many freshly created accounts, and some are also spending heavily on a single card before it gets reported.

The team wants a standalone TypeScript module that can be dropped into the checkout API to perform velocity checks before any payment is attempted. The module should track order attempts per IP address, per email address, per card fingerprint (counting distinct account usage), and total spend per card — all backed by Redis so it works across multiple API server instances. It must also record successful transactions so that the running spend total stays accurate.

## Output Specification

Produce a single TypeScript file named `velocity.ts` that exports:
- A `checkVelocity` function accepting `{ email, ip, cardFingerprint, amount }` and returning `{ allowed: boolean; reason?: string }`
- A `recordSuccessfulTransaction` function accepting `(cardFingerprint: string, amount: number)`

Also produce a short `notes.md` explaining the key design decisions — in particular, any limits used, how Redis keys are structured, and how expiry is handled.

Do not install or run anything; the deliverable is source code only.
