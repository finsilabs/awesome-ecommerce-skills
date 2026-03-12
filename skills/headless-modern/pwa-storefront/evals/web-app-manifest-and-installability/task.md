# Mobile Storefront Launch Preparation

## Problem/Feature Description

A fashion retailer, StyleNow, is preparing to launch their new online storefront and wants it to be installable on customers' home screens on both Android and iOS devices. Their marketing team has found that customers who install the app to their home screen have 3x higher re-engagement rates than those who only bookmark the site. The development lead has asked you to set up the foundational PWA configuration so the store can pass app store listing audits and show the "Add to Home Screen" prompt on Android.

The storefront is a Next.js app. The team has not yet created any manifest or service worker configuration — you are starting from scratch. They've told you the store name is "StyleNow", the short name is "StyleNow", the theme color is "#1a1a2e", background color is "#ffffff", and the primary language is English. They want the store to open at the root path and for users to be able to install it like a native app. The share functionality should allow sharing products to the store's search page.

## Output Specification

Produce the following files:

- `public/manifest.json` — the complete Web App Manifest
- `app/layout.tsx` (or `pages/_document.tsx`) — an HTML layout or document file that links the manifest and includes the appropriate iOS compatibility meta tags and theme-color meta tag
- `NOTES.md` — a short explanation of the choices made (display mode, icon sizes, share target, etc.) and what a developer should verify before deploying to ensure the app is installable

Do not include actual image files — reference the icon paths as they would appear in production.
