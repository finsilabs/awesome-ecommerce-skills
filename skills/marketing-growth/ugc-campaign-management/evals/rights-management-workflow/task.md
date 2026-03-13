# UGC Rights Management System

## Problem/Feature Description

A fashion accessories brand called Lumara has been running a successful hashtag campaign on Instagram for six months. Their community has tagged hundreds of posts featuring Lumara products, and the marketing team wants to start using these customer photos on product pages and in paid social ads. However, the legal team has flagged that using customer-created content — even when customers voluntarily tag the brand — requires explicit permission before any commercial use.

The engineering team needs to build the rights management module that sits between content discovery and publication. The system must request permission from content creators, track whether permission has been granted, and prevent any customer content from appearing on the site or in ad creatives until the creator has formally approved its use. The module also needs to reward creators who grant rights, as this has been shown to increase the overall rights-grant rate.

## Output Specification

Write a TypeScript module that implements the rights management workflow. The module should include:

- A function to send a rights request to a content creator (via Instagram comment)
- An HTTP endpoint handler for the rights grant page (where creators click to approve)
- A function or query example showing how to safely retrieve only content that is cleared for use

Save the implementation as `rights-management.ts`.

Provide a brief `notes.md` explaining the key design decisions in your implementation.

## Input Files

The following skeleton types file is provided to give you the database interface shape. Extend it as needed. Extract it before beginning.

=============== FILE: types.ts ===============
export interface UGCSubmission {
  id: string;
  externalId: string;
  source: string;
  platform: string;
  authorHandle: string;
  authorEmail?: string;
  contentUrl: string;
  mediaUrls: string[];
  caption?: string;
  productIds: string[];
  submittedAt: Date;
  status: string;
  // Add any additional fields your rights management system requires
  [key: string]: unknown;
}

// Database interface (stubbed — implement the logic, not the db layer)
export declare const db: {
  ugcSubmissions: {
    findById(id: string): Promise<UGCSubmission | null>;
    findByToken(token: string): Promise<UGCSubmission | null>;
    update(id: string, data: Partial<Record<string, unknown>>): Promise<void>;
    findAll(options: object): Promise<UGCSubmission[]>;
  };
};

export declare function postInstagramComment(externalId: string, message: string): Promise<void>;
export declare function sendEmail(email: string, template: string, payload: object): Promise<void>;
export declare function createUniqueDiscount(options: { type: string; value: number }): Promise<string>;
export declare function generateSecureToken(): string;
