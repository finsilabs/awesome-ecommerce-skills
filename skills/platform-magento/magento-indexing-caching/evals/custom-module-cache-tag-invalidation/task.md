# Custom Magento Module: Product Widget with Proper Cache Integration

## Problem/Feature Description

A Magento agency has built a custom module called `Acme_FeaturedProducts` that displays a homepage widget showing hand-picked featured products. After deploying the module to production (which runs Varnish as the full-page cache), the client has reported that when a product price changes or a product is disabled, the homepage continues showing the old data for hours — sometimes until the next overnight cache flush. The Varnish server is running correctly and serving other pages fine.

The agency needs to fix the module so that Varnish properly invalidates cached pages when the featured products change. They also need to create a Magento observer that flushes the right cache entries when a product is saved, and ensure the development team knows which CLI command to use for routine cache maintenance going forward.

## Output Specification

Produce the following files for the fixed module:

1. `Block/FeaturedProducts.php` — The corrected block class. The widget displays products from a hardcoded list of product IDs (use `[1, 5, 12, 47]` as the IDs for this implementation). The block should integrate with Magento's cache tagging system so Varnish knows which pages to invalidate.

2. `Observer/ProductSaveObserver.php` — An observer class that invalidates the full-page cache after a product is saved. Use the correct Magento API for this; the invalidation should work with Varnish's tag-based purging.

3. `cache-maintenance.md` — A one-page guide for the client's admin team explaining which Magento CLI cache commands to use for day-to-day maintenance and when each is appropriate.

## Input Files

The following files represent the current (broken) state of the module. Extract them before beginning.

=============== FILE: current/Block/FeaturedProducts.php ===============
<?php
namespace Acme\FeaturedProducts\Block;

use Magento\Framework\View\Element\Template;

class FeaturedProducts extends Template
{
    private array $productIds = [1, 5, 12, 47];

    public function getProductIds(): array
    {
        return $this->productIds;
    }
}
=============== FILE: current/Observer/ProductSaveObserver.php ===============
<?php
namespace Acme\FeaturedProducts\Observer;

use Magento\Framework\Event\ObserverInterface;

class ProductSaveObserver implements ObserverInterface
{
    public function execute(\Magento\Framework\Event\Observer $observer): void
    {
        // TODO: invalidate cache after product save
    }
}
