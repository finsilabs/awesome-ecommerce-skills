# Implement the Digital Download API Endpoint

## Problem Description

An e-commerce platform sells digital goods (PDFs, software binaries, audio files). The product files are stored in a private cloud storage bucket. Currently there is no way for customers to actually retrieve their purchased files — the platform has a basic database schema and a stub API route, but the actual file delivery logic is missing.

The platform backend is Node.js. Files are stored in S3. The existing database (`db`) uses a Prisma-like API. The relevant tables are already set up:

- `orderDigitalAccess`: tracks per-order download entitlements with fields `orderId`, `digitalProductId`, `downloadCount`, `maxDownloads` (null = unlimited), `expiresAt` (null = perpetual), and a composite unique key `orderId_digitalProductId`.
- `digitalProducts`: metadata for each product with fields `fileStorageKey`, `fileName`, `mimeType`, `downloadLimit`, `accessDurationDays`.

The product manager has flagged several requirements:
1. Customers should not be able to share or reuse download links — links must expire quickly.
2. Some products have download limits (e.g., max 5 downloads per order). The system must enforce these.
3. Some products are only accessible for a limited time window (e.g., 1 year after purchase). The system must enforce these too.
4. Files must never be served directly through the application server.

## Output Specification

Implement the file delivery logic in a file called `lib/digitalDelivery.js`. This file should export an async function `generateDownloadUrl(orderId, digitalProductId)` that enforces all access rules and returns a download URL.

Also implement the API route handler in `api/orders/[orderId]/downloads/[digitalProductId].js` that calls `generateDownloadUrl` and returns `{ downloadUrl }` on success, or an appropriate error response.

Write a `package.json` listing the npm dependencies your implementation requires.

Include brief inline comments explaining the access-check sequence in `digitalDelivery.js`.
