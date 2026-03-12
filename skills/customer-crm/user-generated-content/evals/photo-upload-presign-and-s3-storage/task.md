# Customer Photo Upload API

## Problem/Feature Description

A growing outdoor apparel brand wants to let post-purchase customers submit lifestyle photos of themselves using their gear. The marketing team has found that authentic customer photos on product pages drive significantly higher conversion than studio shots alone. The engineering team previously attempted to accept photo uploads directly through the Express API server, but this caused memory spikes and occasional crashes when customers uploaded high-resolution images simultaneously.

Your task is to implement the backend API endpoint that initiates a customer photo upload. The endpoint must allow post-purchase customers to submit a photo for a given product without routing the file through the application server. The implementation must include proper file type validation and must record the upload intent in the database as soon as the upload slot is created.

## Output Specification

Produce a TypeScript source file (e.g. `ugc-upload.ts`) containing the implementation of the presign endpoint. The file should be self-contained and include all necessary imports, the S3 client initialisation, validation logic, database record creation, and the response payload.

Also produce a short `design-notes.md` file explaining the key architectural decisions you made — in particular, why files are not routed through the API server and how the database record relates to the upload lifecycle.

## Input Files

The following file is provided as a starting point. Extract it before beginning.

=============== FILE: inputs/schema.ts ===============
// Existing DB schema types (read-only reference)
export interface UGCPhoto {
  id: string;
  productId: string;
  customerId: string | null;
  s3Key: string;
  status: 'pending_upload' | 'pending_review' | 'approved' | 'rejected';
  rejectionReason?: string;
  verifiedPurchase: boolean;
  createdAt: Date;
  approvedAt: Date | null;
}

// Stub db object — replace with your actual ORM calls
export const db = {
  ugcPhotos: {
    create: async (data: Partial<UGCPhoto>): Promise<UGCPhoto> => ({ id: 'stub', ...data } as UGCPhoto),
  },
};
