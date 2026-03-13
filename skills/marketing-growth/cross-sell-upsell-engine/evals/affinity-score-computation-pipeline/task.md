# Nightly Product Affinity Computation Job

## Problem/Feature Description

A mid-size outdoor equipment retailer has accumulated three years of order data across 8,000+ SKUs. Their current recommendation system uses simple category matching ("other products in Camping > Tents"), which drives poor click-through rates because it surfaces duplicates and irrelevant items. The analytics team has identified that customers who buy tent poles almost always buy tent stakes and groundsheets — but the system never surfaces these connections.

The engineering team wants to replace the category-matching approach with a data-driven affinity computation job. This job will process completed orders from the database, calculate which product pairs appear together frequently beyond what random chance would predict, and write the resulting scores back to a `product_affinities` table for the recommendation API to query. The job must be designed to run unattended on a schedule and produce reliable signal — meaning it needs to handle noise from low-volume pairs and avoid distorted scores introduced by wholesale/bulk purchase orders.

## Output Specification

Write a self-contained TypeScript module `affinity-job.ts` that implements the full affinity computation pipeline. The module should export the main computation function and include inline comments explaining the algorithm.

Also produce a short `design-notes.md` explaining:
- How the affinity score is calculated (the formula used)
- What filtering is applied to orders before processing
- Why a minimum co-purchase count is required before a pair is recorded
- How the job is intended to be scheduled
