# Implement Collection Product Ranking with Merchandising Overrides

## Problem/Feature Description

A home goods retailer runs a flagship "Living Room" collection page that drives 30% of their revenue. Their merchandising manager needs fine-grained control over how products appear: certain high-margin items should be promoted to the front, clearance items should be pushed to the back, and a few key hero products must always appear at specific positions (e.g., their new sofa launch always at slot 1 for the next two weeks).

The engineering team needs to implement the collection ranking module that takes a pre-scored list of products, applies configurable boost/bury rules, and then applies manual placement overrides. The system should correctly handle products being excluded (e.g., discontinued items), products being pinned to specific positions, and the ordering of all remaining products by score after overrides are applied.

## Output Specification

Implement the collection ranking pipeline in `collection_ranker.ts` (or equivalent language). The implementation should:

1. Accept a list of products with scores, a list of boost/bury rules (each with conditions and a value), and a list of manual overrides (pin/bury/exclude)
2. Apply the boost/bury rules to adjust scores
3. Apply manual overrides (exclusions and pins)
4. Return products in final ranked order with each product's final score and a flag indicating whether it is pinned

Save a demonstration script to `ranking_demo.ts` (or equivalent) that:
- Creates a sample set of 8 products with scores and varied tags/attributes
- Defines at least 2 boost/bury rules (e.g., boost "new-arrival" tag, bury "clearance" tag)
- Defines at least 2 manual overrides (pin one product to position 1, exclude one discontinued product)
- Runs the full pipeline and prints the final ordered list with scores and pin status

Run the demo and save the output to `ranking_output.txt`.
