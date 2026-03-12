# Catalog Data Migration for a Fashion Retailer

## Problem/Feature Description

A mid-sized fashion retailer is launching a new Salesforce Commerce Cloud storefront and needs their product catalog migrated from a legacy spreadsheet system into SFCC. The merchandising team has compiled a product list that includes both simple standalone products and configurable products (shirts available in multiple colors and sizes). Their ERP team will handle inventory separately, but the catalog structure — categories, product definitions, and variation relationships — needs to be ready for the platform engineers to test.

The platform team has asked for a complete SFCC catalog XML import file. The file needs to define a category hierarchy, a mix of simple and variation products, and proper category assignments so products show up in the storefront once the import runs. A product manager has flagged from a previous migration attempt that some products ended up in the wrong catalog and others never appeared in the storefront, so the import file needs to be done correctly.

## Output Specification

Produce a single file `catalog-import.xml` that:
- Defines at least two product categories
- Includes at least two simple products and one variation product (master + at least two variants) that use color and/or size as variation attributes
- Assigns each product to a category
- Uses realistic product data (names, attributes, etc.)

Also produce a brief `import-notes.md` explaining any decisions made about the structure and what to watch out for during the import.
