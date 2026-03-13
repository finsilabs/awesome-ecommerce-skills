# Dynamic Product Ad Catalog Feed for Ecommerce Store

## Problem Description

An ecommerce retailer wants to launch Dynamic Product Ads (DPA) on Meta (Facebook/Instagram) to automatically retarget customers who browsed products but didn't purchase. To power these ads, Meta requires a product catalog feed that lists all active inventory with structured product data. The feed needs to be machine-readable, regularly refreshed so prices and availability stay accurate, and conform to Meta's catalog specification.

The backend is built with Node.js/TypeScript. The products are already available in a database abstraction layer (provided below). The team needs a catalog feed generator script and a scheduled job configuration that keeps the feed up to date. Since product prices and inventory can change throughout the day, the feed should never become stale — the team was burned before by ads showing outdated prices after a flash sale.

## Output Specification

Produce the following files:

- `generate-catalog-feed.ts` — A TypeScript script that generates the catalog CSV feed from the product data
- `cron-schedule.md` — A short document describing the cron schedule to use and the command to run, with a brief explanation of the chosen frequency

Run the script to produce `catalog-feed.csv` using the sample data provided below.

## Input Files

The following files provide sample product data and the database abstraction layer. Extract them before beginning.

=============== FILE: sample-products.json ===============
[
  {
    "sku": "SHOE-001",
    "name": "CloudWalk Running Shoe",
    "description": "<p>The <strong>CloudWalk</strong> is our best-selling running shoe. <br/>Featuring responsive foam cushioning and a breathable mesh upper, it handles everything from track workouts to marathon training. Available in 12 colors.</p><p>Recommended for neutral runners.</p>",
    "stockQuantity": 142,
    "price": 89.99,
    "slug": "cloudwalk-running-shoe",
    "images": [{ "url": "https://cdn.example.com/shoes/cloudwalk-main.jpg" }],
    "brandName": "SwiftStep",
    "gpcCategory": "187"
  },
  {
    "sku": "SHOE-002",
    "name": "TrailBlazer Hiking Boot — Waterproof Edition with Advanced Gore-Tex Lining for Extended Backcountry and Multi-Day Trek Adventures",
    "description": "Built for serious terrain. The TrailBlazer features a Gore-Tex waterproof membrane, Vibram outsole, and full-grain leather upper. Tested in conditions from the Scottish Highlands to the Himalayas.",
    "stockQuantity": 0,
    "price": 219.00,
    "slug": "trailblazer-hiking-boot",
    "images": [{ "url": "https://cdn.example.com/shoes/trailblazer-main.jpg" }],
    "brandName": "SwiftStep",
    "gpcCategory": "187"
  },
  {
    "sku": "SHIRT-045",
    "name": "Performance Dry-Fit Training Tee",
    "description": "<ul><li>Moisture-wicking fabric</li><li>Anti-odor treatment</li><li>Flatlock seams</li></ul>Great for gym or casual wear.",
    "stockQuantity": 88,
    "price": 34.50,
    "slug": "performance-dry-fit-tee",
    "images": [{ "url": "https://cdn.example.com/shirts/dry-fit-tee-main.jpg" }],
    "brandName": "SwiftStep",
    "gpcCategory": "212"
  }
]

=============== FILE: db.ts ===============
import products from './sample-products.json';

interface Product {
  sku: string;
  name: string;
  description: string;
  stockQuantity: number;
  price: number;
  slug: string;
  images: Array<{ url: string }>;
  brandName: string;
  gpcCategory: string;
}

export const db = {
  products: {
    findAll: async (_opts?: unknown): Promise<Product[]> => {
      return products.filter((p: Product) => p.stockQuantity > 0 || true);
    },
  },
};

const STORE_URL = process.env.STORE_URL ?? 'https://shop.example.com';
const STORE_NAME = process.env.STORE_NAME ?? 'SwiftStep';

export { STORE_URL, STORE_NAME };
