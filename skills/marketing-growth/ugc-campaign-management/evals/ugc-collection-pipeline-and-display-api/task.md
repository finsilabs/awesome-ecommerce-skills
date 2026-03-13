# UGC Collection Pipeline and Product Gallery API

## Problem/Feature Description

Bloom & Co is a home fragrance brand launching its first structured UGC program after noticing that customers are spontaneously sharing beautiful photos of their candles and diffusers online. The brand wants to systematically collect this content from multiple touchpoints — customers who just placed an order, people posting with the brand hashtag on Instagram, and visitors who want to upload content directly on the website.

Once collected, the content needs to surface on individual product pages where it has been shown to improve purchase confidence. The frontend team is ready to build the gallery component and needs a backend API endpoint they can call to fetch approved customer photos for any given product. The API should support pagination for products with large amounts of content and return everything the gallery component needs to render a tile — including the original post link so shoppers can click through to see the real customer context.

## Output Specification

Write the following TypeScript files:

1. `ugc-types.ts` — The TypeScript interface(s) for the UGC submission data model
2. `ugc-collection.ts` — Functions implementing the collection pipeline:
   - A function to send a post-purchase UGC request email
   - A function to ingest posts from Instagram hashtag monitoring into the database
3. `ugc-display.ts` — The Express route handler for the product UGC display API endpoint

Also provide `design-notes.md` with a brief description of how the collection channels work and any important decisions about the data model or API design.

## Input Files

The following Express and database stubs are provided. Extract them before beginning.

=============== FILE: stubs.ts ===============
import { Request, Response } from 'express';

export { Request, Response };

// Schedule an email to be sent after a delay
export declare function scheduleEmail(
  customerId: string,
  template: string,
  options: {
    subject: string;
    delay: number;
    payload: Record<string, unknown>;
  }
): Promise<void>;

// Stub DB — implement logic that calls these
export declare const db: {
  ugcSubmissions: {
    findByExternalId(externalId: string): Promise<unknown | null>;
    create(data: Record<string, unknown>): Promise<{ id: string }>;
    findAll(options: object): Promise<unknown[]>;
    count(options: object): Promise<number>;
  };
};

export interface Order {
  id: string;
  customerId: string;
  lineItems: Array<{ productId: string; name: string }>;
}
