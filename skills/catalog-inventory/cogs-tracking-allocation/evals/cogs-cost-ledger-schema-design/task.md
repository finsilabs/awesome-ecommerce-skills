# Perpetual Inventory Cost Tracking — Database Schema

## Problem/Feature Description

A mid-sized online retailer is replacing their end-of-year spreadsheet inventory count with a real-time perpetual inventory cost system. They sell hundreds of SKUs across multiple product variants and warehouse locations. Some goods are imported internationally, so the total cost of a unit includes not just the purchase price but also freight, insurance, customs, and duties that arrive on separate invoices.

The finance team has three requirements. First, they want to be able to trace which purchase lots were consumed when any order ships, using the costing method of their choice (FIFO, LIFO, or weighted average). Second, they need to record the landed costs associated with each inbound shipment and spread those costs across the received inventory. Third, they want to run variance reports each month comparing what units actually cost against the budgeted standard costs they set at the start of the year.

Your job is to produce the SQL migration that creates the full schema for this system. The schema must support all these use cases and enforce valid states through the database itself.

## Output Specification

Produce a single SQL file named `schema.sql` containing all table definitions. Include comments explaining the purpose of key columns where the naming alone might be ambiguous. Do not include seed data or application logic — just the table definitions.
