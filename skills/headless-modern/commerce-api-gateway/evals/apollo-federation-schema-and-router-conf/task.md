# GraphQL Federation Gateway: Schema Design and Router Configuration

## Problem/Feature Description

Meridian Commerce is rebuilding their platform around a composable architecture. They have three backend teams: the Catalog team owns products and categories, the Inventory team owns stock levels and warehouse locations, and the Cart team owns shopping carts and line items. Each team wants to own their GraphQL schema independently, but the storefront needs a single unified GraphQL endpoint so it can query products, inventory, and cart data in one request.

The platform team has been asked to set up a federated GraphQL gateway using industry-standard tooling. They need: (1) a supergraph composition configuration that registers all three subgraphs, (2) subgraph schema files for each service showing how the `Product` type is shared across services — the Catalog team defines it, the Inventory team extends it with stock data, (3) a production-ready router configuration with proper authentication via JWKS (the company uses Auth0), explicit CORS allowed origins for the storefront (`https://shop.meridian.com` and `https://staging.meridian.com`), traffic shaping with independent timeouts, and retry logic.

The gateway should also be configured to propagate the customer's identity headers downstream so subgraphs can perform per-field authorization.

## Output Specification

Produce the following configuration and schema files in a `gateway/` directory:

- `gateway/supergraph.yaml` — supergraph composition config listing all three subgraphs
- `gateway/router.yaml` — Apollo Router configuration (auth, CORS, traffic shaping, header propagation)
- `gateway/subgraphs/catalog/schema.graphql` — catalog subgraph schema defining the Product type
- `gateway/subgraphs/inventory/schema.graphql` — inventory subgraph schema extending Product with inventory data
- `gateway/subgraphs/cart/schema.graphql` — cart subgraph schema

Also produce `gateway/SETUP.md` documenting the commands needed to: install the required CLI tools, compose the supergraph schema, and start the router.
