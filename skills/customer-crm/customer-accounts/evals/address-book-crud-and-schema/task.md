# Customer Address Book

## Problem/Feature Description

A global e-commerce platform is adding a saved-address feature to their customer accounts. Customers frequently abandon checkout because they have to re-enter their shipping details every time — the business wants to let customers save multiple addresses and have their preferred one pre-fill the checkout form automatically.

The platform has customers in the US, UK, Australia, Japan, and several other countries where postal address formats differ significantly. The engineering team has been burned before by an address system that rejected valid addresses from customers in countries like Hong Kong (no state/province) and broke the checkout for those users. The solution must handle international addresses gracefully.

Your task is to implement the address book feature: the SQL schema for storing addresses and the Express/TypeScript API endpoints for listing, adding, updating, and deleting customer addresses. The system must intelligently manage which address is the "default" so that checkout can always pre-fill from a single well-defined source of truth.

## Output Specification

Produce two files:

1. `schema.sql` — the SQL DDL for the customer addresses table (you may include a stub customers table as context if needed)
2. `addresses.ts` — TypeScript Express handler functions for:
   - `GET /api/customers/me/addresses`
   - `POST /api/customers/me/addresses`
   - `PUT /api/customers/me/addresses/:id`
   - `DELETE /api/customers/me/addresses/:id`

You may stub database calls with placeholder functions. Focus on the logic for default-address management and request validation. Include type definitions for the address shape.
