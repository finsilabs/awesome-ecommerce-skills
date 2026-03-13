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
platforms: [platform-agnostic]
difficulty: advanced
---

# Same-Day Delivery

## Overview

Implement a same-day local delivery system covering delivery zone management (polygon-based coverage areas), customer time-slot booking with capacity limits, automated order routing to available drivers, and real-time delivery status updates. Designed for operations where you control your own delivery fleet or integrate with a local courier service.

## When to Use This Skill

- When launching a same-day or next-hour delivery service in a defined geographic area
- When allowing customers to select a preferred delivery window at checkout
- When building a driver dispatch dashboard that shows outstanding orders and optimizes routes
- When integrating with a third-party last-mile courier (e.g., DoorDash Drive, Uber Direct, Onfleet)
- When managing capacity limits per time slot to prevent over-committing delivery resources

## Core Instructions

1. **Define delivery zones and time slots**

   ```sql
   CREATE TABLE delivery_zones (
     id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name           VARCHAR(64) NOT NULL,
     polygon        GEOGRAPHY(POLYGON, 4326) NOT NULL,  -- PostGIS
     min_order_cents INTEGER NOT NULL DEFAULT 0,
     delivery_fee_cents INTEGER NOT NULL DEFAULT 0,
     is_active      BOOLEAN NOT NULL DEFAULT true
   );

   CREATE INDEX idx_delivery_zones_poly ON delivery_zones USING GIST(polygon);

   CREATE TABLE delivery_slots (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     zone_id         UUID NOT NULL REFERENCES delivery_zones(id),
     slot_date       DATE NOT NULL,
     window_start    TIME NOT NULL,   -- e.g. '14:00'
     window_end      TIME NOT NULL,   -- e.g. '16:00'
     capacity        INTEGER NOT NULL,
     booked          INTEGER NOT NULL DEFAULT 0,
     cutoff_time     TIMESTAMPTZ NOT NULL,  -- orders must be placed by this time
     is_active       BOOLEAN NOT NULL DEFAULT true
   );

   CREATE UNIQUE INDEX idx_slots_zone_date_window ON delivery_slots(zone_id, slot_date, window_start);

   CREATE TABLE delivery_assignments (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     order_id        UUID NOT NULL REFERENCES orders(id),
     slot_id         UUID NOT NULL REFERENCES delivery_slots(id),
     driver_id       UUID,
     status          VARCHAR(24) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'assigned', 'en_route', 'delivered', 'failed')),
     eta             TIMESTAMPTZ,
     delivered_at    TIMESTAMPTZ,
     created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   ```

