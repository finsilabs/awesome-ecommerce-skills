# Conversion Funnel and Trend Report

## Problem/Feature Description

The growth team at Meridian Retail wants to understand how effectively their website converts visitors into buyers, and whether that efficiency is improving or declining week over week. They have two tables: `sessions` (one row per website visit, with a boolean `is_new_visitor` column and a `started_at` timestamp) and `orders` (with a `session_id` foreign key, a `status` column, and a `created_at` timestamp). Sessions without a matching order represent non-converting visits.

The team wants a TypeScript module that can be called with any arbitrary date range and return a conversion funnel report for that period alongside an equivalent comparison to the immediately preceding period of the same length. The analyst using this wants to know: how many sessions occurred, how many resulted in purchases, what the conversion rate was, and how the new-visitor vs. returning-visitor breakdown looked. They also want to know immediately how all those numbers shifted compared to the prior period.

## Output Specification

Produce the following files:

1. `conversion-query.sql` — A PostgreSQL SQL query that computes the conversion rate and visitor segmentation for a given date range, using named parameters `:start_date` and `:end_date`.
2. `conversion-report.ts` — A TypeScript function `getConversionReport(currentStart: Date, currentEnd: Date)` that:
   - Fetches the conversion data for the current period
   - Determines the prior period (same length, immediately preceding) and fetches that too
   - Returns an object containing current metrics, prior metrics, and percentage-change values for each metric
3. `report-notes.md` — A short document (max 200 words) noting any important design decisions made in the query or TypeScript code.

Assume a database query function `db.query(sql, params)` is available.
