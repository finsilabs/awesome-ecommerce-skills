---
name: shopify-checkout-extensions
description: "Customize Shopify's checkout with UI extensions for upsells and custom fields, plus Shopify Functions for serverless discount and shipping logic"
category: platform-shopify
risk: safe
source: curated
date_added: "2026-03-12"
tags: [shopify, checkout-extensions, shopify-functions, checkout-ui, discounts, custom-logic, wasm]
triggers: ["shopify checkout extension", "shopify checkout ui", "shopify functions", "customize shopify checkout", "shopify checkout customization", "shopify discount function"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify]
difficulty: advanced
---

# Shopify Checkout Extensions

## Overview

Shopify Checkout Extensions allow apps to render custom UI blocks inside Shopify's checkout without forking the checkout template. Shopify Functions let you replace backend logic — discounts, shipping, payment methods, and order validation — with custom WebAssembly modules that run inside Shopify's infrastructure. Together they replace the deprecated `checkout.liquid` customization approach and work with both Shopify Plus and non-Plus stores (UI extensions) or Plus-only (some Functions targets).

## When to Use This Skill

- When adding custom UI blocks to checkout (upsells, trust badges, gift message fields, warranty options)
- When implementing custom discount logic beyond native Shopify discount rules (e.g., tiered discounts, B2B pricing)
- When creating custom shipping method filtering or renaming based on cart contents
- When building payment customization to hide/rename payment methods for specific customers
- When validating order contents before checkout completes (e.g., quantity limits, region restrictions)
- When replacing deprecated `checkout.liquid` customizations for Shopify Plus stores

## Core Instructions

1. **Scaffold an extension with Shopify CLI**

   ```bash
   # Inside an existing Shopify app directory
   shopify app generate extension
   # Choose: Checkout UI extension OR Shopify Function
   # Name: my-checkout-extension
   ```

   This creates an `extensions/my-checkout-extension/` directory with `src/index.tsx` (UI) or `src/index.ts` (Function).

2. **Build a Checkout UI extension**

   Checkout UI extensions use a React-like component API from `@shopify/ui-extensions-react/checkout`:

   ```typescript
   // extensions/order-upsell/src/index.tsx
   import {
     reactExtension,
     useCartLines,
     useApplyCartLinesChange,
     useSettings,
     BlockStack,
     Button,
     Image,
     Text,
     InlineStack,
     Divider,
   } from "@shopify/ui-extensions-react/checkout";

   const CheckoutBlock = reactExtension(
     "purchase.checkout.block.render",
     () => <OrderUpsell />
   );
   export { CheckoutBlock };

   function OrderUpsell() {
     const cartLines = useCartLines();
     const applyCartLinesChange = useApplyCartLinesChange();
     const { upsell_variant_id: upsellVariantId } = useSettings();

     // Only show upsell if a variant is configured and cart doesn't already contain it
     if (!upsellVariantId) return null;

     const alreadyInCart = cartLines.some(
       (line) => line.merchandise.id === upsellVariantId
     );

     if (alreadyInCart) return null;

     const handleAddUpsell = async () => {
       await applyCartLinesChange({
         type: "addCartLine",
         merchandiseId: upsellVariantId,
         quantity: 1,
       });
     };

     return (
       <BlockStack spacing="base">
         <Divider />
         <InlineStack blockAlignment="center" spacing="base">
           <Image source="https://cdn.shopify.com/s/files/..." aspectRatio={1} />
           <BlockStack>
             <Text emphasis="bold">Add a gift bag for $3.99</Text>
             <Text appearance="subdued">Beautiful packaging for your order</Text>
           </BlockStack>
           <Button onPress={handleAddUpsell}>Add</Button>
         </InlineStack>
       </BlockStack>
     );
   }
   ```

3. **Configure the extension in `shopify.extension.toml`**

   ```toml
   api_version = "2025-01"

   [[extensions]]
   type = "ui_extension"
   name = "Order Upsell"
   handle = "order-upsell"

   [[extensions.targeting]]
   module = "./src/index.tsx"
   target = "purchase.checkout.block.render"

   [extensions.settings]
   [[extensions.settings.fields]]
   key = "upsell_variant_id"
   type = "variant_reference"
   name = "Upsell Product Variant"
   ```

