---
name: woocommerce-plugin-development
description: "Create custom WooCommerce plugins using action/filter hooks, the Settings API, and REST API extensions to add features without modifying core"
category: platform-woocommerce
risk: safe
source: curated
date_added: "2026-03-12"
tags: [woocommerce, wordpress, plugin, hooks, filters, php, settings-api]
triggers: ["build woocommerce plugin", "customize woocommerce", "woocommerce hooks", "extend woocommerce"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [woocommerce]
difficulty: intermediate
---

# WooCommerce Plugin Development

## Overview

Build custom WooCommerce plugins that extend store functionality using WordPress hooks (actions and filters), the WooCommerce Settings API, custom post types and meta boxes, REST API extensions, and HPOS (High-Performance Order Storage) compatibility. This skill covers plugin architecture, the WooCommerce lifecycle hooks for orders and products, and patterns for building maintainable, upgrade-safe extensions.

## When to Use This Skill

- When building a custom feature that extends WooCommerce (custom shipping, payment, or discount logic)
- When creating a plugin that adds admin settings and configuration pages
- When hooking into the WooCommerce checkout, order, or product lifecycle
- When extending the WooCommerce REST API with custom endpoints
- When migrating a plugin to support HPOS (High-Performance Order Storage)

## Core Instructions

1. **Set up the plugin boilerplate**

   ```php
   <?php
   /**
    * Plugin Name: My Custom WooCommerce Extension
    * Description: Adds custom functionality to WooCommerce
    * Version: 1.0.0
    * Author: Your Name
    * Requires Plugins: woocommerce
    * WC requires at least: 8.0
    * WC tested up to: 9.0
    *
    * @package MyWooExtension
    */

   defined('ABSPATH') || exit;

   // Check if WooCommerce is active
   if (!in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')))) {
       return;
   }

   define('MWE_VERSION', '1.0.0');
   define('MWE_PLUGIN_DIR', plugin_dir_path(__FILE__));
   define('MWE_PLUGIN_URL', plugin_dir_url(__FILE__));

   // Declare HPOS compatibility
   add_action('before_woocommerce_init', function () {
       if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
           \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
               'custom_order_tables',
               __FILE__,
               true
           );
       }
   });

   // Initialize the plugin after WooCommerce loads
   add_action('woocommerce_loaded', function () {
       require_once MWE_PLUGIN_DIR . 'includes/class-mwe-main.php';
       MWE_Main::instance();
   });
   ```

2. **Use WooCommerce hooks for order lifecycle events**

   ```php
   class MWE_Order_Handler {
       public function __construct() {
           // Order status transitions
           add_action('woocommerce_order_status_completed', [$this, 'on_order_completed'], 10, 2);
           add_action('woocommerce_order_status_changed', [$this, 'on_status_change'], 10, 4);

           // New order created
           add_action('woocommerce_checkout_order_created', [$this, 'on_order_created']);

           // Payment complete
           add_action('woocommerce_payment_complete', [$this, 'on_payment_complete']);

           // Before/after order item saved (HPOS compatible)
           add_action('woocommerce_new_order_item', [$this, 'on_new_order_item'], 10, 3);
       }

       public function on_order_completed(int $order_id, \WC_Order $order): void {
           // Example: trigger fulfillment via external API
           $items = $order->get_items();
           $shipping_address = $order->get_address('shipping');

           foreach ($items as $item) {
               $product = $item->get_product();
               $sku = $product->get_sku();
               $quantity = $item->get_quantity();

               // Call your external fulfillment service
               $this->send_to_fulfillment($sku, $quantity, $shipping_address);
           }

           $order->add_order_note('Order sent to fulfillment service.');
       }

       public function on_status_change(int $order_id, string $from, string $to, \WC_Order $order): void {
           // Log status transitions
           error_log(sprintf(
               'Order #%d transitioned from %s to %s',
               $order_id, $from, $to
           ));
       }
   }
   ```

3. **Add settings using the WooCommerce Settings API**

   ```php
   class MWE_Settings {
       public function __construct() {
           add_filter('woocommerce_settings_tabs_array', [$this, 'add_settings_tab'], 50);
           add_action('woocommerce_settings_tabs_mwe_settings', [$this, 'render_settings']);
           add_action('woocommerce_update_options_mwe_settings', [$this, 'save_settings']);
       }

       public function add_settings_tab(array $tabs): array {
           $tabs['mwe_settings'] = __('My Extension', 'my-woo-extension');
           return $tabs;
       }

       public function render_settings(): void {
           woocommerce_admin_fields($this->get_settings());
       }

       public function save_settings(): void {
           woocommerce_update_options($this->get_settings());
       }

       private function get_settings(): array {
           return [
               [
                   'title' => __('General Settings', 'my-woo-extension'),
                   'type'  => 'title',
                   'id'    => 'mwe_general_settings',
               ],
               [
                   'title'    => __('Enable Feature', 'my-woo-extension'),
                   'desc'     => __('Enable the custom feature', 'my-woo-extension'),
                   'id'       => 'mwe_enable_feature',
                   'type'     => 'checkbox',
                   'default'  => 'yes',
               ],
               [
                   'title'    => __('API Key', 'my-woo-extension'),
                   'desc'     => __('Enter your external service API key', 'my-woo-extension'),
                   'id'       => 'mwe_api_key',
                   'type'     => 'text',
                   'css'      => 'min-width: 300px;',
               ],
               [
                   'title'    => __('Processing Mode', 'my-woo-extension'),
                   'id'       => 'mwe_processing_mode',
                   'type'     => 'select',
                   'options'  => [
                       'sync'  => __('Synchronous', 'my-woo-extension'),
                       'async' => __('Asynchronous (Queue)', 'my-woo-extension'),
                   ],
                   'default'  => 'sync',
               ],
               [
                   'type' => 'sectionend',
                   'id'   => 'mwe_general_settings',
               ],
           ];
       }
   }
   ```

4. **Modify product data with filters**

   ```php
   class MWE_Product_Customizer {
       public function __construct() {
           // Add a custom product tab in admin
           add_filter('woocommerce_product_data_tabs', [$this, 'add_product_tab']);
           add_action('woocommerce_product_data_panels', [$this, 'render_product_panel']);
           add_action('woocommerce_process_product_meta', [$this, 'save_product_meta']);

           // Modify price display on frontend
           add_filter('woocommerce_get_price_html', [$this, 'modify_price_display'], 10, 2);

           // Add custom data to cart item
           add_filter('woocommerce_add_cart_item_data', [$this, 'add_custom_cart_data'], 10, 3);

           // Display custom data in cart
           add_filter('woocommerce_get_item_data', [$this, 'display_cart_item_data'], 10, 2);

           // Save custom data to order item
           add_action('woocommerce_checkout_create_order_line_item', [$this, 'save_order_item_meta'], 10, 4);
       }

       public function add_product_tab(array $tabs): array {
           $tabs['mwe_custom'] = [
               'label'    => __('Custom Fields', 'my-woo-extension'),
               'target'   => 'mwe_custom_product_data',
               'class'    => [],
               'priority' => 80,
           ];
           return $tabs;
       }

       public function render_product_panel(): void {
           global $post;
           echo '<div id="mwe_custom_product_data" class="panel woocommerce_options_panel">';

           wp_nonce_field('mwe_save_product_meta', 'mwe_product_meta_nonce');

           woocommerce_wp_text_input([
               'id'          => '_mwe_custom_field',
               'label'       => __('Custom Field', 'my-woo-extension'),
               'description' => __('Enter a custom value for this product', 'my-woo-extension'),
               'desc_tip'    => true,
           ]);

           woocommerce_wp_select([
               'id'      => '_mwe_product_badge',
               'label'   => __('Product Badge', 'my-woo-extension'),
               'options' => [
                   ''         => __('None', 'my-woo-extension'),
                   'new'      => __('New', 'my-woo-extension'),
                   'sale'     => __('Sale', 'my-woo-extension'),
                   'limited'  => __('Limited Edition', 'my-woo-extension'),
               ],
           ]);

           echo '</div>';
       }

       public function save_product_meta(int $post_id): void {
           // Verify nonce before processing $_POST data
           if (!isset($_POST['mwe_product_meta_nonce']) ||
               !wp_verify_nonce($_POST['mwe_product_meta_nonce'], 'mwe_save_product_meta')) {
               return;
           }

           $custom_field = sanitize_text_field($_POST['_mwe_custom_field'] ?? '');
           update_post_meta($post_id, '_mwe_custom_field', $custom_field);

           $badge = sanitize_text_field($_POST['_mwe_product_badge'] ?? '');
           update_post_meta($post_id, '_mwe_product_badge', $badge);
       }
   }
   ```

5. **Extend the WooCommerce REST API**

   ```php
   class MWE_REST_Controller {
       public function __construct() {
           add_action('rest_api_init', [$this, 'register_routes']);
       }

       public function register_routes(): void {
           register_rest_route('mwe/v1', '/analytics/summary', [
               'methods'             => \WP_REST_Server::READABLE,
               'callback'            => [$this, 'get_analytics_summary'],
               'permission_callback' => [$this, 'check_admin_permission'],
           ]);

           register_rest_route('mwe/v1', '/products/(?P<id>\d+)/custom-data', [
               'methods'             => \WP_REST_Server::READABLE,
               'callback'            => [$this, 'get_product_custom_data'],
               'permission_callback' => '__return_true',
               'args'                => [
                   'id' => [
                       'validate_callback' => function ($param) {
                           return is_numeric($param);
                       },
                   ],
               ],
           ]);
       }

       public function check_admin_permission(\WP_REST_Request $request): bool {
           return current_user_can('manage_woocommerce');
       }

       public function get_analytics_summary(\WP_REST_Request $request): \WP_REST_Response {
           $days = absint($request->get_param('days') ?? 30);
           $date_from = date('Y-m-d', strtotime("-{$days} days"));

           // HPOS-compatible order query
           $orders = wc_get_orders([
               'date_created' => ">={$date_from}",
               'status'       => ['wc-completed', 'wc-processing'],
               'limit'        => -1,
               'return'       => 'ids',
           ]);

           $total_revenue = 0;
           foreach ($orders as $order_id) {
               $order = wc_get_order($order_id);
               $total_revenue += (float) $order->get_total();
           }

           return new \WP_REST_Response([
               'period'        => "{$days}_days",
               'total_orders'  => count($orders),
               'total_revenue' => $total_revenue,
               'avg_order'     => count($orders) > 0 ? $total_revenue / count($orders) : 0,
           ]);
       }
   }
   ```

6. **Create a custom shipping method**

   ```php
   // Register the shipping method
   add_filter('woocommerce_shipping_methods', function (array $methods): array {
       $methods['mwe_custom_shipping'] = 'MWE_Custom_Shipping_Method';
       return $methods;
   });

   class MWE_Custom_Shipping_Method extends \WC_Shipping_Method {
       public function __construct(int $instance_id = 0) {
           $this->id                 = 'mwe_custom_shipping';
           $this->instance_id        = absint($instance_id);
           $this->method_title       = __('Custom Shipping', 'my-woo-extension');
           $this->method_description = __('Custom shipping rate calculation', 'my-woo-extension');
           $this->supports           = ['shipping-zones', 'instance-settings'];

           $this->init();
       }

       public function init(): void {
           $this->init_form_fields();
           $this->init_settings();

           $this->title = $this->get_option('title', 'Custom Shipping');
           $this->enabled = $this->get_option('enabled', 'yes');
       }

       public function init_form_fields(): void {
           $this->instance_form_fields = [
               'title' => [
                   'title'   => __('Method Title', 'my-woo-extension'),
                   'type'    => 'text',
                   'default' => 'Custom Shipping',
               ],
               'base_cost' => [
                   'title'   => __('Base Cost', 'my-woo-extension'),
                   'type'    => 'price',
                   'default' => '5.00',
               ],
               'per_item_cost' => [
                   'title'   => __('Per Item Cost', 'my-woo-extension'),
                   'type'    => 'price',
                   'default' => '1.00',
               ],
           ];
       }

       public function calculate_shipping($package = []): void {
           $base_cost = (float) $this->get_option('base_cost', 5);
           $per_item = (float) $this->get_option('per_item_cost', 1);

           $item_count = 0;
           foreach ($package['contents'] as $item) {
               $item_count += $item['quantity'];
           }

           $cost = $base_cost + ($per_item * $item_count);

           $this->add_rate([
               'id'    => $this->get_rate_id(),
               'label' => $this->title,
               'cost'  => $cost,
           ]);
       }
   }
   ```

## Examples

### Custom WooCommerce email notification

```php
class MWE_Custom_Email extends \WC_Email {
    public function __construct() {
        $this->id             = 'mwe_order_shipped';
        $this->title          = __('Order Shipped', 'my-woo-extension');
        $this->description    = __('Sent when an order is marked as shipped', 'my-woo-extension');
        $this->heading        = __('Your order has shipped!', 'my-woo-extension');
        $this->subject        = __('Your {site_title} order #{order_number} has shipped', 'my-woo-extension');
        $this->template_base  = MWE_PLUGIN_DIR . 'templates/';
        $this->template_html  = 'emails/order-shipped.php';
        $this->template_plain = 'emails/plain/order-shipped.php';
        $this->customer_email = true;

        add_action('mwe_order_shipped_notification', [$this, 'trigger'], 10, 2);

        parent::__construct();
    }

    public function trigger(int $order_id, string $tracking_number): void {
        $this->object = wc_get_order($order_id);
        if (!$this->object) return;

        $this->recipient = $this->object->get_billing_email();
        $this->placeholders['{tracking_number}'] = $tracking_number;

        if ($this->is_enabled() && $this->get_recipient()) {
            $this->send(
                $this->get_recipient(),
                $this->get_subject(),
                $this->get_content(),
                $this->get_headers(),
                $this->get_attachments()
            );
        }
    }
}

// Register the email class
add_filter('woocommerce_email_classes', function (array $emails): array {
    $emails['MWE_Order_Shipped'] = new MWE_Custom_Email();
    return $emails;
});
```

### HPOS-compatible order meta access

```php
// Old way (post meta) — DEPRECATED
// $value = get_post_meta($order_id, '_custom_field', true);

// New way (HPOS compatible)
$order = wc_get_order($order_id);

// Read custom meta
$custom_value = $order->get_meta('_mwe_custom_field', true);

// Write custom meta
$order->update_meta_data('_mwe_custom_field', 'new_value');
$order->save();

// Query orders with custom meta (HPOS compatible)
$orders = wc_get_orders([
    'meta_query' => [
        [
            'key'   => '_mwe_custom_field',
            'value' => 'specific_value',
        ],
    ],
    'status' => 'completed',
    'limit'  => 50,
]);
```

## Best Practices

- **Always declare HPOS compatibility** — WooCommerce is migrating to custom order tables; use `FeaturesUtil::declare_compatibility` and avoid direct `wp_posts` queries for orders
- **Use WooCommerce CRUD methods** — access order/product data via `$order->get_total()`, not `get_post_meta()`; CRUD methods work with both legacy and HPOS storage
- **Hook at the right priority** — default priority is 10; use lower numbers (5) to run before WooCommerce's own handlers, higher (20+) to run after
- **Sanitize and escape everything** — use `sanitize_text_field()` on input, `esc_html()` / `esc_attr()` on output; never trust `$_POST` or `$_GET` data
- **Use WooCommerce's built-in functions** — `wc_get_orders()`, `wc_get_products()`, `wc_price()` handle edge cases and are forward-compatible
- **Namespace your meta keys** — prefix all custom meta with your plugin slug (e.g., `_mwe_`) to avoid conflicts with other plugins
- **Support multisite** — use `is_plugin_active_for_network()` checks if your plugin needs to work on WordPress multisite
- **Test with WooCommerce's test suite** — use `WC_Unit_Test_Case` as a base class for PHPUnit tests

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Plugin breaks after WooCommerce update | Hook into `woocommerce_loaded` instead of `plugins_loaded` to ensure WooCommerce classes are available |
| Order meta not saving with HPOS enabled | Use `$order->update_meta_data()` and `$order->save()` instead of `update_post_meta()` |
| Hooks fire multiple times (duplicate emails, double stock reduction) | Check if the hook has already been processed using a static flag or transient; use `did_action()` to check |
| Custom shipping method not appearing | Ensure the method is registered via `woocommerce_shipping_methods` filter and the class extends `WC_Shipping_Method` |
| REST API endpoint returns 403 | Check `permission_callback` — use `current_user_can('manage_woocommerce')` for admin endpoints, or `'__return_true'` for public |

## Related Skills

- @woocommerce-performance
- @product-data-modeling
- @discount-engine
- @ecommerce-seo
- @erp-integration
