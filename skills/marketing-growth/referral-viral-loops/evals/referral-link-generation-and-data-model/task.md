# Launch a Customer Referral Program

## Problem/Feature Description

Nora Foods is a direct-to-consumer snack brand that has grown mainly through paid social ads, but CAC has been creeping up quarter over quarter. The growth team has noticed that a significant portion of customers mention they "heard about Nora from a friend" in post-purchase surveys — yet there's no mechanism to track or reward these organic referrals. The VP of Growth wants to formalize this into a structured referral program that gives both the person who refers *and* the person who is referred an incentive to participate, with the goal of turning happy customers into a reliable acquisition channel.

The engineering team needs to build the core TypeScript module for this program. They need proper data models for the program configuration and the referral links themselves, plus a function to generate a referral link for a given customer. The referral links should be memorable and shareable (not random hashes), and each customer should always get the same link rather than accumulating duplicates. Links need to include tracking parameters so the marketing analytics platform can attribute traffic correctly.

## Output Specification

Produce a TypeScript file `referral.ts` that contains:
- Type definitions / interfaces for the referral program and its components
- A `generateReferralLink(customerId, programId)` function
- A short usage example or inline comment showing what a typical program configuration looks like

Also produce a `referral-design.md` explaining the key design decisions made (2–4 bullet points).

Assume a `db` object is available with the same shape shown in typical ORM-style code (e.g., `db.referralLinks.findOne`, `db.referralLinks.create`). Assume `createShortLink(longUrl, slug)` is available. Assume `process.env.STORE_URL` contains the base store URL.
