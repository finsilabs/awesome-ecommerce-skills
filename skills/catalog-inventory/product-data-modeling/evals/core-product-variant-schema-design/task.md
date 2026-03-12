# Fashion E-Commerce Platform: Product Catalog Schema

## Problem/Feature Description

A growing fashion startup, StyleForge, is building a new e-commerce platform from scratch. Their engineering team needs a robust PostgreSQL database schema for the product catalog. StyleForge sells clothing and accessories with multiple variations — a single jacket may come in four colors and three sizes, each combination tracked separately for inventory. Their catalog also needs to support product images that can be associated with specific color variants so shoppers see the right photo when selecting "Red" vs "Blue."

The team has been burned before by subtle bugs in their legacy system where prices sometimes displayed incorrectly due to floating-point representation issues. They also want clean, shareable product URLs and a way to manage product lifecycle states so catalog staff can work on products internally before they go live, and retire products gracefully rather than deleting them. Products should be deletable without corrupting their order history, and the schema should be designed so catalog listing queries for active products are fast even as the catalog grows to hundreds of thousands of items.

## Output Specification

Produce a file called `schema.sql` containing a complete PostgreSQL schema with:
- All `CREATE TABLE` statements for a product catalog (products, variants, options, images, and any supporting tables)
- All relevant indexes
- Brief SQL comments explaining key design decisions

Also produce a short `design-notes.md` explaining:
- How prices are stored and why
- How product lifecycle states are managed
- How product URLs are structured
- How images are associated with variants
- What happens to related records when a product is deleted
