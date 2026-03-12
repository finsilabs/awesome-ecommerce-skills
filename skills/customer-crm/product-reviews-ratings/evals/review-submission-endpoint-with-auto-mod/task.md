# Customer Review Submission and Moderation System

## Problem/Feature Description

An e-commerce startup is building a review system from scratch after migrating away from a third-party review platform. They need an API backend that handles review submissions from customers and gives the operations team the tools to moderate content before it goes live. The team has been burned before by fake reviews flooding their old system, so spam prevention and verified-purchase authenticity are top priorities.

The backend engineer has been asked to design and implement two parts: first, a customer-facing endpoint that accepts review submissions (triggered from post-purchase emails) and applies automatic content moderation, and second, an admin-facing API for the operations team to manually review flagged content. The solution should be written as TypeScript code that documents the intended behavior clearly enough that the rest of the team can implement the database layer.

## Output Specification

Write the solution as TypeScript (`.ts`) files:

1. **`types.ts`** — TypeScript interfaces/types for the review data model and rating summary model.

2. **`review-submission.ts`** — The review submission handler. Include stub implementations for external dependencies (token verification, spam checking, profanity checking, database operations) as comments or simple mocks so the logic flow is clear.

3. **`moderation.ts`** — The admin moderation handlers: listing pending reviews (with pagination) and performing a moderation action on a single review.

4. **`README.md`** — A short explanation (1–2 paragraphs) of the moderation status flow: when reviews get auto-approved vs. sent to the queue vs. marked as spam, and what happens to the rating summary when a review is moderated.

The README should be written as real technical documentation (not a test description).
