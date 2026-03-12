# Inventory Alert System — Core Data Layer

## Problem Description

A small e-commerce retailer has been managing stock levels manually, relying on a warehouse manager to scan a spreadsheet every morning and email suppliers when something looks low. This process breaks down over weekends and busy seasons, and the team has lost sales on several occasions because they ran out of a variant before anyone noticed.

The engineering team has been asked to build an automated stock monitoring system. The first milestone is the **core data layer**: the database models that track per-variant, per-location reorder configuration and the alerts that get fired when a threshold is breached. The second part of the milestone is a **background job** that scans all inventory levels, compares them against configured thresholds, and creates alert records as needed.

A critical requirement from the ops team is that the system must **not spam the same alert** for a variant that is already in an alerted state — if a low-stock alert for "Red T-Shirt / Medium / East Warehouse" was created yesterday and hasn't been addressed yet, the next job run should not create a duplicate. The system should only create a new alert once the previous one has been closed out.

## Output Specification

Produce the following files:

- `schema.js` — JavaScript object definitions (or equivalent data model) for the two tables needed: one for storing per-variant reorder configuration and one for tracking stock alerts. Include field names, types, and a brief comment on each field's purpose.
- `jobs/checkStockLevels.js` — The background job function that: fetches all inventory levels that have a reorder config, determines alert type and severity for each, and creates alert records while preventing duplicates.
- `DESIGN.md` — A short (1-2 page) design note explaining the deduplication strategy and how the system decides what type of alert to raise.
