# Login Protection Module

## Problem/Feature Description

A mid-sized e-commerce platform is observing a surge in failed login attempts across thousands of customer accounts over the past week. The security team suspects a coordinated credential stuffing campaign where attackers are using leaked credential lists from other data breaches. The system currently has no protection beyond a simple password check, and the database is being hammered by login requests.

The engineering team needs a dedicated login protection module for the existing Next.js application. The module should slow down and block malicious actors while keeping the experience smooth for legitimate customers who occasionally mistype their password. The team has already approved use of Upstash (Redis-backed) for rate limiting infrastructure.

## Output Specification

Produce the following files:

- `lib/auth/login-protection.ts` — the protection module containing rate limiting and delay logic as TypeScript source
- `lib/auth/login-protection.test.ts` — unit tests (or integration tests) that verify the behavior of the module, demonstrating the rate limit thresholds and progressive delay values

The TypeScript file should be fully compilable and runnable in a Node.js/Next.js environment. Add a short `README.md` explaining the module's design decisions and the thresholds chosen.
