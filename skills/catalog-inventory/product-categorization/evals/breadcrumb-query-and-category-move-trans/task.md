# Category Reorganization and Breadcrumb Navigation

## Problem/Feature Description

HomeGoods Co. recently acquired a competitor and is merging the two product catalogs. The combined store now needs a significant category restructuring: several sub-trees that were at the top-level in the acquired catalog must be moved under existing HomeGoods categories, and the navigation system must display correct breadcrumbs on every category page after the move.

The existing system stores categories in a relational database using a hierarchical data model. The development team is concerned about three things: (1) if a large sub-tree of categories is moved, they don't want to end up with a partially updated state if something fails mid-way; (2) breadcrumb generation currently requires one query per level, which is too slow; (3) the full category tree for the mega-menu must be rendered in a consistent order.

Your task is to implement the server-side functions that handle category reorganization and breadcrumb generation.

## Output Specification

Produce the following files:

1. `lib/categoryOps.js` (or `.ts`) — A module containing:
   - `moveCategory(categoryId, newParentId)` — moves a category and its entire sub-tree to a new parent
   - `getCategoryWithBreadcrumb(slug)` — returns a category with its breadcrumb trail
   - `getCategoryTree(rootSlug?)` — returns the full published category tree as a nested structure

2. `test-scenario.md` — A short walkthrough showing what the state of the database would look like for a sample move (e.g. moving "Kitchen > Cookware" under "Cooking & Baking"), demonstrating path values before and after.

The DB client can be mocked/stubbed — focus on the logic and data transformations. Show the data shapes clearly in the code.

## Input Files

The following files are provided as inputs. Extract them before beginning.

=============== FILE: inputs/sample-categories.json ===============
[
  { "id": "cat_root", "name": "Root", "slug": "root", "parentId": null, "path": "root", "pathIds": ["cat_root"], "depth": 0, "position": 0, "published": true },
  { "id": "cat_kitchen", "name": "Kitchen", "slug": "kitchen", "parentId": "cat_root", "path": "root/kitchen", "pathIds": ["cat_root","cat_kitchen"], "depth": 1, "position": 1, "published": true },
  { "id": "cat_cookware", "name": "Cookware", "slug": "cookware", "parentId": "cat_kitchen", "path": "root/kitchen/cookware", "pathIds": ["cat_root","cat_kitchen","cat_cookware"], "depth": 2, "position": 1, "published": true },
  { "id": "cat_pans", "name": "Pans", "slug": "pans", "parentId": "cat_cookware", "path": "root/kitchen/cookware/pans", "pathIds": ["cat_root","cat_kitchen","cat_cookware","cat_pans"], "depth": 3, "position": 1, "published": true },
  { "id": "cat_baking", "name": "Baking", "slug": "baking", "parentId": "cat_root", "path": "root/baking", "pathIds": ["cat_root","cat_baking"], "depth": 1, "position": 2, "published": true }
]
