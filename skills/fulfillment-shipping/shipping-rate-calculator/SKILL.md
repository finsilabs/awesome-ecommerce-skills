---
name: shipping-rate-calculator
description: "Real-time rate calculation with carrier APIs (UPS, FedEx, USPS, DHL)"
category: fulfillment-shipping
risk: critical
source: curated
date_added: "2026-03-12"
tags: [shipping, rates, carriers, ups, fedex, usps, dhl, fulfillment]
triggers: ["calculate shipping rates", "integrate carrier APIs", "add shipping options", "real-time shipping quotes"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Shipping Rate Calculator

## Overview

Implement real-time shipping rate calculation by integrating carrier APIs (UPS, FedEx, USPS, DHL) through a unified abstraction layer. This skill covers rate shopping across carriers, package dimension and weight-based quoting, shipping zone configuration, flat-rate and free-shipping thresholds, and caching strategies to keep checkout fast even when carrier APIs are slow.

## When to Use This Skill

- When adding real-time carrier rate quotes to checkout
- When building a multi-carrier shipping rate comparison feature
- When implementing free shipping thresholds or tiered flat-rate shipping
- When you need to calculate dimensional weight for accurate carrier pricing
- When setting up shipping zones and rate tables for international shipping

## Core Instructions

1. **Define the shipping rate abstraction layer**

   ```typescript
   interface ShipmentRequest {
     origin: Address;
     destination: Address;
     packages: Package[];
     declaredValue?: number;     // in cents, for insurance
     shipDate?: Date;
   }

   interface Address {
     name?: string;
     street1: string;
     street2?: string;
     city: string;
     state: string;
     postalCode: string;
     country: string;            // ISO 3166-1 alpha-2
     residential?: boolean;
   }

   interface Package {
     weight: { value: number; unit: 'oz' | 'lb' | 'g' | 'kg' };
     dimensions: { length: number; width: number; height: number; unit: 'in' | 'cm' };
     itemCount?: number;
   }

   interface ShippingRate {
     carrier: string;            // 'ups', 'fedex', 'usps', 'dhl'
     service: string;            // 'ground', 'express', '2day', etc.
     serviceName: string;        // Human-readable: "UPS Ground"
     rate: number;               // in cents
     currency: string;
     estimatedDays: number;
     estimatedDelivery?: Date;
     guaranteed: boolean;
   }

   interface CarrierAdapter {
     name: string;
     getRates(request: ShipmentRequest): Promise<ShippingRate[]>;
   }
   ```

2. **Implement the UPS carrier adapter (REST API)**

   ```typescript
   import axios from 'axios';

   class UPSAdapter implements CarrierAdapter {
     name = 'ups';
     private baseUrl = 'https://onlinetools.ups.com/api';
     private accessToken: string;

     constructor(private config: {
       clientId: string;
       clientSecret: string;
       accountNumber: string;
     }) {}

     private async authenticate(): Promise<void> {
       const response = await axios.post(
         'https://onlinetools.ups.com/security/v1/oauth/token',
         'grant_type=client_credentials',
         {
           headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
           auth: {
             username: this.config.clientId,
             password: this.config.clientSecret,
           },
         }
       );
       this.accessToken = response.data.access_token;
     }

     async getRates(request: ShipmentRequest): Promise<ShippingRate[]> {
       await this.authenticate();

       const response = await axios.post(
         `${this.baseUrl}/rating/v1/Rate`,
         {
           RateRequest: {
             Shipment: {
               Shipper: {
                 ShipperNumber: this.config.accountNumber,
                 Address: this.formatAddress(request.origin),
               },
               ShipTo: { Address: this.formatAddress(request.destination) },
               Package: request.packages.map(pkg => ({
                 PackagingType: { Code: '02' }, // Customer packaging
                 Dimensions: {
                   UnitOfMeasurement: { Code: pkg.dimensions.unit === 'in' ? 'IN' : 'CM' },
                   Length: String(pkg.dimensions.length),
                   Width: String(pkg.dimensions.width),
                   Height: String(pkg.dimensions.height),
                 },
                 PackageWeight: {
                   UnitOfMeasurement: { Code: pkg.weight.unit === 'lb' ? 'LBS' : 'KGS' },
                   Weight: String(this.normalizeWeight(pkg.weight)),
                 },
               })),
             },
           },
         },
         {
           headers: {
             Authorization: `Bearer ${this.accessToken}`,
             'Content-Type': 'application/json',
           },
         }
       );

       return this.parseRates(response.data);
     }

     private formatAddress(addr: Address) {
       return {
         AddressLine: [addr.street1, addr.street2].filter(Boolean),
         City: addr.city,
         StateProvinceCode: addr.state,
         PostalCode: addr.postalCode,
         CountryCode: addr.country,
       };
     }

     private normalizeWeight(weight: Package['weight']): number {
       if (weight.unit === 'oz') return weight.value / 16;
       if (weight.unit === 'g') return weight.value / 1000;
       if (weight.unit === 'kg') return weight.value;
       return weight.value; // lb
     }

     private parseRates(data: any): ShippingRate[] {
       const rated = data.RateResponse?.RatedShipment || [];
       return rated.map(r => ({
         carrier: 'ups',
         service: r.Service.Code,
         serviceName: this.getServiceName(r.Service.Code),
         rate: Math.round(parseFloat(r.TotalCharges.MonetaryValue) * 100),
         currency: r.TotalCharges.CurrencyCode,
         estimatedDays: parseInt(r.GuaranteedDelivery?.BusinessDaysInTransit || '5'),
         guaranteed: !!r.GuaranteedDelivery,
       }));
     }

     private getServiceName(code: string): string {
       const names: Record<string, string> = {
         '03': 'UPS Ground',
         '02': 'UPS 2nd Day Air',
         '01': 'UPS Next Day Air',
         '13': 'UPS 3 Day Select',
         '12': 'UPS Next Day Air Saver',
         '14': 'UPS Next Day Air Early',
       };
       return names[code] || `UPS Service ${code}`;
     }
   }
   ```

3. **Build the multi-carrier rate shopping engine**

   ```typescript
   class ShippingRateEngine {
     private carriers: CarrierAdapter[] = [];
     private cache: Map<string, { rates: ShippingRate[]; expires: number }> = new Map();

     registerCarrier(adapter: CarrierAdapter): void {
       this.carriers.push(adapter);
     }

     async getRates(request: ShipmentRequest): Promise<ShippingRate[]> {
       // Check cache first (rates are valid for ~15 minutes)
       const cacheKey = this.getCacheKey(request);
       const cached = this.cache.get(cacheKey);
       if (cached && cached.expires > Date.now()) {
         return cached.rates;
       }

       // Fetch from all carriers in parallel with timeouts
       const results = await Promise.allSettled(
         this.carriers.map(carrier =>
           Promise.race([
             carrier.getRates(request),
             new Promise<ShippingRate[]>((_, reject) =>
               setTimeout(() => reject(new Error(`${carrier.name} timeout`)), 5000)
             ),
           ])
         )
       );

       const rates: ShippingRate[] = [];
       for (const result of results) {
         if (result.status === 'fulfilled') {
           rates.push(...result.value);
         } else {
           console.warn(`Carrier rate fetch failed: ${result.reason}`);
         }
       }

       // Sort by price ascending
       rates.sort((a, b) => a.rate - b.rate);

       // Cache for 15 minutes
       this.cache.set(cacheKey, { rates, expires: Date.now() + 15 * 60 * 1000 });

       return rates;
     }

     private getCacheKey(request: ShipmentRequest): string {
       const dest = `${request.destination.postalCode}-${request.destination.country}`;
       const weight = request.packages.reduce((sum, p) => sum + p.weight.value, 0);
       return `${request.origin.postalCode}-${dest}-${weight}`;
     }
   }
   ```

4. **Calculate dimensional weight**

   ```typescript
   function calculateDimensionalWeight(pkg: Package): number {
     // DIM factor: 139 for domestic (US), 139 for UPS/FedEx international
     const DIM_FACTOR_DOMESTIC = 139;   // cubic inches per pound
     const DIM_FACTOR_METRIC = 5000;    // cubic cm per kg

     let dimWeight: number;

     if (pkg.dimensions.unit === 'in') {
       const cubicInches =
         pkg.dimensions.length * pkg.dimensions.width * pkg.dimensions.height;
       dimWeight = cubicInches / DIM_FACTOR_DOMESTIC; // result in lbs
     } else {
       const cubicCm =
         pkg.dimensions.length * pkg.dimensions.width * pkg.dimensions.height;
       dimWeight = cubicCm / DIM_FACTOR_METRIC; // result in kg
     }

     // Carrier charges the greater of actual weight vs dimensional weight
     const actualWeight = normalizeWeightToLbs(pkg.weight);
     return Math.max(actualWeight, Math.ceil(dimWeight));
   }

   function normalizeWeightToLbs(weight: Package['weight']): number {
     switch (weight.unit) {
       case 'oz': return weight.value / 16;
       case 'g':  return weight.value / 453.592;
       case 'kg': return weight.value * 2.20462;
       case 'lb': return weight.value;
     }
   }
   ```

5. **Add flat-rate and free-shipping rules**

   ```typescript
   interface ShippingRule {
     name: string;
     type: 'flat_rate' | 'free_shipping' | 'tiered_rate';
     conditions: {
       minOrderTotal?: number;     // in cents
       maxOrderWeight?: number;    // in lbs
       countries?: string[];       // ISO codes
       zones?: string[];
     };
     rate?: number;                // in cents (for flat rate)
     tiers?: { minWeight: number; maxWeight: number; rate: number }[];
   }

   function applyShippingRules(
     carrierRates: ShippingRate[],
     rules: ShippingRule[],
     orderTotal: number,
     totalWeight: number,
     destination: Address
   ): ShippingRate[] {
     const allRates = [...carrierRates];

     for (const rule of rules) {
       const countryMatch = !rule.conditions.countries ||
         rule.conditions.countries.includes(destination.country);
       const totalMatch = !rule.conditions.minOrderTotal ||
         orderTotal >= rule.conditions.minOrderTotal;
       const weightMatch = !rule.conditions.maxOrderWeight ||
         totalWeight <= rule.conditions.maxOrderWeight;

       if (!countryMatch || !totalMatch || !weightMatch) continue;

       if (rule.type === 'free_shipping') {
         allRates.push({
           carrier: 'store',
           service: 'free',
           serviceName: 'Free Shipping',
           rate: 0,
           currency: 'USD',
           estimatedDays: 7,
           guaranteed: false,
         });
       }

       if (rule.type === 'flat_rate' && rule.rate !== undefined) {
         allRates.push({
           carrier: 'store',
           service: 'flat',
           serviceName: rule.name,
           rate: rule.rate,
           currency: 'USD',
           estimatedDays: 5,
           guaranteed: false,
         });
       }
     }

     return allRates.sort((a, b) => a.rate - b.rate);
   }
   ```

6. **Expose the shipping rate API endpoint**

   ```typescript
   // POST /api/shipping/rates
   async function getShippingRates(req: Request, res: Response) {
     const { cartId, destination } = req.body;

     const cart = await getCartWithItems(cartId);
     const origin = await getWarehouseAddress(cart);

     // Convert cart items to packages using bin-packing
     const packages = packItems(cart.lineItems, await getPackagingOptions());

     const engine = new ShippingRateEngine();
     engine.registerCarrier(new UPSAdapter(config.ups));
     engine.registerCarrier(new FedExAdapter(config.fedex));
     engine.registerCarrier(new USPSAdapter(config.usps));

     const carrierRates = await engine.getRates({ origin, destination, packages });

     // Apply store rules (free shipping, flat rates)
     const rules = await db.shippingRules.find({ isActive: true });
     const allRates = applyShippingRules(
       carrierRates,
       rules,
       cart.subtotal,
       packages.reduce((s, p) => s + p.weight.value, 0),
       destination
     );

     // Only show top options to reduce choice paralysis
     const topRates = [
       allRates.find(r => r.rate === 0),                          // Free (if available)
       allRates.find(r => r.rate > 0),                            // Cheapest paid
       allRates.find(r => r.estimatedDays <= 2 && r.guaranteed),  // Fastest
     ].filter(Boolean);

     res.json({ rates: topRates });
   }
   ```

## Examples

### EasyPost as a unified carrier API

Instead of integrating each carrier individually, use EasyPost as a meta-API:

```typescript
import EasyPost from '@easypost/api';

const easypost = new EasyPost(process.env.EASYPOST_API_KEY);

async function getEasyPostRates(request: ShipmentRequest): Promise<ShippingRate[]> {
  const shipment = await easypost.Shipment.create({
    from_address: {
      street1: request.origin.street1,
      city: request.origin.city,
      state: request.origin.state,
      zip: request.origin.postalCode,
      country: request.origin.country,
    },
    to_address: {
      street1: request.destination.street1,
      city: request.destination.city,
      state: request.destination.state,
      zip: request.destination.postalCode,
      country: request.destination.country,
    },
    parcel: {
      length: request.packages[0].dimensions.length,
      width: request.packages[0].dimensions.width,
      height: request.packages[0].dimensions.height,
      weight: request.packages[0].weight.value * 16, // EasyPost expects oz
    },
  });

  return shipment.rates.map(rate => ({
    carrier: rate.carrier.toLowerCase(),
    service: rate.service,
    serviceName: `${rate.carrier} ${rate.service}`,
    rate: Math.round(parseFloat(rate.rate) * 100),
    currency: rate.currency,
    estimatedDays: rate.est_delivery_days || 5,
    estimatedDelivery: rate.delivery_date ? new Date(rate.delivery_date) : undefined,
    guaranteed: rate.delivery_days !== null,
  }));
}
```

### Shipping zone-based rate table

```typescript
const zoneRates: Record<string, Record<string, number>> = {
  // zone -> { weightBucket -> rate in cents }
  domestic: { '0-1lb': 599, '1-5lb': 899, '5-10lb': 1299, '10-20lb': 1899 },
  canada:   { '0-1lb': 999, '1-5lb': 1499, '5-10lb': 2199, '10-20lb': 3299 },
  international: { '0-1lb': 1499, '1-5lb': 2499, '5-10lb': 3999, '10-20lb': 5999 },
};

function getZone(country: string): string {
  if (country === 'US') return 'domestic';
  if (country === 'CA') return 'canada';
  return 'international';
}

function getWeightBucket(weightLbs: number): string {
  if (weightLbs <= 1) return '0-1lb';
  if (weightLbs <= 5) return '1-5lb';
  if (weightLbs <= 10) return '5-10lb';
  return '10-20lb';
}

function getZoneRate(country: string, weightLbs: number): number {
  const zone = getZone(country);
  const bucket = getWeightBucket(weightLbs);
  return zoneRates[zone]?.[bucket] ?? zoneRates.international['10-20lb'];
}
```

## Best Practices

- **Always set carrier API timeouts** — carrier APIs can be slow (2-5s); set a 5s timeout and fall back to flat rates if they fail
- **Cache rate quotes for 15-30 minutes** — rates don't change frequently; cache by origin+destination+weight to avoid repeated API calls
- **Use dimensional weight** — always calculate dim weight and charge the greater of actual vs. dimensional; otherwise you lose money on large, light items
- **Show 2-3 shipping options max** — cheapest, fastest, and free (if available); too many options cause checkout abandonment
- **Validate addresses before rate requests** — use carrier address validation APIs to catch bad addresses before they cause rate errors
- **Handle carrier outages gracefully** — if all carrier APIs fail, show flat-rate fallback options instead of an error
- **Round up package weights** — carriers round up to the next pound/kilogram; do the same in your calculation to match actual charges
- **Recalculate rates when the cart changes** — invalidate cached rates when items are added, removed, or quantities change

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Carrier API returns no rates for valid address | Check if the address is a PO Box (UPS/FedEx don't deliver to PO Boxes); fall back to USPS |
| Shipping cost calculated at checkout differs from order total | Recalculate shipping at order creation, not just at cart; lock the rate for a limited time window |
| Huge shipping costs for lightweight but large items | Always use dimensional weight calculation; the DIM factor is 139 (domestic) and 5000 (metric) |
| Rate requests are too slow (>3 seconds) | Fetch all carriers in parallel with `Promise.allSettled`, set 5s timeouts, and use in-memory caching |
| International shipments missing duties/taxes | Use DHL's Landed Cost API or a service like Zonos for duty/tax estimation on international orders |
| Residential vs. commercial surcharges | Validate address type and pass `residential: true` to carrier APIs to get accurate quotes including surcharges |

## Related Skills

- @order-processing-pipeline
- @erp-integration
- @ecommerce-caching
- @checkout-flow-optimization
- @pci-dss-compliance
