# Product Availability Badge and View Tracking Module

## Problem/Feature Description

A fashion retailer's merchandising team wants two small but important enhancements to their Magento 2 store. First, products that are tagged with a custom attribute `is_exclusive` should display a "[Exclusive]" prefix in their name wherever the name appears on the storefront — on product listing pages, detail pages, and in search results. The team explicitly does not want to change the stored product name in the database; they only want the display to be modified at runtime.

Second, the analytics team wants to record a log entry whenever a customer views a product detail page. The logging must not interfere with page rendering under any circumstances — if the logging step fails, the storefront page should still load normally. The observer should log both the product SKU and the event outcome. All necessary configuration files to wire up this event listener must be included.

The module should be named `Acme_Merchandising`. Implement only the storefront (frontend) behavior for the name modification; the admin panel should be unaffected.

## Output Specification

Produce all source files for the `Acme_Merchandising` module under `app/code/Acme/Merchandising/`. Include all module skeleton files, all PHP implementation classes, and all XML configuration files needed to wire up the two behaviors.

Create a `design-notes.md` file at the root of your working directory explaining: (1) the technical approach chosen for the product name modification and why it was preferred over other options, (2) which specific method type within that approach was selected and why, and (3) in which scope the name modification is registered and why.
