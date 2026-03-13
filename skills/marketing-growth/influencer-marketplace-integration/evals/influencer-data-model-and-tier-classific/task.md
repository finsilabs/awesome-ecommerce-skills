# Influencer CRM TypeScript Module

## Problem/Feature Description

A lifestyle e-commerce startup is moving their influencer relationships out of a Google Sheet and into a proper system. They have about 80 creators across Instagram, TikTok, and YouTube — some are tiny accounts with under 5,000 followers, others have audiences pushing two million. The team needs a TypeScript module that defines how influencer data is stored and categorized so it can be used across their new backend.

The head of partnerships wants the system to correctly bucket each creator into a tier category based on their combined following. She also needs to track per-platform metrics separately since engagement benchmarks differ across Instagram, TikTok, and YouTube. Each creator should also have a lifecycle status so the team can filter by who they've already reached out to, who is currently active, and who should never be contacted again.

## Output Specification

Produce a TypeScript file called `influencer-crm.ts` that contains:

- A complete TypeScript interface or type for an influencer profile with all the relevant fields the partnerships team would need
- A function that accepts a total follower count and returns the appropriate influencer tier category
- A short demo block (can use a comment or `console.log`) that shows at least 4 sample influencers instantiated with the type, each in a different tier, with realistic data across platforms

Also produce a `design-notes.md` file (max 200 words) explaining the key design decisions made — particularly around how tiers are defined and what per-platform metrics are tracked.