4. **Build a Shopify Function for custom discounts**

   Shopify Functions compile to WebAssembly. Use Rust or JavaScript:

   ```typescript
   // extensions/volume-discount/src/index.ts
   import type {
     RunInput,
     FunctionRunResult,
     CartLineInput,
   } from "../generated/api";

   const NO_CHANGES: FunctionRunResult = { discounts: [], discountApplicationStrategy: "FIRST" };

   export function run(input: RunInput): FunctionRunResult {
     const { cart } = input;

     // Calculate total quantity across all lines
     const totalQuantity = cart.lines.reduce(
       (sum, line) => sum + line.quantity,
       0
     );

     // Tiered volume discount
     let discountPercent = 0;
     if (totalQuantity >= 20) discountPercent = 20;
     else if (totalQuantity >= 10) discountPercent = 10;
     else if (totalQuantity >= 5) discountPercent = 5;

     if (discountPercent === 0) return NO_CHANGES;

     return {
       discounts: [
         {
           value: {
             percentage: { value: discountPercent.toString() },
           },
           targets: [{ orderSubtotal: { excludedVariantIds: [] } }],
           message: `${discountPercent}% volume discount (${totalQuantity} items)`,
         },
       ],
       discountApplicationStrategy: "FIRST",
     };
   }
   ```

   Function `shopify.extension.toml`:

   ```toml
   api_version = "2025-01"

   [[extensions]]
   type = "function"
   name = "Volume Discount"
   handle = "volume-discount"
   runtime = "javascript"

   [[extensions.input.variables]]
   name = "cart"
   type = "Cart"

   [extensions.build]
   command = "npm run build"
   path = "dist/index.wasm"
   ```

5. **Test and deploy extensions**

   ```bash
   # Run local dev preview (UI extension hot-reloads in checkout)
   shopify app dev
   # Open the checkout preview URL shown in terminal

   # Deploy all extensions to Shopify
   shopify app deploy
   ```

   After deploying, go to Admin → Checkout → Customize to add the UI extension block to a checkout template. Functions are activated by creating a discount with the function from Admin → Discounts.

## Examples

### Gift message field using useApplyMetafieldsChange

```typescript
import {
  reactExtension,
  TextField,
  useApplyMetafieldsChange,
  useMetafield,
  BlockStack,
  Text,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension(
  "purchase.checkout.shipping-option-list.render-after",
  () => <GiftMessage />
);

function GiftMessage() {
  const giftMessage = useMetafield({ namespace: "custom", key: "gift_message" });
  const applyMetafieldsChange = useApplyMetafieldsChange();

  return (
    <BlockStack spacing="tight">
      <Text emphasis="bold">Gift message (optional)</Text>
      <TextField
        label="Message"
        value={giftMessage?.value ?? ""}
        multiline={3}
        onChange={(value) =>
          applyMetafieldsChange({
            type: "updateMetafield",
            namespace: "custom",
            key: "gift_message",
            valueType: "string",
            value,
          })
        }
      />
    </BlockStack>
  );
}
```

### Payment customization Function (hide cash on delivery for international orders)

```typescript
// extensions/payment-customization/src/index.ts
import type { RunInput, FunctionRunResult } from "../generated/api";

export function run(input: RunInput): FunctionRunResult {
  const country = input.cart.buyerIdentity?.countryCode;

  // Hide "Cash on Delivery" for non-domestic orders
  const hideOperations = input.paymentMethods
    .filter((pm) => pm.name.toLowerCase().includes("cash on delivery") && country !== "US")
    .map((pm) => ({
      hide: { paymentMethodId: pm.id },
    }));

  return { operations: hideOperations };
}
```

## Best Practices

- **Use the `purchase.checkout.block.render` target** for maximum placement flexibility — merchants can drag the block anywhere in the checkout editor
- **Keep Function execution under 5ms** — Shopify enforces a strict execution time limit; avoid network calls inside Functions (use metafields or Function input variables for configuration)
- **Use `useSettings()` hook** to read merchant-configured values from the extension settings schema — avoids hardcoded IDs in extension code
- **Never read DOM or use browser APIs** in UI extensions — they run in a sandboxed Worker environment without DOM access
- **Use `@shopify/ui-extensions-react/checkout` components only** — native HTML and other UI libraries are not available in the extension sandbox
- **Test payment and shipping Functions with real checkout sessions** — the local dev preview only works for UI extensions; Functions need to be deployed to test
- **Version-pin your extension API version** — increment the `api_version` in `shopify.extension.toml` to access new APIs while keeping backward compatibility
- **Handle async operations with loading states** — `useApplyCartLinesChange` is async; show a spinner while the mutation is in flight

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Extension not appearing in checkout editor | Ensure the extension is deployed (`shopify app deploy`) and the correct checkout template is selected in Admin → Checkout |
| Function returns `FUNCTION_EXECUTION_TIMEOUT` | Move configuration out of runtime logic into Function input metafields; avoid complex loops on large catalogs |
| `useCartLines` returns stale data after cart update | Use the returned promise from `applyCartLinesChange` to wait for checkout to re-evaluate before reading cart lines again |
| Extension crashes with "Cannot use browser APIs" | Remove `document`, `window`, `localStorage` references — the extension runs in a Worker sandbox |
| Discount Function not applying | Verify the Function-based discount is active in Admin → Discounts and the customer qualifies per any eligibility rules |
| Checkout UI extension settings not saving | Settings fields require `handle` values that match the keys referenced by `useSettings()` in the extension code |

## Related Skills

- @shopify-app-development
- @shopify-storefront-api
- @shopify-metafields
- @checkout-flow-optimization
- @shopify-admin-api
