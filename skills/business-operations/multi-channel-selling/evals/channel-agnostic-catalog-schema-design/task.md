# Unified Multi-Channel Catalog Database Schema

## Problem/Feature Description

Finboard is a growing consumer electronics brand that currently sells exclusively through their own website. After a strong holiday season, their growth team has secured approval to expand to Amazon US and Walmart Marketplace. Their existing product table is tightly coupled to their DTC storefront — it stores a single price, a single product description, and has no concept of per-channel availability or external marketplace identifiers.

The engineering team needs to design a new PostgreSQL schema that will serve as the backbone for unified catalog and inventory management across all three channels. The schema must allow them to maintain a single authoritative product record internally while supporting channel-specific pricing, titles, and stock availability. It also needs to track inventory in a way that prevents overselling when orders arrive from multiple channels simultaneously. The schema will be used as the foundation before any application code is written.

## Output Specification

Produce a single SQL file named `schema.sql` containing all `CREATE TABLE` statements for the complete multi-channel catalog and inventory schema. Include all constraints, indexes, and default values.

Also produce a `notes.md` file with brief explanations of any non-obvious design decisions in your schema, including your approach to storing monetary values, how inventory state is shared across channels, and how you've guarded against data integrity issues at the database level.
