# SAP S/4HANA Adapter and Order Mapping Layer

## Problem/Feature Description

NordLight, a Scandinavian outdoor lighting brand, is migrating from a legacy monolith to a headless commerce platform. Their ERP of record is SAP S/4HANA, which the operations, finance, and logistics teams rely on for all order fulfillment and reporting. The new integration must push orders from the storefront into SAP as sales orders, but the engineering team has learned through painful experience that SAP's API has specific quirks — authentication requirements, strict field formats, and rate limits — that tripped up their first integration attempt.

The team wants to build a clean integration layer: a SAP-specific adapter that hides all SAP API details from the rest of the application, a data transformation layer that converts the e-commerce order format into SAP's expected format, and clear handling of pricing so that SAP's base prices and the storefront's promotional discounts don't interfere with each other. The adapter should also be designed for the long term — the team may need to add a NetSuite adapter next quarter, so the interface should be generic enough to support multiple ERP backends.

## Output Specification

Implement the ERP adapter layer in TypeScript. Produce the following files:

- `src/adapters/ERPAdapter.ts` — The abstract ERPAdapter interface defining all methods
- `src/adapters/SAPAdapter.ts` — The SAP S/4HANA implementation of ERPAdapter
- `src/mappers/orderMapper.ts` — The transformation functions that convert e-commerce order objects to ERP-generic format (and SAP-specific format where needed)
- `src/types.ts` — Shared TypeScript types: ERPSalesOrder, ERPCustomer, ERPInventoryItem, ERPProduct, SAPConfig, etc.

Write a `DESIGN.md` that explains:
- How the adapter pattern keeps SAP-specific code isolated
- How pricing is handled to avoid overwriting promotional prices with ERP base prices
- How the SAP adapter handles API authentication requirements
