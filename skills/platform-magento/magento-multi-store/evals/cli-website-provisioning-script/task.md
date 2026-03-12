# Automated Country Website Provisioning for Magento

## Problem/Feature Description

A global e-commerce company is expanding rapidly and needs to launch new country-specific storefronts every quarter. Each new country gets its own Magento website with a dedicated subdomain, local currency, locale, and timezone. The operations team currently provisions new websites by clicking through the Magento admin UI, which is error-prone and takes 30–45 minutes per country. They want a repeatable shell script that can be run once a root category for the new country has been created in the catalog.

The company has recently run into problems where products on new websites were still showing global (USD) prices instead of local prices, causing customer complaints. This issue needs to be baked into the provisioning script so it doesn't happen again. The team also found that after running config changes, the new settings sometimes don't appear until after manual cache intervention — the script must handle this automatically.

The script will be run by engineers who know the new website's code, name, domain, currency, locale, timezone, and root category ID ahead of time. They maintain a policy of referencing stores and websites by their string codes (not internal numeric IDs) in all scripts, since IDs differ across staging and production environments.

## Output Specification

Produce a shell script named `provision-website.sh` that accepts the following parameters (either as positional arguments or as environment variables — document the calling convention in the script header):

- Website code (e.g., `au_site`)
- Website name (e.g., `Australia`)
- Store code (e.g., `au_store`)
- Store view code (e.g., `au_en`)
- Root category ID (integer)
- Domain (e.g., `au.mystore.com`)
- Currency code (e.g., `AUD`)
- Locale code (e.g., `en_AU`)
- Timezone (e.g., `Australia/Sydney`)

The script should fully provision the new website, configure scoped settings, and leave the system in a working state. Assume the script is run from the Magento root directory (where `bin/magento` is located). Add inline comments explaining non-obvious steps.
