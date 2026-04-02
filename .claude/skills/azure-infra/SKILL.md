---
name: azure-infra
description: >
  Azure infrastructure patterns for the pitch deck builder. Covers Blob
  Storage, CDN, Functions, and deployment. Use when setting up or modifying
  Azure resources.
---

# Azure Infrastructure

## Blob Storage
- Storage Account: pitchdeckerstorage (or similar)
- Containers:
  - team-photos (public read, CDN-fronted)
  - candidate-photos (public read, CDN-fronted)
  - published-decks (private, accessed via Azure Function)
- Naming: {container}/{slug}.{ext} (e.g., team-photos/auke-bijnsdorp.webp)
- Format: WebP preferred, JPEG fallback, max 500KB per image

## CDN
- Azure CDN profile fronting team-photos and candidate-photos containers
- Custom domain: cdn.pitchdecker.topofminds.com (or similar)
- URLs in database: https://cdn.pitchdecker.topofminds.com/team/auke-bijnsdorp.webp

## Azure Functions
- Password gate: validates access code, serves published deck HTML, logs view event
- Analytics logger: stores view events (timestamp, basic device info)
- Keep functions minimal — serverless, consumption plan

## Published Deck URLs
- Stable URL per placement: https://pitch.topofminds.com/{placement-slug}
- Re-publishing overwrites blob content, URL stays the same
- CDN cache purge on re-publish
