# PHP Data Setup Script for New Website Launch

## Problem/Feature Description

An e-commerce platform running Adobe Commerce is launching a new wholesale website (`wholesale_site`) alongside the existing retail storefront. The development team needs a PHP setup script (a Magento data patch or standalone script) that handles the programmatic side of the website launch: making sure products from a specified list of SKUs are visible on the new wholesale website, setting website-level configuration values via the proper Magento API, and reading back configuration values at the correct scope to verify the setup.

The team has been burned before by config changes that appeared to take effect immediately but were actually still serving cached values hours later, so the setup script must handle cache invalidation. There's also a requirement to implement a helper class that other modules can use to safely read configuration at either website or store-view scope — the rest of the codebase should not have to deal with raw scope strings.

## Output Specification

Produce a PHP file (or set of files) that implements:

1. **A configuration manager class** (`WebsiteConfigManager.php` or similar) that:
   - Can write a configuration value at a given scope and scope ID
   - Invalidates the config cache after writing
   - Can read a configuration value at website scope (given a website code)
   - Can read a configuration value at store view scope (given a store code)

2. **A product assignment helper class** (`ProductWebsiteAssigner.php` or similar) that:
   - Accepts a product ID and website code and makes the product visible on that website
   - Includes a method that sets a website-specific price for a product

3. **A setup script** (`setup.php` or a Magento DataPatch class) that uses the above helpers to:
   - Assign a hardcoded list of 3 product IDs (101, 102, 103) to `wholesale_site`
   - Set the base URL for `wholesale_site` to `https://wholesale.mystore.com/`
   - Read back and print the base URL at website scope to verify it was saved

Include inline comments in the code explaining the approach.
