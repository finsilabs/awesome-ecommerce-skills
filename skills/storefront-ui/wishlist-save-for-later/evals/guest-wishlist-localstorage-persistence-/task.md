# Guest Wishlist Store Module

## Problem/Feature Description

A headless e-commerce startup is building a new storefront where many visitors browse and save items before creating an account. The product team wants to ensure that products a visitor saves while browsing are not lost when they later sign up or log in — this has been a major complaint about the previous platform.

Your task is to build a self-contained JavaScript wishlist store module (`lib/wishlistStore.js`) that handles wishlist persistence for unauthenticated users, and a companion merge utility (`lib/mergeWishlist.js`) that runs immediately after a user authenticates. The merge utility should post the locally-stored items to a server endpoint and then clean up the local state.

The module will be used in a Next.js/React project but the store itself should be plain JavaScript with no framework dependencies. Another team is building the UI layer and they just need solid, well-named exports they can call.

## Output Specification

Produce the following files:

- `lib/wishlistStore.js` — The guest wishlist store with functions to read, add, remove, and save items to local browser storage
- `lib/mergeWishlist.js` — A merge utility that transfers locally-stored wishlist items to the server after login and clears local state on success
- `lib/wishlistStore.test.js` — Unit tests (using any test framework you prefer, or plain assertions) that demonstrate the key behaviors of the store, including deduplication and error handling

The test file should be runnable with `node lib/wishlistStore.test.js` (using Node's built-in `assert` module is fine) or with a standard test runner if you choose one. Include instructions in a comment at the top of the test file for how to run it.
