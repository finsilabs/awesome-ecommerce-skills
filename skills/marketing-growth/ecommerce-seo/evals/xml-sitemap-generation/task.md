# Automated Sitemap Generation for Large Product Catalog

## Problem Description

A home goods retailer has grown their online catalog to over 120,000 active product SKUs across 400+ collections. Their current sitemap is a single hand-maintained XML file that hasn't been updated in months and is causing Google Search Console to report that many new products are not being indexed. The SEO team has flagged this as a top priority before their upcoming product line launch.

The engineering team needs to build an automated sitemap generation script that can handle a catalog of this size and be run on a schedule. The script should produce all necessary sitemap files and ensure that search engines are notified when they are regenerated. Product images are also important for the business — they drive significant traffic through Google Image Search — so those should be represented in the sitemap too.

The team is working in a Node.js/TypeScript environment. They've noted that the existing code in their codebase uses a consistent pattern of storing prices in integer cents, and their product records include an `updatedAt` timestamp and an `images` array where each image has `src` and `alt` properties.

## Output Specification

Write the solution as a TypeScript script `regenerate-sitemaps.ts` that, when run, generates the complete sitemap file set.

Since there is no live database available, use the following mock data module as a stand-in. Extract the file below before starting, then import it in your script.

The script should write output sitemap files to disk so they can be inspected.

Also write a brief `sitemap-plan.md` document (1 page) explaining the structure of the sitemap output, what files are created, how products are distributed across child sitemaps, and how the script should be integrated into a production workflow (e.g. when to trigger regeneration, how to schedule it).

=============== FILE: mock-db.ts ===============
// Mock database module for sitemap generation
// In production this would query a real database

export interface Product {
  id: number;
  slug: string;
  title: string;
  updatedAt: Date;
  images: { src: string; alt: string }[];
}

export interface Collection {
  slug: string;
  title: string;
  updatedAt: Date;
}

// Simulate a catalog of 120,000 products split across pages
export const db = {
  products: {
    async countActive(): Promise<number> {
      return 120000;
    },
    async findActive(opts: { limit: number; offset: number }): Promise<Product[]> {
      const products: Product[] = [];
      const start = opts.offset + 1;
      const end = Math.min(opts.offset + opts.limit, 120000);
      for (let i = start; i <= end; i++) {
        products.push({
          id: i,
          slug: `product-${i}`,
          title: `Home Goods Item ${i}`,
          updatedAt: new Date('2026-03-10T08:00:00Z'),
          images: [
            {
              src: `https://cdn.example.com/products/${i}/main.jpg`,
              alt: i % 3 === 0 ? `Home Goods Item ${i} - Front View` : '',
            },
          ],
        });
      }
      return products;
    },
  },
  collections: {
    async findPublished(): Promise<Collection[]> {
      return Array.from({ length: 400 }, (_, i) => ({
        slug: `collection-${i + 1}`,
        title: `Collection ${i + 1}`,
        updatedAt: new Date('2026-03-11T08:00:00Z'),
      }));
    },
  },
};
