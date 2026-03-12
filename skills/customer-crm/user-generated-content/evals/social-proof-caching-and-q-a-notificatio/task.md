# Social Proof Widget and Q&A Notification System

## Problem/Feature Description

A DTC furniture brand is launching two product-page features: a live "recently purchased" social proof ticker and a customer Q&A section. The social proof ticker must show real recent purchases to build urgency, while the Q&A section needs to ensure customers get timely answers and can signal which questions are most helpful.

The engineering lead has flagged two operational concerns: the social proof feed must not hammer the database on every page view (the product pages receive thousands of visits per hour), and the Q&A section has historically gone stale — customers asked questions and never heard back, which damaged trust. A previous attempt at a social proof feature was pulled after the legal team flagged that some "recent purchase" entries were fabricated.

Your task is to implement: (1) the social proof feed builder and its read endpoint, (2) the Q&A submission, answer, and upvote endpoints, and (3) a mechanism to notify the product team about unanswered questions.

## Output Specification

Produce the following TypeScript source files:
- `social-proof.ts` — feed builder and GET endpoint
- `qa.ts` — question submission, answer, and upvote endpoints
- `qa-digest.ts` — a scheduled job or function that sends a daily digest of unanswered questions to the product team

Also produce a `ugc-api-notes.md` explaining: how you prevent database overload on the social proof endpoint, how you ensure questions don't go unanswered indefinitely, and how duplicate upvotes are prevented.

## Input Files

The following file provides database and cache stubs.

=============== FILE: inputs/stubs.ts ===============
import { subHours } from 'date-fns';

export { subHours };

// Redis stub
export const redis = {
  setex: async (key: string, ttl: number, value: string): Promise<void> => {},
  get: async (key: string): Promise<string | null> => null,
};

// DB stubs
export const db = {
  orders: {
    findMany: async (query: any): Promise<any[]> => [],
  },
  productQuestions: {
    create: async (data: any): Promise<any> => ({ id: 'q-stub', ...data }),
    update: async (id: string, data: any): Promise<void> => {},
    findById: async (id: string, opts?: any): Promise<any> => ({
      id,
      question: 'Is this available in blue?',
      authorEmail: 'customer@example.com',
      product: { name: 'Lounge Chair', slug: 'lounge-chair' },
    }),
    increment: async (id: string, field: string, amount: number): Promise<void> => {},
    findUnanswered: async (olderThanDays?: number): Promise<any[]> => [],
  },
  questionVotes: {
    exists: async (query: any): Promise<boolean> => false,
    create: async (data: any): Promise<void> => {},
  },
  ugcPhotos: {
    findMany: async (query: any): Promise<any[]> => [],
  },
};

export async function notifyProductTeam(data: any): Promise<void> {}
export async function sendTransactionalEmail(to: string, template: string, vars: any): Promise<void> {}
export async function sendDigestEmail(recipients: string[], subject: string, body: any): Promise<void> {}
