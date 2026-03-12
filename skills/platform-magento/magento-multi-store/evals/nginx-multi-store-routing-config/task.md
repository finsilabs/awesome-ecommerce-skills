# nginx Configuration for Multi-Brand Magento Storefront

## Problem/Feature Description

A retail group operates a single Magento installation that needs to serve three distinct web properties from one server: a UK English storefront at `uk.fashiongroup.com`, a German-language storefront at `de.fashiongroup.com`, and a B2B wholesale portal at `b2b.fashiongroup.com`. The UK and German storefronts share the same customer database and order history — shoppers who registered on one can log in to the other — but the B2B portal serves an entirely separate corporate customer base with its own order management and payment terms.

The current nginx configuration only serves a single domain. The infrastructure team needs a production-ready nginx server block that routes each incoming request to the correct Magento context, with all environment variables set correctly so that Magento serves the right store without any changes to application code. The team has had previous issues where environment variables set in the wrong location weren't picked up by PHP-FPM, so correctness of placement is critical.

## Output Specification

Produce a single nginx configuration file named `magento-multi-store.conf` that can be dropped into `/etc/nginx/sites-available/`. The file should:

- Handle all three domains listed above
- Route each domain to the correct Magento context using appropriate environment variable values
- Include a working PHP location block with FastCGI configuration passing the required Magento routing variables to PHP-FPM (assume socket path: `/var/run/php/php8.2-fpm.sock`)
- Set the document root to `/var/www/magento/pub`

Write a brief `routing-notes.md` explaining the routing strategy chosen for each domain and why the B2B portal uses a different routing approach than the language storefronts.
