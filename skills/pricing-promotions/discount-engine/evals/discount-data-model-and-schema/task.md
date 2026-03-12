# Promotions System: Data Model Design

## Problem/Feature Description

A mid-size fashion retailer is expanding their e-commerce platform and needs a robust promotions module. Their merchandising team wants to run a variety of campaigns: percentage-off sales, flat-dollar coupons, buy-one-get-one offers on selected products, and free shipping thresholds. The engineering team has been asked to design the foundational data layer before any UI or business logic is built.

The data model must support both automatically applied promotions (such as a sitewide sale that activates during a flash sale window) and merchant-issued coupon codes that customers enter at checkout. It also needs to track how many times each discount has been used, and support per-customer limits to prevent abuse. The team plans to use PostgreSQL for persistence.

## Output Specification

Produce the following files in your working directory:

1. `discount-model.ts` — TypeScript type definitions for the discount system, including the core discount entity and any supporting interfaces (e.g., for cart context, line items, and condition types).
2. `schema.sql` — PostgreSQL DDL to create the tables and indexes needed to persist discounts and track their usage.
3. `design-notes.md` — A brief document (bullet points are fine) explaining key decisions made in the data model, especially around monetary representation, code handling, and how automatic vs. coupon discounts are distinguished.
