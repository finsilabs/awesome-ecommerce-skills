# Attribution Model Engine

## Problem/Feature Description

A DTC ecommerce company is launching a marketing analytics platform and needs to move away from relying on last-click attribution. The analytics team has collected multi-channel touchpoint data for thousands of orders but currently has no way to compare how different attribution philosophies would allocate revenue credit across channels like paid search, paid social, and email.

The head of growth wants to evaluate several attribution approaches side by side to understand which channels are being over- or under-valued under their current last-click model. Specifically, they need an engine that can take an order and its associated touchpoint sequence and output how much revenue credit each touchpoint should receive, depending on which model is selected. The engine must handle edge cases (single touchpoint, two touchpoints) and must be defensible to the CFO — meaning the math must be provably correct.

## Output Specification

Implement the attribution model engine as a TypeScript module. The module should export:

1. A `computeWeights` function that, given a list of touchpoints and a model name, returns an array of fractional weights (one per touchpoint).
2. An `attributeConversion` function that takes an order (with `id` and `total`), a list of touchpoints, and a model name, and returns an `AttributedConversion` object containing per-touchpoint credit amounts and fractions.

Write the implementation to `attribution-engine.ts`.

Also write a `demo.ts` script that:
- Creates 3 sample orders with different touchpoint sequences (1 touchpoint, 2 touchpoints, 4+ touchpoints)
- Runs each order through all supported attribution models
- Prints the resulting weight arrays and credit amounts to the console in a readable format
- Verifies that weights sum to 1.0 (within floating-point tolerance) for each model/order combination and prints a summary of which checks passed

Run the demo with `npx ts-node demo.ts` and save the console output to `demo-output.txt`.
