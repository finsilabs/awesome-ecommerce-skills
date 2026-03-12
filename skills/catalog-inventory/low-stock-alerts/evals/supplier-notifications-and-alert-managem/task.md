# Stock Alert Notifications and Merchant Dashboard API

## Problem Description

A retailer's inventory system can already detect when stock falls below a reorder threshold and creates alert records in the database. The next milestone is to **notify the right people** and give the ops team a way to manage those alerts through an admin interface.

On the notification side, the retailer works with around a dozen suppliers. When multiple products from the same supplier are running low at the same time (which happens frequently before long weekends), the ops team has complained that their suppliers get bombarded with individual emails — one per SKU — which has led several suppliers to start ignoring them. Notifications need to be consolidated so that a supplier receives a single email listing everything they need to reorder, rather than a flood of individual messages. Merchants also need their own alert email summarising what's happening across the store.

On the API side, the ops team wants a simple dashboard that shows all active (unresolved) stock alerts with the ability to filter by alert type and warehouse location. When a team member has reviewed an alert and decided on a course of action, they should be able to mark it as acknowledged. When a purchase order is received and stock is replenished, the system should automatically close out any open alerts for that variant and location.

## Output Specification

Produce the following files:

- `lib/alertNotifications.js` — The notification module. It should accept a list of alert objects and send emails to merchants and suppliers, handling the consolidation logic.
- `api/admin/stock-alerts.js` — The admin API handlers: one to retrieve active alerts with query-parameter filtering, and one to mark an alert as acknowledged.
- `lib/stockAlerts.js` — A helper module containing the function to resolve alerts when stock is replenished.
- `API.md` — Brief API documentation listing the endpoints, their parameters, and response shapes.
