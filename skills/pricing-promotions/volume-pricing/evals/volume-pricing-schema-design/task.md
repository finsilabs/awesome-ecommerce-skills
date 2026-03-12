# B2B Wholesale Platform: Volume Pricing Database Schema

## Problem/Feature Description

A mid-sized industrial supply company is launching a new B2B e-commerce platform. They sell to three customer segments: retail consumers, wholesale resellers, and distributors. Each segment negotiates different pricing, and the company wants a system where wholesale and distributor accounts can be assigned dedicated price lists that override standard pricing — while all customers can still benefit from quantity breaks (e.g., buying 10 units gets a cheaper unit price than buying 1).

The engineering team needs a PostgreSQL schema to power this pricing system. The schema must handle: product-level quantity tiers, category-level tiers, customer-group-specific overrides, and named price lists for B2B accounts. The ops team has already confirmed that the `products` and `categories` tables exist.

## Output Specification

Produce a file `schema.sql` containing the complete PostgreSQL DDL (CREATE TABLE and CREATE INDEX statements) for the volume pricing and B2B price list system.

Also produce a short `notes.md` explaining any design decisions made (e.g., column types, nullable fields, indexing strategy).
