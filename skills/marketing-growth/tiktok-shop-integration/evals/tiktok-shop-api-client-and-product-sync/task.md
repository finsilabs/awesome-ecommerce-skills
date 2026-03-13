# TikTok Shop API Integration Module

## Problem/Feature Description

Bloom & Thread is a UK-based home décor brand that sells through its own Shopify storefront. After strong performance on TikTok organic content, the team has decided to launch TikTok Shop as a direct commerce channel. The engineering lead has asked you to build a reusable TypeScript API client module that the rest of the backend can use to communicate with TikTok Shop's REST API, and an initial product sync function so the catalogue team can push product listings programmatically.

The brand's products have long marketing names (sometimes exceeding 300 characters), multiple colour/size variants, and each variant has an independent price and stock level. The CTO wants to make sure the integration handles authentication correctly and fails loudly (throws descriptive errors) when the API returns a non-success response, so problems are caught early.

## Output Specification

Produce a TypeScript file `tiktok-shop-client.ts` that contains:

1. A generic `tiktokShopRequest(path, body)` function that handles authentication and makes POST requests to the TikTok Shop REST API.
2. A `syncProduct(product)` function that uses the generic client to create or update a product listing, mapping the fields defined in the input schema below.
3. An `updateInventory(tikTokSkuId, newQuantity)` function that updates stock for a single SKU.

Also produce a short `INTEGRATION_NOTES.md` explaining:
- What environment variables the module expects
- Any constraints or limits the calling code should be aware of (e.g. field length restrictions, numeric formatting)
- The recommended image format/dimensions for product images submitted to TikTok Shop

## Input Files (optional)

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/product-schema.ts ===============
export interface ProductVariant {
  sku: string;
  price: number;          // e.g. 29.99
  stockQuantity: number;
  options: Array<{ name: string; value: string }>;
  images?: Array<{ url: string }>;
}

export interface Product {
  name: string;           // marketing name, may be very long
  description: string;
  tikTokCategoryId: string;
  tikTokBrandId?: string;
  images: Array<{ url: string }>;
  weightKg: number;
  heightCm: number;
  lengthCm: number;
  widthCm: number;
  variants: ProductVariant[];
}
