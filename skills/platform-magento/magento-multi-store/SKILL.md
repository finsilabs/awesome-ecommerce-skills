---
name: magento-multi-store
description: "Configure multiple websites and store views in Magento with shared or scoped catalogs, separate URL structures, and store-specific settings"
category: platform-magento
risk: safe
source: curated
date_added: "2026-03-12"
tags: [magento, multi-store, multi-website, store-scope, catalog, shared-catalog, b2b, scoped-config]
triggers: ["magento multi store", "magento multiple websites", "magento store scope", "magento multi website setup", "magento b2b shared catalog", "adobe commerce multi store"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [magento]
difficulty: advanced
---

# Magento Multi-Store Setup

## Overview

Magento's multi-store architecture has three levels: Website → Store → Store View. A Website groups stores with a shared customer base and order flow. A Store (under a Website) has its own root category and URL structure. Store Views (under a Store) typically represent languages or locales. Configuration values can be set at Global, Website, or Store View scope — lower scopes override higher ones. Adobe Commerce (B2B) adds Shared Catalogs for per-company product/price visibility control.

## When to Use This Skill

- When running multiple brands or country-specific storefronts from a single Magento installation
- When setting different base currencies, tax configurations, or payment methods per website
- When creating a B2B portal alongside a B2C store with different product visibility
- When implementing localized store views for multiple languages under the same product catalog
- When configuring separate checkout flows, shipping methods, or payment gateways per website
- When managing shared product catalog with website-specific pricing and visibility overrides

## Core Instructions

1. **Create the Website → Store → Store View hierarchy**

   > **Note:** Core Magento does not ship `bin/magento store:website:create`, `store:group:create`, or `store:store:create` CLI commands. Create websites, stores, and store views either through **Admin → Stores → All Stores** or programmatically in PHP (shown below). Some third-party modules add CLI equivalents, but they are not part of the core.

   Via PHP programmatically (primary method):

   ```php
   <?php
   // Create website via DataObject
   use Magento\Store\Model\Website;
   use Magento\Store\Model\Group;
   use Magento\Store\Model\Store;

   $website = $objectManager->create(Website::class);
   $website->setCode('uk_site')
           ->setName('UK Website')
           ->setDefaultGroupId(0) // Set after creating group
           ->save();

   $storeGroup = $objectManager->create(Group::class);
   $storeGroup->setWebsiteId($website->getId())
              ->setName('UK Store')
              ->setRootCategoryId(3) // Your UK root category ID
              ->save();

   $storeView = $objectManager->create(Store::class);
   $storeView->setWebsiteId($website->getId())
             ->setGroupId($storeGroup->getId())
             ->setCode('uk_en')
             ->setName('UK English')
             ->setIsActive(1)
             ->save();
   ```

2. **Configure nginx for multi-website routing**

   ```nginx
   # /etc/nginx/sites-available/magento-multi-store.conf

   # Map host to Magento store code (MAGE_RUN_CODE + MAGE_RUN_TYPE)
   map $http_host $MAGE_RUN_CODE {
       hostnames;
       default         "";
       www.mystore.com "";         # Default (global config)
       uk.mystore.com  uk_en;     # UK store view
       de.mystore.com  de_de;     # German store view
       b2b.mystore.com b2b_en;   # B2B website
   }

   map $http_host $MAGE_RUN_TYPE {
       hostnames;
       default         "";
       www.mystore.com "";
       uk.mystore.com  "store";   # Route to store view
       de.mystore.com  "store";
       b2b.mystore.com "website"; # Route to website (different customer base)
   }

   server {
       listen 443 ssl http2;
       server_name ~^(.+\.)?mystore\.com$;

       root /var/www/magento/pub;
       index index.php;

       location ~ \.php$ {
           fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
           fastcgi_param MAGE_RUN_CODE $MAGE_RUN_CODE;
           fastcgi_param MAGE_RUN_TYPE $MAGE_RUN_TYPE;
           include fastcgi_params;
       }
   }
   ```

3. **Set scoped configuration values**

   Configuration can be set at global, website, or store view scope:

   ```bash
   # Set base URL per website
   bin/magento config:set --scope=websites --scope-code=uk_site web/secure/base_url "https://uk.mystore.com/"
   bin/magento config:set --scope=websites --scope-code=uk_site web/unsecure/base_url "https://uk.mystore.com/"

   # Set currency per website
   bin/magento config:set --scope=websites --scope-code=uk_site currency/options/base GBP
   bin/magento config:set --scope=websites --scope-code=uk_site currency/options/default GBP
   bin/magento config:set --scope=websites --scope-code=uk_site currency/options/allow "GBP,EUR"

   # Set locale per store view
   bin/magento config:set --scope=stores --scope-code=de_de general/locale/code de_DE
   bin/magento config:set --scope=stores --scope-code=de_de general/locale/timezone "Europe/Berlin"

   # Disable a payment method for specific website
   bin/magento config:set --scope=websites --scope-code=uk_site payment/checkmo/active 0
   ```

   Programmatically in PHP:

   ```php
   <?php
   use Magento\Framework\App\Config\Storage\WriterInterface;
   use Magento\Store\Model\ScopeInterface;

   class ScopeConfigManager
   {
       public function __construct(
           private readonly WriterInterface $configWriter,
           private readonly \Magento\Framework\App\Cache\TypeListInterface $cacheTypeList
       ) {}

       public function setScopedValue(
           string $path,
           mixed $value,
           string $scope,
           int $scopeId
       ): void {
           $this->configWriter->save($path, $value, $scope, $scopeId);
           // Flush config cache after write
           $this->cacheTypeList->cleanType('config');
       }

       public function setWebsiteShippingOrigin(string $websiteCode, array $originData): void {
           $website = \Magento\Framework\App\ObjectManager::getInstance()
               ->create(\Magento\Store\Model\Website::class)
               ->load($websiteCode, 'code');

           $this->setScopedValue(
               'shipping/origin/country_id',
               $originData['country'],
               ScopeInterface::SCOPE_WEBSITES,
               (int)$website->getId()
           );
       }
   }
   ```

4. **Manage website-specific product assignment and pricing**

   Products can be assigned to specific websites while sharing the global catalog:

   ```php
   <?php
   // Assign a product to specific websites
   use Magento\Catalog\Model\ResourceModel\Product as ProductResource;

   class ProductWebsiteAssignment
   {
       public function __construct(
           private readonly ProductResource $productResource,
           private readonly \Magento\Store\Model\StoreManagerInterface $storeManager
       ) {}

       public function assignProductToWebsite(int $productId, string $websiteCode): void {
           $website = $this->storeManager->getWebsite($websiteCode);
           $this->productResource->websiteToProducts([
               ['product_id' => $productId, 'website_id' => $website->getId()],
           ]);
       }

       public function setWebsitePrice(int $productId, string $websiteCode, float $price): void {
           // Use tier prices with website scope for website-specific pricing
           $tierPriceResource = \Magento\Framework\App\ObjectManager::getInstance()
               ->create(\Magento\Catalog\Model\ResourceModel\Product\Attribute\Backend\Tierprice::class);
           // Or use price scope: Admin → Config → Catalog → Price → Catalog Price Scope = Website
       }
   }
   ```

   Enable website-scoped pricing:

   ```bash
   bin/magento config:set catalog/price/scope 1  # 0 = Global, 1 = Website
   bin/magento indexer:reindex catalog_product_price
   ```

5. **Configure Adobe Commerce B2B Shared Catalogs**

   Shared Catalogs (B2B feature) allow per-company product and pricing visibility:

   ```php
   <?php
   // Assign a company to a custom shared catalog
   use Magento\SharedCatalog\Api\SharedCatalogManagementInterface;
   use Magento\SharedCatalog\Api\Data\SharedCatalogInterface;

   class SharedCatalogManager
   {
       public function __construct(
           private readonly SharedCatalogManagementInterface $sharedCatalogManagement,
           private readonly \Magento\SharedCatalog\Api\SharedCatalogRepositoryInterface $catalogRepository,
           private readonly \Magento\Company\Api\CompanyRepositoryInterface $companyRepository
       ) {}

       public function assignCompanyToCatalog(int $companyId, int $sharedCatalogId): void {
           $sharedCatalog = $this->catalogRepository->get($sharedCatalogId);
           $company = $this->companyRepository->get($companyId);
           $company->getExtensionAttributes()->getQuoteConfig()?->setCustomerGroupId(
               $sharedCatalog->getCustomerGroupId()
           );
           $this->companyRepository->save($company);
       }
   }
   ```

   ```bash
   # CLI: Assign products to a shared catalog (by SKU list from CSV)
   bin/magento company:catalog:assign --catalog-id=2 --products-file=products.csv

   # Set catalog-specific pricing via import
   bin/magento import:start --entity=shared_catalog_product_price --behavior=add_update --import-file=prices.csv
   ```

## Examples

### Automated multi-website deployment configuration

```php
<?php
// Console command to provision a new website from config array
namespace MyVendor\MultiStore\Console\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class ProvisionWebsiteCommand extends Command
{
    protected function configure(): void
    {
        $this->setName('mystore:website:provision')
             ->setDescription('Provision a new website from config');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $websites = [
            [
                'code' => 'au_site',
                'name' => 'Australia',
                'domain' => 'au.mystore.com',
                'currency' => 'AUD',
                'locale' => 'en_AU',
                'timezone' => 'Australia/Sydney',
                'root_category_id' => 5,
            ],
        ];

        foreach ($websites as $config) {
            $output->writeln("Creating website: {$config['code']}");
            // Execute creation commands...
            $this->createWebsite($config, $output);
        }

        return Command::SUCCESS;
    }

    private function createWebsite(array $config, OutputInterface $output): void
    {
        // Implementation: create Website → Group → StoreView → set config
    }
}
```

### Read scoped configuration in a custom module

```php
<?php
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Store\Model\ScopeInterface;

class StoreAwareConfig
{
    public function __construct(
        private readonly ScopeConfigInterface $scopeConfig
    ) {}

    public function getWebsiteConfig(string $path, ?string $websiteCode = null): mixed
    {
        return $this->scopeConfig->getValue(
            $path,
            ScopeInterface::SCOPE_WEBSITE,
            $websiteCode // null = current website
        );
    }

    public function getStoreConfig(string $path, ?string $storeCode = null): mixed
    {
        return $this->scopeConfig->getValue(
            $path,
            ScopeInterface::SCOPE_STORE,
            $storeCode // null = current store view
        );
    }

    // Usage
    public function getShippingOriginCountry(): string
    {
        return (string)$this->getStoreConfig('shipping/origin/country_id');
    }
}
```

## Best Practices

- **Use store code routing (`MAGE_RUN_TYPE=store`) for language variants** and website routing (`MAGE_RUN_TYPE=website`) only when you need separate customer bases, orders, and payment methods
- **Enable website-scoped pricing** before going live — switching from global to website scope later requires a full price index rebuild and may break existing catalog rules
- **Set `MAGE_RUN_CODE` and `MAGE_RUN_TYPE` at the nginx/Apache level**, not in `index.php` — this keeps routing config in the infrastructure layer and enables easier replication
- **Test each website's checkout independently** — payment gateways, tax classes, and shipping methods are all configurable per website; a working checkout on one website does not guarantee others work
- **Flush configuration cache after every `config:set`** — scoped config changes are cached; run `bin/magento cache:clean config` after automated provisioning scripts
- **Use separate Redis databases per website in high-traffic setups** — a slow reindex on one website can saturate shared cache storage and affect all websites
- **Document the website/store/store-view ID mapping** — IDs change between environments; use codes (`uk_en`) not numeric IDs in all configuration scripts

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| New website shows global prices ignoring website config | Enable website-scoped pricing: `bin/magento config:set catalog/price/scope 1` then reindex `catalog_product_price` |
| nginx `MAGE_RUN_CODE` not passed to PHP | Verify `fastcgi_param MAGE_RUN_CODE` is inside the `location ~ \.php$` block and not outside it — a common placement mistake |
| Customer from one website can log in to another | Websites with `MAGE_RUN_TYPE=website` share customer pools by default unless you enable customer account sharing scoped per website: `Admin → Config → Customer → Account Sharing` |
| Product visible on wrong website | Check product's "Product in Websites" attribute in Admin → Catalog; products must be explicitly assigned to each website they should appear on |
| Scoped config not taking effect | Config values are cached — always run `bin/magento cache:clean config` after changes; also verify the scope code spelling matches exactly |
| B2B shared catalog not filtering products | The customer must be assigned to a company with the correct catalog; guest and non-company customers see only the public shared catalog |

## Related Skills

- @magento-module-development
- @magento-graphql
- @magento-indexing-caching
- @international-ecommerce
- @b2b-commerce
