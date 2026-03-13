# Profitability Database Setup for a DTC Brand

## Problem / Feature Description

A direct-to-consumer apparel brand has been tracking sales and costs in spreadsheets across several people and has finally decided to migrate everything into a proper database. They sell across three channels — their own website, Amazon, and a wholesale portal — and carry roughly 80 SKUs across four product categories.

The finance team needs a SQL schema that lets them load monthly sales and cost data per SKU per channel and immediately query things like "what is our gross margin by category this month?" or "how has profitability per sale changed over the last year, after accounting for all variable costs?". The schema should handle all the relevant cost components — from product cost through to marketing and overhead — and should make it easy to run margin queries without repeating the margin formulas everywhere.

The head of finance has asked you to design and implement the database schema, including any views or derived columns that will simplify downstream analysis. The schema should reflect the full cost waterfall used in ecommerce profitability analysis, covering every layer of cost from gross revenue all the way down to profit after overhead.

## Output Specification

Produce a single SQL file named `profitability_schema.sql` containing:

- The main fact table definition with all required columns
- A view (or views) that compute margin percentages for use in analysis queries
- Two or three example `SELECT` queries demonstrating how a user would query gross margin by category and profitability by channel for a given period

The SQL should run without errors on PostgreSQL 15+. Include brief inline comments explaining what each section does.
