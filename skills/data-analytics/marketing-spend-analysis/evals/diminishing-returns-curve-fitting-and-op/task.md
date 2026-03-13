# Meta Ads Scaling Analysis

## Problem Description

A DTC skincare brand has been scaling their Meta advertising budget aggressively over the past six months. Each week they increased spend slightly and tracked how much attributed revenue came back. Now the growth team is debating whether to push spend up another 30% this quarter or hold steady — the CEO wants data to back up the decision.

The analytics lead has compiled weekly snapshots of Meta spend and the revenue attributed to it by their internal model. She suspects they may be hitting diminishing returns but can't quantify it, and needs to present a concrete recommendation with supporting numbers at the next board meeting.

Your job is to write a Python analysis script that models the relationship between spend and revenue, determines where the channel sits on the efficiency curve today, and produces a clear spend recommendation.

## Output Specification

Write a Python script named `scaling_analysis.py` that:
1. Loads the data below as hard-coded inputs
2. Fits a curve to the spend vs. revenue relationship
3. Computes current efficiency and the theoretically optimal spend level
4. Outputs a recommendation (reduce / maintain / increase) with supporting numbers
5. Saves results to `scaling_output.json`

Run with: `python scaling_analysis.py`

## Input Data

The following 24 weeks of Meta spend and first-party attributed revenue data should be used as input (already in USD):

| Week | Spend ($) | Revenue ($) |
|------|-----------|-------------|
| 1    | 15000     | 48200       |
| 2    | 17500     | 54600       |
| 3    | 20000     | 60100       |
| 4    | 22000     | 64300       |
| 5    | 25000     | 69800       |
| 6    | 28000     | 74200       |
| 7    | 30000     | 77100       |
| 8    | 33000     | 80500       |
| 9    | 36000     | 83200       |
| 10   | 38000     | 85100       |
| 11   | 40000     | 86600       |
| 12   | 43000     | 88200       |
| 13   | 45000     | 89500       |
| 14   | 47000     | 90400       |
| 15   | 50000     | 91800       |
| 16   | 52000     | 92500       |
| 17   | 55000     | 93400       |
| 18   | 57000     | 94000       |
| 19   | 60000     | 94800       |
| 20   | 62000     | 95200       |
| 21   | 65000     | 95800       |
| 22   | 67000     | 96100       |
| 23   | 70000     | 96600       |
| 24   | 72000     | 96900       |
