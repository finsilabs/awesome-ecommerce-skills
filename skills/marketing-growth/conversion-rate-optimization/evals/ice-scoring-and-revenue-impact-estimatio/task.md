# CRO Experiment Prioritization and Business Case Tool

## Problem/Feature Description

Birchwood Home, an online home goods brand, has accumulated a backlog of 8 checkout improvement ideas over the past six months. The growth team has been arguing about which experiments to tackle first, with engineers pushing for the easiest wins and the CMO pushing for the biggest revenue impact. The VP of Growth wants to settle the debate with a data-driven prioritization framework that everyone can reference, and also needs a financial model to justify experiment investment to the board.

You have been asked to build a TypeScript prioritization module that scores each experiment in the backlog and ranks them objectively. The tool also needs to model the expected revenue impact of the top experiments so the team can quantify what is at stake. The team has also asked you to document a brief guidance note on responsible experiment management practices to accompany the tool.

The experiment ideas to include in the backlog are:
1. Allow checkout without mandatory account registration
2. Add Apple Pay and Google Pay buttons at the top of the checkout page
3. Show a "3 items left in stock" urgency message on the product page
4. Redesign the shipping address form to reduce the number of required fields
5. Add a progress bar showing the steps remaining in checkout
6. Show security trust badges and accepted payment logos next to the payment form
7. Send abandoned cart emails triggered 30 minutes after cart abandonment
8. Allow customers to save their cart across sessions without creating an account

For the financial model, use these site metrics: 180,000 monthly visitors, current CVR of 2.1%, average order value of $72.

## Output Specification

Produce the following files:

- `experiment-prioritizer.ts` — TypeScript module with the experiment data structures, scoring function, and revenue impact calculator. Include the full scored and ranked backlog as a constant, and demonstrate the revenue impact calculation for the top-ranked experiment.
- `experiment-guidance.md` — Brief guidance notes covering best practices for running this experiment program responsibly (concurrent test limits, how to determine when an experiment is ready to call, and what metrics to track alongside conversion rate).
