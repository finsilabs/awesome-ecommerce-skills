# Dropshipping Database Schema

## Problem/Feature Description

A growing home goods retailer is expanding into dropshipping to offer a wider product range without holding additional inventory. The engineering team needs to design the persistence layer for this new dropshipping capability. The store already has `products` and `orders` tables in PostgreSQL.

The dropshipping system needs to track: which suppliers exist and how to connect with them, which products each supplier can fulfill (along with their own internal SKU references and pricing), and the lifecycle of orders that have been routed to suppliers for fulfillment. Suppliers use a variety of integration methods — some have REST APIs, others use email, EDI, or CSV files over FTP. API credentials must be stored securely. The schema should also support computing accurate delivery estimates for customers based on each supplier's typical fulfillment time.

## Output Specification

Write a SQL migration file named `migration.sql` containing the `CREATE TABLE` statements for all the new dropshipping-related tables. Use PostgreSQL syntax. Add comments where appropriate to explain design decisions, especially around sensitive fields and data types.
