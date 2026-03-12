# Price Experiment Results Analyzer

## Problem/Feature Description

A growth engineering team has been running a series of price tests over the past quarter and needs a standalone TypeScript module to analyze the accumulated data. The results dashboard currently just shows raw counts but the team needs statistically rigorous analysis so they can tell whether one price variant is genuinely outperforming another, rather than just looking better by chance.

The analytics lead has stressed that the module must enforce proper statistical discipline — the team has been burned before by acting on early results that later reversed. There is also a concern that a variant with a higher conversion rate might not actually be the better business outcome, so the analysis needs to surface more than just conversion numbers.

## Output Specification

Produce the following files:

1. `analysis.ts` — A TypeScript module exporting:
   - A function `calculateSignificance(controlConversions, controlImpressions, treatmentConversions, treatmentImpressions)` that returns a statistical test result with at least `zScore`, `pValue`, and `significant` fields.
   - A function `getExperimentResults(experimentId: string)` that retrieves variant data and returns enriched results per variant.
   - A function `isReadyToConclude(variant: object, pValue: number)` that returns true only when the experiment meets minimum requirements to be acted upon.
   - A helper function implementing an approximation for the standard normal CDF (do not use an external statistics library).

2. `analysis.test.ts` — A set of TypeScript test cases (plain assertions or any test framework) that demonstrate the significance calculation working correctly on some sample data. Include at least one case that should be significant and one that should not.

Assume a `db` object is available with `db.priceExperimentVariants.findByExperiment(experimentId)`.
