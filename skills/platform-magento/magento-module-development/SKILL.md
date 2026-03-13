---
name: magento-module-development
description: "Build custom Magento 2 modules using dependency injection, plugins, observers, and service contracts to extend core functionality cleanly"
category: platform-magento
risk: safe
source: curated
date_added: "2026-03-12"
tags: [magento, magento2, module, dependency-injection, service-contracts, plugins, observers]
triggers: ["build magento module", "create magento 2 extension", "magento dependency injection", "customize magento"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [magento]
difficulty: advanced
---

# Magento 2 Module Development

## Overview

Build custom Magento 2 modules using the module architecture, dependency injection (DI), service contracts (interfaces), plugins (interceptors), observers, and the repository pattern. This skill covers the Magento 2 module skeleton, XML-based configuration, the Object Manager and DI container, custom REST/GraphQL API endpoints, and database schema management with `db_schema.xml` (declarative schema).

## When to Use This Skill

- When building a custom module that adds new functionality to a Magento 2 store
- When extending or overriding core Magento behavior using plugins or preferences
- When creating custom REST API or GraphQL endpoints for headless integrations
- When adding custom database tables with declarative schema
- When implementing admin grids, forms, and system configuration

## Core Instructions

1. **Create the module skeleton**

   Every Magento 2 module lives in `app/code/Vendor/Module` and requires at minimum two files:

   ```
   app/code/Acme/CustomModule/
   ├── etc/
   │   └── module.xml
   ├── registration.php
   ├── Api/
   │   └── CustomRepositoryInterface.php
   ├── Model/
   │   ├── CustomRepository.php
   │   └── ResourceModel/
   ├── Controller/
   ├── Block/
   ├── view/
   │   ├── frontend/
   │   └── adminhtml/
   └── Setup/
       └── Patch/
           └── Data/
   ```

   ```php
   // registration.php
   <?php
   declare(strict_types=1);

   use Magento\Framework\Component\ComponentRegistrar;

   ComponentRegistrar::register(
       ComponentRegistrar::MODULE,
       'Acme_CustomModule',
       __DIR__
   );
   ```

   ```xml
   <!-- etc/module.xml -->
   <?xml version="1.0"?>
   <config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
       <module name="Acme_CustomModule" setup_version="1.0.0">
           <sequence>
               <module name="Magento_Catalog"/>
               <module name="Magento_Sales"/>
           </sequence>
       </module>
   </config>
   ```

2. **Define service contracts (interfaces) and implement them**

   Service contracts ensure your module provides a stable API that other modules and integrations can rely on:

   ```php
   // Api/Data/CustomEntityInterface.php
   <?php
   declare(strict_types=1);

   namespace Acme\CustomModule\Api\Data;

   interface CustomEntityInterface
   {
       const ENTITY_ID = 'entity_id';
       const NAME = 'name';
       const STATUS = 'status';
       const CREATED_AT = 'created_at';

       public function getEntityId(): ?int;
       public function getName(): string;
       public function setName(string $name): self;
       public function getStatus(): string;
       public function setStatus(string $status): self;
       public function getCreatedAt(): ?string;
   }
   ```

   ```php
   // Api/CustomRepositoryInterface.php
   <?php
   declare(strict_types=1);

   namespace Acme\CustomModule\Api;

   use Acme\CustomModule\Api\Data\CustomEntityInterface;
   use Magento\Framework\Api\SearchCriteriaInterface;
   use Magento\Framework\Api\SearchResultsInterface;
   use Magento\Framework\Exception\NoSuchEntityException;

   interface CustomRepositoryInterface
   {
       /**
        * @throws NoSuchEntityException
        */
       public function getById(int $id): CustomEntityInterface;

       public function save(CustomEntityInterface $entity): CustomEntityInterface;

       public function delete(CustomEntityInterface $entity): bool;

       public function getList(SearchCriteriaInterface $searchCriteria): SearchResultsInterface;
   }
   ```

3. **Implement the Model, ResourceModel, and Repository**

   ```php
   // Model/CustomEntity.php
   <?php
   declare(strict_types=1);

   namespace Acme\CustomModule\Model;

   use Acme\CustomModule\Api\Data\CustomEntityInterface;
   use Magento\Framework\Model\AbstractModel;

   class CustomEntity extends AbstractModel implements CustomEntityInterface
   {
       protected function _construct(): void
       {
           $this->_init(\Acme\CustomModule\Model\ResourceModel\CustomEntity::class);
       }

       public function getEntityId(): ?int
       {
           return $this->getData(self::ENTITY_ID) ? (int) $this->getData(self::ENTITY_ID) : null;
       }

       public function getName(): string
       {
           return (string) $this->getData(self::NAME);
       }

       public function setName(string $name): CustomEntityInterface
       {
           return $this->setData(self::NAME, $name);
       }

       public function getStatus(): string
       {
           return (string) $this->getData(self::STATUS);
       }

       public function setStatus(string $status): CustomEntityInterface
       {
           return $this->setData(self::STATUS, $status);
       }

       public function getCreatedAt(): ?string
       {
           return $this->getData(self::CREATED_AT);
       }
   }
   ```

   ```php
   // Model/ResourceModel/CustomEntity.php
   <?php
   declare(strict_types=1);

   namespace Acme\CustomModule\Model\ResourceModel;

   use Magento\Framework\Model\ResourceModel\Db\AbstractDb;

   class CustomEntity extends AbstractDb
   {
       protected function _construct(): void
       {
           $this->_init('acme_custom_entity', 'entity_id');
       }
   }
   ```

   ```php
   // Model/CustomRepository.php
   <?php
   declare(strict_types=1);

   namespace Acme\CustomModule\Model;

   use Acme\CustomModule\Api\CustomRepositoryInterface;
   use Acme\CustomModule\Api\Data\CustomEntityInterface;
   use Acme\CustomModule\Model\ResourceModel\CustomEntity as ResourceModel;
   use Acme\CustomModule\Model\CustomEntityFactory;
   use Magento\Framework\Api\SearchCriteriaInterface;
   use Magento\Framework\Api\SearchResultsInterface;
   use Magento\Framework\Api\SearchResultsInterfaceFactory;
   use Magento\Framework\Exception\NoSuchEntityException;

   class CustomRepository implements CustomRepositoryInterface
   {
       public function __construct(
           private readonly ResourceModel $resourceModel,
           private readonly CustomEntityFactory $entityFactory,
           private readonly SearchResultsInterfaceFactory $searchResultsFactory,
           private readonly \Acme\CustomModule\Model\ResourceModel\CustomEntity\CollectionFactory $collectionFactory
       ) {}

       public function getById(int $id): CustomEntityInterface
       {
           $entity = $this->entityFactory->create();
           $this->resourceModel->load($entity, $id);
           if (!$entity->getEntityId()) {
               throw new NoSuchEntityException(
                   __('Entity with ID "%1" does not exist.', $id)
               );
           }
           return $entity;
       }

       public function save(CustomEntityInterface $entity): CustomEntityInterface
       {
           $this->resourceModel->save($entity);
           return $entity;
       }

       public function delete(CustomEntityInterface $entity): bool
       {
           $this->resourceModel->delete($entity);
           return true;
       }

       public function getList(SearchCriteriaInterface $searchCriteria): SearchResultsInterface
       {
           $collection = $this->collectionFactory->create();

           foreach ($searchCriteria->getFilterGroups() as $filterGroup) {
               foreach ($filterGroup->getFilters() as $filter) {
                   $collection->addFieldToFilter(
                       $filter->getField(),
                       [$filter->getConditionType() => $filter->getValue()]
                   );
               }
           }

           $searchResults = $this->searchResultsFactory->create();
           $searchResults->setSearchCriteria($searchCriteria);
           $searchResults->setItems($collection->getItems());
           $searchResults->setTotalCount($collection->getSize());

           return $searchResults;
       }
   }
   ```

4. **Configure dependency injection with `di.xml`**

   ```xml
   <!-- etc/di.xml -->
   <?xml version="1.0"?>
   <config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd">

       <!-- Bind interfaces to implementations (preferences) -->
       <preference for="Acme\CustomModule\Api\Data\CustomEntityInterface"
                   type="Acme\CustomModule\Model\CustomEntity"/>
       <preference for="Acme\CustomModule\Api\CustomRepositoryInterface"
                   type="Acme\CustomModule\Model\CustomRepository"/>

       <!-- Virtual type: reusable configured class without a new PHP file -->
       <virtualType name="Acme\CustomModule\Model\ResourceModel\CustomEntity\Grid\Collection"
                    type="Magento\Framework\View\Element\UiComponent\DataProvider\SearchResult">
           <arguments>
               <argument name="mainTable" xsi:type="string">acme_custom_entity</argument>
               <argument name="resourceModel"
                         xsi:type="string">Acme\CustomModule\Model\ResourceModel\CustomEntity</argument>
           </arguments>
       </virtualType>

       <!-- Constructor argument injection -->
       <type name="Acme\CustomModule\Model\SomeService">
           <arguments>
               <argument name="maxRetries" xsi:type="number">3</argument>
               <argument name="logger" xsi:type="object">Psr\Log\LoggerInterface</argument>
           </arguments>
       </type>
   </config>
   ```

5. **Create database tables with declarative schema**

   ```xml
   <!-- etc/db_schema.xml -->
   <?xml version="1.0"?>
   <schema xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:noNamespaceSchemaLocation="urn:magento:framework:Setup/Declaration/Schema/etc/schema.xsd">
       <table name="acme_custom_entity" resource="default" engine="innodb"
              comment="Acme Custom Entity Table">
           <column xsi:type="int" name="entity_id" unsigned="true" nullable="false"
                   identity="true" comment="Entity ID"/>
           <column xsi:type="varchar" name="name" nullable="false" length="255"
                   comment="Name"/>
           <column xsi:type="varchar" name="status" nullable="false" length="20"
                   default="active" comment="Status"/>
           <column xsi:type="decimal" name="amount" precision="12" scale="4"
                   nullable="true" comment="Amount"/>
           <column xsi:type="timestamp" name="created_at" nullable="false"
                   default="CURRENT_TIMESTAMP" comment="Created At"/>
           <column xsi:type="timestamp" name="updated_at" nullable="false"
                   default="CURRENT_TIMESTAMP" on_update="true" comment="Updated At"/>
           <constraint xsi:type="primary" referenceId="PRIMARY">
               <column name="entity_id"/>
           </constraint>
           <index referenceId="ACME_CUSTOM_ENTITY_STATUS" indexType="btree">
               <column name="status"/>
           </index>
       </table>
   </schema>
   ```

   Generate the whitelist file after modifying `db_schema.xml`:
   ```bash
   bin/magento setup:db-declaration:generate-whitelist --module-name=Acme_CustomModule
   ```

6. **Use plugins (interceptors) to modify core behavior**

   ```php
   // Plugin/ProductPricePlugin.php
   <?php
   declare(strict_types=1);

   namespace Acme\CustomModule\Plugin;

   use Magento\Catalog\Model\Product;

   class ProductPricePlugin
   {
       /**
        * After-plugin: modify the return value of getPrice()
        */
       public function afterGetPrice(Product $subject, float $result): float
       {
           // Example: apply a 10% surcharge for a specific attribute
           if ($subject->getData('requires_special_handling')) {
               return $result * 1.10;
           }
           return $result;
       }

       /**
        * Before-plugin: modify input arguments
        */
       public function beforeSetPrice(Product $subject, $price): array
       {
           // Ensure price is never negative
           return [max(0, (float) $price)];
       }

       /**
        * Around-plugin: wrap the original method (use sparingly)
        */
       public function aroundGetName(Product $subject, callable $proceed): string
       {
           $name = $proceed();
           $badge = $subject->getData('custom_badge');
           return $badge ? "[{$badge}] {$name}" : $name;
       }
   }
   ```

   Register the plugin in `di.xml`:
   ```xml
   <type name="Magento\Catalog\Model\Product">
       <plugin name="acme_custom_price_plugin"
               type="Acme\CustomModule\Plugin\ProductPricePlugin"
               sortOrder="10"/>
   </type>
   ```

## Examples

### Custom REST API endpoint

```php
// etc/webapi.xml
<?xml version="1.0"?>
<routes xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Webapi:etc/webapi.xsd">
    <route url="/V1/acme/custom-entities" method="GET">
        <service class="Acme\CustomModule\Api\CustomRepositoryInterface" method="getList"/>
        <resources>
            <resource ref="Magento_Catalog::catalog"/>
        </resources>
    </route>
    <route url="/V1/acme/custom-entities/:id" method="GET">
        <service class="Acme\CustomModule\Api\CustomRepositoryInterface" method="getById"/>
        <resources>
            <resource ref="anonymous"/>
        </resources>
    </route>
    <route url="/V1/acme/custom-entities" method="POST">
        <service class="Acme\CustomModule\Api\CustomRepositoryInterface" method="save"/>
        <resources>
            <resource ref="Magento_Catalog::catalog"/>
        </resources>
    </route>
</routes>
```

### Observer for post-order events

```php
// Observer/OrderPlaceAfterObserver.php
<?php
declare(strict_types=1);

namespace Acme\CustomModule\Observer;

use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;
use Magento\Sales\Model\Order;
use Psr\Log\LoggerInterface;

class OrderPlaceAfterObserver implements ObserverInterface
{
    public function __construct(
        private readonly LoggerInterface $logger,
        private readonly \Acme\CustomModule\Model\ExternalSyncService $syncService
    ) {}

    public function execute(Observer $observer): void
    {
        /** @var Order $order */
        $order = $observer->getEvent()->getOrder();

        try {
            $this->syncService->pushOrder($order);
            $this->logger->info(
                sprintf('Order #%s synced to external system.', $order->getIncrementId())
            );
        } catch (\Exception $e) {
            // Log but do not block order placement
            $this->logger->error(
                sprintf('Failed to sync order #%s: %s', $order->getIncrementId(), $e->getMessage())
            );
        }
    }
}
```

```xml
<!-- etc/events.xml -->
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Event/etc/events.xsd">
    <event name="sales_order_place_after">
        <observer name="acme_order_sync" instance="Acme\CustomModule\Observer\OrderPlaceAfterObserver"/>
    </event>
</config>
```

## Best Practices

- **Always use service contracts** -- inject interfaces (`CustomRepositoryInterface`) not concrete classes; this enables compatibility with REST, GraphQL, and other modules
- **Prefer plugins over class rewrites** -- plugins (interceptors) are composable and allow multiple modules to modify the same method; preferences (rewrites) cause conflicts
- **Use `around` plugins sparingly** -- they wrap the entire method call and prevent other plugins from executing if you forget to call `$proceed()`; prefer `before`/`after` plugins
- **Declare module dependencies in `module.xml`** -- the `<sequence>` node ensures your module loads after its dependencies; missing sequences cause subtle load-order bugs
- **Use declarative schema (`db_schema.xml`)** -- avoid legacy `InstallSchema`/`UpgradeSchema` scripts; declarative schema is idempotent and supports rollback
- **Never use the Object Manager directly** -- always use constructor dependency injection; direct `ObjectManager::getInstance()` calls bypass DI configuration and break testability
- **Run `bin/magento setup:di:compile` after changes** -- the DI compilation step generates interceptors and factories; missing compilation causes "class not found" errors in production mode
- **Follow Magento coding standards** -- run `vendor/bin/phpcs --standard=Magento2` on your module before release

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| "Class does not exist" after adding a new class | Run `bin/magento setup:di:compile` and `bin/magento cache:flush`; check namespace matches directory path exactly |
| Plugin not executing | Verify the plugin is registered in the correct scope's `di.xml` (`etc/frontend/di.xml` for frontend, `etc/di.xml` for global) and the `sortOrder` doesn't conflict |
| Declarative schema changes not applying | Run `bin/magento setup:upgrade` and regenerate the whitelist with `setup:db-declaration:generate-whitelist` |
| Circular dependency injection error | Refactor one of the dependent classes to use a Proxy (`\Acme\CustomModule\Model\SomeClass\Proxy`) in `di.xml` to break the cycle |
| Observer throws exception and blocks checkout | Wrap observer logic in try/catch; observers should log errors but never throw exceptions that block critical flows |
| Factory class not found | Factories are auto-generated by DI compilation; run `bin/magento setup:di:compile` or check that the base class exists |

## Related Skills

- @product-data-modeling
- @erp-integration
- @ecommerce-caching
- @pci-dss-compliance
- @ecommerce-seo
