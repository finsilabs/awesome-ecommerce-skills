# Multi-Vendor Marketplace: Relationships, Collections, and Price Tracking

## Problem/Feature Description

TradeHub is a multi-vendor marketplace where independent sellers list products under their own brand. The platform has several requirements beyond a basic product catalog:

1. **Product discovery features**: The marketing team wants to implement "Frequently Bought Together", "You May Also Like", and "Complete the Look" sections on product pages. They also need to support bundled products (e.g., a camera sold together with a memory card and strap as a kit). These associations need to be stored in a structured, queryable way.

2. **Collections and merchandising**: The catalog team manages both manually curated collections ("Summer Sale") and automatically populated collections based on rules (e.g., "all products tagged 'organic' priced under $50"). Collections need to support different sort orders for display.

3. **Multi-vendor SKU management**: Each vendor manages their own SKUs, and the same SKU string (e.g., "BLK-M-001") may legitimately be used by multiple vendors. The current schema causes conflicts when two vendors try to register the same SKU.

4. **Regulatory compliance**: The finance team now requires a complete audit trail of all price changes, including when each price change occurred and what the previous price was, for financial reporting purposes.

## Output Specification

Produce a file called `schema.sql` with a complete PostgreSQL schema addressing all four requirements above (can include a simplified products/variants table or build on a prior schema).

Produce a `design-notes.md` explaining:
- The types of product relationships supported and how the schema enforces their validity
- How automated vs. manual collection rules are stored
- How SKU uniqueness is enforced in a multi-vendor context
- How the price audit trail works
