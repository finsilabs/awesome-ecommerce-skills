# UGC Brand Safety Moderation System

## Problem/Feature Description

Zephyr Outdoor is a mid-sized sporting goods brand that has launched a major hashtag campaign across Instagram and TikTok. Within the first week, thousands of customer posts have come in — but the marketing team quickly realized they cannot manually review everything. They need an automated pipeline that screens incoming content for brand safety before it can be published anywhere.

The moderation system needs to catch explicit or violent imagery, screen text for harmful language, and identify posts where competitor products are prominently mentioned or shown. At the same time, the team knows that AI moderation is imperfect — especially for edge cases involving sporting activities that may look violent, or captions with sarcasm. The solution must route ambiguous content to a human review queue rather than making all decisions automatically. The system should integrate with external content analysis services for image and text screening.

## Output Specification

Write a TypeScript module implementing the content moderation pipeline as `moderation.ts`. The module should:

- Implement a function that takes a UGC submission and returns a moderation result with flags and a score
- Implement a queue-processing function that processes pending submissions and routes them to the correct outcome (approval, rejection, or human review)

Also provide a brief `moderation-notes.md` explaining what each flag means and when human review is triggered vs. automatic rejection.

## Input Files

The following types are provided. Extract them before beginning.

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
  status: 'pending' | 'approved' | 'rejected' | 'rights-requested' | 'rights-granted';
  moderationFlags?: string[];
  thumbnailUrl?: string;
  engagementScore?: number;
}

export interface ModerationResult {
  approved: boolean;
  flags: string[];
  score: number;
}

// Stubs — implement the logic that calls these
export declare function callVisionSafeSearchAPI(mediaUrl: string): Promise<{
  adult: string;
  violence: string;
  racy: string;
}>;

export declare function callPerspectiveAPI(text: string): Promise<number>;

export declare const db: {
  ugcSubmissions: {
    findAll(options: object): Promise<UGCSubmission[]>;
    update(id: string, data: Partial<UGCSubmission>): Promise<void>;
  };
  ugcModerationQueue: {
    create(data: { submissionId: string; flags: string[] }): Promise<void>;
  };
};

export declare function requestContentRights(submissionId: string): Promise<void>;
