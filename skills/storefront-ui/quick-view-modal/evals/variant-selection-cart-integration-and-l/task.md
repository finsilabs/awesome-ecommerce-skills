# Quick View Body with Variant Selection and Cart

## Problem/Feature Description

Threads & Co., an online fashion retailer, has a product listing page where each card now shows a modal overlay when "Quick View" is clicked. The modal shell and data-fetching hook are already in place. What's missing is the body content that renders inside the modal once product data has loaded.

Products have variants (typically size and colour combinations). Each variant has its own inventory count and its own image. The UX team requires that when a shopper picks a variant, the image displayed in the modal updates to reflect that variant's photo. Out-of-stock variants must be visually distinguishable and non-selectable. When the shopper successfully adds a product to the cart, the modal should close automatically — the team wants to avoid the shopper feeling "stuck" in the overlay.

The body must also accommodate shoppers who want more information than the quick view provides; a clear route back to the full product detail page must always be present.

A backend engineer has noted that on mobile the page behind the modal tends to scroll while the modal is open, which is disruptive. The implementation should prevent this.

## Output Specification

Produce the following files:

- `QuickViewBody.jsx` — the body component rendered inside the quick view modal once data is loaded
- `QuickViewBody.css` — associated styles
- `QuickViewPage.jsx` — a minimal product listing page that wires the modal, the body, and a mock `addToCart` function together so the integration can be verified

## Input Files

The following stub files define the product data shape and the cart API signature your implementation should use. Extract them before beginning.

=============== FILE: types.js ===============
/**
 * @typedef {Object} ProductVariant
 * @property {string} id
 * @property {number} price
 * @property {string} [image]
 * @property {number} inventory  - 0 means out of stock
 * @property {Object.<string, string>} options  - e.g. { Size: 'M', Colour: 'Red' }
 */

/**
 * @typedef {Object} ProductOption
 * @property {string} name   - e.g. 'Size'
 * @property {string[]} values - e.g. ['XS', 'S', 'M', 'L']
 */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {number} price
 * @property {string} shortDescription
 * @property {string} url
 * @property {string[]} images
 * @property {ProductVariant[]} variants
 * @property {ProductOption[]} options
 */

/**
 * Add an item to the cart.
 * @param {{ variantId: string, quantity: number }} item
 * @returns {Promise<void>}
 */
export async function addToCart(item) {
  // mock implementation
  return Promise.resolve();
}
