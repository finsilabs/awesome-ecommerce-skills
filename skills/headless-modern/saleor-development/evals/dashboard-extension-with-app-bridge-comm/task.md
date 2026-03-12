# Saleor Dashboard Extension: Inventory Reservation Button

## Problem/Feature Description

A wholesale distributor manages their product catalog in Saleor and also maintains an external warehouse management system (WMS). Their operations team spends time manually copying SKUs and stock levels between the two systems. To reduce this friction, the engineering team wants to embed a "Reserve Inventory" button directly inside the Saleor product details page. When a staff member clicks the button, it should trigger a reservation request to the WMS and show a success or failure notification within the Saleor Dashboard — without navigating away.

The team has already built a Saleor App skeleton (manifest and registration endpoint exist). They now need to extend the manifest to declare the Dashboard Extension and build the React page that renders inside the dashboard iframe. The extension should be accessible from the product details page and communicate with the dashboard shell to display status notifications. A README or inline comments should describe the HTTPS and CORS requirements for the extension page to work in production.

## Output Specification

Produce the following files:

- `pages/api/manifest.ts` — updated manifest handler that declares the Dashboard Extension
- `pages/extension/inventory-reserve.tsx` — the React page rendered inside the extension iframe
- `README.md` — brief notes on deployment requirements for the extension to work correctly in production (HTTPS, CORS)

The extension page should simulate the WMS call (a placeholder async function is fine) and show a notification in the dashboard on completion. Do not implement real WMS API calls — a mock/stub is sufficient.
