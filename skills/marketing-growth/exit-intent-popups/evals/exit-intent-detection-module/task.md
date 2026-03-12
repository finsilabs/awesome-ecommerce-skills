# Exit Intent Detection Module

## Problem/Feature Description

The engineering team at a mid-sized e-commerce company has been asked to build native exit-intent detection from scratch — without any third-party libraries like Ouibounce or ExitMonitor. The marketing team wants full control over the trigger logic, and the current vendor solution costs $800/month. The new module needs to work reliably on both desktop and mobile browsers, and must not cause any jarring experience for visitors who just loaded the page.

A previous attempt by a junior developer fires the popup the moment anyone moves their mouse, which has caused a surge in bounce rate and complaints. The module needs to be well-structured, written in TypeScript, and designed so it can be cleanly removed or re-initialized without leaving dangling event listeners.

## Output Specification

Write a TypeScript file `exit-intent.ts` that exports:
- A function to initialize exit-intent detection
- An interface or type for the configuration options

The module should handle both desktop and mobile detection scenarios. Include a brief `README.md` explaining the configuration options and how to integrate the module.
