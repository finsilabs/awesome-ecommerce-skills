# Driver Dispatch Module: Assignment, Live Tracking, and Failure Recovery

## Problem/Feature Description

A meal-kit delivery startup has built out zone management and slot booking, and now needs the driver-facing side of the platform. When an operations coordinator assigns a driver to an order, the driver must receive an immediate notification on their mobile app. Once the driver starts heading to the customer, the platform needs to keep the customer informed with live ETAs so they know when to expect their delivery — the support team has found that customers without live updates generate three times as many "where is my order?" contacts.

The platform also needs to handle two failure modes gracefully. Drivers sometimes lose mobile connectivity while en route, and dispatch needs an automated alert before too much time passes without a location ping. And on rare occasions a driver cannot complete a delivery; in that case the customer should automatically be offered an alternative window and a new driver should be queued up, rather than leaving the order in limbo.

## Output Specification

Produce the following files:

1. `dispatch.ts` — TypeScript module exporting:
   - `assignDriverToOrder(assignmentId: string, driverId: string): Promise<void>` — assigns a driver and notifies them.
   - `updateDeliveryStatus(assignmentId: string, status: 'en_route' | 'delivered' | 'failed', driverLat?: number, driverLng?: number): Promise<void>` — updates assignment status and handles all side-effects for each status.

2. `driver-heartbeat.ts` — TypeScript module that exports a function (or class) implementing a heartbeat/watchdog mechanism for active deliveries. Include a comment explaining the threshold used and why.

3. `NOTES.md` — Explanation of the ETA update strategy (frequency, data source) and the failure-recovery flow for a failed delivery.

You may stub `db`, `pushNotification`, `websocketHub`, and any external services. Focus on the logic and the correctness of the side-effects for each scenario. The implementation does not need to be runnable.
