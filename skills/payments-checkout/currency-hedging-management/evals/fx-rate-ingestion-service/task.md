# Daily FX Rate Ingestion Service

## Problem/Feature Description

A fintech startup is launching a multi-currency ecommerce platform targeting customers across Europe, Asia, and the Americas. Their accounting team needs accurate daily exchange rates stored in a database to power transaction booking and month-end revaluation workflows. The engineering team has been asked to build the daily rate fetching service.

The service must handle real-world operational challenges: the rate provider may occasionally be unreliable, markets are closed on weekends, and the service must be safe to rerun without creating duplicate entries. The engineering team wants the stored rates to support efficient lookups in any direction, minimizing compute overhead at query time.

## Output Specification

Produce a JavaScript/Node.js implementation of the rate ingestion service. Save it as `rate-fetcher.js`. The file should export:
- A `fetchAndStoreDailyRates(date)` function that fetches and persists exchange rates for a given date
- A `getRate(fromCurrency, toCurrency, date)` function that looks up a stored rate with appropriate fallback logic

Also produce a `README.md` that explains:
- Which environment variables are required and what they do
- Which currencies are tracked
- How the fallback logic works when rates are unavailable for a specific date

Assume a Prisma ORM client (`db`) is available via `import { db } from './lib/db.js'` and that the `fxRates` model matches a table with fields: `base_currency`, `quote_currency`, `rate`, `rate_date`, `source`, `created_at`.
