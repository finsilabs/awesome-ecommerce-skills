# Valentine's Day Campaign Setup

## Problem/Feature Description

Botanica & Bloom, an online florist and gifting brand, runs Valentine's Day as their biggest revenue event of the year — often accounting for 40% of Q1 sales. For the past three years the marketing team has built the campaign from scratch each February: writing briefs, manually scheduling emails, and negotiating discount levels at the last minute. Last year, a key email went out a day late because a team member was ill, and a promotional code continued to work for two weeks after the sale ended because no one remembered to deactivate it.

The CTO has asked for a TypeScript-based campaign configuration system that can be reused each year. You have been brought in to implement the initial campaign definition and email sequence for Valentine's Day 2027 (the sale runs February 12–16, 2027). The company wants a 20% sitewide discount, a multi-step email warm-up starting three weeks out, and targeting rules that differentiate between their VIP loyalty members, lapsed customers who haven't ordered in 12 months, and general subscribers.

## Output Specification

Produce a TypeScript file named `campaign.ts` that contains:
- The type/interface definitions needed to represent the campaign and its email steps
- A fully populated Valentine's Day 2027 campaign object using those types
- The email cadence should include at least 5 steps spanning from 3 weeks before to the last day of the sale
- A brief `planning-notes.md` explaining key decisions around audience segmentation strategy and campaign timeline

The TypeScript file should be self-contained (no external imports needed beyond type definitions) and should compile without errors if types are used correctly.
