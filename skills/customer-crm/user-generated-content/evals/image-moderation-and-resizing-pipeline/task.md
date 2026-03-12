# UGC Photo Processing Lambda

## Problem/Feature Description

An e-commerce platform has been receiving customer photo submissions stored in an S3 bucket under a `ugc/pending/` prefix. The team wants to automate processing those uploads: screening them for inappropriate content, resizing them into multiple display variants, and deciding whether they can be published immediately or need manual review first.

Currently photos are going directly to the approved gallery without any content screening, which has already caused one incident where an offensive image appeared on a product page. The team also wants to serve images in web-friendly sizes rather than the raw originals, and they want to fast-track photos from customers who can be verified to have purchased the product.

Your job is to write the Lambda (or equivalent async worker) that handles the `S3:ObjectCreated` event for the pending prefix. The function should screen, resize, and update the status of each uploaded photo appropriately.

## Output Specification

Produce a TypeScript source file (e.g. `process-ugc-photo.ts`) that contains the full photo-processing logic. The file should be self-contained with all imports, configuration, and helper functions.

Include a brief `processing-notes.md` that explains: (1) which service you chose for content moderation and why, (2) what confidence threshold you used, (3) how you decided which photos are published automatically versus held for review, and (4) how you handled image resizing and format choices.

## Input Files

The following file provides type definitions and stub helpers to use as a starting point.

=============== FILE: inputs/types.ts ===============
export interface S3Event {
  Records: Array<{
    s3: {
      bucket: { name: string };
      object: { key: string; size: number };
    };
  }>;
}

export interface UGCPhoto {
  id: string;
  productId: string;
  customerId: string;
  s3Key: string;
  status: string;
  verifiedPurchase: boolean;
}

// Stub db — replace with real ORM calls
export const db = {
  ugcPhotos: {
    findByS3Key: async (key: string): Promise<UGCPhoto> =>
      ({ id: 'stub-id', productId: 'prod-1', customerId: 'cust-1', s3Key: key, status: 'pending_upload', verifiedPurchase: false }),
    update: async (id: string, data: Partial<UGCPhoto>): Promise<void> => {},
  },
  orderItems: {
    exists: async (query: { customerId: string; productId: string }): Promise<boolean> => false,
  },
};
