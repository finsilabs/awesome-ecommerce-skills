# Vendor Portal: PO Submission and Acknowledgment Flow

## Problem Description

NorthBay Goods has finished its database schema and now needs the backend logic for the purchase order workflow. The procurement team submits POs to vendors electronically, and vendors — many of whom are small family businesses with no technical staff — need an easy way to confirm the order. Previous integrations that required vendors to log in and navigate a portal resulted in a 40% non-response rate because low-tech suppliers found it too complicated.

The solution is to email the vendor a link they can click once to confirm the order without any login process. The engineering team must implement: (1) the function that submits a PO by emailing the vendor, and (2) the API endpoint the vendor hits when they click the confirmation link. Security is a concern because vendor portal links will be sent over email — the team must not expose persistent credentials, and must handle the case where a vendor tries to confirm an order that was already confirmed.

The expected delivery date logic is also part of this milestone. When creating a new PO, the system must calculate a realistic delivery date that accounts for each vendor's lead time while building in some cushion for delays. The finance team insists that unit costs recorded at order time must never be changed after the fact — any discrepancy with the eventual invoice is handled by accounts payable, not by editing the PO.

## Output Specification

Produce a TypeScript implementation file `vendor_portal.ts` containing:
1. A `submitPurchaseOrder(poId: string)` function that emails the vendor and updates PO status
2. A POST endpoint handler for vendor acknowledgment (Express-style or equivalent)
3. A `calculateExpectedDelivery(vendor: { lead_time_days: number }, orderDate: Date)` helper function

Also produce `design_notes.md` explaining the security decisions made around portal access and why unit costs are handled a particular way.

You may assume the following are already available as imports:
- `db` — a database client with the methods shown in the examples
- `emailService` — an email service with a `send({ to, template, data })` method
- `process.env.VENDOR_PORTAL_URL` — the portal base URL

Do not use real API keys or credentials. Use placeholder strings where needed.
