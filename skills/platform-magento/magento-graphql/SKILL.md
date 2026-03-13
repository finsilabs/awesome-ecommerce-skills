---
name: magento-graphql
description: "Query Magento's GraphQL API to build headless storefronts or PWA Studio frontends with products, cart, checkout, and customer operations"
category: platform-magento
risk: safe
source: curated
date_added: "2026-03-12"
tags: [magento, graphql, headless, pwa-studio, storefront, cart, products, luma]
triggers: ["magento graphql", "magento headless", "magento pwa", "magento graphql api", "magento storefront api", "adobe commerce graphql"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [magento]
difficulty: intermediate
---

# Magento GraphQL API

## Overview

Magento 2 (and Adobe Commerce) ships a comprehensive GraphQL API for storefront operations — product catalog, search, cart, checkout, customer authentication, and order history. The endpoint is `/graphql` and does not require an admin token for public catalog data. Cart and customer operations require a guest cart ID (UUID) or a Bearer token from customer login. PWA Studio (Venia) is built entirely on this API, making it the reference implementation for headless Magento.

## When to Use This Skill

- When building a React, Vue, or Next.js headless storefront on Magento 2
- When creating a native mobile app that needs Magento product and checkout data
- When implementing PWA Studio extensions that fetch custom data via GraphQL resolvers
- When replacing REST API calls with more efficient GraphQL queries in existing headless projects
- When building a custom GraphQL resolver to expose third-party or custom module data
- When integrating a headless CMS with Magento's product catalog

## Core Instructions

1. **Set up the GraphQL client**

   Magento GraphQL uses standard HTTP POST to `/graphql`. Use Apollo Client or a lightweight fetch wrapper:

   ```typescript
   // lib/magento.ts
   const MAGENTO_URL = process.env.NEXT_PUBLIC_MAGENTO_URL; // e.g. https://magento.example.com

   export async function magentoQuery<T>(
     query: string,
     variables: Record<string, unknown> = {},
     token?: string
   ): Promise<T> {
     const headers: Record<string, string> = {
       "Content-Type": "application/json",
       Store: process.env.NEXT_PUBLIC_MAGENTO_STORE_CODE ?? "default",
     };

     if (token) {
       headers["Authorization"] = `Bearer ${token}`;
     }

     const response = await fetch(`${MAGENTO_URL}/graphql`, {
       method: "POST",
       headers,
       body: JSON.stringify({ query, variables }),
       next: { revalidate: 300 }, // Next.js ISR caching
     });

     if (!response.ok) {
       throw new Error(`Magento GraphQL HTTP error: ${response.status}`);
     }

     const { data, errors } = await response.json();
     if (errors?.length) {
       throw new Error(errors[0].message);
     }
     return data as T;
   }
   ```

2. **Query the product catalog**

   ```typescript
   // Fetch products by category UID or search
   export async function getProducts(params: {
     categoryUid?: string;
     search?: string;
     pageSize?: number;
     currentPage?: number;
   }) {
     return magentoQuery<{ products: MagentoProductList }>(`
       query GetProducts(
         $search: String
         $filter: ProductAttributeFilterInput
         $pageSize: Int
         $currentPage: Int
       ) {
         products(
           search: $search
           filter: $filter
           pageSize: $pageSize
           currentPage: $currentPage
           sort: { position: ASC }
         ) {
           total_count
           page_info { current_page page_size total_pages }
           aggregations {
             attribute_code label count
             options { label value count }
           }
           items {
             uid sku name url_key
             ... on SimpleProduct {
               price_range {
                 minimum_price {
                   regular_price { value currency }
                   final_price { value currency }
                   discount { percent_off amount_off }
                 }
               }
             }
             ... on ConfigurableProduct {
               configurable_options {
                 attribute_code label
                 values { uid label swatch_data { value } }
               }
               variants {
                 attributes { uid label code value_index }
                 product { sku stock_status price_range { minimum_price { final_price { value } } } }
               }
             }
             small_image { url label }
             thumbnail { url label }
             rating_summary review_count
             stock_status
           }
         }
       }
     `, {
       search: params.search,
       filter: params.categoryUid ? { category_uid: { eq: params.categoryUid } } : undefined,
       pageSize: params.pageSize ?? 20,
       currentPage: params.currentPage ?? 1,
     });
   }
   ```

3. **Create guest cart and add items**

   ```typescript
   // Create a guest cart and get the cart ID
   export async function createGuestCart(): Promise<string> {
     const data = await magentoQuery<{ createEmptyCart: string }>(`
       mutation { createEmptyCart }
     `);
     return data.createEmptyCart; // Returns a UUID cart ID
   }

   // Add a simple product to cart
   export async function addSimpleProductToCart(cartId: string, sku: string, qty: number) {
     return magentoQuery(`
       mutation AddSimpleProduct($cartId: String!, $sku: String!, $qty: Float!) {
         addSimpleProductsToCart(
           input: {
             cart_id: $cartId
             cart_items: [{ data: { sku: $sku, quantity: $qty } }]
           }
         ) {
           cart {
             items {
               uid quantity
               product { name sku }
               prices { price { value currency } }
             }
             prices {
               subtotal_excluding_tax { value currency }
               grand_total { value currency }
             }
           }
         }
       }
     `, { cartId, sku, qty });
   }

   // Add a configurable product with selected variant
   export async function addConfigurableProductToCart(
     cartId: string,
     parentSku: string,
     variantSku: string,
     qty: number
   ) {
     return magentoQuery(`
       mutation AddConfigurable($cartId: String!, $parentSku: String!, $variantSku: String!, $qty: Float!) {
         addConfigurableProductsToCart(
           input: {
             cart_id: $cartId
             cart_items: [{
               parent_sku: $parentSku
               data: { sku: $variantSku, quantity: $qty }
             }]
           }
         ) {
           cart {
             items { uid quantity product { name } }
           }
         }
       }
     `, { cartId, parentSku, variantSku, qty });
   }
   ```

4. **Authenticate customers and manage accounts**

   ```typescript
   // Customer login — returns a bearer token
   export async function loginCustomer(email: string, password: string): Promise<string> {
     const data = await magentoQuery<{ generateCustomerToken: { token: string } }>(`
       mutation Login($email: String!, $password: String!) {
         generateCustomerToken(email: $email, password: $password) {
           token
         }
       }
     `, { email, password });
     return data.generateCustomerToken.token;
   }

   // Get authenticated customer's cart
   export async function getCustomerCart(token: string) {
     return magentoQuery(`
       query {
         customerCart {
           id
           items {
             uid quantity
             product { name sku small_image { url } }
             prices { price { value currency } }
           }
           prices { grand_total { value currency } }
         }
       }
     `, {}, token);
   }

   // Get order history
   export async function getCustomerOrders(token: string, pageSize = 10) {
     return magentoQuery(`
       query GetOrders($pageSize: Int) {
         customer {
           orders(pageSize: $pageSize, sort: { sort_field: CREATED_AT, sort_direction: DESC }) {
             total_count
             items {
               id number status order_date
               total { grand_total { value currency } }
               items { product_name product_sku quantity_ordered }
               shipping_address { firstname lastname city region { code } country_code }
             }
           }
         }
       }
     `, { pageSize }, token);
   }
   ```

5. **Create a custom GraphQL resolver in a Magento 2 module**

   ```php
   <?php
   // app/code/MyVendor/CustomGraphQL/etc/schema.graphqls

   type Query {
       myCustomProducts(
           brand: String @doc(description: "Filter by brand")
       ): MyCustomProductOutput @resolver(class: "MyVendor\\CustomGraphQL\\Model\\Resolver\\CustomProducts") @doc(description: "Get custom product list")
   }

   type MyCustomProductOutput {
       items: [CustomProductItem]
       total_count: Int
   }

   type CustomProductItem {
       sku: String
       name: String
       brand: String
       custom_attribute: String
   }
   ```

   ```php
   <?php
   // app/code/MyVendor/CustomGraphQL/Model/Resolver/CustomProducts.php
   namespace MyVendor\CustomGraphQL\Model\Resolver;

   use Magento\Framework\GraphQl\Config\Element\Field;
   use Magento\Framework\GraphQl\Query\ResolverInterface;
   use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
   use Magento\Catalog\Model\ResourceModel\Product\CollectionFactory;

   class CustomProducts implements ResolverInterface
   {
       public function __construct(
           private readonly CollectionFactory $collectionFactory
       ) {}

       public function resolve(Field $field, $context, ResolveInfo $info, array $value = null, array $args = null)
       {
           $collection = $this->collectionFactory->create();
           $collection->addAttributeToSelect(['sku', 'name', 'brand', 'custom_attribute']);
           $collection->addAttributeToFilter('status', 1);
           $collection->addAttributeToFilter('visibility', ['neq' => 1]);

           if (!empty($args['brand'])) {
               $collection->addAttributeToFilter('brand', ['like' => '%' . $args['brand'] . '%']);
           }

           $items = [];
           foreach ($collection as $product) {
               $items[] = [
                   'sku'              => $product->getSku(),
                   'name'             => $product->getName(),
                   'brand'            => $product->getData('brand'),
                   'custom_attribute' => $product->getData('custom_attribute'),
               ];
           }

           return ['items' => $items, 'total_count' => $collection->getSize()];
       }
   }
   ```

## Examples

### Product detail page — configurable product with swatches

```typescript
export async function getProductByUrlKey(urlKey: string) {
  return magentoQuery<{ products: { items: MagentoProduct[] } }>(`
    query GetProduct($urlKey: String!) {
      products(filter: { url_key: { eq: $urlKey } }) {
        items {
          uid sku name url_key
          meta_title meta_description
          description { html }
          short_description { html }
          ... on ConfigurableProduct {
            configurable_options {
              id uid label attribute_code position
              values {
                uid label
                swatch_data {
                  ... on ColorSwatchData { value }
                  ... on ImageSwatchData { thumbnail value }
                  ... on TextSwatchData { value }
                }
              }
            }
            variants {
              attributes { uid label code value_index }
              product {
                uid sku stock_status
                media_gallery { url label disabled }
                price_range {
                  minimum_price {
                    regular_price { value currency }
                    final_price { value currency }
                  }
                }
              }
            }
          }
          media_gallery { url label disabled position }
          reviews(pageSize: 5) {
            items {
              summary text created_at
              ratings_breakdown { name value }
              nickname
            }
          }
        }
      }
    }
  `, { urlKey });
}
```

### Checkout flow — set shipping address and place order

```typescript
export async function setShippingAddress(cartId: string, address: AddressInput) {
  return magentoQuery(`
    mutation SetShipping($cartId: String!, $address: CartAddressInput!) {
      setShippingAddressesOnCart(input: {
        cart_id: $cartId
        shipping_addresses: [{ address: $address }]
      }) {
        cart {
          shipping_addresses {
            available_shipping_methods {
              carrier_code method_code carrier_title method_title
              amount { value currency }
            }
          }
        }
      }
    }
  `, { cartId, address });
}

export async function placeOrder(cartId: string) {
  return magentoQuery<{ placeOrder: { order: { order_number: string } } }>(`
    mutation PlaceOrder($cartId: String!) {
      placeOrder(input: { cart_id: $cartId }) {
        order { order_number }
        errors { message code }
      }
    }
  `, { cartId });
}
```

## Best Practices

- **Use the `Store` HTTP header** to target specific store views — without it, Magento defaults to the default store and returns incorrect pricing/currency for multi-store setups
- **Enable GraphQL query caching** in Magento via Varnish or built-in cache for public catalog queries — product list queries can be cached for minutes to reduce PHP execution
- **Use inline fragments for polymorphic product types** — always include `... on SimpleProduct`, `... on ConfigurableProduct`, `... on BundleProduct` where applicable
- **Persist the cart ID in a cookie** — guest cart IDs (UUID) expire after 24 hours of inactivity; merge with customer cart after login using `mergeCarts` mutation
- **Batch related queries** — Apollo Client batching or manual query merging reduces RTTs for pages that need product + category + CMS block data simultaneously
- **Implement proper error handling for `errors` array** — GraphQL responses return 200 even for errors; always check `errors` property in the response body
- **Cache customer tokens securely** — store bearer tokens in `httpOnly` cookies, not `localStorage`, to prevent XSS token theft

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Products missing from GraphQL but visible in Admin | Check the product's `visibility` attribute — products set to "Not Visible Individually" won't appear in catalog queries |
| Configurable product variants return empty `stock_status` | Query the `product` field inside `variants.product` — stock is tracked at the simple product (variant) level, not the parent |
| Custom resolver not recognized | Run `bin/magento setup:upgrade` after adding new GraphQL schema files; also check `schema.graphqls` syntax carefully |
| Cart merge fails after customer login | Call `mergeCarts(source_cart_id: $guestCartId, destination_cart_id: $customerCartId)` — then discard the guest cart ID cookie |
| Slow GraphQL responses | Enable Magento's built-in GraphQL caching: `bin/magento config:set system/full_page_cache/caching_application 1`; use Varnish for public queries |
| Bearer token expired mid-session | Implement token refresh: catch `The current customer isn't authorized` error and redirect to login or use refresh token if available |

## Related Skills

- @magento-module-development
- @magento-indexing-caching
- @magento-multi-store
- @headless-commerce-architecture
- @graphql-api-design
