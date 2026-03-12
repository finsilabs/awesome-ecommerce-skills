# Product FAQ REST API Module

## Problem/Feature Description

A headless commerce team is building a React storefront that needs to display frequently asked questions (FAQs) associated with individual products. The team needs a new Magento 2 module called `Acme_ProductFaq` that stores FAQ entries in a dedicated database table and exposes them through the Magento REST API. Each FAQ entry should have an auto-increment ID, a product ID it belongs to, a question text, an answer text, and timestamps for creation and last update.

The REST API must allow: listing all FAQs for a given product (public endpoint, no auth required), retrieving a single FAQ by its ID, and creating a new FAQ entry. The backend team insists the database schema is defined in a way that supports clean upgrades and rollbacks without manual SQL scripts. The module must also follow Magento's recommended approach for exposing entity operations — other backend modules should be able to depend on the FAQ data layer without importing concrete classes.

## Output Specification

Produce all source files for `Acme_ProductFaq` under `app/code/Acme/ProductFaq/`. Include:
- All module skeleton and configuration files
- Service contract interfaces (data interface and repository interface)
- Model, ResourceModel, Collection, and Repository implementations
- Database schema definition file
- REST API route definitions file
- Dependency injection configuration file

Create a `deployment-guide.md` file at the root of your working directory that lists in order all `bin/magento` CLI commands a developer must run after deploying this module to a live Magento 2 instance to fully activate the module, create its tables, and make the REST API available.
