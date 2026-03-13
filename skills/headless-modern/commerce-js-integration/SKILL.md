---
name: commerce-js-integration
description: "Build a lightweight headless store using the Commerce.js SDK for product display, cart management, and checkout without a heavy backend"
category: headless-modern
risk: safe
source: curated
date_added: "2026-03-12"
tags: [commercejs, chec, headless, sdk, cart, checkout, products, javascript]
triggers: ["commerce.js", "chec platform", "commercejs sdk", "lightweight headless store", "commercejs integration"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: beginner
---

# Commerce.js Integration

## Overview

Commerce.js (Chec) is a headless commerce platform offering a JavaScript SDK that wraps its REST API for managing products, carts, checkouts, and orders. It is designed for developers who want to add commerce functionality to any website or JavaScript framework without the complexity of a full e-commerce platform. The SDK handles product fetching, cart lifecycle, checkout token creation, and order capture in a straightforward, promise-based API.

## When to Use This Skill

- When you want to add e-commerce to a static site or simple React/Vue/Svelte project quickly
- When you don't need a complex backend and want a managed commerce API without server-side code
- When building a portfolio project, MVP, or proof-of-concept headless store
- When your catalog is small (under 1,000 products) and you don't need custom fulfillment logic
- When you want a simple SDK without managing a full Shopify or commercetools environment

## Prerequisites & Platform Notes

**This skill is written for custom/headless storefronts** (Node.js, Python, or similar backend). The code examples use TypeScript/Node.js and can be adapted to any stack.

**Shopify**: Shopify Hydrogen is Shopify's headless framework. MACH/composable patterns apply when using Shopify as the commerce backend with a custom frontend, or when mixing Shopify with other best-of-breed services.
**WooCommerce**: WooCommerce can serve as a headless backend via its REST API and WPGraphQL. These patterns apply when decoupling the frontend from WordPress.
**Magento**: Magento's GraphQL API and PWA Studio support headless architectures. These composable patterns apply to Magento as a backend service in a MACH stack.

**You'll need**:
- Node.js 18+ (or adapt to your backend language)
- Stripe account and API keys
- An email sending service (SendGrid, AWS SES, or Postmark)

## Core Instructions

1. **Install the SDK and initialize the client**

   ```bash
   npm install @chec/commerce.js
   ```

   ```javascript
   import Commerce from '@chec/commerce.js';

   // Public key is safe to expose in the browser
   const commerce = new Commerce(process.env.NEXT_PUBLIC_CHEC_PUBLIC_KEY, true); // true = debug mode
   ```

   Get your public API key from the Chec Dashboard under **Developer → API keys**.

2. **Fetch and display products**

   ```javascript
   // Fetch all products
   const {data: products} = await commerce.products.list({
     limit: 20,
     page: 1,
     sort_by: 'created',
     sort_direction: 'desc',
   });

   // Fetch a single product by permalink (slug)
   const product = await commerce.products.retrieve('my-product-slug', {type: 'permalink'});

   // Products include structured data
   console.log({
     id: product.id,
     name: product.name,
     price: product.price.formatted_with_symbol, // "$29.99"
     description: product.description,           // HTML string from Chec CMS
     image: product.image?.url,
     variants: product.variants,                 // Size, color options
   });
   ```

   React component example:

   ```tsx
   import {useEffect, useState} from 'react';
   import Commerce from '@chec/commerce.js';

   const commerce = new Commerce(process.env.NEXT_PUBLIC_CHEC_PUBLIC_KEY!);

   export function ProductGrid() {
     const [products, setProducts] = useState<any[]>([]);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
       commerce.products.list()
         .then(({data}) => setProducts(data))
         .finally(() => setLoading(false));
     }, []);

     if (loading) return <div>Loading...</div>;

     return (
       <div className="grid grid-cols-3 gap-6">
         {products.map(product => (
           <div key={product.id} className="border rounded-lg p-4">
             <img src={product.image?.url} alt={product.name} className="w-full h-48 object-cover" />
             <h2 className="mt-2 font-semibold">{product.name}</h2>
             <p className="text-gray-600">{product.price.formatted_with_symbol}</p>
             <AddToCartButton productId={product.id} />
           </div>
         ))}
       </div>
     );
   }
   ```

3. **Manage the cart**

   Commerce.js stores the cart ID in localStorage automatically:

   ```javascript
   // Get or create the current cart
   const cart = await commerce.cart.retrieve();

   // Add a product to the cart
   const updatedCart = await commerce.cart.add(productId, quantity, {
     // Optional: specify variant selections
     variantId: 'variant_id_here',
     optionId: 'option_id_here',
   });

   // Update line item quantity
   await commerce.cart.update(lineItemId, {quantity: 3});

   // Remove a line item
   await commerce.cart.remove(lineItemId);

   // Empty the cart
   await commerce.cart.empty();

   // Refresh the cart
   const refreshedCart = await commerce.cart.refresh();
   ```

   Cart state management with React Context:

   ```tsx
   // context/cart-context.tsx
   import {createContext, useContext, useState, useEffect} from 'react';
   import Commerce from '@chec/commerce.js';

   const commerce = new Commerce(process.env.NEXT_PUBLIC_CHEC_PUBLIC_KEY!);
   const CartContext = createContext<any>(null);

   export function CartProvider({children}: {children: React.ReactNode}) {
     const [cart, setCart] = useState<any>(null);

     useEffect(() => { commerce.cart.retrieve().then(setCart); }, []);

     const addToCart = async (productId: string, quantity = 1) => {
       const {cart: updated} = await commerce.cart.add(productId, quantity);
       setCart(updated);
     };

     const removeFromCart = async (lineItemId: string) => {
       const {cart: updated} = await commerce.cart.remove(lineItemId);
       setCart(updated);
     };

     return (
       <CartContext.Provider value={{cart, addToCart, removeFromCart}}>
         {children}
       </CartContext.Provider>
     );
   }

   export const useCart = () => useContext(CartContext);
   ```

4. **Generate a checkout token and capture the order**

   ```javascript
   // Step 1: Generate a checkout token from the cart
   const checkoutToken = await commerce.checkout.generateToken(cart.id, {type: 'cart'});

   // Step 2: Get live checkout information (shipping options, taxes)
   const checkoutData = await commerce.checkout.getLive(checkoutToken.id);

   // Step 3: Capture the order
   const order = await commerce.checkout.capture(checkoutToken.id, {
     customer: {
       firstname: 'Jane',
       lastname: 'Doe',
       email: 'jane@example.com',
     },
     shipping: {
       name: 'Jane Doe',
       street: '123 Main Street',
       town_city: 'San Francisco',
       county_state: 'US-CA',
       postal_zip_code: '94103',
       country: 'US',
     },
     fulfillment: {
       shipping_method: checkoutData.shipping.available_options[0].id,
     },
     payment: {
       gateway: 'stripe',
       stripe: {
         payment_method_id: stripePaymentMethodId, // from Stripe.js
       },
     },
   });

   console.log(`Order #${order.customer_reference} placed!`);
   // Clear the cart after successful order
   await commerce.cart.refresh();
   ```

5. **Handle product variants**

   ```javascript
   const product = await commerce.products.retrieve(productId);

   // Variants are organized as variant groups (e.g., "Size") with options (e.g., "S", "M", "L")
   product.variants.forEach(variantGroup => {
     console.log(`Variant group: ${variantGroup.name}`);
     variantGroup.options.forEach(option => {
       console.log(`  - ${option.name}: +${option.price.formatted_with_symbol}`);
     });
   });

   // When adding to cart, provide the full variant selection
   const selections = {
     [sizeVariantGroupId]: selectedSizeOptionId,
     [colorVariantGroupId]: selectedColorOptionId,
   };

   await commerce.cart.add(product.id, 1, selections);
   ```

6. **List and display orders**

   ```javascript
   // Requires a customer JWT (obtained via commerce.customer.login)
   const customerToken = await commerce.customer.login(email, password);

   const {data: orders} = await commerce.orders.getAllForCustomer({
     customer_token: customerToken.token,
   });

   orders.forEach(order => {
     console.log({
       reference: order.customer_reference,
       status: order.status,
       total: order.order_value.formatted_with_symbol,
       items: order.order.line_items.map(item => item.product_name),
     });
   });
   ```

## Examples

### Complete Next.js product page

```tsx
// app/products/[permalink]/page.tsx
import Commerce from '@chec/commerce.js';
import DOMPurify from 'isomorphic-dompurify';

// Server-side: use secret key to fetch product at build time
const commerce = new Commerce(process.env.CHEC_SECRET_KEY!);

export async function generateStaticParams() {
  const {data: products} = await commerce.products.list({limit: 200});
  return products.map((p: any) => ({permalink: p.permalink}));
}

export default async function ProductPage({params}: {params: {permalink: string}}) {
  const product = await commerce.products.retrieve(params.permalink, {type: 'permalink'});
  // Sanitize HTML from Chec CMS before rendering
  const safeDescription = DOMPurify.sanitize(product.description ?? '');

  return (
    <main>
      <img src={product.image?.url} alt={product.name} />
      <h1>{product.name}</h1>
      {/* Sanitized HTML rendered safely */}
      <div dangerouslySetInnerHTML={{__html: safeDescription}} />
      <p className="text-xl font-bold">{product.price.formatted_with_symbol}</p>
    </main>
  );
}
```

### Cart item count badge

```tsx
export function CartBadge() {
  const {cart} = useCart();
  const totalItems = cart?.total_unique_items ?? 0;

  return (
    <button className="relative">
      <ShoppingCartIcon />
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </button>
  );
}
```

## Best Practices

- **Use the public key on the client, secret key on the server** — the public key can only read products and manage carts; the secret key can also manage orders and is not safe to expose in browser code
- **Initialize the `Commerce` client once** — create a single instance in a module-level constant and import it; avoid creating a new instance on every render
- **Handle webhook events for order automation** — configure Chec webhooks in the dashboard to POST to your server when orders are placed, updated, or refunded
- **Use checkout tokens, not cart IDs, for checkout** — `generateToken` creates a time-limited, checkout-specific token; always pass this token to `capture`, never the raw cart ID
- **Refresh the cart after order capture** — calling `commerce.cart.refresh()` after a successful order creates a fresh empty cart; the old cart ID is invalidated
- **Sanitize product description HTML before rendering** — product descriptions are HTML from the Chec CMS; always run them through DOMPurify (`isomorphic-dompurify` works in both Node.js and browser) before rendering
- **Implement error handling for checkout capture** — wrap `commerce.checkout.capture` in try/catch and map `commerce.error` codes to user-friendly messages

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| `Commerce is not a constructor` | Ensure you import as `import Commerce from '@chec/commerce.js'` (default import, not named) |
| Cart not persisting between page loads | Commerce.js stores the cart in localStorage under `chec_cart_id`; ensure localStorage is available and not blocked |
| Checkout token expires | Checkout tokens expire after 7 days; generate a new token from the cart immediately before starting checkout |
| Variant selections not applied | Pass selections as the third argument to `commerce.cart.add()`: `commerce.cart.add(id, qty, {variantGroupId: optionId})` |
| Payment gateway not configured | Enable and configure the payment gateway (Stripe, Square, etc.) in the Chec Dashboard under **Setup → Payment gateways** |

## Related Skills

- @jamstack-storefront
- @shopify-hydrogen
- @secure-checkout
- @webhook-architecture
