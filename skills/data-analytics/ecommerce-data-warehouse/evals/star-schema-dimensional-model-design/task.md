# Analytics Warehouse Schema for GreenLeaf Commerce

## Problem/Feature Description

GreenLeaf Commerce is a mid-sized online retailer that sells organic gardening products. Their engineering team has been storing all transactional data in an operational PostgreSQL database, and the data analysts are struggling to run reporting queries directly on it — they're causing performance issues and the schema isn't optimized for aggregations.

The analytics team has decided to build a dedicated data warehouse. They need SQL DDL definitions for a star schema that will power their reporting dashboards. The warehouse needs to handle order analysis, product performance, customer segmentation, and time-based trending. They want the schema to support historical tracking of product price changes and customer segment changes over time, so reports can reflect what was true at the time of each transaction rather than current values.

The team also needs a separate aggregate table that their executive dashboards can query quickly without scanning the full order line detail. Their BI tool expects a consistent monetary format, so they want all money fields documented with a clear convention.

## Output Specification

Produce a single SQL file `schema.sql` containing:
- All dimension table definitions (at minimum: date, customer, product, and channel dimensions)
- All fact table definitions (at minimum: a line-item fact and a daily aggregate fact)
- Comments explaining the grain of each fact table and the monetary value convention used

Also produce a short `design-notes.md` file explaining key design decisions made, including how historical changes are handled and how dates are keyed.
