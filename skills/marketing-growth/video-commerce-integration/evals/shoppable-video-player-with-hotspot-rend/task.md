# Shoppable Video Player Component

## Problem/Feature Description

A beauty brand has 15 product demo videos hosted on their e-commerce site, but customers keep dropping off to search for products mentioned in the videos. The marketing team wants to keep customers engaged by surfacing the exact product being shown at any given moment — directly overlaid on the video — so viewers can add it to their cart without leaving the player.

The team has noticed that on mobile, pixel-based overlays are breaking layout because the video renders at different sizes across devices. They also have concerns about lag: when a hotspot appears, there's a noticeable delay while the app fetches the product data, causing the card to pop in visibly late after the relevant product has already left the frame.

Your task is to design and implement a `ShoppableVideoPlayer` React component in TypeScript that solves these problems. Use the provided sample data to demonstrate the component working correctly. Write the implementation to `shoppable-player.tsx`, and include a brief `notes.md` explaining the key design decisions you made.

## Output Specification

- `shoppable-player.tsx` — TypeScript React component implementing the shoppable video player with hotspot overlays
- `notes.md` — A short document (bullet points are fine) explaining the key technical decisions in your implementation, particularly around hotspot display timing and product data loading strategy

## Input Files

The following data is provided for use in your implementation. Extract the files before beginning.

=============== FILE: inputs/sample-video.json ===============
{
  "id": "vid-001",
  "title": "Summer Skincare Routine",
  "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "thumbnailUrl": "https://example.com/thumbnails/vid-001.jpg",
  "duration": 180,
  "type": "recorded",
  "status": "published",
  "products": [
    { "productId": "prod-sunscreen", "featuredAt": 12 },
    { "productId": "prod-moisturizer", "featuredAt": 45 },
    { "productId": "prod-serum", "featuredAt": 90 }
  ],
  "hotspots": [
    {
      "id": "hs-1",
      "videoId": "vid-001",
      "productId": "prod-sunscreen",
      "timestamp": 13,
      "displayDuration": 8,
      "position": { "x": 70, "y": 15 }
    },
    {
      "id": "hs-2",
      "videoId": "vid-001",
      "productId": "prod-moisturizer",
      "timestamp": 46,
      "displayDuration": 10,
      "position": { "x": 20, "y": 60 }
    },
    {
      "id": "hs-3",
      "videoId": "vid-001",
      "productId": "prod-serum",
      "timestamp": 91,
      "displayDuration": 12,
      "position": { "x": 55, "y": 30 }
    }
  ],
  "createdAt": "2026-01-15T09:00:00Z"
}

=============== FILE: inputs/sample-products.json ===============
[
  {
    "id": "prod-sunscreen",
    "name": "SPF 50 Daily Shield",
    "price": 28.00,
    "images": [{ "url": "https://example.com/images/sunscreen.jpg" }]
  },
  {
    "id": "prod-moisturizer",
    "name": "Hydra-Boost Moisturizer",
    "price": 42.00,
    "images": [{ "url": "https://example.com/images/moisturizer.jpg" }]
  },
  {
    "id": "prod-serum",
    "name": "Vitamin C Brightening Serum",
    "price": 65.00,
    "images": [{ "url": "https://example.com/images/serum.jpg" }]
  }
]
