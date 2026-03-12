# Category System Foundation for a New Fashion Store

## Problem/Feature Description

A new online fashion retailer, StyleHive, is launching a web store that will eventually carry tens of thousands of products across a deep hierarchy of clothing, accessories, and footwear. The tech lead needs a solid foundation for the product category system before the first product import next week.

The store has a relatively complex taxonomy: top-level divisions (Clothing, Footwear, Accessories), then gender or age groups, then product type, and sometimes a style sub-type — so paths like "clothing > women > dresses > evening" are expected. Navigation needs to be fast and SEO-friendly from day one, and the team wants to avoid painful data-migration work later if the hierarchy is reorganized.

Your job is to design and implement the core data model and category library that the rest of the application will depend on. The engineering team has heard of several approaches to storing hierarchical data in a relational database and wants you to pick the right one and justify it briefly. They are using a Node.js/TypeScript stack with Prisma as the ORM.

## Output Specification

Produce the following files in your working directory:

1. `schema.prisma` (or `schema.sql`) — The Prisma schema (or SQL DDL) for the `Category` model, with all fields the team will need for navigation, sorting, SEO, and publishing workflow.
2. `lib/categories.js` (or `.ts`) — A module with at least:
   - A function to fetch a single category by slug (including breadcrumb data)
   - A function to retrieve the full published category tree
3. `DESIGN.md` — A short (1–2 page) design document explaining the chosen data storage approach, how breadcrumb retrieval works, and any constraints enforced in the schema.

You do not need to set up a real database connection — stub or comment out DB calls where needed, but make sure the logic and data structures are clearly shown.
