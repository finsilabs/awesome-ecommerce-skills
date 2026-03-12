# Configuring a Third-Party Reviews Integration for SFCC

## Problem/Feature Description

An e-commerce team is adding a product reviews integration (from a third-party vendor called "ReviewFlow") to their Salesforce Commerce Cloud store. The integration requires several configuration values to be available at runtime: an API endpoint URL, an API key string, a widget embed code prefix, a boolean flag to enable or disable the integration per environment, and a numeric timeout value (in milliseconds) for API requests.

The backend developer asked the DevOps team to set these values by clicking through Business Manager on each environment, but the lead architect rejected this approach because it creates inconsistency across dev, staging, and production and leaves no audit trail. The team needs a proper, version-controlled configuration approach instead.

The task is to produce the import XML file that defines these custom site preferences in SFCC, along with a small JavaScript code snippet showing how a cartridge controller would read two of these values at runtime. The integration should be organized under a named group in the site preferences UI.

## Output Specification

Produce the following files:

1. `system-objecttype-extensions.xml` — defines the five custom site preference attributes for the ReviewFlow integration, grouped under a named attribute group
2. `cartridge-snippet.js` — a short SFCC server-side JavaScript snippet demonstrating how to retrieve the API endpoint and enabled flag from site preferences in a cartridge controller
3. `setup-notes.md` — a brief note on how to apply these files to a new environment and why this approach was chosen over manual configuration
