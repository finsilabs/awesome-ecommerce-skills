# Gift Card Database Schema for Sprout Home & Garden

## Problem Description

Sprout Home & Garden is a mid-sized e-commerce retailer preparing to launch a digital gift card product ahead of the holiday season. The platform is built on PostgreSQL. The engineering team has been tasked with designing the persistence layer for gift cards before the rest of the feature is implemented.

The product requirements are as follows: customers should be able to purchase gift cards for others, cards can be partially used across multiple orders (so a $100 card could be used for a $60 purchase and still have $40 left), and the finance team has strict requirements that every balance change be traceable for accounting reconciliation and customer support inquiries. The customer support team needs to be able to look up the full history of how any given card's balance changed over time. There is also a need to handle card expiration in a way that is reversible and auditable.

Cards will be identified by alphanumeric codes that customers type in during checkout, so lookups must work regardless of whether the customer types the code in upper or lower case.

## Output Specification

Write the SQL migration file(s) needed to create the gift card schema in PostgreSQL. Save the output as `migration.sql`.

Include all tables, constraints, and indexes your design requires. Add brief SQL comments where the purpose of a column or design decision is not self-evident.
