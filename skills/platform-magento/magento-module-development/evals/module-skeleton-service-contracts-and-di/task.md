# Loyalty Program Membership Module

## Problem/Feature Description

An outdoor gear retailer is launching a tiered loyalty program for their Magento 2 store. The program needs to track membership records — each member has a unique ID, a tier name (e.g., "Bronze", "Silver", "Gold"), a points balance, and a join date. The development team needs a new custom Magento 2 module that stores these records in a dedicated database table and provides a clean, reusable PHP API for other modules and integrations to create, retrieve, and list memberships.

The team already has a Magento 2 codebase but no loyalty module exists yet. The module should be structured so that future modules (such as a checkout module that awards points on purchase) can depend on it cleanly, without tight coupling to implementation details. The module will eventually depend on the Magento_Customer module, so the load order must be arranged accordingly.

## Output Specification

Produce all the PHP and XML source files for the module under `app/code/Acme/Loyalty/`. The directory tree should reflect a complete module scaffold with correct namespace usage throughout.

Specifically, provide:
- All configuration XML files needed at the module level
- All PHP interface definitions for data access
- All PHP implementation classes (model, resource model, repository)
- The dependency injection configuration file
- The database schema definition file

Also create a `setup-notes.md` file at the root of your working directory that lists the `bin/magento` CLI commands a developer must run after deploying this module to a Magento 2 instance (to register the module, create tables, and prepare the DI container).
