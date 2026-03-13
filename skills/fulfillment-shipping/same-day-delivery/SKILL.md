---
name: same-day-delivery
description: "Offer same-day local delivery with geographic zone management, customer-facing time-slot booking, and driver dispatch coordination"
category: fulfillment-shipping
risk: critical
source: curated
date_added: "2026-03-12"
tags: [same-day-delivery, local-delivery, time-slots, driver-dispatch, delivery-zones, last-mile]
triggers: ["same day delivery", "local delivery", "time slot booking", "driver dispatch", "delivery zone", "last mile delivery"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [shopify, woocommerce, bigcommerce, custom]
difficulty: advanced
---

# Same-Day Delivery

## Overview

Same-day local delivery requires three things working together: a way for customers to select a delivery time slot at checkout, a way for you to dispatch orders to drivers, and a way to communicate delivery status back to customers. For most merchants, third-party last-mile services (DoorDash Drive, Uber Direct, Onfleet) are the fastest path to same-day delivery — they handle driver logistics so you focus on operations.

## When to Use This Skill

- When launching a same-day or next-hour delivery service in a defined geographic area
- When allowing customers to select a preferred delivery window at checkout
- When building a driver dispatch dashboard that shows outstanding orders and optimizes routes
- When integrating with a third-party last-mile courier (DoorDash Drive, Uber Direct, Onfleet)
- When managing capacity limits per time slot to prevent over-committing delivery resources

## Core Instructions

### Step 1: Determine your platform and delivery model

| Platform | Recommended Tool | Why |
|----------|-----------------|-----|
| **Shopify** | Local Delivery by Zapiet + DoorDash Drive or Uber Direct | Zapiet handles time-slot booking at checkout; DoorDash Drive / Uber Direct dispatch drivers automatically |
| **WooCommerce** | WooCommerce Local Pickup Plus + Onfleet or your own drivers | Local Pickup Plus handles zones and time slots; Onfleet provides driver dispatch and tracking |
| **BigCommerce** | Zapiet Delivery + Onfleet or Dispatch Science | Zapiet and similar apps add delivery scheduling; Dispatch Science optimizes routes |
| **Custom / Headless** | Build time-slot booking + integrate Onfleet/DoorDash Drive API for dispatch | Full control over zone management, slot capacity, and driver routing |

**Choose your delivery model first:**

- **Your own drivers:** You control quality and cost but must manage driver availability, vehicles, and routing. Best for: florists, grocery, restaurants with a regular local customer base.
- **On-demand couriers (DoorDash Drive, Uber Direct):** Drivers appear on demand with no fixed cost. Best for: merchants who need occasional same-day delivery without committing to a driver fleet.
- **Hybrid:** Your drivers for scheduled slots; on-demand couriers for rush orders.

### Step 2: Set up delivery zones and time slot booking

#### Shopify

**Using Zapiet — Pickup + Delivery (the most feature-complete app):**

1. Install **Zapiet — Pickup + Delivery** from the Shopify App Store
2. In Zapiet, go to **Delivery → Zones** and define your delivery coverage area by:
   - Postal/ZIP codes (simplest): list all ZIP codes you deliver to
   - Radius from your store address
   - Custom drawn polygon (requires higher Zapiet plan)
3. Set up time slots in **Delivery → Time Slots**:
   - Define daily windows (e.g., 10am–12pm, 12pm–2pm, 2pm–4pm, 4pm–6pm)
   - Set capacity per slot (e.g., max 20 orders per 2-hour window)
   - Set the order cutoff time for each slot (e.g., orders for the 2pm–4pm slot must be placed by 12pm)
4. Set delivery fees per zone in **Delivery → Rates** (can be distance-based or flat)
5. Customers see available time slots during Shopify checkout after entering their address

**Order management in Zapiet:**
- Go to Zapiet → Orders to see all delivery orders sorted by time slot
- Export the pick list and manifest for your drivers from this view
- Mark orders as "out for delivery" and "delivered" to update customers

#### WooCommerce

**Using WooCommerce Local Pickup Plus (WooCommerce.com official extension):**

1. Install **Local Pickup Plus** from WooCommerce.com
2. Go to **WooCommerce → Settings → Shipping → Local Pickup Plus**
3. Add pickup/delivery locations — for delivery, define your service area by postal code or radius
4. Enable "Delivery date & time selection" to let customers pick slots
5. Configure time slots and capacity in the plugin settings

**For more advanced zone management:** use the **Flexible Shipping** plugin or **WooCommerce Table Rate Shipping** to create delivery rates based on postal code matching.

**For driver dispatch:** use **Onfleet** (onfleet.com) which has a WooCommerce webhook integration — new delivery orders automatically appear in Onfleet for driver assignment.

#### BigCommerce

**Using Zapiet on BigCommerce:**
1. Install Zapiet from the BigCommerce App Marketplace
2. Same configuration as the Shopify workflow above — define zones, time slots, and capacity

**Using ShipperHQ:**
- ShipperHQ has local delivery zones and time-window restrictions built in
- Go to ShipperHQ → Carrier Manager → Add Local Delivery carrier and define your zone rules

### Step 3: Connect to a driver dispatch platform

#### Using DoorDash Drive (on-demand, no fixed driver costs)

DoorDash Drive sends DoorDash gig-economy drivers to pick up and deliver your orders. Available in most major US cities.

1. Sign up at developer.doordash.com/portal for a DoorDash Drive API key
2. For Shopify: install **DoorDash Drive** from the Shopify App Store — it creates a DoorDash delivery automatically when you mark an order for dispatch
3. DoorDash notifies the customer with a real-time tracking link via SMS
4. You pay per delivery (typically $7–$15 depending on distance)

#### Using Uber Direct (on-demand)

Similar to DoorDash Drive — Uber Direct uses Uber drivers for local delivery.

1. Sign up at developer.uber.com/products/uber-direct
2. Install the Uber Direct app if available for your platform, or use the REST API
3. Create a delivery by sending the pickup address (your store) and drop-off address (customer) to the Uber Direct API

#### Using Onfleet (your own drivers + route optimization)

Best if you have your own delivery team and need route optimization and real-time tracking.

1. Sign up at onfleet.com (starts at $349/month for up to 3 drivers)
2. Install the WooCommerce webhook integration or use Zapier to connect your platform to Onfleet
3. New orders auto-create Onfleet tasks
4. Dispatchers assign tasks to drivers in the Onfleet web dashboard
5. Drivers get a mobile app with turn-by-turn navigation and proof-of-delivery photo capture
6. Customers receive an SMS with a real-time tracking link when the driver starts their route

### Step 4: Handle edge cases

**Slot fills up after customer views it:**
- Most apps (Zapiet, Onfleet scheduling) use real-time slot availability checks at checkout
- Enable slot capacity enforcement in your app settings to prevent overbooking

**Address outside delivery zone:**
- Zapiet checks the delivery zone before showing time slots — if the address is outside your zone, delivery options are hidden and only pickup/standard shipping shows
- Test this thoroughly with addresses near your zone boundary before going live

**Driver can't fulfill an order:**
- For DoorDash Drive / Uber Direct: the platform automatically reassigns to another driver
- For your own drivers (Onfleet): the dispatcher must manually reassign in the dashboard; set up Onfleet alerts for unassigned tasks approaching their slot window

**Cutoff time management:**
- Set your order cutoff 2–3 hours before the delivery window to give time for picking, packing, and loading
- Zapiet automatically hides time slots that have passed their cutoff

### Step 5: Custom / Headless Implementation

For headless stores that need full control over zone management and slot booking:

```typescript
// Check if a customer address is in a delivery zone
async function checkDeliveryEligibility(params: {
  customerZip: string;
  deliveryZones: { name: string; zipCodes: string[]; deliveryFeeCents: number }[];
}): Promise<{ eligible: boolean; zone?: string; feeCents?: number }> {
  const zone = params.deliveryZones.find(z => z.zipCodes.includes(params.customerZip));
  if (!zone) return { eligible: false };
  return { eligible: true, zone: zone.name, feeCents: zone.deliveryFeeCents };
}

// Get available time slots for today (slots with remaining capacity)
async function getAvailableSlots(params: {
  date: Date;
  zone: string;
  slots: { id: string; label: string; capacity: number; booked: number; cutoffTime: Date }[];
}): Promise<{ id: string; label: string; spotsRemaining: number }[]> {
  const now = new Date();
  return params.slots
    .filter(slot => slot.cutoffTime > now && slot.booked < slot.capacity)
    .map(slot => ({
      id: slot.id,
      label: slot.label,
      spotsRemaining: slot.capacity - slot.booked,
    }));
}

// Dispatch a delivery via DoorDash Drive API
async function dispatchDoorDashDelivery(params: {
  externalDeliveryId: string;
  pickupAddress: Address;
  dropoffAddress: Address;
  customerPhone: string;
  pickupWindow: { startTime: string; endTime: string }; // ISO 8601
}): Promise<{ trackingUrl: string; fee: number }> {
  const response = await fetch('https://openapi.doordash.com/drive/v2/deliveries', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DOORDASH_DRIVE_JWT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      external_delivery_id: params.externalDeliveryId,
      pickup_address: `${params.pickupAddress.street1}, ${params.pickupAddress.city}, ${params.pickupAddress.state} ${params.pickupAddress.zip}`,
      dropoff_address: `${params.dropoffAddress.street1}, ${params.dropoffAddress.city}, ${params.dropoffAddress.state} ${params.dropoffAddress.zip}`,
      dropoff_phone_number: params.customerPhone,
      pickup_time: params.pickupWindow.startTime,
    }),
  });
  const data = await response.json();
  return { trackingUrl: data.tracking_url, fee: data.fee };
}
```

## Best Practices

- **Start with ZIP code zones, not radius or polygon** — ZIP-code-based zones are easier to manage, easier to communicate to customers ("We deliver to these zip codes"), and don't require geocoding
- **Set slot cutoff times generously** — give your warehouse at least 2 hours between order cutoff and window start to pick, pack, and hand off to drivers
- **Generate delivery manifests before each slot window** — print the manifest 30 minutes before your driver leaves; it should list each order with address, time slot, and special instructions
- **Send ETA push notifications as the driver approaches** — customers with live ETAs submit far fewer "where is my delivery" support contacts; Onfleet and DoorDash Drive both handle this automatically
- **Monitor slot fill rates** — if slots fill up consistently hours before the window, add capacity; if they're under 50% filled at cutoff, consolidate or reduce windows

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Two customers book the last spot in a slot simultaneously | Use atomic slot decrement with capacity check — Zapiet handles this; for custom builds use database-level locks or atomic updates |
| Customer enters an address outside the delivery zone but sees time slots | Validate zone eligibility server-side at checkout, not just client-side; Zapiet enforces this automatically |
| Cutoff time displayed in wrong timezone for customer | Always store and compare times in UTC; display to customers in their local timezone using the browser's `Intl` API |
| Driver assigned to more orders than they can fulfill in the window | Cap orders per driver per slot and enable route optimization in Onfleet; set realistic capacity limits when building your slot schedule |

## Related Skills

- @order-fulfillment-workflow
- @shipment-tracking
- @order-management-system
- @international-shipping
- @dropshipping-integration
