# Launch Email Sequences and Paid Social Configuration

## Problem/Feature Description

Meridian Apparel is launching a limited-edition capsule collection next month. Their engineering and growth team is building the automation layer for the launch — specifically the scheduled email sequences and the paid social campaign activation logic. They have an `emailQueue` (Bull/BullMQ queue with `.add()` supporting a delay option) and a `campaignScheduleQueue` for paid social, plus a `db` object with `products`, `waitlist`, and `orderLineItems`, `orders`, and `productReviews` collections.

The team needs well-structured TypeScript code covering: (a) an email scheduler that fires the right emails to the right segments at the right times relative to launch day, (b) a paid social campaign activator that schedules three distinct campaign tiers with the correct budgets and audience types, (c) a launch analytics function that collects key post-launch KPIs, and (d) a setup checklist in a separate markdown file covering the email deliverability steps the team must complete before launch day.

## Output Specification

Produce the following files:

- `launch-automation.ts` — TypeScript code containing:
  - `scheduleLaunchEmails(productId: string, launchDate: Date)` — schedules all launch-related emails
  - `activateLaunchCampaigns(productId: string, launchTimestamp: number)` — schedules paid social campaign activation
  - `getLaunchMetrics(productId: string, launchDate: Date)` — returns launch KPIs

- `pre-launch-checklist.md` — a checklist of email deliverability and operational steps the team must complete before launch day, including any timing requirements and technical setup items