2. **Check if a delivery address is within a zone**

   ```typescript
   async function findDeliveryZone(
     lat: number,
     lng: number
   ): Promise<DeliveryZone | null> {
     // PostGIS point-in-polygon query
     const result = await db.raw(`
       SELECT *
       FROM delivery_zones
       WHERE is_active = true
         AND ST_Contains(polygon, ST_SetSRID(ST_MakePoint($1, $2), 4326))
       ORDER BY min_order_cents DESC
       LIMIT 1
     `, [lng, lat]); // Note: PostGIS takes (lng, lat)

     return result.rows[0] ?? null;
   }

   async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
     const resp = await fetch(
       `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
     );
     const data = await resp.json();
     const loc = data.results[0]?.geometry?.location;
     if (!loc) throw new Error('Address could not be geocoded');
     return { lat: loc.lat, lng: loc.lng };
   }
   ```

3. **List available time slots for a zone and date**

   ```typescript
   async function getAvailableSlots(
     zoneId: string,
     date: Date
   ): Promise<DeliverySlot[]> {
     const now = new Date();
     const dateStr = date.toISOString().slice(0, 10);

     const slots = await db.deliverySlots.findAll({
       zone_id: zoneId,
       slot_date: dateStr,
       is_active: true,
       cutoff_time: { gt: now },       // past cutoff = no longer bookable
     });

     return slots.filter(slot => slot.booked < slot.capacity);
   }
   ```

4. **Book a delivery slot atomically**

   ```typescript
   async function bookDeliverySlot(
     orderId: string,
     slotId: string
   ): Promise<DeliveryAssignment> {
     return db.transaction(async tx => {
       // Lock the slot row
       const slot = await tx.raw(
         'SELECT * FROM delivery_slots WHERE id = ? FOR UPDATE',
         [slotId]
       ).then(r => r.rows[0]);

       if (!slot || !slot.is_active) throw new Error('SLOT_NOT_AVAILABLE');
       if (slot.booked >= slot.capacity) throw new Error('SLOT_FULL');
       if (new Date() > new Date(slot.cutoff_time)) throw new Error('SLOT_CUTOFF_PASSED');

       await tx.raw(
         'UPDATE delivery_slots SET booked = booked + 1 WHERE id = ?',
         [slotId]
       );

       const assignment = await tx.deliveryAssignments.insert({
         order_id: orderId,
         slot_id: slotId,
         status: 'pending',
       });

       return assignment;
     });
   }
   ```

5. **Dispatch drivers and update delivery status**

   ```typescript
   async function assignDriverToOrder(
     assignmentId: string,
     driverId: string
   ): Promise<void> {
     await db.deliveryAssignments.update(assignmentId, {
       driver_id: driverId,
       status: 'assigned',
     });

     // Notify driver via push notification or SMS
     const assignment = await db.deliveryAssignments.findById(assignmentId);
     const order = await db.orders.findById(assignment.order_id);

     await pushNotification.send(driverId, {
       title: 'New delivery assigned',
       body: `Order #${order.order_number} — ${order.shipping_address.line1}`,
       data: { assignmentId, orderId: assignment.order_id },
     });
   }

   async function updateDeliveryStatus(
     assignmentId: string,
     status: 'en_route' | 'delivered' | 'failed',
     driverLat?: number,
     driverLng?: number
   ): Promise<void> {
     const updates: any = { status };
     if (status === 'delivered') updates.delivered_at = new Date();
     if (driverLat && driverLng) updates.eta = await estimateETA(driverLat, driverLng, assignmentId);

     await db.deliveryAssignments.update(assignmentId, updates);

     const assignment = await db.deliveryAssignments.findById(assignmentId);

     if (status === 'delivered') {
       await db.orders.update(assignment.order_id, { status: 'delivered' });
       await sendDeliveryConfirmationEmail(assignment.order_id);
     }

     // Push real-time update to customer via WebSocket
     await websocketHub.sendToOrder(assignment.order_id, { type: 'DELIVERY_UPDATE', status, eta: updates.eta });
   }
   ```

## Examples

### Admin: auto-generate slots for a zone for the next 7 days

```typescript
async function generateWeeklySlots(zoneId: string): Promise<void> {
  const DAILY_WINDOWS = [
    { start: '10:00', end: '12:00', capacity: 15 },
    { start: '12:00', end: '14:00', capacity: 20 },
    { start: '14:00', end: '16:00', capacity: 20 },
    { start: '16:00', end: '18:00', capacity: 15 },
    { start: '18:00', end: '20:00', capacity: 10 },
  ];

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    const dateStr = date.toISOString().slice(0, 10);

    for (const window of DAILY_WINDOWS) {
      const cutoffTime = new Date(`${dateStr}T${window.start}:00`);
      cutoffTime.setHours(cutoffTime.getHours() - 2); // cutoff 2h before window

      await db.deliverySlots.insert({
        zone_id: zoneId,
        slot_date: dateStr,
        window_start: window.start,
        window_end: window.end,
        capacity: window.capacity,
        cutoff_time: cutoffTime,
      }).catch(() => {}); // ignore duplicate key if already generated
    }
  }
}
```

### Customer-facing slot selection component (React)

```tsx
function DeliverySlotPicker({ zoneId, onSelect }: { zoneId: string; onSelect: (slotId: string) => void }) {
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(tomorrow());

  useEffect(() => {
    fetch(`/api/delivery/slots?zoneId=${zoneId}&date=${selectedDate.toISOString().slice(0, 10)}`)
      .then(r => r.json())
      .then(setSlots);
  }, [zoneId, selectedDate]);

  return (
    <div>
      <input type="date" value={selectedDate.toISOString().slice(0, 10)}
        onChange={e => setSelectedDate(new Date(e.target.value))} />
      {slots.map(slot => (
        <button key={slot.id} onClick={() => onSelect(slot.id)}>
          {slot.window_start}–{slot.window_end} ({slot.capacity - slot.booked} spots left)
        </button>
      ))}
    </div>
  );
}
```

## Best Practices

- **Lock the slot row before booking** — use `SELECT ... FOR UPDATE` to prevent double-booking when two customers simultaneously claim the last spot in a slot
- **Store delivery zones as PostGIS polygons** — polygon geometry enables exact in/out checks; don't approximate with bounding boxes or radius circles
- **Set slot cutoff times generously** — give the warehouse at least 2 hours between order cutoff and window start to pick, pack, and load orders for that slot
- **Generate slots in advance** — run a weekly job to pre-generate the next 7 days of slots so checkout never blocks on slot creation
- **Send ETA push notifications as the driver approaches** — update ETA every 2–3 minutes once the driver marks `en_route`; customers with live ETAs have significantly fewer "where is my delivery" support contacts
- **Plan for driver failures** — if a driver reports `failed`, immediately offer the customer a re-schedule to the next available slot and trigger a re-assignment
- **Monitor slot fill rates** — if slots consistently fill 100%, add capacity; if they're consistently under 30%, reduce capacity or consolidate windows

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Two customers book the last slot simultaneously | Use `SELECT ... FOR UPDATE` + `booked < capacity` check in a single transaction |
| Geocoding returns an address outside the zone polygon | Always re-validate the zone in the checkout API, not just during zone lookup on the address entry page |
| Driver app loses GPS and stops sending location updates | Implement a heartbeat check — if no update for 5 minutes while `en_route`, alert dispatch |
| Cutoff calculation is in the wrong timezone | Store `cutoff_time` as a UTC TIMESTAMPTZ computed from the slot's local time + zone timezone; never use client-local time |

## Related Skills

- @order-fulfillment-workflow
- @shipment-tracking
- @order-management-system
- @international-shipping
- @dropshipping-integration
