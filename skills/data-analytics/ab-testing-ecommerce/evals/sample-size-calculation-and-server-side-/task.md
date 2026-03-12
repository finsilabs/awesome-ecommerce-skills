# Experiment Framework: Core Assignment Engine

## Problem/Feature Description

The growth team at a mid-size e-commerce company wants to start running controlled experiments on their Node.js/Express storefront but has no experimentation infrastructure in place. They've been making product changes based on gut feel and want to move to data-driven decisions. The engineering lead has asked you to build the foundational experiment engine that will power all future tests.

The team's primary concern is accuracy: in the past, third-party A/B tools caused pricing "flicker" on the page and were blocked by some customers' ad blockers, which skewed results. They need a TypeScript implementation that lives entirely in their backend.

Before any test goes live, the team lead requires a way to know how many users are needed to run the experiment for meaningful results, given the current checkout conversion rate of 3.1% and a desire to detect improvements of at least 0.4 percentage points. The team runs tests at 80% statistical power and a 5% significance level.

## Output Specification

Produce a single TypeScript file called `experiment-engine.ts` that contains:

1. A `calculateRequiredSampleSize` function that takes baseline conversion rate, minimum detectable effect, statistical power, and significance level as parameters and returns the per-variant sample size.
2. An `assignVariant` function that deterministically assigns a user to a variant given an experiment ID and user ID. The assignment must be stable — the same user must always get the same variant for a given experiment.
3. An Express middleware function that reads active experiments and attaches each experiment's variant assignment to the request context, using the customer's stable identity.
4. A brief `README.md` explaining the design decisions and how to use the two key functions, including an example call to `calculateRequiredSampleSize` with the parameters described above and its output.
