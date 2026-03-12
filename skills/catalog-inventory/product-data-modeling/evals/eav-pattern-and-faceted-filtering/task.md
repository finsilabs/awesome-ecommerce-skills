# Home Goods Marketplace: Dynamic Attributes and Faceted Search

## Problem/Feature Description

HomeNest is a home goods marketplace that sells products across dozens of categories — furniture, bedding, kitchen appliances, lighting, and more. Each category has completely different relevant attributes: a mattress needs "Thread Count" and "Fill Material", a refrigerator needs "Capacity (liters)" and "Energy Rating", and a lamp needs "Bulb Type" and "Max Wattage". The product team needs a database design that allows the catalog team to add new attribute types for new product categories without requiring schema migrations every time.

The marketplace's primary shopping feature is a faceted filter sidebar that lets users narrow results by these category-specific attributes — e.g., filter mattresses to "Thread Count > 400" or filter refrigerators by "Energy Rating = A+++". Performance of these filter queries is critical because the catalog has grown to 80,000 products. The engineering team also needs guidance on which attributes should be pulled into denormalized structures for commonly-used filters vs. stored only in the flexible attribute system.

## Output Specification

Produce a file called `schema.sql` containing a PostgreSQL schema for:
- A products table and variant table (can be simplified/abbreviated)
- A complete dynamic attribute system capable of storing string, numeric, boolean, date, and enumerated values
- All indexes needed to support efficient attribute-based filtering

Produce a file called `queries.sql` with at least two example queries:
1. A query that fetches all products filtered by at least two specific attribute values simultaneously (e.g., filtering by material AND energy rating)
2. A query or SQL that demonstrates how to fetch products with a numeric attribute range filter

Produce a `design-notes.md` explaining:
- How the attribute type system works and which data types are supported
- How the schema distinguishes attributes used for filtering from those used for text search
- Trade-offs between full EAV normalization and denormalization into JSONB, with a recommendation
