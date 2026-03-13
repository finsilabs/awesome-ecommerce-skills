---
name: woocommerce-blocks
description: "Customize WooCommerce checkout and cart pages using Gutenberg blocks with server-side rendering, slot-fills, and extensibility hooks"
category: platform-woocommerce
risk: safe
source: curated
date_added: "2026-03-12"
tags: [woocommerce, blocks, gutenberg, checkout, cart, inner-blocks, slot-fills, javascript]
triggers: ["woocommerce blocks", "woocommerce gutenberg checkout", "woocommerce block checkout", "customize woocommerce cart block", "woocommerce inner blocks"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [woocommerce]
difficulty: intermediate
---

# WooCommerce Blocks

## Overview

WooCommerce Blocks replaces the classic shortcode-based cart and checkout with React-powered Gutenberg blocks. Custom plugins can extend the Checkout Block by registering inner blocks (custom fields inside checkout steps), using SlotFills (inject UI into predefined injection points), and extending the Store API to save and retrieve custom data. The block-based checkout is the default for new WooCommerce stores since version 8.3.

## When to Use This Skill

- When adding custom fields to the checkout form (gift message, delivery date picker, VAT number)
- When injecting promotional content or upsell banners into the cart or checkout block
- When creating a custom checkout step with additional business logic
- When replacing the legacy shortcode checkout on existing WooCommerce sites
- When building a plugin that extends checkout behavior without modifying core templates

## Core Instructions

1. **Register a Checkout Inner Block**

   Inner blocks are React components that render inside a checkout step. They require PHP block registration + a JS/React frontend:

   ```php
   <?php
   // my-checkout-fields/my-checkout-fields.php
   add_action('woocommerce_blocks_loaded', function () {
       if (!class_exists('Automattic\WooCommerce\Blocks\Integrations\IntegrationInterface')) {
           return;
       }
       require_once __DIR__ . '/class-my-checkout-integration.php';
       add_action(
           'woocommerce_blocks_checkout_block_registration',
           function ($integration_registry) {
               $integration_registry->register(new My_Checkout_Integration());
           }
       );
   });
   ```

   ```php
   <?php
   // class-my-checkout-integration.php
   use Automattic\WooCommerce\Blocks\Integrations\IntegrationInterface;

   class My_Checkout_Integration implements IntegrationInterface {
       public function get_name() {
           return 'my-checkout-fields';
       }

       public function initialize() {
           $this->register_block_frontend_scripts();
           $this->register_inner_block();
       }

       private function register_block_frontend_scripts() {
           wp_register_script(
               'my-checkout-fields-frontend',
               plugin_dir_url(__FILE__) . 'build/frontend.js',
               ['wc-blocks-checkout', 'wp-element'],
               filemtime(plugin_dir_path(__FILE__) . 'build/frontend.js'),
               true
           );
       }

       private function register_inner_block() {
           register_block_type(plugin_dir_path(__FILE__) . 'build/blocks/gift-message/block.json');
       }

       public function get_script_handles() {
           return ['my-checkout-fields-frontend'];
       }

       public function get_editor_script_handles() {
           return [];
       }

       public function get_script_data() {
           return [];
       }
   }
   ```

2. **Create the inner block React component**

   ```javascript
   // src/blocks/gift-message/index.js
   import { registerCheckoutBlock } from "@woocommerce/blocks-checkout";
   import { __ } from "@wordpress/i18n";
   import { useEffect, useState } from "@wordpress/element";
   import {
     useExtensionCartUpdateData,
     extensionCartUpdate,
   } from "@woocommerce/blocks-checkout";

   const Block = ({ children, checkoutExtensionData }) => {
     const [giftMessage, setGiftMessage] = useState("");

     // Persist gift message to cart extension data
     const handleChange = (e) => {
       const value = e.target.value;
       setGiftMessage(value);
       extensionCartUpdate({
         namespace: "my-checkout-fields",
         data: { gift_message: value },
       });
     };

     return (
       <div className="wc-block-checkout__gift-message">
         <label htmlFor="gift-message">
           {__("Gift message (optional)", "my-checkout-fields")}
         </label>
         <textarea
           id="gift-message"
           value={giftMessage}
           onChange={handleChange}
           placeholder={__("Write your message here...", "my-checkout-fields")}
           rows={3}
           maxLength={200}
         />
         <span className="character-count">{giftMessage.length}/200</span>
       </div>
     );
   };

   registerCheckoutBlock({
     metadata: {
       name: "my-checkout-fields/gift-message",
       title: "Gift Message",
       category: "woocommerce",
       parent: ["woocommerce/checkout-shipping-methods-block"],
       attributes: {},
     },
     component: Block,
   });
   ```

3. **Extend the Store API to persist custom data**

   ```php
   <?php
   // Extend the Store API Cart schema to accept and store custom extension data
   add_action('woocommerce_blocks_loaded', function () {
       woocommerce_store_api_register_endpoint_data([
           'endpoint'        => Automattic\WooCommerce\StoreApi\Schemas\V1\CartSchema::IDENTIFIER,
           'namespace'       => 'my-checkout-fields',
           'schema_callback' => function () {
               return [
                   'gift_message' => [
                       'description' => 'Gift message for the order',
                       'type'        => 'string',
                       'context'     => ['view', 'edit'],
                       'readonly'    => false,
                       'sanitize_callback' => 'sanitize_textarea_field',
                   ],
               ];
           },
           'schema_type' => ARRAY_A,
       ]);

       // Save the gift message to WC session when cart is updated
       woocommerce_store_api_register_update_callback([
           'namespace' => 'my-checkout-fields',
           'callback'  => function (array $data) {
               if (isset($data['gift_message'])) {
                   WC()->session->set('gift_message', sanitize_textarea_field($data['gift_message']));
               }
           },
       ]);
   });

   // Transfer session data to order meta on checkout
   add_action('woocommerce_checkout_order_created', function ($order) {
       $gift_message = WC()->session->get('gift_message', '');
       if (!empty($gift_message)) {
           $order->update_meta_data('_gift_message', $gift_message);
           $order->save();
       }
   });
   ```

4. **Use SlotFills for injecting UI without inner blocks**

   SlotFills are simpler than inner blocks — they inject content into predefined slots:

   ```javascript
   // src/frontend.js
   import { registerPlugin } from "@wordpress/plugins";
   import { ExperimentalOrderMeta } from "@woocommerce/blocks-checkout";
   import { __ } from "@wordpress/i18n";
   import { useSelect } from "@wordpress/data";
   import { CART_STORE_KEY } from "@woocommerce/block-data";

   const CartUpsellBanner = () => {
     const cartTotal = useSelect((select) => {
       const cart = select(CART_STORE_KEY).getCartData();
       return cart?.totals?.total_items;
     });

     const freeShippingThreshold = 5000; // $50.00 in cents
     const remaining = freeShippingThreshold - parseInt(cartTotal ?? "0");

     if (remaining <= 0) return null;

     return (
       <div className="free-shipping-banner">
         {__(`Add $${(remaining / 100).toFixed(2)} more for free shipping!`, "my-checkout-fields")}
       </div>
     );
   };

   registerPlugin("my-cart-upsell", {
     render: () => (
       <ExperimentalOrderMeta>
         <CartUpsellBanner />
       </ExperimentalOrderMeta>
     ),
     scope: "woocommerce-checkout",
   });
   ```

5. **Build and enqueue assets with `@wordpress/scripts`**

   ```json
   // package.json
   {
     "scripts": {
       "build": "wp-scripts build src/frontend.js src/blocks/gift-message/index.js",
       "start": "wp-scripts start src/frontend.js src/blocks/gift-message/index.js"
     },
     "devDependencies": {
       "@wordpress/scripts": "^30.0.0"
     }
   }
   ```

   ```json
   // src/blocks/gift-message/block.json
   {
     "$schema": "https://schemas.wp.org/trunk/block.json",
     "apiVersion": 3,
     "name": "my-checkout-fields/gift-message",
     "title": "Gift Message",
     "category": "woocommerce",
     "parent": ["woocommerce/checkout-shipping-methods-block"],
     "textdomain": "my-checkout-fields",
     "editorScript": "file:../../build/blocks/gift-message/index.js",
     "script": "file:../../build/blocks/gift-message/index.js",
     "style": "file:../../build/blocks/gift-message/style-index.css"
   }
   ```

## Examples

### Checkout field validation

Validation of custom checkout data should be done **server-side** via the Store API update callback. Client-side filters (`__experimentalRegisterCheckoutFilters`) can only modify display values (e.g., price formatting), not validate form fields.

```php
<?php
// Server-side validation in the Store API update callback
woocommerce_store_api_register_update_callback([
    'namespace' => 'my-checkout-fields',
    'callback'  => function (array $data) {
        if (isset($data['gift_message'])) {
            $message = sanitize_textarea_field($data['gift_message']);

            // Reject messages that contain URLs
            if (preg_match('#https?://#i', $message)) {
                throw new \Automattic\WooCommerce\StoreApi\Exceptions\RouteException(
                    'invalid_gift_message',
                    __('Gift messages cannot contain links.', 'my-checkout-fields'),
                    400
                );
            }

            WC()->session->set('gift_message', $message);
        }
    },
]);
```

On the client side, handle the error response from `extensionCartUpdate` to display validation messages:

```javascript
import { extensionCartUpdate } from "@woocommerce/blocks-checkout";

const handleChange = async (e) => {
  const value = e.target.value;
  setGiftMessage(value);
  try {
    await extensionCartUpdate({
      namespace: "my-checkout-fields",
      data: { gift_message: value },
    });
    setError(null);
  } catch (err) {
    setError(err.message);
  }
};
```

### Disable a payment method for certain cart conditions

```php
<?php
// Hide "Pay Later" payment method if cart contains digital-only products
add_filter(
    'woocommerce_blocks_payment_method_type_registration',
    function ($payment_method_registry) {
        $payment_method_registry->register(
            new class implements \Automattic\WooCommerce\Blocks\Payments\PaymentMethodTypeInterface {
                public function is_active() { return true; }
                public function get_payment_method_script_handles() { return []; }
                public function get_payment_method_data() { return []; }
                public function get_name() { return 'custom-payment-guard'; }
                public function initialize() {}
            }
        );
        return $payment_method_registry;
    }
);

add_filter('__experimental_woocommerce_blocks_payment_gateway_features_list', function ($features, $name) {
    if ($name === 'pay-later') {
        // Check if all items in cart are virtual/downloadable
        $cart_has_physical = false;
        foreach (WC()->cart->get_cart() as $item) {
            $product = $item['data'];
            if (!$product->is_virtual() && !$product->is_downloadable()) {
                $cart_has_physical = true;
                break;
            }
        }
        if (!$cart_has_physical) {
            $features['available'] = false;
        }
    }
    return $features;
}, 10, 2);
```

## Best Practices

- **Use `extensionCartUpdate` instead of local state** for data that must survive page reload — it stores data in the WooCommerce session via the Store API
- **Sanitize all custom data server-side** — PHP `sanitize_textarea_field`, `sanitize_text_field`, and `absint` are essential for any data written to order meta
- **Build with `@wordpress/scripts`** — it handles dependency extraction, webpack config, and asset versioning automatically for WordPress/Gutenberg projects
- **Use `block.json` for inner blocks** — the block registry requires a `block.json` manifest; it also enables automatic asset loading in the editor
- **Test both classic and block checkout** — some stores may still use the shortcode checkout; conditionally enqueue scripts only when block checkout is detected
- **Use the `woocommerce_store_api_register_update_callback` for server validation** — client-side validation can be bypassed; always re-validate extension data in the callback
- **Prefix all meta keys and namespaces** with your plugin slug to avoid conflicts with other plugins

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Inner block not appearing in editor | Ensure `parent` in `block.json` matches the exact block name of the checkout step you're targeting; use browser devtools to confirm the parent block name |
| Extension data not persisting to order | Add `woocommerce_checkout_order_created` hook to transfer session data to order meta — Store API session data is not automatically copied to orders |
| SlotFill component not rendering | The `scope: "woocommerce-checkout"` is required in `registerPlugin`; omitting it or using the wrong scope silently prevents rendering |
| Build errors with `@wordpress/scripts` | The entry points must be specified in `package.json` scripts or `wp-scripts.config.js`; by default only `src/index.js` is built |
| Blocks break on WooCommerce downgrade | Pin `@woocommerce/blocks-checkout` package version to match the installed WooCommerce version in `composer.json` |
| `useSelect(CART_STORE_KEY)` returns undefined | Ensure the `@woocommerce/block-data` package is in the `dependencies` array of `wp_register_script` — the store is not globally available |

## Related Skills

- @woocommerce-plugin-development
- @woocommerce-rest-api
- @gutenberg-block-development
- @checkout-flow-optimization
- @woocommerce-subscriptions
