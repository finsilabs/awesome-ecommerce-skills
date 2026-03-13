# Customer Profile System for a Fashion E-Commerce Platform

## Problem/Feature Description

StyleNest is a mid-sized fashion e-commerce brand that has been running for three years. Their marketing team is struggling with three related problems: their paid ad performance has dropped significantly due to iOS and browser tracking changes, their email campaigns are untargeted (same newsletter to everyone), and their product recommendation engine returns generic results because it has no customer preference data to work with.

The engineering team has been asked to build the foundational data layer for a first-party data strategy. This means designing a customer profile schema that captures both what customers tell you (declared/zero-party data) and what you observe from their behavior, along with an incremental data collection system that asks customers for information progressively rather than overwhelming them with a long form.

The head of engineering wants a TypeScript implementation with two things: (1) a `CustomerProfile` interface that properly captures all relevant preference, behavioral, and consent fields, and (2) a progressive profiling module that determines what to ask next and computes how complete a customer's profile is. The system should be designed so it can later be connected to a preference center and quiz, but for this task just produce the schema and profiling logic.

## Output Specification

Produce the following TypeScript files in your working directory:

- `customer-profile.ts` — the `CustomerProfile` interface and any supporting type definitions
- `progressive-profiling.ts` — the `getNextProfileQuestion` function, the `PROFILE_QUESTIONS` configuration array, and the `computeProfileCompleteness` function
- `README.md` — a short explanation of the schema design decisions, especially around privacy fields and what drives the profile completeness score

The README should document:
- Which fields contribute to the profile completeness score
- The list of trigger events used for progressive profiling questions (in order)
- The rationale for any privacy-sensitive field design choices
